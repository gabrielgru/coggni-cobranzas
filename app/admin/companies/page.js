'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // Intentar cargar de Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');
        
        if (!error && data) {
          setCompanies(data);
        } else {
          // Si falla, usar datos de ejemplo
          setCompanies([
            { id: 'dental-link', name: 'Dental Link', currencies: ['$', 'U$S'], languages: ['es'], is_active: true },
            { id: 'la-perla', name: 'La Perla', currencies: ['EUR'], languages: ['es'], is_active: true },
            { id: 'test-company', name: 'Test Company', currencies: ['U$S'], languages: ['en', 'es'], is_active: true }
          ]);
        }
      } else {
        // Si no hay Supabase, usar datos de ejemplo
        setCompanies([
          { id: 'dental-link', name: 'Dental Link', currencies: ['$', 'U$S'], languages: ['es'], is_active: true },
          { id: 'la-perla', name: 'La Perla', currencies: ['EUR'], languages: ['es'], is_active: true },
          { id: 'test-company', name: 'Test Company', currencies: ['U$S'], languages: ['en', 'es'], is_active: true }
        ]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Usar datos de ejemplo en caso de error
      setCompanies([
        { id: 'dental-link', name: 'Dental Link', currencies: ['$', 'U$S'], languages: ['es'], is_active: true },
        { id: 'la-perla', name: 'La Perla', currencies: ['EUR'], languages: ['es'], is_active: true },
        { id: 'test-company', name: 'Test Company', currencies: ['U$S'], languages: ['en', 'es'], is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
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
    title: {
      fontSize: '36px',
      fontWeight: '700',
      margin: '0',
      color: '#1a1a1a'
    },
    newButton: {
      padding: '12px 24px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px'
    },
    card: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      padding: '24px'
    },
    companyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    companyName: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 16px 0'
    },
    details: {
      marginBottom: '20px'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px'
    },
    label: {
      color: '#6b7280',
      fontWeight: '500'
    },
    value: {
      color: '#1a1a1a'
    },
    statusActive: {
      color: '#10b981',
      fontWeight: '600'
    },
    statusInactive: {
      color: '#ef4444',
      fontWeight: '600'
    },
    actions: {
      display: 'flex',
      gap: '8px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb'
    },
    actionButton: {
      flex: 1,
      padding: '8px 16px',
      background: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      color: '#1a1a1a',
      textAlign: 'center',
      cursor: 'pointer'
    },
    empty: {
      textAlign: 'center',
      padding: '80px 20px',
      color: '#9ca3af'
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
    return (
      <div style={styles.loading}>
        Cargando empresas...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Empresas</h1>
        <a href="/admin/companies/new" style={styles.newButton}>
          + Nueva Empresa
        </a>
      </div>

      {companies.length > 0 ? (
        <div style={styles.grid}>
          {companies.map((company) => (
            <div key={company.id} style={styles.card}>
              <div style={styles.companyIcon}>🏢</div>
              <h3 style={styles.companyName}>{company.name}</h3>
              
              <div style={styles.details}>
                <div style={styles.detailRow}>
                  <span style={styles.label}>ID:</span>
                  <span style={styles.value}>{company.id}</span>
                </div>
                
                <div style={styles.detailRow}>
                  <span style={styles.label}>Monedas:</span>
                  <span style={styles.value}>
                    {company.currencies?.join(', ') || 'N/A'}
                  </span>
                </div>
                
                <div style={styles.detailRow}>
                  <span style={styles.label}>Idiomas:</span>
                  <span style={styles.value}>
                    {company.languages?.join(', ') || 'N/A'}
                  </span>
                </div>
                
                <div style={styles.detailRow}>
                  <span style={styles.label}>Estado:</span>
                  <span style={company.is_active ? styles.statusActive : styles.statusInactive}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              
              <div style={styles.actions}>
                <a 
                  href={`/admin/companies/${company.id}`} 
                  style={styles.actionButton}
                >
                  Configurar
                </a>
                <a 
                  href={`/admin/companies/${company.id}/fields`} 
                  style={styles.actionButton}
                >
                  Campos
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <p style={{ fontSize: '18px', marginBottom: '24px' }}>
            No hay empresas registradas
          </p>
          <a href="/admin/companies/new" style={styles.newButton}>
            Crear primera empresa
          </a>
        </div>
      )}
    </div>
  );
}