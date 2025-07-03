// Nuevo: Proxy SOLO para el helper de browser
export { createClient as createBrowserClient } from '../utils/supabase/client';

// Cliente con service role (solo para servidor, si es necesario)
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createSupabaseClient(
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
  
  if (!supabaseAdmin) {
    console.error('[Supabase Test] No client available');
    return { success: false, error: 'No Supabase client' };
  }
  
  try {
    // Intentar una query simple
    const { data, error } = await supabaseAdmin
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