# Coggni Cobranzas - Project Description

## Project Overview

**Coggni Cobranzas** is a web-based automated collection system designed to streamline the process of sending payment reminders to customers. The application allows companies to upload invoice files and automatically send collection reminders via WhatsApp and/or email based on configurable strategies.

### Key Features

- **Multi-company Support**: Configurable for different companies with custom field mappings
- **Multi-language Support**: Spanish and English interfaces
- **File Upload & Validation**: Supports Excel (.xlsx, .xls) and CSV files with automatic validation
- **Flexible Sending Strategies**:
  - WhatsApp Priority (WhatsApp first, email fallback)
  - Both Channels (simultaneous WhatsApp and email)
  - WhatsApp Only
  - Email Only
- **Advanced Scheduling**: Include upcoming invoices with configurable anticipation days (1-10 days)
- **Contact Database Management**: Optional contact updates with new phone numbers and emails
- **Admin Panel**: Company management and processing logs
- **Real-time Processing**: Webhook integration for automated processing

## Technology Stack

### Frontend
- **Next.js 14.0.4** - React framework with App Router
- **React 18** - UI library
- **CSS Modules** - Styling with theme support (light/dark mode)
- **Client-side Components** - Using 'use client' directive for interactivity

### Backend & Database
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - File storage

### File Processing
- **PapaParse** - CSV parsing library
- **XLSX** - Excel file processing library

### Development Tools
- **TypeScript** - Type safety (configured but using .js files)
- **ESLint** - Code linting
- **Next.js App Directory** - Modern Next.js architecture

## Project Architecture

### Authentication System
- Custom authentication context (`AuthContext.js`)
- Multi-company login with demo credentials
- Local storage persistence
- Company-specific configurations

### Data Flow
1. **File Upload** → Validation → Processing
2. **Strategy Selection** → Webhook Integration → Automated Sending
3. **Contact Updates** → Database Synchronization

### Database Schema (Supabase)
- `companies` - Company configurations
- `field_mappings` - Custom field mappings per company
- `processing_logs` - Processing history and webhook calls

## Folder Structure

```
coggni-cobranzas/
├── app/                          # Next.js App Router directory
│   ├── admin/                    # Admin panel section
│   │   ├── admin-apple.css       # Admin-specific styles
│   │   ├── admin-modern.css      # Modern admin theme
│   │   ├── admin.module.css      # CSS modules for admin
│   │   ├── companies/            # Company management
│   │   │   └── page.js          # Companies listing page
│   │   ├── components/           # Admin-specific components
│   │   │   └── AdminNav.js      # Admin navigation
│   │   ├── layout.js            # Admin layout wrapper
│   │   └── page.js              # Admin dashboard
│   ├── components/               # Main application components
│   │   ├── Dashboard.js         # Main dashboard component
│   │   ├── FileUploadZone.js    # File upload interface
│   │   ├── LanguageSelector.js  # Language switcher
│   │   ├── Login.js             # Login form
│   │   ├── OptionalSection.js   # Optional features section
│   │   └── ThemeToggle.js       # Theme switcher
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.js       # Authentication context
│   │   └── ThemeContext.js      # Theme management
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout
│   ├── lib/                     # Utility libraries
│   │   └── supabase.js          # Supabase client configuration
│   ├── page.js                  # Main application page
│   ├── test-env/                # Testing environment
│   │   └── page.js              # Test page
│   ├── utils/                   # Utility functions
│   │   ├── constants.js         # Application constants
│   │   └── fileValidation.js    # File validation logic
│   └── globals.css              # Global CSS styles
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
└── package-lock.json           # Locked dependency versions
```

## Key Components

### Core Components

1. **Dashboard.js** (522 lines)
   - Main application interface
   - File upload handling
   - Strategy selection
   - Processing workflow
   - Real-time status updates

2. **AuthContext.js** (83 lines)
   - User authentication management
   - Company-specific configurations
   - Language preferences
   - Session persistence

3. **FileUploadZone.js**
   - Drag-and-drop file upload
   - File validation
   - Progress indicators
   - Error handling

### Configuration System

**constants.js** contains:
- Company configurations (`EMPRESAS_CONFIG`)
- Multi-language text content (`TEXTOS`)
- Demo credentials (`DEMO_CREDENTIALS`)
- Field mappings for different companies

### Supported Companies

1. **Dental Link** (Uruguay)
   - Spanish interface
   - Uruguayan Peso and USD support
   - Custom field mappings for dental industry

2. **La Perla** (Spain)
   - Spanish interface
   - Euro currency
   - European phone number support

3. **Test Company** (US)
   - Bilingual (English/Spanish)
   - USD currency
   - North American phone numbers

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin Supabase key (server-side)

## Development Setup

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Webhook Integration

The system integrates with external webhooks for automated processing:
- **Dental Link**: `https://gabrielgru.app.n8n.cloud/webhook/cobranza-automatica-dl`
- **La Perla**: `https://gabrielgru.app.n8n.cloud/webhook/cobranza-la-perla`
- **Test Company**: `https://gabrielgru.app.n8n.cloud/webhook/cobranza-test`

## File Requirements

### Invoice Files
Required columns vary by company but typically include:
- Customer code
- Customer name
- Outstanding balance
- Invoice number
- Currency
- Due date (optional)
- Reference (optional)

### Contact Files
Required columns:
- Customer code
- Customer name
- Email address
- Phone number
- Additional contacts (optional)

## Security Features

- Environment variable protection
- Supabase Row Level Security (RLS)
- Client-side validation
- Secure file handling
- Admin-only access controls

## Performance Optimizations

- Client-side file validation
- Progressive loading
- Optimized bundle size
- Efficient state management
- Real-time updates via Supabase

## Browser Support

- Modern browsers with ES6+ support
- Responsive design for mobile and desktop
- Progressive Web App (PWA) ready

This project represents a comprehensive solution for automated collection management, designed with scalability, security, and user experience in mind. 