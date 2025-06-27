'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from './components/Dashboard';
import { useSession } from '../layout';
import { supabase } from '../../lib/supabase';

// Importar configuración de empresas para fallback
import { EMPRESAS_CONFIG } from '../../utils/constants';

export default function CollectionsPage() {
  const router = useRouter();
  const { session } = useSession();
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadCompanyData();
    }
  }, [session]);

  const loadCompanyData = async () => {
    try {
      let companyData = null;
      let fieldMappings = {};

      // Intentar cargar de Supabase primero
      if (supabase && session.companyId) {
        try {
          // Cargar datos de la empresa
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', session.companyId)
            .single();

          if (company) {
            // Cargar field mappings
            const { data: mappings } = await supabase
              .from('field_mappings')
              .select('*')
              .eq('company_id', session.companyId);

            if (mappings) {
              mappings.forEach(mapping => {
                fieldMappings[mapping.field_type] = mapping.source_column;
              });
            }

            companyData = formatCompanyData(company, fieldMappings);
          }
        } catch (error) {
          console.error('Error loading from Supabase:', error);
        }
      }

      // Si no hay datos de Supabase, usar fallback
      if (!companyData) {
        companyData = EMPRESAS_CONFIG[session.companyId];
      }

      if (companyData) {
        setEmpresaActual(companyData);
        setIdioma(companyData.idioma_default || 'es');
      } else {
        // Si no hay datos, redirigir a login
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const formatCompanyData = (company, fieldMappings) => {
    return {
      id: company.id,
      nombre: company.name,
      admin_email: company.admin_email,
      idiomas_disponibles: company.languages || ['es'],
      idioma_default: company.languages?.[0] || 'es',
      paises_operacion: company.countries || ['UY'],
      monedas: company.currencies || ['USD'],
      timezone: company.timezone || 'America/Montevideo',
      whatsapp_enabled: company.whatsapp_enabled !== false,
      email_enabled: company.email_enabled !== false,
      campo_monto_obligatorio: company.campo_monto_obligatorio !== false,
      dias_default: company.default_days || 7,
      usa_recordatorio_preventivo: company.usa_recordatorio_preventivo || false,
      campo_opcional_1_activo: company.campo_opcional_1_activo || false,
      nombre_campo_opcional_1: company.nombre_campo_opcional_1 || 'Fecha vencimiento',
      campo_opcional_2_activo: company.campo_opcional_2_activo || false,
      nombre_campo_opcional_2: company.nombre_campo_opcional_2 || 'Fecha emisión',
      
      // Field mappings
      campos_facturas: {
        numero: { nombre: fieldMappings['invoice_number'] || 'Número de Factura', requerido: true },
        monto: { nombre: fieldMappings['invoice_amount'] || 'Monto', requerido: company.campo_monto_obligatorio !== false },
        moneda: { nombre: fieldMappings['invoice_currency'] || 'Moneda', requerido: false },
        descripcion: { nombre: fieldMappings['invoice_description'] || 'Descripción', requerido: false },
        fecha_vencimiento: { nombre: fieldMappings['invoice_due_date'] || 'Fecha de Vencimiento', requerido: false },
        fecha_emision: { nombre: fieldMappings['invoice_issue_date'] || 'Fecha de Emisión', requerido: false }
      },
      campos_contactos: {
        codigo: { nombre: fieldMappings['contact_code'] || 'Código', requerido: true },
        nombre: { nombre: fieldMappings['contact_name'] || 'Nombre', requerido: true },
        email: { nombre: fieldMappings['contact_email'] || 'Email', requerido: true },
        telefono: { nombre: fieldMappings['contact_phone'] || 'Teléfono', requerido: true },
        contacto1: { nombre: fieldMappings['contact_contact1'] || 'Contacto 1', requerido: false },
        contacto2: { nombre: fieldMappings['contact_contact2'] || 'Contacto 2', requerido: false }
      }
    };
  };

  const changeIdioma = (nuevoIdioma) => {
    if (empresaActual?.idiomas_disponibles.includes(nuevoIdioma)) {
      setIdioma(nuevoIdioma);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!empresaActual) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Error al cargar datos de la empresa</p>
      </div>
    );
  }

  return (
    <Dashboard 
      empresaActual={empresaActual}
      idioma={idioma}
      changeIdioma={changeIdioma}
    />
  );
}