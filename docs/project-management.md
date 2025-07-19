# Project Management - Coggni Cobranzas

## Features Pendientes de Desarrollo

### 1. Fix Login Colgado - Endpoint Processing Status [COMPLETED]

**Fecha identificación:** 2025-07-14
**Fecha implementación:** 2025-07-19
**Prioridad:** Alta
**Estado:** Completado

#### Problema
- Tras periodo de inactividad (~1 hora), el login y dashboard quedan "colgados"
- Error en consola: peticiones a `/api/processing-status/<id>` retornan 404
- Error de parseo JSON al recibir HTML en lugar de JSON
- Se soluciona temporalmente con F5 pero vuelve a ocurrir

#### Causa Raíz
- No existía endpoint dinámico `/api/processing-status/[id]/route.js`
- Frontend (Dashboard.js:405) intentaba hacer fetch a endpoint inexistente
- Solo existía endpoint base que maneja PATCH (n8n) y GET (health check)

#### Solución Implementada
✅ Creado endpoint RESTful dinámico:
- Archivo: `app/api/processing-status/[id]/route.js`
- Funcionalidad: GET por ID de processing_log
- Soporta búsqueda por `id` o `webhook_call_id`
- Retorna JSON con status y detalles completos
- Maneja errores 404/400/500 correctamente con JSON

#### Detalles Técnicos
- El endpoint busca registros por ID o webhook_call_id
- Compatible con el timeout de 5 minutos en Dashboard.js
- Retorna todos los campos necesarios para el frontend
- Manejo de errores robusto con logs apropiados

#### Referencias
- Bitácora técnica completa: `g:\My Drive\[06] Coggni\6 - Product\4 - Features a desarrollar web app\2025-07-14 17-45 - mejoras en login que queda colgado.txt`
- Código afectado: `app/collections/components/Dashboard.js:405`
- Solución implementada: `app/api/processing-status/[id]/route.js`

---

### 2. [Espacio para próximas features]

## Convenciones
- [PLANNED]: Feature identificada, pendiente desarrollo
- [IN_PROGRESS]: En desarrollo activo
- [COMPLETED]: Completada y en producción
- [DEPRECATED]: Ya no relevante o reemplazada

Este prompt creará la documentación necesaria para retomar el trabajo mañana. 

---

### 3. Deuda Técnica - RLS Deshabilitado [HIGH PRIORITY]

Fecha identificación: 2025-07-19
Prioridad: Alta
Estado: Pendiente

Problema

- RLS deshabilitado en tablas críticas: company_users, field_mappings, message_logs, webhooks
- Causa: Problemas con webhooks de n8n que no funcionaban con RLS activo
- Impacto: Cualquier usuario autenticado puede ver datos de todas las empresas

Solución Propuesta

1. Investigar problema específico con service role de n8n
2. Implementar políticas RLS correctas por empresa
3. Re-habilitar RLS tabla por tabla con testing exhaustivo

---

### 4. Feature - Sistema de Payment Links [PLANNED]

Fecha identificación: 2025-07-19
Prioridad: Media
Estado: Pendiente

Descripción

Integrar links de pago en los recordatorios de cobranza para facilitar el cobro

Proveedores a Integrar

- MercadoLibre/MercadoPago (LATAM)
- Redsys (España)
- Stripe (Global/Backup)

Implementación

1. Activar tablas payment_configs y payment_links
2. Crear endpoints API para generar links
3. Integrar SDKs de proveedores
4. Actualizar templates de mensajes con links de pago
5. Dashboard de tracking de pagos

---

### 5. Deuda Técnica - Limpieza de usuarios legacy en company_users [CRITICAL]

**Fecha identificación:** 2025-07-19
**Prioridad:** Crítica
**Estado:** Pendiente

#### Problema
- Tabla company_users contiene mezcla de usuarios:
  - Usuarios nuevos: Autenticados via Supabase Auth (auth_id)
  - Usuarios legacy: Passwords en texto plano en campo password
- Sistema dual de autenticación activo

