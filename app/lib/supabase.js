// REEMPLAZAR TODO EL ARCHIVO CON:

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Logs detallados para debug
console.log('[Supabase Init] Starting initialization...');
console.log('[Supabase Init] URL present:', !!supabaseUrl);
console.log('[Supabase Init] URL value:', supabaseUrl || 'MISSING');
console.log('[Supabase Init] Key present:', !!supabaseAnonKey);
console.log('[Supabase Init] Environment:', process.env.NODE_ENV);

// Log del user agent para identificar mobile
if (typeof window !== 'undefined') {
  console.log('[Supabase Init] User Agent:', navigator.userAgent);
  console.log('[Supabase Init] Is Mobile:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Init] CRITICAL: Missing environment variables!');
  console.error('[Supabase Init] This will cause login to fail');
  
  // En desarrollo, mostrar las variables esperadas
  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase Init] Expected variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Cliente público con configuración para mobile
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'coggni-supabase-auth',
        autoRefreshToken: true,
        // Configuración específica para mobile
        flowType: 'implicit'
      },
      // Headers para evitar problemas de CORS en mobile
      global: {
        headers: {
          'x-client-info': 'coggni-app'
        }
      }
    })
  : null;

console.log('[Supabase Init] Client created:', !!supabase);

// Cliente con service role (solo para servidor)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Función de prueba para verificar conexión
export const testSupabaseConnection = async () => {
  console.log('[Supabase Test] Starting connection test...');
  
  if (!supabase) {
    console.error('[Supabase Test] No client available');
    return { success: false, error: 'No Supabase client' };
  }
  
  try {
    // Intentar una query simple
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[Supabase Test] Query failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Supabase Test] Connection successful');
    return { success: true };
  } catch (err) {
    console.error('[Supabase Test] Connection error:', err);
    return { success: false, error: err.message };
  }
};