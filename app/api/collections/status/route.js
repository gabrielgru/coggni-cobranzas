import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function PATCH(request) {
  try {
    const body = await request.json();
    
    if (!body.webhook_call_id || !body.status) {
      return NextResponse.json({ 
        status: 'error',
        message: 'webhook_call_id and status are required' 
      }, { status: 400 });
    }
    
    const updateData = {
      status: body.status,
      processing_status: body.status,
      updated_at: new Date().toISOString()
    };
    
    if (body.error_details) {
      updateData.error_details = body.error_details;
    }
    
    const { error } = await supabaseAdmin
      .from('processing_logs')
      .update(updateData)
      .eq('webhook_call_id', body.webhook_call_id);
    
    if (error) {
      console.error('Error updating processing status:', error);
      return NextResponse.json({ 
        status: 'error',
        message: 'Failed to update status' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Status updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: '/api/collections/status',
    method: 'PATCH',
    purpose: 'Update processing status'
  });
}