import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../utils/supabase/service-role';

export async function POST(request) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    const errorData = await request.json();
    
    console.log('=== WORKFLOW ERROR RECEIVED ===');
    console.log('Error data:', JSON.stringify(errorData, null, 2));
    
    // Validar datos mínimos
    if (!errorData.webhook_call_id || !errorData.company_id) {
      console.error('Missing required fields for error logging');
      return NextResponse.json({ 
        status: 'error',
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Guardar en workflow_errors
    const { data, error } = await supabaseAdmin
      .from('workflow_errors')
      .insert({
        webhook_call_id: errorData.webhook_call_id,
        company_id: errorData.company_id,
        error_node: errorData.error_node,
        error_message: errorData.error_message,
        error_details: errorData.error_details,
        workflow_execution_id: errorData.workflow_execution_id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving to workflow_errors:', error);
      return NextResponse.json({ 
        status: 'error',
        message: 'Failed to save error' 
      }, { status: 500 });
    }
    
    console.log('✅ Error saved successfully:', data.id);
    
    // También actualizar processing_logs si es posible
    if (errorData.webhook_call_id !== 'unknown') {
      const { error: updateError } = await supabaseAdmin
        .from('processing_logs')
        .update({
          status: 'error',
          processing_status: 'error',
          error_details: {
            error_node: errorData.error_node,
            error_message: errorData.error_message,
            error_time: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('webhook_call_id', errorData.webhook_call_id);
      
      if (updateError) {
        console.error('Error updating processing_logs:', updateError);
      } else {
        console.log('✅ Processing log updated to error status');
      }
    }
    
    return NextResponse.json({ 
      status: 'ok',
      error_id: data.id,
      message: 'Error logged successfully' 
    });
    
  } catch (error) {
    console.error('Error in workflow-error endpoint:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/workflow-error',
    method: 'POST',
    purpose: 'Log workflow errors from n8n'
  });
}