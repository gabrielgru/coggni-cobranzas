'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    currencies: [],
    languages: [],
    is_active: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Opciones disponibles
  const currencyOptions = ['$', 'U$S', 'EUR', 'R$', 'CLP', 'ARS'];
  const languageOptions = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (!formData.id || !formData.name) {
      setError('ID y Nombre son requeridos');
      setLoading(false);
      return;
    }

    if (formData.currencies.length === 0) {
      setError('Selecciona al menos una moneda');
      setLoading(false);
      return;
    }

    if (formData.languages.length === 0) {
      setError('Selecciona al menos un idioma');
      setLoading(false);
      return;
    }

    try {
      // Intentar guardar en Supabase
      if (supabase) {
        const { error: insertError } = await supabase
          .from('companies')
          .insert([formData]);

        if (insertError) {
          console.error('Error inserting:', insertError);
          setError('Error al crear la empresa. El ID podría estar duplicado.');
          setLoading(false);
          return;
        }

        // Crear field mappings por defecto para la nueva empresa
        const defaultFieldMappings = [
          // Mappings de facturas (invoice_*)
          { company_id: formData.id, field_type: 'invoice_codigo', source_column: 'Código' },
          { company_id: formData.id, field_type: 'invoice_nombre', source_column: 'Nombre' },
          { company_id: formData.id, field_type: 'invoice_saldo', source_column: 'Saldo' },
          { company_id: formData.id, field_type: 'invoice_docum', source_column: 'Docum' },
          { company_id: formData.id, field_type: 'invoice_mon', source_column: 'Mon' },
          { company_id: formData.id, field_type: 'invoice_vencim', source_column: 'Vencim' },
          { company_id: formData.id, field_type: 'invoice_referencia', source_column: 'Referencia' },
          // Mappings de contactos (contact_*)
          { company_id: formData.id, field_type: 'contact_codigo', source_column: 'Código' },
          { company_id: formData.id, field_type: 'contact_nombre', source_column: 'Nombre' },
          { company_id: formData.id, field_type: 'contact_email', source_column: 'Email' },
          { company_id: formData.id, field_type: 'contact_telefono', source_column: 'Teléfono' },
          { company_id: formData.id, field_type: 'contact_contacto1', source_column: 'Contacto 1' },
          { company_id: formData.id, field_type: 'contact_contacto2', source_column: 'Contacto 2' }
        ];

        const { error: mappingError } = await supabase
          .from('field_mappings')
          .insert(defaultFieldMappings);

        if (mappingError) {
          console.error('Error creating default field mappings:', mappingError);
          // No detenemos el flujo, la empresa ya fue creada exitosamente
        }
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/companies');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = (currency) => {
    setFormData(prev => ({
      ...prev,
      currencies: prev.currencies.includes(currency)
        ? prev.currencies.filter(c => c !== currency)
        : [...prev.currencies, currency]
    }));
  };

  const toggleLanguage = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
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
      margin: '0 0 12px 0',
      color: '#1a1a1a'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0'
    },
    form: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#1a1a1a',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    inputFocus: {
      borderColor: '#3b82f6'
    },
    helpText: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '4px'
    },
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '12px',
      marginTop: '8px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px',
      fontWeight: '500'
    },
    checkboxLabelActive: {
      background: '#dbeafe',
      borderColor: '#3b82f6',
      color: '#1e40af'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    switchGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    switch: {
      position: 'relative',
      width: '48px',
      height: '24px',
      background: '#e5e7eb',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    switchActive: {
      background: '#10b981'
    },
    switchKnob: {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '20px',
      height: '20px',
      background: '#ffffff',
      borderRadius: '50%',
      transition: 'transform 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    switchKnobActive: {
      transform: 'translateX(24px)'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '32px'
    },
    submitButton: {
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
    submitButtonDisabled: {
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
    alert: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px'
    },
    alertError: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    alertSuccess: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Nueva Empresa</h1>
        <p style={styles.subtitle}>Configura una nueva empresa en el sistema</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            ¡Empresa creada exitosamente! Redirigiendo...
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>ID de la Empresa*</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            style={styles.input}
            placeholder="ej: mi-empresa"
            required
          />
          <p style={styles.helpText}>
            Identificador único, sin espacios. Se usará en las URLs.
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Nombre de la Empresa*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            placeholder="ej: Mi Empresa S.A."
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Monedas Soportadas*</label>
          <div style={styles.checkboxGroup}>
            {currencyOptions.map(currency => (
              <label
                key={currency}
                style={{
                  ...styles.checkboxLabel,
                  ...(formData.currencies.includes(currency) ? styles.checkboxLabelActive : {})
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.currencies.includes(currency)}
                  onChange={() => toggleCurrency(currency)}
                  style={styles.checkbox}
                />
                {currency}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Idiomas Disponibles*</label>
          <div style={styles.checkboxGroup}>
            {languageOptions.map(lang => (
              <label
                key={lang.code}
                style={{
                  ...styles.checkboxLabel,
                  ...(formData.languages.includes(lang.code) ? styles.checkboxLabelActive : {})
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.languages.includes(lang.code)}
                  onChange={() => toggleLanguage(lang.code)}
                  style={styles.checkbox}
                />
                {lang.name}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Estado</label>
          <div style={styles.switchGroup}>
            <div
              style={{
                ...styles.switch,
                ...(formData.is_active ? styles.switchActive : {})
              }}
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            >
              <div
                style={{
                  ...styles.switchKnob,
                  ...(formData.is_active ? styles.switchKnobActive : {})
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {formData.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? 'Creando...' : 'Crear Empresa'}
          </button>
          
          <a
            href="/admin/companies"
            style={styles.cancelButton}
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}