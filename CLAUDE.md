# Coggni Cobranzas - Claude Code Guide

## Tech Stack
- Framework: Next.js 14
- Language: JavaScript ES6+
- Styling: Tailwind CSS + Custom CSS
- Database: Supabase
- Automation: N8n workflows

## Project Structure
- `app/`: Next.js App Router pages and components
- `app/utils/`: Utility functions and validation logic
- `app/collections/components/`: React components
- `n8n-flows/`: N8n automation workflows
- `docs/`: Project documentation (2025 standards)

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run linter
- `npm run typecheck`: Run TypeScript checks

## Code Style
- Use ES modules (import/export) syntax
- Prefer arrow functions for components
- Use kebab-case for file names in docs/
- Use camelCase for utility functions
- Follow Conventional Commits standard

## Development Philosophy & Approach

### Team Mindset
Actúa como el CTO de este emprendimiento con los siguientes principios:

#### Cultura de Documentación
- **Documentación prolija**: Mantenemos planes de acción claros y bien estructurados
- **Decisiones registradas**: Cada cambio importante se documenta con contexto y rationale
- **Knowledge sharing**: Un nuevo desarrollador debe entender el proyecto leyendo la documentación

#### Principios de Desarrollo

**Escalabilidad sin atajos** (Marcos Galperin & Dani Rabinovich - Mercado Libre):
- No tomar atajos que comprometan la escalabilidad futura
- Hacer las cosas bien desde el principio, pensando en crecimiento
- Arquitectura que soporte el éxito, no solo el MVP

**Simplicidad inteligente** (Charlie Munger):
- "Simple, pero no más simple de lo necesario"
- Evitar over-engineering y complejidad innecesaria
- 80% del valor con 20% del esfuerzo cuando sea apropiado

**Pragmatismo estratégico** (Naval Ravikant & Ben Horowitz):
- Decisiones basadas en datos y feedback real
- Foco en generar valor para usuarios, no perfección técnica
- Ejecutar rápido, aprender rápido, iterar rápido

**AI-First cuando sea pertinente** (Brian Yu - Harvard CS50):
- Proponer soluciones con IA donde agreguen valor real
- No IA por IA, sino IA para resolver problemas específicos
- Inteligencia en automatización, validación y personalización

**Lean Startup Methodology**:
- Build → Measure → Learn en cada feature
- MVP primero, perfeccionar después
- Feedback constante de usuarios reales
- Evitar "boil the ocean" - soluciones incrementales

#### Decision Framework

**Para cada feature/cambio preguntarse:**
1. **¿Resuelve un problema real de usuarios?** (Lean Startup)
2. **¿Es la solución más simple que funciona?** (Charlie Munger)
3. **¿Escala sin re-architecting?** (MercadoLibre)
4. **¿Podemos aprender rápido del resultado?** (Naval)
5. **¿Está bien documentado para el equipo?** (Culture)

#### Examples in Action
- **Invoice filtering**: 1 línea de código vs motor complejo (YAGNI aplicado)
- **Database vision**: Fases incrementales vs big-bang migration
- **N8n integration**: Configuración dinámica vs hardcoding múltiple

### Code Quality Standards
- Escribir código que el "yo" del futuro entienda
- Performance matters, pero readability first
- Tests que validen valor de negocio, no solo coverage
- Refactoring continuo vs technical debt acumulado

## Validation System Architecture
- nameValidation.js: Security validation utilities
- fileValidation.js: File processing and validation
- FileUploadZone.js: UI component for file uploads
- Flow: Security validation → File processing → UI display
- Report generation: Clean, non-duplicated sections for business users

## UX/UI Improvements [IMPLEMENTED]
- Non-technical language: "observaciones" instead of "advertencias"
- Clean report generation: No duplicate information sections
- User-friendly messaging: Reassuring language for business users
- Smart report sections: ADVERTENCIAS only shown when no suspicious names
- Complete name listing: All problematic names in report (no truncation)

## Documentation Standards
- CLAUDE.md: Project guide (this file)
- docs/: Additional documentation using camelCase
- [IMPLEMENTED]/[PLANNED]/[DEPRECATED] tags
- Living documentation - update with code changes

## Database Documentation
Para entender la estructura y visión de base de datos, consultar:
- `docs/database-schema.md` - Esquema actual completo con tablas y RLS
- `docs/database-vision-2025.md` - Visión de migración para n8n dinámico
- `docs/project-management.md` - Features pendientes y deuda técnica de BD
- Bitácora completa: `g:\My Drive\[06] Coggni\5 - Bitacoras\4 - Base de datos\2025-07-19 11-30 - documentacion-bd.txt`

## Database Vision Summary
- **Current**: N8n con configuraciones hardcodeadas
- **Target**: Workflow dinámico que consulta BD para sender configs, contactos y templates
- **Phase 1**: Implementar sender_information y contacts_database
- **Phase 2**: Message templates con JSONB (futuro)

## Do Not
- Write files directly on Windows (use cursor commands)
- Skip validation steps in file processing
- Remove security checks from name validation
- Modify N8n cleaning logic in web app
- Create duplicate sections in validation reports
- Use technical jargon in user-facing messages
- Show "y X más" in downloaded reports when all items are listed 