#### Solución
1. Identificar usuarios con password != null (legacy)
2. Migrar estos usuarios a Supabase Auth
3. Eliminar datos del campo password después de migración
4. Mantener tabla company_users para relación usuario-empresa
5. Actualizar campo password a nullable o eliminarlo

#### Query para identificar usuarios legacy:
```sql
SELECT email, company_id, created_at 
FROM company_users
WHERE password IS NOT NULL
  AND auth_id IS NULL;
``` 

---

### 6. Feature - N8n Dynamic Configuration System [PLANNED]

**Fecha identificación:** 2025-07-19
**Prioridad:** Alta
**Estado:** Fase 1 - Pendiente

#### Descripción
Migrar configuraciones hardcodeadas de n8n a base de datos para workflow dinámico y escalable

#### Problema Actual
- Configuraciones de WhatsApp/Email hardcodeadas en n8n
- Cada nueva empresa requiere modificaciones de código
- Base de contactos se re-procesa en cada ejecución
- Sin flexibilidad para personalización por cliente

#### Solución Propuesta - Fase 1
1. **sender_information**: Configuración dinámica de remitentes por empresa/app
2. **contacts_database**: Base persistente con datos originales + limpios
3. **API endpoint**: `/api/n8n-config/{company_id}/{app}` para n8n
4. **Workflow update**: Modificar n8n para consultar BD en lugar de hardcode

#### Implementación Fase 1
- [ ] Crear tabla sender_information
- [ ] Crear tabla contacts_database
- [ ] Poblar datos iniciales (incluir Coggni como empresa)
- [ ] Crear endpoint API para n8n
- [ ] Modificar workflow n8n para usar nuevo endpoint
- [ ] Testing con empresa piloto

#### Beneficios Esperados
- Onboarding sin modificaciones de código
- Performance mejorado (datos pre-procesados)
- Escalabilidad para múltiples empresas
- Flexibilidad en configuración por cliente

#### Referencias
- Documentación completa: `docs/database-vision-2025.md`
- Esquema actual: `docs/database-schema.md`

---

### 7. Feature - Message Templates Dinámicos [FUTURE]

**Fecha identificación:** 2025-07-19
**Prioridad:** Media
**Estado:** Fase 2 - Análisis pendiente

#### Descripción
Sistema de templates flexibles con variables dinámicas para personalización completa de mensajes

#### Dependencias
- ✅ Completar Fase 1 del sistema dinámico
- 🔄 Analizar templates actuales en n8n workflow
- 🔄 Identificar variables comunes vs específicas por empresa

#### Implementación Fase 2
1. Analizar estructura de templates en n8n actual
2. Diseñar schema JSONB para máxima flexibilidad
3. Crear tabla message_templates unificada
4. Implementar sistema de variables {{variable}}
5. UI admin para gestión de templates
6. Migrar templates existentes

#### Consideraciones Técnicas
- JSONB para estructura flexible por canal (email vs whatsapp)
- Variables dinámicas: {{customer_name}}, {{amount}}, {{due_date}}
- Versionado de templates para rollbacks
- Formato por país/idioma (fechas, números, monedas)

---

### 8. Mejora - Contact Data Strategy [PLANNED]

**Fecha identificación:** 2025-07-19
**Prioridad:** Alta
**Estado:** Incluido en Fase 1

#### Descripción
Implementar estrategia dual para datos de contactos: originales + limpios

#### Beneficios
- **Performance**: Evitar re-procesamiento en cada envío
- **Auditoría**: Comparar datos originales vs procesados
- **Flexibilidad**: Re-procesar solo cuando cambien reglas de limpieza

#### Implementación
- Campos `*_original` para datos del Excel sin procesar
- Campos `*_clean` para datos procesados por n8n
- Metadatos: `last_processed_at`, `processing_version`
- Estrategia upsert: actualizar solo contactos presentes en nuevo Excel

#### Impacto en N8n
- Primera carga: procesar y guardar datos limpios
- Cargas posteriores: usar datos limpios existentes
- Re-procesamiento opcional cuando mejoren algoritmos 

