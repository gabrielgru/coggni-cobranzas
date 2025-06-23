'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function FieldMappingPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id;
  
  const [company, setCompany] = useState(null);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Default field types that every company needs
  const requiredFields = [
    { key: 'customer_code', label: 'Código Cliente', required: true },
    { key: 'customer_name', label: 'Nombre/Razón Social', required: true },
    { key: 'balance', label: 'Saldo/Importe', required: true },
    { key: 'document', label: 'Nº Documento/Factura', required: true },
    { key: 'currency', label: 'Moneda', required: false },
    { key: 'due_date', label: 'Fecha Vencimiento', required: false },
    { key: 'reference', label: 'Referencia', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Teléfono', required: false }
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
          // Convert array to object for easier access
          const mappingsObj = {};
          existingMappings.forEach(mapping => {
            mappingsObj[mapping.field_type] = mapping.source_column;
          });
          setMappings(mappingsObj);
        }
      }

      // Set default mappings if none exist
      if (Object.keys(mappings).length === 0) {
        const defaultMappings = {
          customer_code: 'Código',
          customer_name: 'Nombre',
          balance: 'Saldo',
          document: 'Docum',
          currency: 'Mon',
          due_date: 'Vencim',
          reference: 'Referencia',
          email: 'Email',
          phone: 'Teléfono'
        };
        setMappings(defaultMappings);
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

        // Insert new mappings
        const mappingsToInsert = Object.entries(mappings)
          .filter(([_, value]) => value) // Only save non-empty mappings
          .map(([fieldType, sourceColumn]) => ({
            company_id: companyId,
            field_type: fieldType,
            source_column: sourceColumn
          }));

        if (mappingsToInsert.length > 0) {
          const { error } = await supabase
            .from('field_mappings')
            .insert(mappingsToInsert);

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

  const handleMappingChange = (fieldKey, value) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const styles = {
    container: {
      maxWidth: '800px',
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
      marginBottom: '24px'
    },
    fieldGrid: {
      display: 'grid',
      gap: '20px'
    },
    fieldRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
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
    inputFocus: {
      borderColor: '#3b82f6'
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
      marginBottom: '8px'
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
          Configura cómo se mapean las columnas del Excel para {company?.name}
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

      <div style={styles.helpSection}>
        <h3 style={styles.helpTitle}>💡 Cómo funciona</h3>
        <p style={styles.helpText}>
          Define qué nombre tienen las columnas en los archivos Excel/CSV que subirán los usuarios.
          Por ejemplo, si en el Excel la columna del código de cliente se llama "CodCliente", 
          escribe "CodCliente" en el campo correspondiente.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Campos del Sistema → Columnas del Excel</h2>
        
        <div style={styles.fieldGrid}>
          {requiredFields.map((field) => (
            <div key={field.key} style={styles.fieldRow}>
              <div>
                <div style={styles.fieldLabel}>
                  <span style={styles.fieldName}>{field.label}</span>
                  {field.required && (
                    <span style={styles.requiredBadge}>Requerido</span>
                  )}
                </div>
                <div style={styles.fieldDescription}>
                  Campo interno: {field.key}
                </div>
              </div>
              
              <input
                type="text"
                value={mappings[field.key] || ''}
                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                placeholder="Nombre de columna en Excel"
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
        </div>
      </div>

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