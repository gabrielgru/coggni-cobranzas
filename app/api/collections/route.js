import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('=== PROCESSING COMPLETE WEBHOOK ===');
    console.log('Webhook call ID:', body.webhook_call_id);
    console.log('Company ID:', body.company_id);
    console.log('Messages received:', body.messages?.length || 0);

    // Validar datos requeridos
    if (!body.webhook_call_id || !body.company_id || !body.messages) {
      console.error('Missing required fields');
      return NextResponse.json({ 
        status: 'error',
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verificar si ya procesamos este webhook_call_id
    const { count } = await supabaseAdmin
      .from('message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('webhook_call_id', body.webhook_call_id);

    if (count > 0) {
      console.log('⚠️ Duplicate webhook_call_id, ignoring:', body.webhook_call_id);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Preparar datos para insertar
    console.log('📝 Preparing message logs for insertion...');
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
      sent_at: new Date().toISOString()
    }));

    console.log(`📊 Inserting ${messageLogs.length} message logs...`);

    // Insertar logs de mensajes
    const { error: insertError, data: insertedData } = await supabaseAdmin
      .from('message_logs')
      .insert(messageLogs)
      .select();

    if (insertError) {
      console.error('❌ Error inserting message logs:', insertError);
    } else {
      console.log(`✅ Successfully inserted ${insertedData?.length || 0} message logs`);
    }

    // Actualizar processing_logs
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

    return NextResponse.json({ 
      status: 'ok',
      received: body.messages.length,
      webhook_call_id: body.webhook_call_id
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in processing-complete webhook:', error);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

export async function GET(request) {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/collections/processing-complete',
    method: 'POST',
    expected_fields: ['webhook_call_id', 'company_id', 'messages']
  });
}