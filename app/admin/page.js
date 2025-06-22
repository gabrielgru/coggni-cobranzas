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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }
      // Cargar estadísticas
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      const { count: mappingsCount } = await supabase
        .from('field_mappings')
        .select('*', { count: 'exact', head: true });

      const { data: activeCompanies } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true);

      // Cargar logs recientes
      const { data: logs } = await supabase
        .from('processing_logs')
        .select(`
          *,
          companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        companies: companiesCount || 0,
        fieldMappings: mappingsCount || 0,
        processedToday: 0, // TODO: Implementar conteo real
        activeCompanies: activeCompanies?.length || 0
      });

      setRecentLogs(logs || []);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      <p className="subtitle">Bienvenido al centro de control de Coggni</p>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.companies}</h3>
            <p>Empresas Totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activeCompanies}</h3>
            <p>Empresas Activas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔤</div>
          <div className="stat-content">
            <h3>{stats.fieldMappings}</h3>
            <p>Campos Mapeados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.processedToday}</h3>
            <p>Procesados Hoy</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="admin-card">
        <h2>Acciones Rápidas</h2>
        <div className="quick-actions">
          <Link href="/admin/companies" className="action-button">
            <span className="action-icon">🏢</span>
            <span>Gestionar Empresas</span>
          </Link>
          <Link href="/admin/companies/new" className="action-button">
            <span className="action-icon">➕</span>
            <span>Nueva Empresa</span>
          </Link>
          <Link href="/admin/logs" className="action-button">
            <span className="action-icon">📋</span>
            <span>Ver Logs</span>
          </Link>
        </div>
      </div>

      {/* Logs recientes */}
      <div className="admin-card">
        <h2>Actividad Reciente</h2>
        {recentLogs.length > 0 ? (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>ID Webhook</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('es-ES')}</td>
                    <td>{log.companies?.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${log.status}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="webhook-id">{log.webhook_call_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No hay actividad reciente</p>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        h1 {
          font-size: 36px;
          margin-bottom: 12px;
          color: var(--text-primary);
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 40px;
          font-size: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--bg-primary);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 40px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: 12px;
        }

        .stat-content h3 {
          font-size: 28px;
          margin: 0;
          color: var(--primary-color);
        }

        .stat-content p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: var(--bg-tertiary);
          border: 2px solid transparent;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.2s;
          font-weight: 500;
        }

        .action-button:hover {
          border-color: var(--primary-color);
          background: var(--bg-secondary);
          transform: translateY(-1px);
        }

        .action-icon {
          font-size: 24px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-success {
          background: #d1fae5;
          color: #065f46;
        }

        .status-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-processing {
          background: #dbeafe;
          color: #1e40af;
        }

        .webhook-id {
          font-family: monospace;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .no-data {
          text-align: center;
          color: var(--text-secondary);
          padding: 40px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}