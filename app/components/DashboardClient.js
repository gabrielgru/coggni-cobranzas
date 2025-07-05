// ========================================
// ARCHIVO: app/components/DashboardClient.js
// COMPONENTE CLIENTE DEL DASHBOARD
// Qué hace: Client Component que recibe datos del servidor
// Por qué: Separar Server Components de Client Components
// ========================================

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from './shared/ThemeToggle';
import Image from 'next/image';

// ========================================
// FUNCIÓN: Formatear datos de empresa
// Qué hace: Convierte mappings en estructura esperada
// Por qué: El AuthContext espera formato específico
// ========================================
function formatCompanyData(companyData, mappings) {
  console.log('[DashboardClient] formatCompanyData - Input:', { 
    companyData, 
    mappingsCount: mappings?.length
  });

  if (!companyData || !mappings || mappings.length === 0) {
    console.warn('[DashboardClient] formatCompanyData - Missing data, using fallback');
    return {
      id: companyData?.id,
      nombre: companyData?.name,
      monedas: companyData?.currencies || ['$'],
      idiomas_disponibles: companyData?.languages || ['es'],
      paises_telefono: companyData?.phone_countries || ['UY', 'AR', 'ES'],
      admin_email: companyData?.admin_email,
      webhook_url: companyData?.webhook_url || 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
      campos_facturas: {
        invoice_number: { nombre: 'Número', requerido: true, tipo: 'text' },
        invoice_amount: { nombre: 'Monto', requerido: true, tipo: 'number' },
        due_date: { nombre: 'Vencimiento', requerido: false, tipo: 'date' }
      },
      campos_contactos: {
        client_email: { nombre: 'Email', requerido: true, tipo: 'email' },
        client_name: { nombre: 'Nombre', requerido: true, tipo: 'text' },
        client_phone: { nombre: 'Teléfono', requerido: false, tipo: 'phone' }
      }
    };
  }

  const campos_facturas = {};
  const campos_contactos = {};

  mappings.forEach((mapping) => {
    const campo = {
      nombre: mapping.company_field_name,
      requerido: mapping.is_required,
      tipo: mapping.data_type || 'text'
    };

    if (mapping.file_type === 'factura') {
      campos_facturas[mapping.internal_field_name] = campo;
    } else if (mapping.file_type === 'cliente') {
      campos_contactos[mapping.internal_field_name] = campo;
    }
  });

  return {
    id: companyData.id,
    nombre: companyData.name,
    monedas: companyData.currencies || ['$'],
    idiomas_disponibles: companyData.languages || ['es'],
    paises_telefono: companyData.phone_countries || ['UY', 'AR', 'ES'],
    admin_email: companyData.admin_email,
    webhook_url: companyData.webhook_url || 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
    campos_facturas,
    campos_contactos
  };
}

// ========================================
// COMPONENTE: Dashboard del cliente
// Qué hace: Recibe datos del servidor e inicializa el contexto
// Por qué: Client Components pueden usar hooks y estado
// ========================================
export default function DashboardClient({ 
  initialUser, 
  initialUserData, 
  initialMappings 
}) {
  const { initializeWithServerData, logout } = useAuth();
  const router = useRouter();

  console.log('[DashboardClient] Props received:', {
    initialUser: initialUser?.email,
    initialUserData: initialUserData?.companies?.name,
    initialMappings: initialMappings?.length
  });

  // ========================================
  // EFECTO: Inicializar contexto con datos del servidor
  // Qué hace: Pasa los datos del servidor al contexto
  // Por qué: Evita el loading inicial y problemas de sesión
  // ========================================
  useEffect(() => {
    console.log('[DashboardClient] Initializing with server data...');
    
    const formattedCompany = formatCompanyData(
      initialUserData.companies, 
      initialMappings
    );
    
    if (formattedCompany) {
      console.log('[DashboardClient] Formatted company:', formattedCompany);
      initializeWithServerData(
        initialUser.email,
        formattedCompany,
        'client'
      );
    }
  }, []); // ← CAMBIO CRÍTICO: dependencias vacías para ejecutar solo una vez

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* ========================================
          SIDEBAR
          ======================================== */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <Image 
            src="/Logo-Coggni.png" 
            alt="Coggni" 
            width={120}
            height={36}
            priority
            style={{ height: '36px', width: 'auto' }}
          />
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            Mis apps
          </div>
          
          <Link href="/collections" className="nav-link active">
            <span>Cobranzas</span>
          </Link>
          
          {['Ventas', 'Finanzas', 'Reportes'].map((app) => (
            <div key={app} className="nav-link disabled">
              <span>{app}</span>
              <span className="nav-badge">
                Próximamente
              </span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-email">
              {initialUser.email}
            </div>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              title="Cerrar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================
          CONTENIDO PRINCIPAL
          ======================================== */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="dashboard-title">
                Dashboard
              </h1>
              <p className="dashboard-date">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2 className="welcome-title">
              Bienvenido de vuelta 👋
            </h2>
            <p className="welcome-email">
              {initialUser.email}
            </p>
            <p className="welcome-company">
              Empresa: {initialUserData.companies.name}
            </p>
          </div>

          {/* Área principal */}
          <div className="main-content">
            {/* Espacio para futuras funcionalidades */}
          </div>
        </div>
      </main>
    </div>
  );
}