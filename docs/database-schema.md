# Database Schema - Coggni Platform

## Overview
Este documento describe la estructura completa de la base de datos de Coggni, incluyendo tablas, relaciones, políticas RLS y deuda técnica.

## Authentication System
Coggni utiliza Supabase Auth como sistema principal de autenticación.

### Usuarios del Sistema
- **Usuarios de aplicación**: Autenticados via Supabase Auth (empresas clientes)
- **Usuarios administrativos**: Tabla `admin_users` para panel de administración interno

## Core Tables

### 🏢 companies
**Propósito**: Almacena información de empresas clientes
**RLS**: ✅ ENABLED
id (text, PK)
name (text)
n8n_api_key (text) - API key para integración con n8n
data_capture_enabled (bool) - Control de captura de datos
created_at (timestamptz)

### 👤 company_users
**Propósito**: Relación entre usuarios y empresas
**RLS**: ❌ DISABLED - Deuda técnica por problemas con webhooks
**Status**: ⚠️ REQUIERE LIMPIEZA DE USUARIOS LEGACY
id (uuid, PK)
company_id (text, FK → companies)
email (text)
password (text) - ⚠️ CAMPO LEGACY - Solo usuarios antiguos tienen data aquí
auth_id (uuid) - ID de Supabase Auth para usuarios migrados
role (text)
is_super_admin (bool)
created_at (timestamptz)
**Notas**:
- Usuarios nuevos: Usan Supabase Auth (auth_id)
- Usuarios legacy: Tienen password en texto plano
- Acción requerida: Identificar y migrar usuarios con password != null

### 🔧 admin_users
**Propósito**: Usuarios con acceso al panel de administración interno
**RLS**: ✅ ENABLED
id (uuid, PK)
email (text)
password_hash (text) - Hasheado correctamente
is_super_admin (bool)
last_login (timestamptz)
created_at (timestamptz)
updated_at (timestamptz)

### 📊 field_mappings
**Propósito**: Mapeo de campos CSV para cada empresa
**RLS**: ❌ DISABLED - Deuda técnica por problemas con webhooks
id (uuid, PK)
company_id (text, FK → companies)
source_field (text)
mapped_field (text)
is_mandatory (bool)
file_type (text)
created_at (timestamptz)
updated_at (timestamptz)

### 📨 message_logs
**Propósito**: Registro de mensajes enviados (WhatsApp/Email)
**RLS**: ❌ DISABLED - Deuda técnica por problemas con webhooks
id (int8, PK)
webhook_call_id (text) - ID único del proceso
company_id (text, FK → companies)
phone (text)
email (text)
invoice_number (text)
customer_name (text)
amount (numeric)
due_date (date)
message (text)
status (text)
sent_at (timestamptz)
error_message (text)
channel (text) - whatsapp/email
created_at (timestamptz)

### 📝 message_templates
**Propósito**: Plantillas de mensajes por empresa
**RLS**: ✅ ENABLED
id (uuid, PK)
company_id (text, FK → companies)
template_type (text)
subject (text)
body (text)
is_active (bool)
created_at (timestamptz)
updated_at (timestamptz)

### 💰 payment_configs [PLANNED]
**Propósito**: Configuración de proveedores de pago por empresa
**RLS**: ✅ ENABLED
**Status**: ⚠️ NO IMPLEMENTADO
id (uuid, PK)
company_id (text, FK → companies)
provider (text) - mercadolibre/redsys/stripe
config (jsonb) - Configuración específica del proveedor
is_active (bool)
created_at (timestamptz)
updated_at (timestamptz)

### 🔗 payment_links [PLANNED]
**Propósito**: Links de pago generados para cobranzas
**RLS**: ✅ ENABLED
**Status**: ⚠️ NO IMPLEMENTADO
id (uuid, PK)
company_id (text, FK → companies)
invoice_id (text)
amount (numeric)
currency (text)
status (text)
payment_url (text)
expires_at (timestamptz)
paid_at (timestamptz)
created_at (timestamptz)

