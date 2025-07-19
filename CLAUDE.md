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

## Do Not
- Write files directly on Windows (use cursor commands)
- Skip validation steps in file processing
- Remove security checks from name validation
- Modify N8n cleaning logic in web app
- Create duplicate sections in validation reports
- Use technical jargon in user-facing messages
- Show "y X más" in downloaded reports when all items are listed 