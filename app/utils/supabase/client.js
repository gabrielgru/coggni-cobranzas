// ========================================
// ARCHIVO: app/utils/supabase/client.js
// CLIENTE SUPABASE FINAL - VERSIÓN LIMPIA
// Qué hace: Cliente que funciona correctamente con cookies
// Por qué: Configuración híbrida para SSR + client-side
// ========================================

import { createBrowserClient } from '@supabase/ssr';

// ========================================
// FUNCIÓN: Crear cliente del navegador
// Qué hace: Cliente configurado para leer cookies del middleware
// Por qué: Para mantener sesión entre server y client
// ========================================
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // ========================================
        // Leer cookies del navegador
        // ========================================
        get(name) {
          if (typeof document !== 'undefined') {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
              return parts.pop().split(';').shift();
            }
          }
          return undefined;
        },
        
        // ========================================
        // Establecer cookies
        // ========================================
        set(name, value, options) {
          if (typeof document !== 'undefined') {
            let cookieStr = `${name}=${value || ''}; path=/`;
            
            if (options?.maxAge) {
              cookieStr += `; max-age=${options.maxAge}`;
            }
            if (options?.expires) {
              cookieStr += `; expires=${options.expires.toUTCString()}`;
            }
            if (options?.sameSite) {
              cookieStr += `; samesite=${options.sameSite}`;
            }
            if (options?.secure) {
              cookieStr += `; secure`;
            }
            
            document.cookie = cookieStr;
          }
        },
        
        // ========================================
        // Remover cookies
        // ========================================
        remove(name, options) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
          }
        }
      }
    }
  );
}