### 📋 processing_logs
**Propósito**: Registro de procesos de cobranza
**RLS**: ✅ ENABLED
id (uuid, PK)
webhook_call_id (text) - ID único del proceso
company_id (text, FK → companies)
company_name (text)
user_email (text)
invoice_file_name (text)
invoice_records_total (int4)
invoice_records_valid (int4)
invoice_records_invalid (int4)
contacts_file_name (text)
contacts_records_total (int4)
contacts_records_valid (int4)
contacts_records_invalid (int4)
files_uploaded (jsonb)
strategy (text)
days_anticipation (int4)
status (text)
processing_status (text)
started_at (timestamptz)
completed_at (timestamptz)
created_at (timestamptz)
updated_at (timestamptz)
user_agent (text)
error_details (text)

### 🔌 webhooks
**Propósito**: URLs de webhooks n8n por empresa
**RLS**: ❌ DISABLED - Deuda técnica por problemas con webhooks
id (int8, PK)
company_id (text, FK → companies)
application_id (text) - cobranzas/otros
url (text) - URL del webhook n8n
is_active (bool)
is_test (bool)
created_at (timestamptz)
updated_at (timestamptz)

### ⚠️ workflow_errors
**Propósito**: Registro de errores en workflows n8n
**RLS**: ✅ ENABLED
id (uuid, PK)
workflow_name (text)
error_message (text)
error_details (jsonb)
created_at (timestamptz)

## Tablas Obsoletas (A ELIMINAR)
- `z_old_auth_migration_logs`
- `z_old_field_mappings_backup_20250701`

## Deuda Técnica

### 1. RLS Deshabilitado [CRITICAL]
**Tablas afectadas**:
- `company_users`
- `field_mappings`
- `message_logs`
- `webhooks`

**Problema**: RLS fue deshabilitado debido a problemas con webhooks de n8n
**Impacto**: Vulnerabilidad de seguridad - cualquier usuario autenticado puede ver datos de todas las empresas
**Solución propuesta**:
1. Investigar el problema específico con webhooks
2. Implementar service role para n8n
3. Re-habilitar RLS con políticas correctas

### 2. Passwords en Texto Plano [CRITICAL]
**Tabla**: `company_users`
**Problema**: Passwords almacenados sin hashear
**Solución**: Completar migración a Supabase Auth y eliminar tabla

### 3. Políticas RLS Genéricas [MEDIUM]
**Problema**: Muchas tablas usan política genérica "Allow all to authenticated users"
**Impacto**: No hay aislamiento por empresa
**Solución propuesta**: Implementar políticas específicas por empresa

## Recomendaciones de Políticas RLS

### Para tablas con company_id:
```sql
-- Ejemplo para field_mappings
CREATE POLICY "Users see own company data" ON field_mappings
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM auth.users
    WHERE id = auth.uid()
  )
);
```

Para webhooks de n8n:

```sql
-- Permitir service role para n8n
CREATE POLICY "Service role full access" ON webhooks
FOR ALL USING (
  auth.jwt()->>'role' = 'service_role'
);

-- Usuarios ven solo sus webhooks
CREATE POLICY "Users see own webhooks" ON webhooks
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM auth.users
    WHERE id = auth.uid()
  )
);
```

Features Pendientes

1. Sistema de Payment Links [PLANNED]

Objetivo: Integrar links de pago en recordatorios de cobranza
Proveedores:
- MercadoLibre (LATAM)
- Redsys (España)
- Stripe (Global)

Implementación pendiente:
1. Activar tablas payment_configs y payment_links
2. Crear API endpoints para generar links
3. Integrar con proveedores de pago
4. Actualizar templates de mensajes

Índices Recomendados

-- Para búsquedas frecuentes
CREATE INDEX idx_message_logs_webhook_id ON message_logs(webhook_call_id);
CREATE INDEX idx_processing_logs_webhook_id ON processing_logs(webhook_call_id);
CREATE INDEX idx_message_logs_company_date ON message_logs(company_id, created_at);

Notas de Mantenimiento

- Hacer backup antes de eliminar tablas z_old_*
- Monitorear performance después de re-habilitar RLS
- Considerar particionamiento para message_logs si crece mucho 