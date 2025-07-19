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