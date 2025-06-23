'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function FieldMappingPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id;
  
  const [company, setCompany] = useState(null);
  const [invoiceMappings, setInvoiceMappings] = useState({});
  const [contactMappings, setContactMappings] = useState({});
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Invoice file fields (Ficha Facturas)
  const invoiceFields = [
    { key: 'codigo', label: 'Código Cliente', required: true },
    { key: 'nombre', label: 'Nombre/Razón Social', required: true },
    { key: 'saldo', label: 'Saldo/Importe', required: true },
    { key: 'docum', label: 'Nº Documento/Factura', required: true },
    { key: 'mon', label: 'Moneda', required: false },
    { key: 'vencim', label: 'Fecha Vencimiento', required: true },
    { key: 'referencia', label: 'Referencia', required: false }
  ];

  // Contact file fields (Ficha Contactos)
  const contactFields = [
    { key: 'codigo', label: 'Código Cliente', required: true },
    { key: 'nombre', label: 'Nombre/Razón Social', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'telefono', label: 'Teléfono', required: true },
    { key: 'contacto1', label: 'Contacto 1', required: false },
    { key: 'contacto2', label: 'Contacto 2', required: false }
  ];

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      // Load company data
      const companyData = {
        id: companyId,
        name: companyId === 'dental-link' ? 'Dental Link' :
              companyId === 'la-perla' ? 'La Perla' :
              companyId === 'test-company' ? 'Test Company' : 'Company'
      };
      setCompany(companyData);

      // Load existing mappings from Supabase
      if (supabase) {
        const { data: existingMappings, error } = await supabase
          .from('field_mappings')
          .select('*')
          .eq('company_id', companyId);

        if (!error && existingMappings) {
          // Separate mappings by type
          const invoiceMap = {};
          const contactMap = {};
          
          existingMappings.forEach(mapping => {
            if (mapping.field_type.startsWith('invoice_')) {
              invoiceMap[mapping.field_type.replace('invoice_', '')] = mapping.source_column;
            } else if (mapping.field_type.startsWith('contact_')) {
              contactMap[mapping.field_type.replace('contact_', '')] = mapping.source_column;
            }
          });
          
          setInvoiceMappings(invoiceMap);
          setContactMappings(contactMap);
        }
      }

      // Set default mappings if none exist
      if (Object.keys(invoiceMappings).length === 0) {
        const defaultInvoiceMappings = {
          codigo: 'Código',
          nombre: 'Nombre',
          saldo: 'Saldo',
          docum: 'Docum',
          mon: 'Mon',
          vencim: 'Vencim',
          referencia: 'Referencia'
        };
        setInvoiceMappings(defaultInvoiceMappings);
      }

      if (Object.keys(contactMappings).length === 0) {
        const defaultContactMappings = {
          codigo: 'Código',
          nombre: 'Nombre',
          email: 'Email',
          telefono: 'Teléfono',
          contacto1: 'Contacto 1',
          contacto2: 'Contacto 2'
        };
        setContactMappings(defaultContactMappings);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (supabase) {
        // Delete existing mappings
        await supabase
          .from('field_mappings')
          .delete()
          .eq('company_id', companyId);

        // Prepare all mappings
        const allMappings = [];
        
        // Invoice mappings
        Object.entries(invoiceMappings).forEach(([field, column]) => {
          if (column) {
            allMappings.push({
              company_id: companyId,
              field_type: `invoice_${field}`,
              source_column: column
            });
          }
        });

        // Contact mappings
        Object.entries(contactMappings).forEach(([field, column]) => {
          if (column) {
            allMappings.push({
              company_id: companyId,
              field_type: `contact_${field}`,
              source_column: column
            });
          }
        });

        // Insert new mappings
        if (allMappings.length > 0) {
          const { error } = await supabase
            .from('field_mappings')
            .insert(allMappings);

          if (error) throw error;
        }
      }

      setMessage({ type: 'success', text: '¡Configuración guardada exitosamente!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceMappingChange = (fieldKey, value) => {
    setInvoiceMappings(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleContactMappingChange = (fieldKey, value) => {
    setContactMappings(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      marginBottom: '40px'
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      color: '#1a1a1a'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      background: '#f3f4f6',
      padding: '4px',
      borderRadius: '10px'
    },
    tab: {
      flex: 1,
      padding: '12px 24px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    tabActive: {
      background: '#ffffff',
      color: '#1a1a1a',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    card: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '8px'
    },
    sectionDescription: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px'
    },
    fieldGrid: {
      display: 'grid',
      gap: '16px'
    },
    fieldRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      alignItems: 'center',
      padding: '14px 16px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    fieldLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    fieldName: {
      fontSize: '15px',
      fontWeight: '500',
      color: '#374151'
    },
    requiredBadge: {
      fontSize: '11px',
      padding: '2px 6px',
      background: '#fee2e2',
      color: '#991b1b',
      borderRadius: '4px',
      fontWeight: '600'
    },
    fieldDescription: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '2px'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      color: '#1a1a1a',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    helpSection: {
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px'
    },
    helpTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0369a1',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    helpText: {
      fontSize: '14px',
      color: '#0c4a6e',
      lineHeight: '1.5'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '32px'
    },
    saveButton: {
      padding: '12px 32px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    saveButtonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    cancelButton: {
      padding: '12px 32px',
      background: '#ffffff',
      color: '#374151',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500'
    },
    messageSuccess: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    messageError: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      fontSize: '18px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Cargando configuración...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mapeo de Campos</h1>
        <p style={styles.subtitle}>
          Configura cómo se mapean las columnas de los archivos Excel para {company?.name}
        </p>
      </div>

      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'invoices' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('invoices')}
        >
          📄 Ficha Facturas
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'contacts' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('contacts')}
        >
          👥 Ficha Contactos
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <>
          <div style={styles.helpSection}>
            <h3 style={styles.helpTitle}>
              📄 Archivo de Facturas/Deudas
            </h3>
            <p style={styles.helpText}>
              Este es el archivo principal que contiene las deudas pendientes de los clientes. 
              Define qué nombre tienen las columnas en el Excel que subirán los usuarios.
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Mapeo de Columnas - Facturas</h2>
            <p style={styles.sectionDescription}>
              Indica el nombre exacto de cada columna tal como aparece en el archivo Excel
            </p>
            
            <div style={styles.fieldGrid}>
              {invoiceFields.map((field) => (
                <div key={field.key} style={styles.fieldRow}>
                  <div>
                    <div style={styles.fieldLabel}>
                      <span style={styles.fieldName}>{field.label}</span>
                      {field.required && (
                        <span style={styles.requiredBadge}>Requerido</span>
                      )}
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={invoiceMappings[field.key] || ''}
                    onChange={(e) => handleInvoiceMappingChange(field.key, e.target.value)}
                    placeholder="Ej: Código, CodCliente, etc."
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={styles.helpSection}>
            <h3 style={styles.helpTitle}>
              👥 Archivo de Contactos (Opcional)
            </h3>
            <p style={styles.helpText}>
              Este archivo se usa para actualizar los datos de contacto (emails y teléfonos) de los clientes. 
              Solo es necesario cuando hay cambios en la información de contacto.
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Mapeo de Columnas - Contactos</h2>
            <p style={styles.sectionDescription}>
              Indica el nombre exacto de cada columna tal como aparece en el archivo Excel de contactos
            </p>
            
            <div style={styles.fieldGrid}>
              {contactFields.map((field) => (
                <div key={field.key} style={styles.fieldRow}>
                  <div>
                    <div style={styles.fieldLabel}>
                      <span style={styles.fieldName}>{field.label}</span>
                      {field.required && (
                        <span style={styles.requiredBadge}>Requerido</span>
                      )}
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={contactMappings[field.key] || ''}
                    onChange={(e) => handleContactMappingChange(field.key, e.target.value)}
                    placeholder="Ej: Email, Correo, etc."
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={styles.buttonGroup}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {})
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        
        <a
          href="/admin/companies"
          style={styles.cancelButton}
        >
          Volver
        </a>
      </div>
    </div>
  );
}