'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    currencies: [],
    languages: [],
    is_active: true,
    admin_emails: []
  });
  const [originalId] = useState(companyId); // Store original ID
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Available options
  const currencyOptions = ['$', 'U$S', 'EUR', 'R$', 'CLP', 'ARS'];
  const languageOptions = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' }
  ];

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      // Try to load from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (!error && data) {
          setFormData({
            ...data,
            admin_emails: data.admin_emails || []
          });
        } else {
          // Fallback data
          loadFallbackData();
        }
      } else {
        // No Supabase, use fallback
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading company:', error);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Hardcoded data for demo
    const companies = {
      'dental-link': {
        id: 'dental-link',
        name: 'Dental Link',
        currencies: ['$', 'U$S'],
        languages: ['es'],
        is_active: true,
        admin_emails: ['admin@dentallink.com']
      },
      'la-perla': {
        id: 'la-perla',
        name: 'La Perla',
        currencies: ['EUR'],
        languages: ['es'],
        is_active: true,
        admin_emails: ['admin@laperla.com']
      },
      'test-company': {
        id: 'test-company',
        name: 'Test Company',
        currencies: ['U$S'],
        languages: ['en', 'es'],
        is_active: true,
        admin_emails: ['admin@testcompany.com', 'reports@testcompany.com']
      }
    };

    const company = companies[companyId];
    if (company) {
      setFormData(company);
    } else {
      setMessage({ type: 'error', text: 'Empresa no encontrada' });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const addEmail = () => {
    if (!newEmail.trim()) {
      setEmailError('El email no puede estar vacío');
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Por favor ingresa un email válido');
      return;
    }

    if (formData.admin_emails.includes(newEmail)) {
      setEmailError('Este email ya está en la lista');
      return;
    }

    setFormData(prev => ({
      ...prev,
      admin_emails: [...prev.admin_emails, newEmail]
    }));
    setNewEmail('');
    setEmailError('');
  };

  const removeEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.filter(email => email !== emailToRemove)
    }));
  };

	const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // AGREGAR ESTOS LOGS
    console.log('=== INICIO HANDLESUBMIT ===');
    console.log('formData completo:', formData);
    console.log('admin_emails tipo:', typeof formData.admin_emails);
    console.log('admin_emails valor:', formData.admin_emails);
    console.log('Es array?:', Array.isArray(formData.admin_emails));

    // Validations
    if (!formData.name) {
      setMessage({ type: 'error', text: 'El nombre es requerido' });
      setSaving(false);
      return;
    }

    if (formData.currencies.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos una moneda' });
      setSaving(false);
      return;
    }

    if (formData.languages.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un idioma' });
      setSaving(false);
      return;
    }

    if (formData.admin_emails.length === 0) {
      setMessage({ type: 'error', text: 'Agrega al menos un email de administrador' });
      setSaving(false);
      return;
    }

	try {
	  // Try to save in Supabase
	  if (supabase) {
		console.log('Datos a guardar:', {
		  name: formData.name,
		  currencies: formData.currencies,
		  languages: formData.languages,
		  is_active: formData.is_active,
		  admin_emails: formData.admin_emails.length > 0 ? formData.admin_emails : null,
		});

	// Forzar el array a un formato específico
    const updatePayload = {
      name: formData.name,
      currencies: formData.currencies,
      languages: formData.languages,
      is_active: formData.is_active,
      admin_emails: formData.admin_emails.filter(email => email && email.trim()),
      updated_at: new Date().toISOString()
    };
    
    console.log('Payload a enviar:', updatePayload);
    
    const { data: updateData, error: updateError } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', originalId)
      .select();

		console.log('Resultado update:', updateData);
		console.log('Error update:', updateError);

        if (updateError) {
          console.error('Error updating:', updateError);
          setMessage({ type: 'error', text: 'Error al actualizar la empresa' });
          setSaving(false);
          return;
        }
      }

      // Success
      setMessage({ type: 'success', text: '¡Empresa actualizada exitosamente!' });
      setTimeout(() => {
        router.push('/admin/companies');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la empresa' });
    } finally {
      setSaving(false);
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

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      if (supabase) {
        // First delete related field_mappings
        await supabase
          .from('field_mappings')
          .delete()
          .eq('company_id', originalId);

        // Then delete company
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', originalId);

        if (error) throw error;
      }

      router.push('/admin/companies');
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la empresa' });
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px'
    },
    headerLeft: {
      flex: 1
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
    deleteButton: {
      padding: '10px 20px',
      background: '#ffffff',
      color: '#ef4444',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s'
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
    inputDisabled: {
      background: '#f3f4f6',
      color: '#9ca3af',
      cursor: 'not-allowed'
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
    message: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px'
    },
    messageError: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    messageSuccess: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      fontSize: '18px',
      color: '#6b7280'
    },
    quickLinks: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px'
    },
    quickLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      color: '#374151',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    emailInputGroup: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px'
    },
    addEmailButton: {
      padding: '12px 24px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s',
      whiteSpace: 'nowrap'
    },
    emailList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    emailItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    },
    emailText: {
      fontSize: '14px',
      color: '#374151'
    },
    removeEmailButton: {
      padding: '4px 12px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '14px',
      marginTop: '4px'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Cargando datos de la empresa...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Editar Empresa</h1>
          <p style={styles.subtitle}>Actualiza la configuración de {formData.name}</p>
        </div>
        <button
          onClick={handleDelete}
          style={styles.deleteButton}
          onMouseOver={(e) => {
            e.target.style.background = '#ef4444';
            e.target.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#ffffff';
            e.target.style.color = '#ef4444';
          }}
        >
          Eliminar Empresa
        </button>
      </div>

      <div style={styles.quickLinks}>
        <a href={`/admin/companies/${companyId}/fields`} style={styles.quickLink}>
          🔤 Configurar Campos
        </a>
        <a href={`/admin/companies/${companyId}/templates`} style={styles.quickLink}>
          📝 Plantillas (próximamente)
        </a>
        <a href={`/admin/companies/${companyId}/payments`} style={styles.quickLink}>
          💳 Pagos (próximamente)
        </a>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
          }}>
            {message.text}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>ID de la Empresa</label>
          <input
            type="text"
            value={formData.id}
            style={{ ...styles.input, ...styles.inputDisabled }}
            disabled
          />
          <p style={styles.helpText}>
            El ID no se puede cambiar una vez creada la empresa
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
          <label style={styles.label}>Emails de Administradores*</label>
          <p style={styles.helpText}>
            Estos emails recibirán los reportes de procesamiento
          </p>
          
          <div style={styles.emailInputGroup}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmail();
                }
              }}
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="admin@empresa.com"
            />
            <button
              type="button"
              onClick={addEmail}
              style={styles.addEmailButton}
            >
              Agregar Email
            </button>
          </div>
          
          {emailError && (
            <p style={styles.errorText}>{emailError}</p>
          )}

          <div style={styles.emailList}>
            {formData.admin_emails.length === 0 ? (
              <p style={{ ...styles.helpText, fontStyle: 'italic' }}>
                No hay emails configurados aún
              </p>
            ) : (
              formData.admin_emails.map((email, index) => (
                <div key={index} style={styles.emailItem}>
                  <span style={styles.emailText}>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    style={styles.removeEmailButton}
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
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
            disabled={saving}
            style={{
              ...styles.submitButton,
              ...(saving ? styles.submitButtonDisabled : {})
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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