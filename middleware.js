import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { metrics } from './app/lib/metrics';
import { COGGNI_COOKIES, verifyCookieIntegrity } from './app/utils/cookieManager';

// Constantes optimizadas
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const PUBLIC_ROUTES = ['/login', '/api', '/_next', '/static', '/favicon.ico', '/public'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_COOKIE_NAME = 'coggni-last-activity';
const SESSION_CACHE_COOKIE = 'coggni-session-cache';
const CACHE_TTL_ACTIVE = 2 * 60 * 1000; // 2 min usuario activo
const CACHE_TTL_NORMAL = 60 * 1000; // 1 min normal
const CACHE_TTL_IDLE = 30 * 1000; // 30 seg casi inactivo

// Helper para manejar race conditions con version tracking
function parseVersionedCookie(cookieValue) {
  try {
    const data = JSON.parse(cookieValue);
    return {
      ...data,
      version: data.version || 0
    };
  } catch (e) {
    return null;
  }
}

function createVersionedCookie(data) {
  return JSON.stringify({
    ...data,
    version: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  });
}

// TTL adaptativo basado en actividad
function getAdaptiveTTL(lastActivity) {
  const timeSinceActivity = Date.now() - lastActivity;
  
  if (timeSinceActivity < 5 * 60 * 1000) { // Menos de 5 min
    return CACHE_TTL_ACTIVE;
  } else if (timeSinceActivity < 15 * 60 * 1000) { // Menos de 15 min
    return CACHE_TTL_NORMAL;
  } else {
    return CACHE_TTL_IDLE;
  }
}

/**
 * Middleware reimplementado para Supabase Auth + Next.js 14
 * 
 * Features:
 * - Verificación de sesión con cache inteligente
 * - Timeout de sesión personalizado (30 min)
 * - Protección contra race conditions
 * - Métricas de performance y cache hit/miss
 * - Limpieza automática de cookies huérfanas
 * - Fail closed para máxima seguridad
 */
export async function middleware(request) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  try {
    // 1. Permitir rutas públicas sin verificación
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return response;
    }

    // 2. No interferir con rutas de admin (tienen su propio sistema)
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      return response;
    }

    // 3. Verificar integridad de cookies
    if (!verifyCookieIntegrity(request)) {
      console.warn('[Middleware] Cookie integrity check failed');
      COGGNI_COOKIES.forEach(name => response.cookies.delete(name));
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('cleanup', 'true');
      
      metrics.track('middleware_cookie_cleanup', { pathname });
      return NextResponse.redirect(loginUrl);
    }

    // 4. Crear cliente Supabase para middleware
    const supabase = createMiddlewareClient({ req: request, res: response });

    // 5. Verificar invalidación forzada
    const forceRevalidate = request.cookies.get('coggni-force-revalidate');
    let fromCache = false;
    let session = null;

    if (forceRevalidate) {
      console.log('[Middleware] Force revalidate requested');
      response.cookies.delete('coggni-force-revalidate');
      response.cookies.delete(SESSION_CACHE_COOKIE);
    } else {
      // 6. Intentar obtener sesión del cache
      const sessionCache = request.cookies.get(SESSION_CACHE_COOKIE);
      
      if (sessionCache) {
        try {
          const cacheData = parseVersionedCookie(sessionCache.value);
          
          if (cacheData && cacheData.expires > Date.now()) {
            const cacheAge = Date.now() - cacheData.version;
            const maxAge = getAdaptiveTTL(parseInt(request.cookies.get(AUTH_COOKIE_NAME)?.value || Date.now()));
            
            if (cacheAge < maxAge * 2) { // Doble del TTL como margen
              session = { user: { email: cacheData.email } };
              fromCache = true;
              metrics.trackCacheHit(pathname);
            }
          }
        } catch (e) {
          console.error('[Middleware] Cache parse error:', e);
        }
      }
    }

    // 7. Verificar sesión con Supabase si no hay cache válido
    if (!fromCache) {
      const { data, error } = await supabase.auth.getSession();
      session = data?.session;
      
      metrics.trackCacheMiss(pathname, session ? 'no_cache' : 'no_session');

      // Cachear la sesión válida con TTL adaptativo
      if (session?.user) {
        const lastActivity = parseInt(request.cookies.get(AUTH_COOKIE_NAME)?.value || Date.now());
        const ttl = getAdaptiveTTL(lastActivity);
        
        response.cookies.set(SESSION_CACHE_COOKIE, createVersionedCookie({
          email: session.user.email,
          expires: Date.now() + ttl,
          sessionId: session.access_token?.substring(0, 8)
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: ttl / 1000
        });
      }

      if (error || !session) {
        console.log('[Middleware] No session found, redirecting to login');
        
        // Limpiar todas las cookies
        COGGNI_COOKIES.forEach(name => response.cookies.delete(name));
        
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        
        return NextResponse.redirect(loginUrl);
      }
    }

    // 8. Verificar timeout de actividad (solo para usuarios client)
    const lastActivityCookie = request.cookies.get(AUTH_COOKIE_NAME);
    const userTypeCookie = request.cookies.get('coggni-user-type');

    if (userTypeCookie?.value === 'client') {
      const now = Date.now();
      
      if (lastActivityCookie) {
        const lastActivity = parseInt(lastActivityCookie.value);
        
        // Si pasaron más de 30 minutos, cerrar sesión
        if (now - lastActivity > SESSION_TIMEOUT) {
          console.log('[Middleware] Session timeout, signing out');
          
          metrics.trackSessionTimeout(pathname);
          
          // Cerrar sesión en Supabase
          await supabase.auth.signOut();
          
          // Limpiar todas las cookies
          COGGNI_COOKIES.forEach(name => response.cookies.delete(name));
          
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('timeout', 'true');
          
          return NextResponse.redirect(loginUrl);
        }
      } else {
        // Si no hay cookie de actividad pero hay sesión, crearla
        console.log('[Middleware] No activity cookie found, creating one');
      }

      // 9. Actualizar última actividad
      response.cookies.set(AUTH_COOKIE_NAME, now.toString(), {
        httpOnly: false, // Permitir acceso desde el cliente para UX
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      });
    }

    // 10. Agregar headers para evitar cache en rutas autenticadas
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    response.headers.set('x-cache-status', fromCache ? 'hit' : 'miss');

    return response;

  } catch (error) {
    console.error('[Middleware] Error:', error);
    
    // En caso de error, ser conservador y redirigir a login
    // Solo permitir acceso si es una ruta pública explícita
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return response;
    }
    
    // Para rutas protegidas, redirigir a login con mensaje de error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'middleware');
    
    // Limpiar cookies por seguridad
    COGGNI_COOKIES.forEach(name => response.cookies.delete(name));
    
    metrics.track('middleware_error', { pathname, error: error.message });
    
    return NextResponse.redirect(loginUrl);
    
  } finally {
    // Siempre trackear performance
    const duration = Date.now() - startTime;
    metrics.trackPerformance(pathname, duration);
    
    // Log de performance en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const cacheStatus = response.headers.get('x-cache-status') || 'unknown';
      console.log(`[Middleware] ${pathname} - ${duration}ms (${cacheStatus})`);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes) 
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (static files)
     * - public folder
     * - Archivos estáticos comunes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|public|.*\\.(?:jpg|jpeg|gif|png|svg|ico|css|js)$).*)',
  ],
};