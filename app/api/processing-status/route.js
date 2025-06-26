import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase';

export async function PATCH(request) {
  try {
    const { webhook_call_id, status, error_details } = await request.json();
    
    console.log('=== PROCESSING STATUS UPDATE ===');
    console.log('Webhook Call ID:', webhook_call_id);
    console.log('New Status:', status);
    
    if (!webhook_call_id || !status) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Actualizar el estado en processing_logs
    const updateData = {
      status: status,
      processing_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Si es error, agregar detalles
    if (status === 'error' && error_details) {
      updateData.error_details = error_details;
    }
    
    // Si es completado, agregar timestamp
    if (status === 'completed' || status === 'success') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabaseAdmin
      .from('processing_logs')
      .update(updateData)
      .eq('webhook_call_id', webhook_call_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating processing status:', error);
      return NextResponse.json({ 
        status: 'error',
        message: 'Failed to update status' 
      }, { status: 500 });
    }
    
    console.log('✅ Processing status updated successfully');
    
    return NextResponse.json({ 
      status: 'ok',
      updated: true,
      new_status: status
    });
    
  } catch (error) {
    console.error('Error in processing-status endpoint:', error);
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
    endpoint: '/api/processing-status',
    method: 'PATCH',
    purpose: 'Update processing status from n8n'
  });
}