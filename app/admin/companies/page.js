'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setError(null);
      
      // Debug 1: Verificar si supabase está inicializado
      console.log('Supabase client:', supabase);
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Error de conexión con la base de datos');
        setLoading(false);
        return;
      }

      // Debug 2: Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('Auth error:', authError);

      // Debug 3: Query con más detalles
      console.log('Fetching companies...');
      const { data, error, status, statusText } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      console.log('Query response:', {
        data,
        error,
        status,
        statusText,
        dataLength: data?.length || 0
      });

      if (error) {
        console.error('Error loading companies:', error);
        setError(`Error al cargar empresas: ${error.message}`);
        
        // Si es error de permisos, dar más info
        if (error.code === 'PGRST301') {
          setError('Error de permisos. Verificar políticas RLS en Supabase.');
        }
      } else {
        setCompanies(data || []);
        console.log(`Loaded ${data?.length || 0} companies`);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para test directo (temporal)
  const testDirectQuery = async () => {
    console.log('Testing direct query...');
    try {
      const { data, error } = await supabase.rpc('get_all_companies');
      console.log('RPC test:', { data, error });
    } catch (e) {
      console.log('RPC not available, trying raw query...');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="companies-page">
      <div className="page-header">
        <h1>Empresas</h1>
        <Link href="/admin/companies/new" className="btn-primary">
          + Nueva Empresa
        </Link>
      </div>

      {/* Debug info - remover en producción */}
      {error && (
        <div className="error-banner" style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
          <button onClick={testDirectQuery} style={{ marginLeft: '1rem' }}>
            Test Query
          </button>
        </div>
      )}

      <div className="companies-grid">
        {companies.map((company) => (
          <div key={company.id} className="company-card">
            <div className="company-icon">🏢</div>
            <h3>{company.name}</h3>
            <div className="company-details">
              <div className="detail-item">
                <span className="label">ID:</span>
                <span className="value">{company.id}</span>
              </div>
              <div className="detail-item">
                <span className="label">Monedas:</span>
                <span className="value">{company.currencies?.join(', ') || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Idiomas:</span>
                <span className="value">{company.languages?.join(', ') || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Estado:</span>
                <span className={`status ${company.is_active ? 'active' : 'inactive'}`}>
                  {company.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            <div className="company-actions">
              <Link href={`/admin/companies/${company.id}`} className="btn-secondary">
                Configurar
              </Link>
              <Link href={`/admin/companies/${company.id}/fields`} className="btn-secondary">
                Campos
              </Link>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && !error && (
        <div className="empty-state">
          <p>No hay empresas registradas</p>
          <Link href="/admin/companies/new" className="btn-primary">
            Crear primera empresa
          </Link>
        </div>
      )}

      {/* Debug: mostrar cantidad */}
      <div style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
        Total empresas cargadas: {companies.length}
      </div>
    </div>
  );
}