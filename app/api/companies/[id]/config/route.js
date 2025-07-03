// app/api/companies/[id]/config/route.js
import { createClient } from '../../../../utils/supabase/server';
const supabase = createClient();

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
      .eq('company_id', companyId)
      .order('file_type')
      .order('field_order');

    // Procesar field mappings con la nueva estructura
    const invoiceFields = {};
    const clientFields = {};
    const requiredInvoiceFields = [];
    const requiredClientFields = [];
    
    if (fieldMappings) {
      fieldMappings.forEach(mapping => {
        if (mapping.file_type === 'factura') {
          // Mapear internal_field_name a company_field_name
          invoiceFields[mapping.internal_field_name] = mapping.company_field_name;
          
          // Agregar a campos requeridos si corresponde
          if (mapping.is_required) {
            requiredInvoiceFields.push(mapping.internal_field_name);
          }
        } else if (mapping.file_type === 'cliente') {
          // Mapear internal_field_name a company_field_name
          clientFields[mapping.internal_field_name] = mapping.company_field_name;
          
          // Agregar a campos requeridos si corresponde
          if (mapping.is_required) {
            requiredClientFields.push(mapping.internal_field_name);
          }
        }
      });
    }

    // Determinar moneda por defecto según la empresa
    const defaultCurrency = company.currencies?.[0] || '$';
    
    // Determinar códigos de país según la empresa
    let countryCode = ['UY']; // Default
    if (companyId === 'dental-link') {
      countryCode = ['UY', 'AR', 'ES'];
    } else if (companyId === 'la-perla') {
      countryCode = ['ES', 'FR', 'IT'];
    }

    // TODO: Buscar messaging config cuando exista la tabla
    const messagingConfig = getDefaultMessagingConfig(companyId);

    // Construir respuesta completa con el formato que espera n8n
    const responseData = {
      id: company.id,
      name: company.name,
      defaults: {
        currency: defaultCurrency,
        country_codes: countryCode
      },
      
      // Field mappings para n8n - usando los nombres en inglés como keys
      field_mappings: {
        invoice: invoiceFields,
        client: clientFields
      },
      
      // Campos requeridos
      required_fields: {
        invoice: requiredInvoiceFields,
        client: requiredClientFields
      },
      
      // Información adicional de la empresa
      company_info: {
        currencies: company.currencies || [],
        languages: company.languages || [],
        is_active: company.is_active,
        admin_email: company.admin_email || ''
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
      payment_link_email: false, // La Perla no tiene email
      show_days_overdue: true,
      include_company_logo: true,
      greeting_style: 'estimado',
      whatsapp_footer: 'Atentamente,\nLa Perla',
      email_footer: '', // No se usa porque no tienen email
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

// Mock data para desarrollo - ACTUALIZADO con nueva estructura
function getMockData(companyId) {
  const companies = {
    'dental-link': {
      id: 'dental-link',
      name: 'Dental Link',
      defaults: {
        currency: '$',
        country_codes: ['UY', 'AR', 'ES']
      },
      field_mappings: {
        invoice: {
          invoice_number: 'Docum.',
          invoice_client_code: 'Código',
          invoice_currency: 'Mon',
          invoice_amount: 'Saldo',
          invoice_due_date: 'Vencim.'
        },
        client: {
          client_code: 'Código',
          client_name: 'Nombre',
          client_email: 'Email',
          client_phone_1: 'Teléfono',
          client_phone_2: 'Contacto 1',
          client_phone_3: 'Contacto 2'
        }
      },
      required_fields: {
        invoice: ['invoice_number', 'invoice_client_code', 'invoice_currency', 'invoice_amount', 'invoice_due_date'],
        client: ['client_code', 'client_name', 'client_email', 'client_phone_1']
      },
      company_info: {
        currencies: ['$', 'U$S'],
        languages: ['es'],
        is_active: true,
        admin_email: 'admin@dentallink.com'
      }
    },
    'la-perla': {
      id: 'la-perla',
      name: 'La Perla',
      defaults: {
        currency: 'EUR',
        country_codes: ['ES', 'FR', 'IT']
      },
      field_mappings: {
        invoice: {
          invoice_number: 'Nº',
          invoice_client_code: 'Nº cliente',
          invoice_amount: 'Importe pendiente',
          invoice_due_date: 'Fecha vencimiento'
        },
        client: {
          client_code: 'Nº',
          client_name: 'Nombre',
          client_alias: 'Alias',
          client_phone_1: 'Nº teléfono'
        }
      },
      required_fields: {
        invoice: ['invoice_number', 'invoice_client_code', 'invoice_amount', 'invoice_due_date'],
        client: ['client_code', 'client_name', 'client_phone_1']
      },
      company_info: {
        currencies: ['EUR'],
        languages: ['es'],
        is_active: true,
        admin_email: 'admin@laperla.com'
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