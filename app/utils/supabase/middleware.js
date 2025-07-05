// ========================================
// ARCHIVO: app/utils/supabase/middleware.js
// MIDDLEWARE CORREGIDO - httpOnly: false
// Qué hace: Refresca tokens con cookies accesibles desde JS
// Por qué: Para que el cliente pueda leer la sesión
// ========================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  console.log('[Middleware] Processing request:', request.nextUrl.pathname);
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: false, // ← CAMBIO CRÍTICO: false para que JS pueda acceder
              path: '/',
            })
          );
        },
      },
    }
  );

  // IMPORTANTE: Este código refrescará la sesión si está expirada
  // y seteará las cookies correctamente
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[Middleware] User found:', user ? user.email : 'none');

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next')
  ) {
    console.log('[Middleware] Redirecting to login');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}