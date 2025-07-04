import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../utils/supabase/service-role';

export async function POST(request) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    const body = await request.json();

    // Validar campos requeridos
    if (!body.webhook_call_id || !body.company_id || !body.user_email) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Insertar en processing_logs
    const { data, error } = await supabaseAdmin
      .from('processing_logs')
      .insert({
        webhook_call_id: body.webhook_call_id,
        status: body.status || 'processing',
        user_email: body.user_email,
        company_id: body.company_id,
        company_name: body.company_name || null,
        invoice_file_name: body.invoice_file_name || null,
        invoice_records_total: body.invoice_records_total || null,
        invoice_records_valid: body.invoice_records_valid || null,
        invoice_records_invalid: body.invoice_records_invalid || null,
        contacts_file_name: body.contacts_file_name || null,
        contacts_records_total: body.contacts_records_total || null,
        contacts_records_valid: body.contacts_records_valid || null,
        contacts_records_invalid: body.contacts_records_invalid || null,
        strategy: body.strategy || null,
        days_anticipation: body.days_anticipation || null,
        processing_status: body.processing_status || 'processing',
        user_agent: body.user_agent || null,
        started_at: body.started_at || new Date().toISOString(),
        files_uploaded: body.files_uploaded || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Falta el id del registro a actualizar' }, { status: 400 });
    }
    // Copia todos los campos excepto id
    const { id, ...fieldsToUpdate } = body;
    const { data, error } = await supabaseAdmin
      .from('processing_logs')
      .update(fieldsToUpdate)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 