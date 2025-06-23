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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Cargando...</div>
      </div>
    );
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px'
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      margin: '0 0 12px 0',
      background: 'linear-gradient(135deg, #3ca4d4 0%, #043c94 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '18px',
      color: '#6b7280',
      margin: '0 0 48px 0',
      fontWeight: '400'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '24px',
      marginBottom: '48px'
    },
    statCard: {
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '28px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      borderColor: '#3ca4d4'
    },
    statIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      marginBottom: '20px',
      fontWeight: '400'
    },
    statValue: {
      fontSize: '42px',
      fontWeight: '700',
      color: '#111827',
      margin: '0',
      letterSpacing: '-1px',
      lineHeight: '1'
    },
    statLabel: {
      fontSize: '15px',
      color: '#6b7280',
      margin: '8px 0 0 0',
      fontWeight: '500'
    },
    section: {
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    sectionTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 28px 0',
      letterSpacing: '-0.3px'
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px'
    },
    actionCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '28px 20px',
      background: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '14px',
      textDecoration: 'none',
      color: '#111827',
      transition: 'all 0.2s ease',
      textAlign: 'center',
      cursor: 'pointer'
    },
    actionCardHover: {
      background: '#ffffff',
      borderColor: '#3ca4d4',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    actionIcon: {
      width: '72px',
      height: '72px',
      background: '#e5e7eb',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      transition: 'all 0.3s ease'
    },
    actionIconHover: {
      background: '#dbeafe',
      transform: 'scale(1.1)'
    },
    actionLabel: {
      fontSize: '17px',
      fontWeight: '600',
      letterSpacing: '-0.2px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      color: '#9ca3af'
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px',
      opacity: '0.3'
    },
    emptyText: {
      fontSize: '18px',
      margin: '0'
    }
  };

  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  const iconColors = {
    companies: { bg: '#dbeafe', color: '#3b82f6' },
    active: { bg: '#d1fae5', color: '#10b981' },
    fields: { bg: '#fef3c7', color: '#f59e0b' },
    processed: { bg: '#e9d5ff', color: '#9333ea' }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Panel de Administración</h1>
      <p style={styles.subtitle}>Bienvenido al centro de control de Coggni</p>

      <div style={styles.statsGrid}>
        <div 
          style={{
            ...styles.statCard,
            ...(hoveredStat === 'companies' ? styles.statCardHover : {})
          }}
          onMouseEnter={() => setHoveredStat('companies')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div style={{
            ...styles.statIcon,
            background: iconColors.companies.bg,
            color: iconColors.companies.color
          }}>
            🏢
          </div>
          <h3 style={styles.statValue}>{stats.companies}</h3>
          <p style={styles.statLabel}>Empresas Totales</p>
        </div>

        <div 
          style={{
            ...styles.statCard,
            ...(hoveredStat === 'active' ? styles.statCardHover : {})
          }}
          onMouseEnter={() => setHoveredStat('active')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div style={{
            ...styles.statIcon,
            background: iconColors.active.bg,
            color: iconColors.active.color
          }}>
            ✅
          </div>
          <h3 style={styles.statValue}>{stats.activeCompanies}</h3>
          <p style={styles.statLabel}>Empresas Activas</p>
        </div>

        <div 
          style={{
            ...styles.statCard,
            ...(hoveredStat === 'fields' ? styles.statCardHover : {})
          }}
          onMouseEnter={() => setHoveredStat('fields')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div style={{
            ...styles.statIcon,
            background: iconColors.fields.bg,
            color: iconColors.fields.color
          }}>
            🔤
          </div>
          <h3 style={styles.statValue}>{stats.fieldMappings}</h3>
          <p style={styles.statLabel}>Campos Mapeados</p>
        </div>

        <div 
          style={{
            ...styles.statCard,
            ...(hoveredStat === 'processed' ? styles.statCardHover : {})
          }}
          onMouseEnter={() => setHoveredStat('processed')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div style={{
            ...styles.statIcon,
            background: iconColors.processed.bg,
            color: iconColors.processed.color
          }}>
            📊
          </div>
          <h3 style={styles.statValue}>{stats.processedToday}</h3>
          <p style={styles.statLabel}>Procesados Hoy</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Acciones Rápidas</h2>
        <div style={styles.actionsGrid}>
          <Link 
            href="/admin/companies" 
            style={{
              ...styles.actionCard,
              ...(hoveredAction === 'companies' ? styles.actionCardHover : {})
            }}
            onMouseEnter={() => setHoveredAction('companies')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div style={{
              ...styles.actionIcon,
              ...(hoveredAction === 'companies' ? styles.actionIconHover : {})
            }}>
              🏢
            </div>
            <span style={styles.actionLabel}>Gestionar Empresas</span>
          </Link>
          
          <Link 
            href="/admin/companies/new" 
            style={{
              ...styles.actionCard,
              ...(hoveredAction === 'new' ? styles.actionCardHover : {})
            }}
            onMouseEnter={() => setHoveredAction('new')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div style={{
              ...styles.actionIcon,
              ...(hoveredAction === 'new' ? styles.actionIconHover : {})
            }}>
              ➕
            </div>
            <span style={styles.actionLabel}>Nueva Empresa</span>
          </Link>
          
          <Link 
            href="/admin/logs" 
            style={{
              ...styles.actionCard,
              ...(hoveredAction === 'logs' ? styles.actionCardHover : {})
            }}
            onMouseEnter={() => setHoveredAction('logs')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div style={{
              ...styles.actionIcon,
              ...(hoveredAction === 'logs' ? styles.actionIconHover : {})
            }}>
              📋
            </div>
            <span style={styles.actionLabel}>Ver Logs</span>
          </Link>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Actividad Reciente</h2>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyText}>No hay actividad reciente</p>
        </div>
      </div>
    </div>
  );
}