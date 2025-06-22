'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading companies:', error);
      } else {
        setCompanies(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

      {companies.length === 0 && (
        <div className="empty-state">
          <p>No hay empresas registradas</p>
          <Link href="/admin/companies/new" className="btn-primary">
            Crear primera empresa
          </Link>
        </div>
      )}
    </div>
  );
}