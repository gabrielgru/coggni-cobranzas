import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Eliminar todas las cookies de sesión
  response.cookies.delete('coggni-session');
  response.cookies.delete('coggni-last-activity');
  
  return response;
}