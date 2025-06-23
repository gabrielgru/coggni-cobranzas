'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    fieldMappings: 0,
    processedToday: 0,
    activeCompanies: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Error de conexión con la base de datos');
        setLoading(false);
        return;
      }

      // Verificar que tenemos sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      // Cargar estadísticas
      const { count: companiesCount, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (companiesError) {
        console.error('Error loading companies:', companiesError);
      }

      const { count: mappingsCount, error: mappingsError } = await supabase
        .from('field_mappings')
        .select('*', { count: 'exact', head: true });

      if (mappingsError) {
        console.error('Error loading mappings:', mappingsError);
      }

      const { data: activeCompanies, error: activeError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true);

      if (activeError) {
        console.error('Error loading active companies:', activeError);
      }

      // Cargar logs recientes
      const { data: logs, error: logsError } = await supabase
        .from('processing_logs')
        .select(`
          *,
          companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsError) {
        console.error('Error loading logs:', logsError);
      }

      // Actualizar estado con los datos obtenidos
      setStats({
        companies: companiesCount || 0,
        fieldMappings: mappingsCount || 0,
        processedToday: 0, // TODO: Implementar conteo real
        activeCompanies: activeCompanies?.length || 0
      });

      setRecentLogs(logs || []);
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError('Error inesperado al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          Cargando dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div style={{
          background: 'var(--error-light)',
          border: '1px solid var(--error-color)',
          color: 'var(--error-color)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem'
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={loadDashboardData}
            style={{
              marginLeft: '1rem',
              padding: '4px 12px',
              background: 'var(--error-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">Bienvenido al centro de control de Coggni</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">🏢</div>
            <div>
              <div className="stat-value">{stats.companies}</div>
              <div className="stat-label">Empresas Totales</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{stats.activeCompanies}</div>
              <div className="stat-label">Empresas Activas</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">🔤</div>
            <div>
              <div className="stat-value">{stats.fieldMappings}</div>
              <div className="stat-label">Campos Mapeados</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">📊</div>
            <div>
              <div className="stat-value">{stats.processedToday}</div>
              <div className="stat-label">Procesados Hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <section style={{ marginBottom: '32px' }}>
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="actions-grid">
          <Link href="/admin/companies" className="action-card">
            <div className="action-icon">🏢</div>
            <div className="action-title">Gestionar Empresas</div>
          </Link>
          
          <Link href="/admin/companies/new" className="action-card">
            <div className="action-icon">➕</div>
            <div className="action-title">Nueva Empresa</div>
          </Link>
          
          <Link href="/admin/logs" className="action-card">
            <div className="action-icon">📋</div>
            <div className="action-title">Ver Logs</div>
          </Link>
        </div>
      </section>

      {/* Actividad reciente */}
      <section>
        <h2 className="section-title">Actividad Reciente</h2>
        <div className="activity-card">
          {recentLogs.length > 0 ? (
            <div className="activity-list">
              {recentLogs.map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-icon">📄</div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {log.companies?.name || 'N/A'}
                    </div>
                    <div className="activity-description">
                      Estado: <span className={`status-badge status-${log.status}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="activity-time">
                      {new Date(log.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-empty">
              <div className="activity-empty-icon">📭</div>
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}