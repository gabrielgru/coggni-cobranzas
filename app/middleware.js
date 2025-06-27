import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/api/auth/login'];
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Skip públicas
  if (PUBLIC_ROUTES.includes(path)) return;
  
  // Verificar cookie
  const session = request.cookies.get('coggni-session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verificar timeout
  const lastActivity = request.cookies.get('coggni-last-activity');
  if (lastActivity && Date.now() - parseInt(lastActivity.value) > SESSION_TIMEOUT) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('coggni-session');
    response.cookies.delete('coggni-last-activity');
    return response;
  }
  
  // Actualizar actividad
  const response = NextResponse.next();
  response.cookies.set('coggni-last-activity', Date.now().toString(), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};