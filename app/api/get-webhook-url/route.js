// ========================================
// ARCHIVO: app/api/get-webhook-url/route.js
// API ROUTE PARA OBTENER URL DE WEBHOOK
// 
// ¿QUÉ HACE ESTE ARCHIVO?
// Esta API route actúa como intermediario seguro entre el frontend y la
// tabla de webhooks en Supabase. Valida que el usuario tenga permisos
// antes de devolver la URL del webhook.
//
// ¿POR QUÉ EXISTE?
// - El frontend no puede usar service role (inseguro)
// - La tabla webhooks tiene problemas de RLS por tipos incompatibles
// - Necesitamos validar permisos antes de devolver datos sensibles
// - Evita exponer todas las URLs de webhooks a cualquier usuario
//
// ¿CÓMO FUNCIONA?
// 1. Recibe company_id del frontend
// 2. Verifica que el usuario esté autenticado
// 3. Valida que el usuario pertenezca a esa empresa
// 4. Solo entonces devuelve la URL del webhook
//
// ¿CUÁNDO SE USA?
// - Cuando el usuario procesa una cobranza
// - Dashboard.js llama a esta API antes de enviar al webhook
// ========================================

import { NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';

export async function POST(request) {
  try {
    // ========================================
    // PASO 1: Verificar autenticación
    // ¿Por qué? Sin usuario autenticado, no hay acceso a nada
    // ========================================
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[API] get-webhook-url: Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ========================================
    // PASO 2: Obtener company_id del request
    // ¿Por qué? Necesitamos saber qué webhook buscar
    // ========================================
    const { companyId } = await request.json();
    
    if (!companyId) {
      console.log('[API] get-webhook-url: No se proporcionó company_id');
      return NextResponse.json({ error: 'company_id es requerido' }, { status: 400 });
    }

    console.log('[API] get-webhook-url: Buscando webhook para empresa:', companyId);

    // ========================================
    // PASO 3: Verificar que el usuario pertenezca a la empresa
    // ¿Por qué? Seguridad - no queremos que usuarios vean webhooks de otras empresas
    // NOTA: Aquí NO usamos service role, usamos el cliente autenticado normal
    // ========================================
    const { data: userCompany, error: userError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('auth_id', user.id)  // user.id ya es string, no necesita cast
      .eq('company_id', companyId)
      .single();

    if (userError || !userCompany) {
      console.log('[API] get-webhook-url: Usuario no pertenece a la empresa', { 
        userId: user.id, 
        companyId,
        error: userError 
      });
      return NextResponse.json({ error: 'No autorizado para esta empresa' }, { status: 403 });
    }

    // ========================================
    // PASO 4: Buscar el webhook activo
    // ¿Por qué? Ahora que validamos permisos, podemos buscar el webhook
    // NOTA: Como RLS está deshabilitado en webhooks, cualquier usuario
    // autenticado puede leer, por eso validamos permisos arriba
    // ========================================
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('url')
      .eq('company_id', companyId)
      .eq('application_id', 'cobranzas')  // Solo webhooks de cobranzas
      .eq('is_active', true)              // Solo webhooks activos
      .single();                          // Esperamos solo uno

    // ========================================
    // Manejo de errores al buscar webhook
    // ========================================
    if (webhookError) {
      console.error('[API] get-webhook-url: Error buscando webhook:', webhookError);
      return NextResponse.json({ 
        error: 'Error al buscar configuración de webhook' 
      }, { status: 500 });
    }
    
    if (!webhook || !webhook.url) {
      console.log('[API] get-webhook-url: No se encontró webhook activo para empresa:', companyId);
      return NextResponse.json({ 
        error: 'No se encontró webhook activo para esta empresa' 
      }, { status: 404 });
    }

    // ========================================
    // ÉXITO: Devolver la URL
    // ========================================
    console.log('[API] get-webhook-url: Webhook encontrado exitosamente');
    return NextResponse.json({ url: webhook.url });

  } catch (err) {
    // ========================================
    // Manejo de errores inesperados
    // ========================================
    console.error('[API] get-webhook-url: Error inesperado:', err);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}