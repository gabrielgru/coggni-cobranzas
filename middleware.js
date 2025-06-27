import { NextResponse } from 'next/server';

// Constantes
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const PUBLIC_ROUTES = ['/login', '/api', '/_next', '/static', '/favicon.ico'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/collections', '/dashboard', '/settings'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Permitir rutas públicas y estáticas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // NO interferir con rutas de admin
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Para la ruta raíz, verificar autenticación
  const isRootPath = pathname === '/';
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route)) || isRootPath;

  if (isAuthRoute) {
    // Verificar cookies de autenticación
    const userCookie = request.cookies.get('coggni-user');
    const lastActivityCookie = request.cookies.get('coggni-last-activity');
    const userTypeCookie = request.cookies.get('coggni-user-type');

    // Si no hay usuario, redirigir a login
    if (!userCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Solo verificar timeout para clientes (no admin)
    if (userTypeCookie?.value === 'client' && lastActivityCookie) {
      const lastActivity = parseInt(lastActivityCookie.value);
      const now = Date.now();
      
      if (now - lastActivity > SESSION_TIMEOUT) {
        // Sesión expirada, limpiar cookies y redirigir
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('coggni-user');
        response.cookies.delete('coggni-company-id');
        response.cookies.delete('coggni-user-type');
        response.cookies.delete('coggni-last-activity');
        return response;
      }
    }

    // Actualizar última actividad
    const response = NextResponse.next();
    if (userTypeCookie?.value === 'client') {
      response.cookies.set('coggni-last-activity', Date.now().toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};