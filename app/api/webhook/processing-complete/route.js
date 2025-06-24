import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    // Parsear el body
    const body = await request.json();
    
    // Log para debugging
    console.log('Processing complete webhook received:', {
      webhook_call_id: body.webhook_call_id,
      company_id: body.company_id,
      messages_count: body.messages?.length || 0
    });

    // Validar datos requeridos
    if (!body.webhook_call_id || !body.company_id || !body.messages) {
      console.error('Missing required fields');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Validar límite de mensajes
    if (body.messages.length > 1000) {
      console.error('Too many messages:', body.messages.length);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Verificar que el webhook_call_id existe en processing_logs
    const { data: processingLog, error: checkError } = await supabase
      .from('processing_logs')
      .select('id')
      .eq('webhook_call_id', body.webhook_call_id)
      .single();

    if (checkError || !processingLog) {
      console.error('Invalid webhook_call_id:', body.webhook_call_id);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Verificar si ya existen logs para este webhook_call_id (duplicado)
    const { count } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('webhook_call_id', body.webhook_call_id);

    if (count > 0) {
      console.log('Duplicate webhook_call_id, ignoring:', body.webhook_call_id);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Preparar datos para insertar
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

    // Insertar logs de mensajes
    const { error: insertError } = await supabase
      .from('message_logs')
      .insert(messageLogs);

    if (insertError) {
      console.error('Error inserting message logs:', insertError);
      // No retornamos error, seguimos adelante
    }

    // Actualizar processing_logs con completed_at
    const { error: updateError } = await supabase
      .from('processing_logs')
      .update({
        completed_at: body.completed_at || new Date().toISOString(),
        status: 'completed',
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('webhook_call_id', body.webhook_call_id);

    if (updateError) {
      console.error('Error updating processing log:', updateError);
    }

    // Siempre retornamos OK
    return NextResponse.json({ 
      status: 'ok',
      received: body.messages.length,
      webhook_call_id: body.webhook_call_id
    }, { status: 200 });

  } catch (error) {
    console.error('Error in processing-complete webhook:', error);
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