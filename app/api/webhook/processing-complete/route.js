import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../utils/supabase/service-role';

export async function POST(request) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    // Parsear el body
    const body = await request.json();
    
    // NUEVO: Log detallado para debugging
    console.log('=== WEBHOOK PROCESSING COMPLETE RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body completo:', JSON.stringify(body, null, 2));
    console.log('webhook_call_id:', body.webhook_call_id);
    console.log('company_id:', body.company_id);
    console.log('messages count:', body.messages?.length || 0);
    console.log('First message:', body.messages?.[0]);
    console.log('===========================================');

    // Validar datos requeridos
    if (!body.webhook_call_id || !body.company_id || !body.messages) {
      console.error('❌ Missing required fields:', {
        has_webhook_call_id: !!body.webhook_call_id,
        has_company_id: !!body.company_id,
        has_messages: !!body.messages
      });
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Validar límite de mensajes
    if (body.messages.length > 1000) {
      console.error('❌ Too many messages:', body.messages.length);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // NUEVO: Verificar conexión a Supabase
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Verificar que el webhook_call_id existe en processing_logs
    console.log('🔍 Checking processing_logs for webhook_call_id:', body.webhook_call_id);
    const { data: processingLog, error: checkError } = await supabaseAdmin
      .from('processing_logs')
      .select('id')
      .eq('webhook_call_id', body.webhook_call_id)
      .single();

    if (checkError || !processingLog) {
      console.error('❌ Invalid webhook_call_id:', body.webhook_call_id);
      console.error('Error details:', checkError);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    console.log('✅ Found processing log:', processingLog.id);

    // Verificar si ya existen logs para este webhook_call_id (duplicado)
    console.log('🔍 Checking for duplicate messages...');
    const { count } = await supabaseAdmin
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('webhook_call_id', body.webhook_call_id);

    if (count > 0) {
      console.log('⚠️ Duplicate webhook_call_id, ignoring:', body.webhook_call_id);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // NUEVO: Función para detectar el origen
    const detectEnvironment = (body) => {
      if (body.webhook_call_id?.startsWith('test_')) return 'test';
      if (body.webhook_call_id?.startsWith('upload_')) return 'production';
      return 'unknown';
    };

    // NUEVO: Función para detectar si es data de prueba
    const isTestData = (msg, webhookCallId) => {
      return msg.client_code === 'TEST' || 
             msg.client_name === 'Test Direct' ||
             webhookCallId?.startsWith('test_');
    };

    // MODIFICADO: Agregar metadata a cada mensaje
    const messageLogs = body.messages.map(msg => ({
      webhook_call_id: body.webhook_call_id,
      company_id: body.company_id,
      client_code: msg.client_code,
      client_name: msg.client_name,
      channel: msg.channel,
      destination: msg.destination,
      status: msg.status,
      error_message: msg.error_message,
      strategy_used: body.strategy_used || null,
      message_type: msg.message_type || 'recordatorio_vencidas',
      sent_at: new Date().toISOString(),
      // NUEVO: Campos de metadata
      environment: detectEnvironment(body),
      source: body.webhook_call_id?.startsWith('upload_') ? 'n8n' : 'direct_api',
      is_test: isTestData(msg, body.webhook_call_id)
    }));

    console.log(`📊 Inserting ${messageLogs.length} message logs...`);
    console.log('Sample message log:', messageLogs[0]);

    // Insertar logs de mensajes
    const { error: insertError, data: insertedData } = await supabaseAdmin
      .from('message_logs')
      .insert(messageLogs)
      .select();

    if (insertError) {
      console.error('❌ Error inserting message logs:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      // No retornamos error, seguimos adelante
    } else {
      console.log(`✅ Successfully inserted ${insertedData?.length || 0} message logs`);
    }

    // Actualizar processing_logs con completed_at
    console.log('📝 Updating processing log status...');
    const { error: updateError } = await supabaseAdmin
      .from('processing_logs')
      .update({
        completed_at: body.completed_at || new Date().toISOString(),
        status: 'completed',
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('webhook_call_id', body.webhook_call_id);

    if (updateError) {
      console.error('❌ Error updating processing log:', updateError);
    } else {
      console.log('✅ Processing log updated successfully');
    }

    // Siempre retornamos OK
    return NextResponse.json({ 
      status: 'ok',
      received: body.messages.length,
      webhook_call_id: body.webhook_call_id
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in processing-complete webhook:', error);
    console.error('Stack trace:', error.stack);
    // Incluso en caso de error, retornamos OK para no bloquear n8n
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

// También manejamos GET para testing
export async function GET(request) {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/webhook/processing-complete',
    method: 'POST',
    expected_fields: ['webhook_call_id', 'company_id', 'messages']
  });
}