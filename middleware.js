import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './app/utils/supabase/middleware';

export async function middleware(request) {
  // Excluir rutas de API del middleware
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};