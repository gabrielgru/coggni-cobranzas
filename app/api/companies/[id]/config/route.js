// app/api/companies/[id]/config/route.js
import { supabase } from '../../../../lib/supabase';

// Cache simple en memoria (por ahora)
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(request, { params }) {
  const companyId = params.id;
  
  // Headers CORS para que n8n pueda acceder
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Check cache first
    const cacheKey = `company_${companyId}`;
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data, { headers });
    }

    // Si no hay Supabase, usar datos hardcodeados (desarrollo)
    if (!supabase) {
      const mockData = getMockData(companyId);
      if (!mockData) {
        return Response.json({ error: 'Company not found' }, { status: 404, headers });
      }
      return Response.json(mockData, { headers });
    }

    // Buscar empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      // Fallback a mock data
      const mockData = getMockData(companyId);
      if (!mockData) {
        return Response.json({ error: 'Company not found' }, { status: 404, headers });
      }
      return Response.json(mockData, { headers });
    }

    // Buscar field mappings
    const { data: fieldMappings } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('company_id', companyId);

    // Procesar field mappings
    const invoiceFields = {};
    const contactFields = {};
    
    if (fieldMappings) {
      fieldMappings.forEach(mapping => {
        if (mapping.field_type.startsWith('invoice_')) {
          invoiceFields[mapping.field_type.replace('invoice_', '')] = mapping.source_column;
        } else if (mapping.field_type.startsWith('contact_')) {
          contactFields[mapping.field_type.replace('contact_', '')] = mapping.source_column;
        }
      });
    }

    // TODO: Buscar messaging config cuando exista la tabla
    const messagingConfig = getDefaultMessagingConfig(companyId);

    // Construir respuesta completa
    const responseData = {
      id: company.id,
      name: company.name,
      currencies: company.currencies || [],
      languages: company.languages || [],
      is_active: company.is_active,
      
      // Field mappings para n8n
      field_mappings: {
        invoices: invoiceFields,
        contacts: contactFields
      },
      
      // Configuración de mensajería
      messaging: messagingConfig,
      
      // Metadata
      _meta: {
        timestamp: new Date().toISOString(),
        cached: false
      }
    };

    // Guardar en cache
    configCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return Response.json(responseData, { headers });

  } catch (error) {
    console.error('Error in company config API:', error);
    return Response.json(
      { error: 'Internal server error', message: error.message },
      { status: 500, headers }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Configuración por defecto según empresa
function getDefaultMessagingConfig(companyId) {
  const configs = {
    'dental-link': {
      payment_link_whatsapp: true,
      payment_link_email: true,
      show_days_overdue: true,
      include_company_logo: false,
      greeting_style: 'nombre',
      whatsapp_footer: 'Para consultas puede contactarnos:\nTeléfono: 12345678\nEmail: admin@dentallink.com.uy',
      email_footer: 'Saludos cordiales,<br>Dental Link',
      currency_format: {
        thousand_separator: '.',
        decimal_separator: ',',
        symbol_position: 'before'
      }
    },
    'la-perla': {
      payment_link_whatsapp: false,
      payment_link_email: true,
      show_days_overdue: true,
      include_company_logo: true,
      greeting_style: 'estimado',
      whatsapp_footer: 'Atentamente,\nLa Perla',
      email_footer: 'Atentamente,<br>Departamento de Administración<br>La Perla',
      currency_format: {
        thousand_separator: '.',
        decimal_separator: ',',
        symbol_position: 'after'
      }
    },
    'test-company': {
      payment_link_whatsapp: true,
      payment_link_email: true,
      show_days_overdue: false,
      include_company_logo: false,
      greeting_style: 'nombre',
      whatsapp_footer: 'Thanks!\nTest Company Team',
      email_footer: 'Best regards,<br>Test Company',
      currency_format: {
        thousand_separator: ',',
        decimal_separator: '.',
        symbol_position: 'before'
      }
    }
  };

  return configs[companyId] || configs['dental-link'];
}

// Mock data para desarrollo
function getMockData(companyId) {
  const companies = {
    'dental-link': {
      id: 'dental-link',
      name: 'Dental Link',
      currencies: ['$', 'U$S'],
      languages: ['es'],
      is_active: true,
      field_mappings: {
        invoices: {
          codigo: 'Código',
          nombre: 'Nombre',
          saldo: 'Saldo',
          docum: 'Docum',
          mon: 'Mon',
          vencim: 'Vencim',
          referencia: 'Referencia'
        },
        contacts: {
          codigo: 'Código',
          nombre: 'Nombre',
          email: 'Email',
          telefono: 'Teléfono',
          contacto1: 'Contacto 1',
          contacto2: 'Contacto 2'
        }
      }
    },
    'la-perla': {
      id: 'la-perla',
      name: 'La Perla',
      currencies: ['EUR'],
      languages: ['es'],
      is_active: true,
      field_mappings: {
        invoices: {
          codigo: 'Código Cliente',
          nombre: 'Razón Social',
          saldo: 'Importe Pendiente',
          docum: 'Nº Factura',
          mon: 'Divisa',
          vencim: 'Fecha Vto',
          referencia: 'Referencia'
        },
        contacts: {
          codigo: 'Código Cliente',
          nombre: 'Razón Social',
          email: 'Correo Electrónico',
          telefono: 'Teléfono Principal',
          contacto1: 'Contacto Comercial',
          contacto2: 'Contacto Administrativo'
        }
      }
    }
  };

  const company = companies[companyId];
  if (!company) return null;

  return {
    ...company,
    messaging: getDefaultMessagingConfig(companyId),
    _meta: {
      timestamp: new Date().toISOString(),
      cached: false,
      mock: true
    }
  };
}