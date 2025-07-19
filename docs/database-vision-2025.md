# Database Vision 2025: N8n Integration & Dynamic Configuration

## Context & Problem Statement

**Current State**: N8n workflow tiene configuraciones hardcodeadas:
- Números de WhatsApp y emails fijos por empresa
- Templates de mensajes dentro del código n8n
- Base de contactos se re-procesa en cada ejecución
- Sin flexibilidad para personalización por cliente

**Problem**: Cada nueva empresa requiere modificaciones de código en n8n, no escalable.

**Goal**: Mover configuraciones a base de datos para workflow dinámico y escalable.

## Proposed Solution

### Vision Overview
Transformar n8n de workflow estático a workflow dinámico que consulte BD para:
1. **Sender configs** (WhatsApp/Email por empresa+app)
2. **Contact database** con datos limpios persistentes
3. **Message templates** flexibles con variables dinámicas

### Business Impact
- ✅ Onboarding de nuevos clientes sin cambios de código
- ✅ Personalización total de mensajes por empresa
- ✅ Performance mejorado (datos limpios pre-procesados)
- ✅ Auditoría completa de comunicaciones

## Detailed Database Design

### 1. 📱 sender_information
**Purpose**: Configuración dinámica de remitentes por empresa/app

```sql
CREATE TABLE sender_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES companies(id),
  app text NOT NULL, -- 'cobranzas', 'ventas', etc.
  channel_type text NOT NULL, -- 'whatsapp', 'email'
  version integer NOT NULL DEFAULT 1,
  is_production boolean DEFAULT true,
  is_test boolean DEFAULT false,
  sender_value text NOT NULL, -- phone number or email
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(company_id, app, channel_type, version)
);

-- Agregar números de Coggni como empresa
INSERT INTO companies (id, name) VALUES ('coggni', 'Coggni Platform');
```

Key Design Decisions:
- ✅ Múltiples versiones activas simultáneamente (prod + test)
- ✅ Un WhatsApp por app por empresa (escalable a ventas vs cobranzas)
- ✅ Coggni como empresa para compartir números con clientes

### 2. 👥 contacts_database

Purpose: Base persistente de contactos con datos originales + limpios

```sql
CREATE TABLE contacts_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES companies(id),

  -- Datos originales (del Excel)
  client_code_original text,
  client_name_original text,
  phone_1_original text,
  phone_2_original text,
  phone_3_original text,
  email_original text,

  -- Datos limpios (procesados por n8n)
  client_name_clean text,
  phone_1_clean text,
  phone_2_clean text,
  phone_3_clean text,
  email_clean text,

  -- Metadatos de procesamiento
  last_processed_at timestamptz,
  processing_version text,
  whatsapp_priority_phone text, -- phone_1_clean, phone_2_clean, etc.

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, client_code_original)
);
```

Key Design Decisions:
- ✅ Estrategia dual: original + limpio para performance y auditoría
- ✅ client_code_original único por empresa (no entre empresas)
- ✅ whatsapp_priority_phone para optimizar envíos
- ✅ Upsert strategy: sobreescribir solo datos del nuevo Excel

### 3. 📝 message_templates

Purpose: Templates dinámicos unificados con máxima flexibilidad

```sql
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES companies(id),
  app text NOT NULL,
  channel_type text NOT NULL, -- 'email', 'whatsapp'
  version integer NOT NULL DEFAULT 1,
  template_data jsonb NOT NULL,
  variables_used text[], -- ['customer_name', 'amount', 'due_date']
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, app, channel_type, version)
);
```

-- Ejemplo template_data para email:
```json
{
  "subject": "Recordatorio de pago - {{customer_name}}",
  "header": "<html><body>",
  "greeting": "Estimado/a {{customer_name}}",
  "body": "Le recordamos que tiene facturas pendientes por {{total_amount}}",
  "footer": "Saludos cordiales,<br>{{company_name}}",
  "contact_info": "Para consultas: {{company_email}}"
}
```

-- Ejemplo template_data para whatsapp:
```json
{
  "greeting": "Hola {{customer_name}}! 👋",
  "body": "Te recordamos que tienes facturas pendientes:\n{{invoice_list}}\nTotal: {{total_amount}}",        
  "footer": "¡Gracias por tu atención!"
}
```

Key Design Decisions:
- ✅ JSONB para máxima flexibilidad por canal
- ✅ Variables dinámicas con {{variable}} syntax
- ✅ Una tabla unificada vs tablas separadas
- 🔄 Implementación POSTERIOR (analizar flujo n8n primero)

## N8n Workflow Integration Strategy

Current vs Proposed Flow

Current: webhook → 3 branches (contacts+invoices+fieldmappings) → merge

Proposed: webhook → set (all configs) → parallel processing → merge

Set Node Configuration

// En el primer Set node después del webhook:
```json
{
  "sender_config": "{{ $json.sender_info }}",
  "field_mappings": "{{ JSON.stringify($json.field_mappings) }}",
  "message_templates": "{{ $json.templates }}",
  "company_settings": "{{ $json.company_config }}"
}
```

Benefits:
- ✅ Todas las configs en un solo request inicial
- ✅ Set node propaga datos a ramas paralelas
- ✅ Mejor performance vs múltiples HTTP requests

## Migration Strategy

Phase 1: Core Tables (CURRENT)

1. ✅ Crear sender_information
2. ✅ Crear contacts_database
3. ✅ Migrar datos existentes si los hay
4. ✅ Modificar n8n workflow para usar nuevas tablas

Phase 2: Templates (FUTURE)

1. 🔄 Analizar templates actuales en n8n
2. 🔄 Identificar variables comunes vs específicas
3. 🔄 Crear message_templates con datos migrados
4. 🔄 Eliminar message_templates actual (vacía)

Phase 3: Admin Panel Integration

1. 🔄 UI para gestionar sender configs
2. 🔄 UI para preview de templates
3. 🔄 Dashboard de contactos por empresa

## Trade-offs & Consequences

Gains ✅

- Escalabilidad: Nuevos clientes sin código
- Flexibilidad: Personalización total por empresa
- Performance: Datos limpios pre-procesados
- Mantenibilidad: Configuración centralizada
- Auditoría: Trazabilidad completa

Costs ❌

- Complejidad: Más tablas y relaciones
- Migration effort: Modificar n8n existente
- Initial setup: Más configuración por cliente
- Data consistency: Mantener original + limpio sincronizado

Risks ⚠️

- N8n performance: Más queries en workflow
- Data integrity: Múltiples versiones activas
- Template complexity: JSONB vs structured fields

## Implementation Checklist

Immediate Actions

- Crear tablas sender_information y contacts_database
- Poblar datos de Coggni como empresa base
- Crear endpoint API para n8n: GET /api/n8n-config/{company_id}/{app}
- Modificar webhook n8n para usar nuevo endpoint
- Testing con empresa piloto

Future Actions

- Analizar templates actuales en n8n workflow
- Diseñar estructura JSONB final para templates
- Crear UI admin para gestión de configuraciones
- Implementar sistema de versioning para rollbacks

## Questions & Decisions Pending

1. Contact uniqueness: ¿Usar client_code o generar UUIDs internos?
2. Template versioning: ¿Cómo manejar rollback de templates?
3. Data retention: ¿Cuánto tiempo mantener versiones antiguas?
4. Monitoring: ¿Alertas si sender configs fallan?

---
Decision Status: ✅ APPROVED - Proceder con Phase 1
Next Review: Post-implementación Phase 1
Owner: Gabriel + Claude Code
Stakeholders: N8n workflow, admin panel, client onboarding 