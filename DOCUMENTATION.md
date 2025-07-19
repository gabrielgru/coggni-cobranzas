# Documentación Técnica - Sistema de Cobranza Automática

## Arquitectura del Sistema de Validación

### Field Mappings - Core del Sistema

El sistema utiliza una tabla `field_mappings` que define dinámicamente qué campos tiene cada empresa para sus archivos de facturas y contactos.

#### Estructura de field_mappings:
```sql
- id: UUID único
- company_id: Referencia a companies
- file_type: "factura" | "cliente" 
- internal_field_name: Nombre interno del campo
- company_field_name: Nombre que ve la empresa
- is_required: boolean
- data_type: "text" | "number" | "email" | "phone" | "date"
```

Flujo de Datos Principal

Database (field_mappings) → AuthContext → empresaActual → validateFacturasFile → FileUploadZone

Archivos que leen field_mappings:

1. app/contexts/AuthContext.js - Construye estructura empresaActual
2. app/page.js - Inicialización de empresas
3. app/api/companies/[id]/config/route.js - API de configuración
4. app/admin/companies/*/page.js - Administración
5. app/collections/components/Dashboard.js - Consume campos dinámicos
6. app/utils/fileValidation.js - Usa estructura para validar

Sistema de Validación de Archivos

validateFacturasFile - Proceso de Validación:

1. Lectura de archivo (Excel/CSV)
2. Validación de estructura básica:
   - Archivo vacío/sin datos
   - Headers válidos
   - Columnas requeridas presentes
3. Mapeo dinámico de columnas:
```js
Object.entries(empresaConfig.campos_facturas).forEach(([key, config]) => {
  const normalizedName = normalizeColumnName(config.nombre);
  columnIndices[key] = headers.indexOf(normalizedName);
});
```
4. Validaciones por fila (consolidadas):
   - Fechas de vencimiento inválidas
   - Monedas no aceptadas
   - Formato de saldos
5. Generación de advertencias consolidadas

validateContactsFile - Validaciones de Seguridad:

- Nombres sospechosos (usando nameValidation.js)
- Emails con formato inválido
- Campos requeridos faltantes

Estructura de empresaActual

```js
empresaActual = {
  id: "dental-link",
  nombre: "Dental Link",
  monedas: ["$", "U$S"],                    // Mapeado desde companies.currencies
  idiomas_disponibles: ["es"],
  paises_telefono: ["UY", "ES"],
  campos_facturas: {                        // Construido desde field_mappings
    invoice_currency: { nombre: "Mon", requerido: true, tipo: "text" },
    invoice_amount: { nombre: "Saldo", requerido: true, tipo: "number" },
    invoice_due_date: { nombre: "Vencim.", requerido: true, tipo: "date" },
    // ... otros campos dinámicos
  },
  campos_contactos: {                       // Construido desde field_mappings
    client_name: { nombre: "Nombre", requerido: true, tipo: "text" },
    client_email: { nombre: "Email", requerido: true, tipo: "email" },
    // ... otros campos dinámicos
  }
}
```

Sistema de Advertencias

Tipos de Advertencias:

1. Advertencias generales (archivo completo):
   - Múltiples monedas sin columna especificada
   - Formatos de fecha inválidos (consolidado)
2. Advertencias especiales (casos específicos):
   - Monedas inválidas (con detalles por fila)
   - Nombres sospechosos (seguridad)

Estructura del objeto validationResult:

```js
{
  valid: boolean,
  errors: string[],                    // Errores bloqueantes
  warnings: string[],                  // Advertencias generales
  totalRows: number,
  validRows: number,
  columns: string[],

  // Para facturas con monedas inválidas:
  invalidCurrencies: number,
  invalidCurrencyDetails: [{fila, currency, invoice}],
  validCurrencies: string[],

  // Para contactos con nombres sospechosos:
  suspiciousNames: number,
  suspiciousNamesByRisk: {alto, medio, bajo},
  suspiciousNameExamples: [{fila, nombre}]
}
```

Componentes y Responsabilidades

**AuthContext.js**

- Función principal: Construir empresaActual desde datos de DB
- Método clave: formatCompanyData(companyData, mappings)
- Validación crítica: Falla explícitamente si faltan field_mappings
- Output: Estructura empresaActual con campos dinámicos

**fileValidation.js**

- validateFacturasFile: Validación de archivos de facturas
- validateContactsFile: Validación de archivos de contactos
- generateErrorReport: Genera reportes detallados
- Principio: Consolidar advertencias para UX limpia

**FileUploadZone.js**

- Renderizado condicional basado en validationResult
- Casos especiales: Monedas inválidas, nombres sospechosos
- PROBLEMA ACTUAL: No muestra advertencias generales del array warnings[]

**Dashboard.js**

- Consume: empresaActual.campos_facturas y campos_contactos
- Muestra: Columnas requeridas dinámicamente
- Estrategias: Basadas en disponibilidad de email

Problemas Conocidos

**UI No Muestra Advertencias Generales**

- Síntoma: Usuario ve "X observaciones" pero no el contenido
- Causa: FileUploadZone solo renderiza casos especiales, no el array warnings[]
- Solución: Agregar sección para mostrar advertencias que no sean casos especiales

**Flujo de Errores vs Advertencias**

- Errores: Bloquean el procesamiento
- Advertencias: Informativas, permiten continuar
- Monedas inválidas: Se tratan como advertencias (filtrado automático)

Convenciones del Código

**Nomenclatura:**

- campos_facturas / campos_contactos: Estructura de campos dinámicos
- empresaActual: Objeto principal de empresa con configuración
- validationResult: Resultado de validación de archivos
- field_mappings: Tabla de configuración de campos

**Principios de Validación:**

1. Fallar explícitamente: No fallbacks silenciosos
2. Consolidar advertencias: Una advertencia por tipo de problema
3. Separar facturas de contactos: Lógicas de validación diferentes
4. Seguridad primero: Validación de nombres sospechosos obligatoria

APIs Relacionadas

**Field Mappings Management:**

- GET /api/companies/[id]/config - Obtener configuración
- POST /api/companies/[id]/config - Actualizar field mappings
- Usado por: Páginas de administración

**Webhook Integration:**

- Recibe datos validados para procesamiento
- Estructura basada en empresaActual.campos_facturas

---
Última actualización: 2025-07-18
Versión del sistema: Next.js 14 + Supabase

**Instrucciones adicionales:**
- Crear el archivo en la raíz del proyecto si no existe
- Si existe, reemplazar completamente el contenido
- Mantener formato Markdown para legibilidad
- Este documento servirá como referencia técnica para futuros desarrollos 