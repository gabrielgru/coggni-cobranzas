'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/shared/Sidebar';

export default function AuthenticatedLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { usuarioActual, empresaActual, userType, updateActivity } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!usuarioActual || !empresaActual)) {
      router.push('/login');
      return;
    }
    if (userType === 'admin') {
      router.push('/admin');
      return;
    }
    if (usuarioActual && empresaActual) {
      setIsAuthenticated(true);
      setLoading(false);
    }
    updateActivity();
  }, [usuarioActual, empresaActual, userType, loading, router, updateActivity]);

  // Configuración de módulos disponibles
  const availableModules = [
    {
      id: 'collections',
      name: 'Cobranzas',
      icon: '📊',
      route: '/collections',
      enabled: true
    }
    // Futuros módulos se agregarán aquí
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Mientras carga, mostrar spinner
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="authenticated-layout">
      <Sidebar 
        modules={availableModules}
        activeModule={pathname.split('/')[1] || 'dashboard'}
        user={{ email: usuarioActual, company: empresaActual?.nombre }}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <header className="content-header">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          <div className="header-info">
            <span className="company-name">{empresaActual?.nombre}</span>
          </div>
        </header>

        <div className="content-wrapper">
          {children}
        </div>
      </main>

      <style jsx>{`
        .authenticated-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-secondary);
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }

        .main-content.sidebar-collapsed {
          margin-left: 64px;
        }

        .content-header {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-primary);
          border-radius: 8px;
          transition: all 0.2s ease;
          margin-right: 16px;
        }

        .sidebar-toggle:hover {
          background: var(--bg-secondary);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .company-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .content-wrapper {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }

          .content-wrapper {
            padding: 20px;
          }

          .content-header {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}