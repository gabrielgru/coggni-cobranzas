'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    companies: 3,
    fieldMappings: 25,
    processedToday: 0,
    activeCompanies: 3
  });

  const [recentActivity] = useState([
    { id: 1, type: 'company', action: 'Nueva empresa agregada', entity: 'Dental Link', time: '2 horas atrás', icon: '🏢' },
    { id: 2, type: 'field', action: 'Campos actualizados', entity: 'La Perla', time: '5 horas atrás', icon: '🔤' },
    { id: 3, type: 'process', action: 'Procesamiento completado', entity: '150 facturas', time: '1 día atrás', icon: '✅' }
  ]);

  return (
    <div className="admin-dashboard">
      {/* Hero Section con Gradiente */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">
            Bienvenido de vuelta. Aquí está el resumen de tu sistema.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/admin/companies/new" className="btn-primary">
            <span>+</span> Nueva Empresa
          </Link>
        </div>
      </div>

      {/* Stats Grid Mejorado */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">🏢</div>
            <div className="stat-trend positive">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 9.5L2.5 6L3.55 4.95L5.25 6.65V2.5H6.75V6.65L8.45 4.95L9.5 6L6 9.5Z" fill="currentColor" transform="rotate(180 6 6)"/>
              </svg>
              <span>100%</span>
            </div>
          </div>
          <div className="stat-value">{stats.companies}</div>
          <div className="stat-label">Empresas Totales</div>
          <div className="stat-footer">
            <Link href="/admin/companies" className="stat-link">
              Ver todas →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">✅</div>
          </div>
          <div className="stat-value">{stats.activeCompanies}</div>
          <div className="stat-label">Empresas Activas</div>
          <div className="stat-footer">
            <span className="stat-percentage">100% del total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">🔤</div>
          </div>
          <div className="stat-value">{stats.fieldMappings}</div>
          <div className="stat-label">Campos Mapeados</div>
          <div className="stat-footer">
            <span className="stat-average">~8 por empresa</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">📊</div>
            <div className="stat-badge">Hoy</div>
          </div>
          <div className="stat-value">{stats.processedToday}</div>
          <div className="stat-label">Procesados</div>
          <div className="stat-footer">
            <Link href="/admin/logs" className="stat-link">
              Ver logs →
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Contenido Principal */}
      <div className="dashboard-grid">
        {/* Acciones Rápidas - Estilo Cards */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Acciones Rápidas</h2>
            <span className="section-badge">4 disponibles</span>
          </div>
          
          <div className="quick-actions-grid">
            <Link href="/admin/companies" className="action-card">
              <div className="action-icon">
                <span>🏢</span>
              </div>
              <div className="action-content">
                <h3 className="action-title">Gestionar Empresas</h3>
                <p className="action-description">Administra configuraciones y permisos</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link href="/admin/companies/new" className="action-card featured">
              <div className="action-icon">
                <span>➕</span>
              </div>
              <div className="action-content">
                <h3 className="action-title">Nueva Empresa</h3>
                <p className="action-description">Agrega una nueva organización</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link href="/admin/templates" className="action-card">
              <div className="action-icon">
                <span>📝</span>
              </div>
              <div className="action-content">
                <h3 className="action-title">Plantillas</h3>
                <p className="action-description">Personaliza mensajes y formatos</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link href="/admin/logs" className="action-card">
              <div className="action-icon">
                <span>📋</span>
              </div>
              <div className="action-content">
                <h3 className="action-title">Ver Logs</h3>
                <p className="action-description">Historial de procesamiento</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Actividad Reciente - Estilo Timeline */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Actividad Reciente</h2>
            <Link href="/admin/logs" className="section-link">Ver todo</Link>
          </div>
          
          <div className="activity-timeline">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                  <div className="activity-entity">{activity.entity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de Estado del Sistema */}
      <div className="system-status">
        <div className="status-header">
          <h3 className="status-title">Estado del Sistema</h3>
          <div className="status-indicator online">
            <span className="status-dot"></span>
            <span>Operativo</span>
          </div>
        </div>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">API</span>
            <span className="status-value good">✓ Activa</span>
          </div>
          <div className="status-item">
            <span className="status-label">Base de Datos</span>
            <span className="status-value good">✓ Conectada</span>
          </div>
          <div className="status-item">
            <span className="status-label">Webhooks</span>
            <span className="status-value good">✓ Funcionando</span>
          </div>
          <div className="status-item">
            <span className="status-label">Última sincronización</span>
            <span className="status-value">Hace 5 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}