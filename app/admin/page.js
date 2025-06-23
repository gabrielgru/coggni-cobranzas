'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    companies: 3,
    fieldMappings: 25,
    processedToday: 0,
    activeCompanies: 3
  });

  // Estilos inline simples
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      margin: '0 0 12px 0',
      color: '#1a1a1a'
    },
    subtitle: {
      fontSize: '18px',
      color: '#6b7280',
      margin: '0 0 48px 0'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '48px'
    },
    card: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center'
    },
    icon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    number: {
      fontSize: '42px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '0 0 8px 0'
    },
    label: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0'
    },
    section: {
      background: '#ffffff',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      margin: '0 0 24px 0',
      color: '#1a1a1a'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    },
    button: {
      display: 'block',
      padding: '24px',
      background: '#f3f4f6',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      textDecoration: 'none',
      color: '#1a1a1a',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: '600'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Panel de Administración</h1>
      <p style={styles.subtitle}>Bienvenido al centro de control de Coggni</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.icon}>🏢</div>
          <h3 style={styles.number}>{stats.companies}</h3>
          <p style={styles.label}>Empresas Totales</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <h3 style={styles.number}>{stats.activeCompanies}</h3>
          <p style={styles.label}>Empresas Activas</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🔤</div>
          <h3 style={styles.number}>{stats.fieldMappings}</h3>
          <p style={styles.label}>Campos Mapeados</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📊</div>
          <h3 style={styles.number}>{stats.processedToday}</h3>
          <p style={styles.label}>Procesados Hoy</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Acciones Rápidas</h2>
        <div style={styles.buttonGrid}>
          <a href="/admin/companies" style={styles.button}>
            🏢 Gestionar Empresas
          </a>
          <a href="/admin/companies/new" style={styles.button}>
            ➕ Nueva Empresa
          </a>
          <a href="/admin/logs" style={styles.button}>
            📋 Ver Logs
          </a>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Actividad Reciente</h2>
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
          No hay actividad reciente
        </p>
      </div>
    </div>
  );
}