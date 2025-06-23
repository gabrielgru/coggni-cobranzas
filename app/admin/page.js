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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
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

      setStats({
        companies: companiesCount || 0,
        fieldMappings: mappingsCount || 0,
        processedToday: 0,
        activeCompanies: activeCompanies?.length || 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #3ca4d4 0%, #043c94 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dashboard-subtitle {
          font-size: 16px;
          color: #666;
          margin: 0 0 40px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          border-color: #3ca4d4;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3ca4d4, #043c94);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 16px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        .actions-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 24px 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .action-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-decoration: none;
          color: #111827;
          transition: all 0.2s ease;
          text-align: center;
        }

        .action-link:hover {
          background: white;
          border-color: #3ca4d4;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .action-icon {
          width: 64px;
          height: 64px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          transition: all 0.3s ease;
        }

        .action-link:hover .action-icon {
          background: #dbeafe;
          transform: scale(1.1);
        }

        .action-label {
          font-size: 16px;
          font-weight: 600;
        }

        .activity-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
      `}</style>

      <div className="dashboard-container">
        <h1 className="dashboard-title">Panel de Administración</h1>
        <p className="dashboard-subtitle">Bienvenido al centro de control de Coggni</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <h3 className="stat-value">{stats.companies}</h3>
            <p className="stat-label">Empresas Totales</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>✅</div>
            <h3 className="stat-value">{stats.activeCompanies}</h3>
            <p className="stat-label">Empresas Activas</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>🔤</div>
            <h3 className="stat-value">{stats.fieldMappings}</h3>
            <p className="stat-label">Campos Mapeados</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3 className="stat-value">{stats.processedToday}</h3>
            <p className="stat-label">Procesados Hoy</p>
          </div>
        </div>

        <div className="actions-section">
          <h2 className="section-title">Acciones Rápidas</h2>
          <div className="actions-grid">
            <Link href="/admin/companies" className="action-link">
              <div className="action-icon">🏢</div>
              <span className="action-label">Gestionar Empresas</span>
            </Link>
            
            <Link href="/admin/companies/new" className="action-link">
              <div className="action-icon">➕</div>
              <span className="action-label">Nueva Empresa</span>
            </Link>
            
            <Link href="/admin/logs" className="action-link">
              <div className="action-icon">📋</div>
              <span className="action-label">Ver Logs</span>
            </Link>
          </div>
        </div>

        <div className="activity-section">
          <h2 className="section-title">Actividad Reciente</h2>
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No hay actividad reciente</p>
          </div>
        </div>
      </div>
    </>
  );
}