---

### 9. Feature - Company Configuration System [PLANNED]

**Fecha identificación:** 2025-07-19 (basado en documento 2025-07-04)
**Prioridad:** Media
**Estado:** Refinamiento de Fase 1

#### Descripción
Sistema de configuración por empresa para personalizar comportamiento de n8n sin hardcoding

#### Problema Identificado
Cada empresa necesita configuraciones específicas:
- Información de contacto (teléfono, email, horarios)
- URLs de pago personalizadas
- Formato de números/fechas por país
- Features habilitadas/deshabilitadas por empresa

#### Solución Propuesta
Extender tabla `companies` o crear tabla `company_configs`:

```sql
-- Opción A: Agregar a companies
ALTER TABLE companies ADD COLUMN config jsonb;

-- Opción B: Nueva tabla
CREATE TABLE company_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES companies(id),
  config_type text NOT NULL, -- 'general', 'payment', 'formatting', etc.
  config_data jsonb NOT NULL,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

Ejemplo configuración:

{
  "contact_info": {
    "phone": "+598 12345678",
    "email": "admin@empresa.com",
    "business_hours": "Lun a Vie 9:00 - 18:00"
  },
  "payment": {
    "payment_url": "https://empresa.com/pagos/",
    "show_payment_button": true,
    "accepted_methods": ["credit_card", "bank_transfer"]
  },
  "formatting": {
    "number_format": "es-UY",
    "date_format": "DD/MM/YYYY",
    "currency": "UYU",
    "timezone": "America/Montevideo"
  },
  "features": {
    "enable_whatsapp": true,
    "enable_email": true,
    "enable_payment_links": false,
    "max_reminders": 3
  }
}

Impacto en N8n

- Workflow consulta configs junto con sender_information
- Lógica condicional basada en features habilitadas
- Formateo automático según configuración de país
- Información de contacto dinámica en templates

Beneficios

- Personalización total sin modificar código
- Soporte multi-país automático
- Features A/B testing por empresa
- Configuración granular per empresa

---
### 10. Mejora - N8n Rollback Strategy [PLANNED]

Fecha identificación: 2025-07-19 (basado en documento 2025-07-04)
Prioridad: Alta
Estado: Requerido para Fase 1

Descripción

Plan de rollback y versionado para cambios en workflow n8n

Componentes

1. Backup automático antes de modificaciones
2. Versionado de workflows con tags
3. Rollback plan documentado
4. Testing gradual por empresa

Implementación

- Backup workflow actual antes de modificaciones
- Duplicar workflow para testing paralelo
- Documentar procedimiento de rollback
- Plan de testing: empresa test → empresa real → todas
- Monitoreo de errores post-deploy

Funciones Supabase Recomendadas

-- Función optimizada para n8n
CREATE OR REPLACE FUNCTION get_company_full_config(p_company_id TEXT)
RETURNS TABLE (
  sender_configs jsonb,
  message_templates jsonb,
  company_config jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT jsonb_agg(row_to_json(si)) FROM sender_information si WHERE si.company_id = p_company_id AND     
 si.is_active = true) as sender_configs,
    (SELECT jsonb_agg(row_to_json(mt)) FROM message_templates mt WHERE mt.company_id = p_company_id AND      
mt.is_active = true) as message_templates,
    c.config as company_config
  FROM companies c
  WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql;

Testing Strategy

1. Empresa piloto: Probar todas las funcionalidades
2. Rollback test: Verificar que el proceso de rollback funciona
3. Performance test: Comparar tiempos antes/después
4. Error handling: Probar comportamiento con datos faltantes 

### 11. Feature - Invoice Reference Filtering [PLANNED]

**Prioridad:** Baja (1 línea de código)
**Implementación:** Agregar `reference_pattern` a company_configs
**Ejemplo:** Solo facturas con "ef-VENTA CREDIT" en referencia
**Filosofía:** YAGNI - implementar lo mínimo que resuelve el problema actual 