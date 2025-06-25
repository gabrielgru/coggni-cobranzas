import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  console.log('Test Supabase endpoint');
  
  // Test 1: Verificar que supabase existe
  const supabaseExists = !!supabase;
  
  // Test 2: Intentar una query simple
  let queryWorks = false;
  let queryError = null;
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    queryWorks = !error;
    queryError = error;
  } catch (e) {
    queryError = e.message;
  }
  
  // Test 3: Intentar insertar en message_logs
  let insertWorks = false;
  let insertError = null;
  
  try {
    const { error } = await supabase
      .from('message_logs')
      .insert({
        webhook_call_id: 'test_' + Date.now(),
        company_id: 'dental-link',
        client_code: 'TEST',
        client_name: 'Test Direct',
        channel: 'email',
        destination: 'test@test.com',
        status: 'sent'
      });
    
    insertWorks = !error;
    insertError = error;
  } catch (e) {
    insertError = e.message;
  }
  
  return NextResponse.json({
    supabaseExists,
    queryWorks,
    queryError,
    insertWorks,
    insertError,
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  });
}