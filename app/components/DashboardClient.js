// ========================================
// ARCHIVO: app/components/DashboardClient.js
// COMPONENTE CLIENTE DEL DASHBOARD
// 
// ¿QUÉ HACE ESTE ARCHIVO?
// Este archivo contiene el componente cliente del dashboard que recibe datos
// del servidor y los pasa al contexto de autenticación. Es un "puente" entre
// los datos del servidor y el estado del cliente.
//
// ¿POR QUÉ EXISTE?
// - Next.js 13+ separa Server Components de Client Components
// - Los Server Components no pueden usar hooks ni estado
// - Este componente permite usar useAuth() y otros hooks del cliente
// - Evita problemas de hidratación y sincronización de estado
//
// ¿CÓMO FUNCIONA?
// 1. Recibe datos iniciales del servidor (usuario, empresa, mappings)
// 2. Formatea los datos de la empresa con los field mappings
// 3. Inicializa el AuthContext con estos datos
// 4. Renderiza la interfaz del dashboard
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
// 
// ¿QUÉ HACE ESTA FUNCIÓN?
// Convierte los datos raw de la empresa y los field mappings en la estructura
// que espera el AuthContext. Es como un "traductor" entre la base de datos
// y el formato que usa la aplicación.
//
// ¿POR QUÉ ES NECESARIA?
// - Los datos vienen de Supabase en formato "crudo"
// - El AuthContext espera una estructura específica
// - Los field mappings definen qué campos tiene cada empresa
// - Sin esta función, la app no sabría qué campos mostrar
//
// ¿QUÉ VALIDA?
// - Que existan los datos de la empresa
// - Que existan los field mappings
// - Que haya al menos un mapping configurado
// - Si algo falta, lanza un error explícito (no fallbacks engañosos)
// ========================================
function formatCompanyData(companyData, mappings) {
  console.log('[DashboardClient] formatCompanyData - Input:', { 
    companyData, 
    mappingsCount: mappings?.length
  });

  // VALIDACIÓN CRÍTICA: Si faltan datos, fallar explícitamente
  // Esto evita que la app "funcione" con datos incompletos
  if (!companyData || !mappings || mappings.length === 0) {
    throw new Error(`[DashboardClient] Missing required data: companyData=${!!companyData}, mappings=${!!mappings}, mappingsLength=${mappings?.length || 0}`);
  }

  // CREAR ESTRUCTURA DE CAMPOS DINÁMICA
  // Los field mappings definen qué campos tiene cada empresa
  // Esto permite que cada empresa tenga su propia configuración
  const campos_facturas = {};
  const campos_contactos = {};

  // PROCESAR CADA FIELD MAPPING
  // Cada mapping define un campo que la empresa puede usar
  mappings.forEach((mapping) => {
    const campo = {
      nombre: mapping.company_field_name,    // Nombre que ve el usuario
      requerido: mapping.is_required,        // Si es obligatorio
      tipo: mapping.data_type                // Tipo de dato (text, number, email, etc.)
    };

    // CLASIFICAR POR TIPO DE ARCHIVO
    // Los campos se separan entre facturas y contactos
    if (mapping.file_type === 'factura') {
      campos_facturas[mapping.internal_field_name] = campo;
    } else if (mapping.file_type === 'cliente') {
      campos_contactos[mapping.internal_field_name] = campo;
    }
  });

  // RETORNAR ESTRUCTURA FINAL
  // Esta es la estructura que espera el AuthContext
  // NOTA: Sin fallbacks - si algo falta, fallará explícitamente
  return {
    id: companyData.id,                    // ID único de la empresa
    nombre: companyData.name,              // Nombre de la empresa
    monedas: companyData.currencies,       // Monedas que usa la empresa
    idiomas_disponibles: companyData.languages,  // Idiomas disponibles
    paises_telefono: companyData.phone_countries, // Países para teléfonos
    admin_email: companyData.admin_email,  // Email del administrador
    webhook_url: companyData.webhook_url,  // URL del webhook para procesamiento
    country: companyData.country,          // País principal de la empresa
    campos_facturas,                       // Campos dinámicos para facturas
    campos_contactos                       // Campos dinámicos para contactos
  };
}

// ========================================
// COMPONENTE: Dashboard del cliente
// 
// ¿QUÉ HACE ESTE COMPONENTE?
// Es el componente principal del dashboard que recibe datos del servidor
// y los pasa al contexto de autenticación. Es el "punto de entrada"
// para la interfaz del usuario autenticado.
//
// ¿POR QUÉ ES UN CLIENT COMPONENT?
// - Necesita usar hooks (useAuth, useRouter)
// - Necesita manejar estado y efectos
// - Necesita interactividad del usuario
// - No puede ser un Server Component
//
// ¿QUÉ PROPS RECIBE?
// - initialUser: Datos del usuario autenticado
// - initialUserData: Datos de la empresa del usuario
// - initialMappings: Configuración de campos de la empresa
// ========================================
export default function DashboardClient({ 
  initialUser, 
  initialUserData, 
  initialMappings 
}) {
  const { initializeWithServerData, logout } = useAuth();
  const router = useRouter();

  // LOGGING PARA DEBUGGING
  // Ayuda a verificar que los datos lleguen correctamente
  console.log('[DashboardClient] Props received:', {
    initialUser: initialUser?.email,
    initialUserData: initialUserData?.companies?.name,
    initialMappings: initialMappings?.length
  });

  // ========================================
  // EFECTO: Inicializar contexto con datos del servidor
  // 
  // ¿QUÉ HACE ESTE EFECTO?
  // Se ejecuta una sola vez cuando el componente se monta y toma los datos
  // que vienen del servidor para inicializar el contexto de autenticación.
  //
  // ¿POR QUÉ ES CRÍTICO?
  // - Sin esto, el AuthContext estaría vacío
  // - Evita el "loading" inicial molesto
  // - Previene problemas de hidratación
  // - Sincroniza el estado del cliente con el servidor
  //
  // ¿POR QUÉ DEPENDENCIAS VACÍAS []?
  // - Solo debe ejecutarse una vez al montar
  // - Los datos iniciales no cambian durante la sesión
  // - Evita re-inicializaciones innecesarias
  // ========================================
  useEffect(() => {
    console.log('[DashboardClient] Initializing with server data...');
    
    // FORMATEAR DATOS DE LA EMPRESA
    // Convierte los datos raw en la estructura que espera el contexto
    const formattedCompany = formatCompanyData(
      initialUserData.companies, 
      initialMappings
    );
    
    // INICIALIZAR CONTEXTO
    // Pasa los datos formateados al AuthContext
    if (formattedCompany) {
      console.log('[DashboardClient] Formatted company:', formattedCompany);
      initializeWithServerData(
        initialUser.email,
        formattedCompany,
        'client'
      );
    }
  }, []); // ← DEPENDENCIAS VACÍAS: ejecutar solo una vez

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