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

  // Invoice file fields - con información más clara
  const invoiceFields = [
    { 
      key: 'customer_code',
      internalName: 'customer_code',
      label: 'Código Cliente', 
      description: 'Identificador único del cliente',
      required: true,
      placeholder: 'Ej: Código, CodCliente, Nº Cliente'
    },
    { 
      key: 'customer_name',
      internalName: 'customer_name',
      label: 'Nombre/Razón Social', 
      description: 'Nombre completo del cliente o empresa',
      required: true,
      placeholder: 'Ej: Nombre, RazonSocial, Cliente'
    },
    { 
      key: 'amount',
      internalName: 'amount',
      label: 'Saldo/Importe', 
      description: 'Monto adeudado',
      required: true,
      placeholder: 'Ej: Saldo, Importe, Monto'
    },
    { 
      key: 'document_number',
      internalName: 'document_number',
      label: 'Nº Documento/Factura', 
      description: 'Número de factura o documento',
      required: true,
      placeholder: 'Ej: NumDoc, NumeroDoc, Factura'
    },
    { 
      key: 'currency',
      internalName: 'currency',
      label: 'Moneda', 
      description: 'Tipo de moneda (EUR, USD, etc)',
      required: false,
      placeholder: 'Ej: Mon, Moneda, Currency'
    },
    { 
      key: 'due_date',
      internalName: 'due_date',
      label: 'Fecha Vencimiento', 
      description: 'Fecha límite de pago',
      required: true,
      placeholder: 'Ej: FechaVto, Vencimiento, DueDate'
    },
    { 
      key: 'reference',
      internalName: 'reference',
      label: 'Referencia', 
      description: 'Información adicional',
      required: false,
      placeholder: 'Ej: Ref, Referencia, Observaciones'
    }
  ];

  // Contact file fields - con información más clara
  const contactFields = [
    { 
      key: 'customer_code',
      internalName: 'customer_code',
      label: 'Código Cliente', 
      description: 'Mismo código que en facturas',
      required: true,
      placeholder: 'Ej: Código, Nº, CodCliente'
    },
    { 
      key: 'customer_name',
      internalName: 'customer_name',
      label: 'Nombre/Razón Social', 
      description: 'Nombre del cliente',
      required: true,
      placeholder: 'Ej: Nombre, RazonSocial, Cliente'
    },
    { 
      key: 'email',
      internalName: 'email',
      label: 'Email', 
      description: 'Correo electrónico',
      required: false,
      placeholder: 'Ej: Email, Correo, Mail'
    },
    { 
      key: 'phone',
      internalName: 'phone',
      label: 'Teléfono', 
      description: 'Número principal',
      required: true,
      placeholder: 'Ej: Teléfono, Tel, Nº teléfono'
    },
    { 
      key: 'phone_alt',
      internalName: 'phone_alt',
      label: 'Teléfono Alternativo', 
      description: 'Número secundario',
      required: false,
      placeholder: 'Ej: Tel2, Contacto1, Celular'
    },
    { 
      key: 'whatsapp',
      internalName: 'whatsapp',
      label: 'WhatsApp', 
      description: 'Número de WhatsApp',
      required: false,
      placeholder: 'Ej: WhatsApp, Movil, Contacto2'
    }
  ];

  // Estado para manejar campos requeridos/opcionales
  const [invoiceRequiredFields, setInvoiceRequiredFields] = useState({});
  const [contactRequiredFields, setContactRequiredFields] = useState({});

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

      // Variables para almacenar los datos cargados
      let loadedInvoiceMap = {};
      let loadedContactMap = {};
      let loadedInvoiceRequired = {};
      let loadedContactRequired = {};
      let hasExistingMappings = false;

      // Load existing mappings from Supabase
      if (supabase) {
        const { data: existingMappings, error } = await supabase
          .from('field_mappings')
          .select('*')
          .eq('company_id', companyId)
          .order('field_order');

        if (!error && existingMappings && existingMappings.length > 0) {
          hasExistingMappings = true;
          
          existingMappings.forEach(mapping => {
            if (mapping.file_type === 'invoice') {
              loadedInvoiceMap[mapping.internal_field_name] = mapping.company_field_name;
              loadedInvoiceRequired[mapping.internal_field_name] = mapping.is_required;
            } else if (mapping.file_type === 'contact') {
              loadedContactMap[mapping.internal_field_name] = mapping.company_field_name;
              loadedContactRequired[mapping.internal_field_name] = mapping.is_required;
            }
          });
        }
      }

      // Si hay mappings existentes, usarlos
      if (hasExistingMappings) {
        setInvoiceMappings(loadedInvoiceMap);
        setContactMappings(loadedContactMap);
        setInvoiceRequiredFields(loadedInvoiceRequired);
        setContactRequiredFields(loadedContactRequired);
      } else {
        // Solo establecer defaults si NO hay mappings
        const defaultInvoiceRequired = {};
        invoiceFields.forEach(field => {
          defaultInvoiceRequired[field.key] = field.required;
        });
        setInvoiceRequiredFields(defaultInvoiceRequired);

        const defaultContactRequired = {};
        contactFields.forEach(field => {
          defaultContactRequired[field.key] = field.required;
        });
        setContactRequiredFields(defaultContactRequired);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
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
        let order = 1;
        
        // Invoice mappings
        invoiceFields.forEach(field => {
          const columnName = invoiceMappings[field.key];
          if (columnName && columnName.trim() !== '') {
            allMappings.push({
              company_id: companyId,
              file_type: 'invoice',
              internal_field_name: field.key,
              company_field_name: columnName.trim(),
              is_required: invoiceRequiredFields[field.key] !== false,
              data_type: getDataType(field.key),
              field_order: order++
            });
          }
        });

        // Contact mappings
        contactFields.forEach(field => {
          const columnName = contactMappings[field.key];
          if (columnName && columnName.trim() !== '') {
            allMappings.push({
              company_id: companyId,
              file_type: 'contact',
              internal_field_name: field.key,
              company_field_name: columnName.trim(),
              is_required: contactRequiredFields[field.key] === true,
              data_type: getDataType(field.key),
              field_order: order++
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

  // Helper para determinar el tipo de dato
  const getDataType = (fieldKey) => {
    const dataTypes = {
      'amount': 'number',
      'due_date': 'date',
      'email': 'email',
      'phone': 'phone',
      'phone_alt': 'phone',
      'whatsapp': 'phone'
    };
    return dataTypes[fieldKey] || 'text';
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

  const handleInvoiceRequiredChange = (fieldKey, isRequired) => {
    setInvoiceRequiredFields(prev => ({
      ...prev,
      [fieldKey]: isRequired
    }));
  };

  const handleContactRequiredChange = (fieldKey, isRequired) => {
    setContactRequiredFields(prev => ({
      ...prev,
      [fieldKey]: isRequired
    }));
  };

  const styles = {
    container: {
      maxWidth: '1000px',
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
    // Nuevo estilo de tabla para mejor claridad
    mappingTable: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '280px 1fr 120px',
      gap: '16px',
      padding: '12px 0',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '8px'
    },
    tableHeaderCell: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    fieldRow: {
      display: 'grid',
      gridTemplateColumns: '280px 1fr 120px',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '8px'
    },
    fieldInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    fieldLabel: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1a1a1a'
    },
    fieldInternal: {
      fontSize: '12px',
      color: '#6b7280',
      fontFamily: 'monospace',
      background: '#e5e7eb',
      padding: '2px 6px',
      borderRadius: '4px',
      display: 'inline-block',
      marginTop: '2px'
    },
    fieldDescription: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '2px'
    },
    arrowIcon: {
      color: '#9ca3af',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      color: '#1a1a1a',
      outline: 'none',
      transition: 'border-color 0.2s',
      background: '#ffffff'
    },
    requiredToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
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
              Conecta cada campo del sistema con la columna correspondiente en tu archivo Excel
            </p>
            
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>Campo del Sistema</div>
              <div style={styles.tableHeaderCell}>Tu Columna en Excel</div>
              <div style={styles.tableHeaderCell}>Obligatorio</div>
            </div>
            
            {invoiceFields.map((field) => (
              <div key={field.key} style={styles.fieldRow}>
                <div style={styles.fieldInfo}>
                  <div style={styles.fieldLabel}>{field.label}</div>
                  <span style={styles.fieldInternal}>{field.internalName}</span>
                  <div style={styles.fieldDescription}>{field.description}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.arrowIcon}>→</span>
                  <input
                    type="text"
                    value={invoiceMappings[field.key] || ''}
                    onChange={(e) => handleInvoiceMappingChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={styles.requiredToggle}>
                  <input
                    type="checkbox"
                    id={`invoice-required-${field.key}`}
                    checked={invoiceRequiredFields[field.key] !== false}
                    onChange={(e) => handleInvoiceRequiredChange(field.key, e.target.checked)}
                    style={styles.checkbox}
                  />
                  <label htmlFor={`invoice-required-${field.key}`}>
                    Requerido
                  </label>
                </div>
              </div>
            ))}
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
              Conecta cada campo del sistema con la columna correspondiente en tu archivo Excel
            </p>
            
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>Campo del Sistema</div>
              <div style={styles.tableHeaderCell}>Tu Columna en Excel</div>
              <div style={styles.tableHeaderCell}>Obligatorio</div>
            </div>
            
            {contactFields.map((field) => (
              <div key={field.key} style={styles.fieldRow}>
                <div style={styles.fieldInfo}>
                  <div style={styles.fieldLabel}>{field.label}</div>
                  <span style={styles.fieldInternal}>{field.internalName}</span>
                  <div style={styles.fieldDescription}>{field.description}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.arrowIcon}>→</span>
                  <input
                    type="text"
                    value={contactMappings[field.key] || ''}
                    onChange={(e) => handleContactMappingChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={styles.requiredToggle}>
                  <input
                    type="checkbox"
                    id={`contact-required-${field.key}`}
                    checked={contactRequiredFields[field.key] === true}
                    onChange={(e) => handleContactRequiredChange(field.key, e.target.checked)}
                    style={styles.checkbox}
                  />
                  <label htmlFor={`contact-required-${field.key}`}>
                    Requerido
                  </label>
                </div>
              </div>
            ))}
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