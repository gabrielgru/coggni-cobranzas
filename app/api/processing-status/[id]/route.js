import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../utils/supabase/service-role';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Buscar por ID o por webhook_call_id (ya que Dashboard.js usa logId que es webhook_call_id)
    const { data, error } = await supabase
      .from('processing_logs')
      .select('*')
      .or(`id.eq.${id},webhook_call_id.eq.${id}`)
      .single();

    if (error || !data) {
      console.error('Processing log not found:', error);
      return NextResponse.json(
        { status: 'error', message: 'Processing log not found' },
        { status: 404 }
      );
    }

    // Retornar los datos en el mismo formato esperado por el frontend
    return NextResponse.json({
      status: data.status || data.processing_status,
      processing_status: data.processing_status,
      webhook_call_id: data.webhook_call_id,
      company_name: data.company_name,
      invoice_file_name: data.invoice_file_name,
      contacts_file_name: data.contacts_file_name,
      invoice_records_total: data.invoice_records_total,
      invoice_records_valid: data.invoice_records_valid,
      invoice_records_invalid: data.invoice_records_invalid,
      contacts_records_total: data.contacts_records_total,
      contacts_records_valid: data.contacts_records_valid,
      contacts_records_invalid: data.contacts_records_invalid,
      strategy: data.strategy,
      days_anticipation: data.days_anticipation,
      started_at: data.started_at,
      completed_at: data.completed_at,
      updated_at: data.updated_at,
      error_details: data.error_details
    });

  } catch (error) {
    console.error('Error in processing-status GET:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 