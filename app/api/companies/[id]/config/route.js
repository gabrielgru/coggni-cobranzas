// app/api/companies/[id]/config/route.js
// FIXED VERSION - Uses database fields instead of hardcoded values

// ========================================
// What is this file for:
// This API route provides company configuration data for the n8n workflow automation system.
// It serves as the central configuration endpoint that tells n8n how to process invoices and 
// contacts for each company, including field mappings, phone number validation rules, 
// currency settings, and messaging templates.
//
// Why do we need it:
// Each company (Dental Link, La Perla, etc.) has different Excel column names, phone number 
// formats, currencies, and business rules. Without this centralized configuration, we would 
// need to hardcode company-specific logic throughout the n8n workflow. This API allows us to:
// 1. Dynamically map Excel columns to standard internal fields
// 2. Set correct phone number validation rules per country  
// 3. Configure currency defaults and messaging templates
// 4. Scale to new companies without changing n8n workflow code
// 5. Maintain company settings in the database instead of code
// ========================================

import { createClient } from '../../../../utils/supabase/server';

// Cache simple en memoria (por ahora)
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(request, { params }) {
  const companyId = params.id;
  const supabase = createClient();
  
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

    // ========================================
    // FIX: Buscar empresa con campos de país
    // ========================================
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, currencies, languages, is_active, admin_email, country, phone_countries')  // ← Added country and phone_countries
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
          invoiceFields[mapping.internal_field_name] = mapping.company_field_name;
          if (mapping.is_required) {
            requiredInvoiceFields.push(mapping.internal_field_name);
          }
        } else if (mapping.file_type === 'cliente') {
          clientFields[mapping.internal_field_name] = mapping.company_field_name;
          if (mapping.is_required) {
            requiredClientFields.push(mapping.internal_field_name);
          }
        }
      });
    }

    // Determinar moneda por defecto según la empresa
    const defaultCurrency = company.currencies?.[0] || '$';
    
    // ========================================
    // FIX: Usar campos de la base de datos en lugar de hardcodeo
    // ========================================
    let countryCode = ['UY']; // Default fallback
    
    if (company.phone_countries && Array.isArray(company.phone_countries) && company.phone_countries.length > 0) {
      // Usar phone_countries de la base de datos
      countryCode = company.phone_countries;
    } else if (company.country) {
      // Si no hay phone_countries, usar country como fallback
      countryCode = [company.country];
    }
    // Si ambos están vacíos, mantener el default ['UY']

    // TODO: Buscar messaging config cuando exista la tabla
    const messagingConfig = getDefaultMessagingConfig(companyId);

    // Construir respuesta completa con el formato que espera n8n
    const responseData = {
      id: company.id,
      name: company.name,
      defaults: {
        currency: defaultCurrency,
        country_codes: countryCode  // ← Ahora viene de la base de datos
      },
      
      field_mappings: {
        invoice: invoiceFields,
        client: clientFields
      },
      
      required_fields: {
        invoice: requiredInvoiceFields,
        client: requiredClientFields
      },
      
      company_info: {
        currencies: company.currencies || [],
        languages: company.languages || [],
        is_active: company.is_active,
        admin_email: company.admin_email || '',
        // ========================================
        // NUEVO: Incluir campos de país para debugging
        // ========================================
        country: company.country,
        phone_countries: company.phone_countries
      },
      
      messaging: messagingConfig,
      
      _meta: {
        timestamp: new Date().toISOString(),
        cached: false,
        // ========================================
        // DEBUG: Info sobre qué países se usaron
        // ========================================
        country_source: company.phone_countries?.length > 0 ? 'phone_countries' : 
                       company.country ? 'country_fallback' : 'default_fallback'
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

// ========================================
// FUNCIÓN: getDefaultMessagingConfig - Sin cambios
// ========================================
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
      payment_link_email: false,
      show_days_overdue: true,
      include_company_logo: true,
      greeting_style: 'estimado',
      whatsapp_footer: 'Atentamente,\nLa Perla',
      email_footer: '',
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

// ========================================
// FUNCIÓN: getMockData - ACTUALIZADA para usar datos consistentes
// ========================================
function getMockData(companyId) {
  const companies = {
    'dental-link': {
      id: 'dental-link',
      name: 'Dental Link',
      defaults: {
        currency: '$',
        country_codes: ['UY', 'AR', 'ES']  // Consistente con lo esperado
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
        admin_email: 'admin@dentallink.com',
        country: 'UY',
        phone_countries: ['UY', 'AR', 'ES']
      }
    },
    'la-perla': {
      id: 'la-perla',
      name: 'La Perla',
      defaults: {
        currency: 'EUR',
        country_codes: ['ES', 'FR', 'IT']  // ← FIXED: Ahora usa valores correctos
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
        admin_email: 'admin@laperla.com',
        country: 'ES',                        // ← FIXED
        phone_countries: ['ES', 'FR', 'IT']   // ← FIXED
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