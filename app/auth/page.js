'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { usuarioActual, empresaActual, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && (!usuarioActual || !empresaActual)) {
      router.push('/login');
    }
  }, [usuarioActual, empresaActual, loading, router]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!usuarioActual || !empresaActual) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Bienvenido a {empresaActual?.nombre}</p>
      </div>

      <div className="coming-soon-card">
        <div className="icon-wrapper">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15" x2="12" y2="15" />
          </svg>
        </div>
        <h2>Dashboard en construcción</h2>
        <p>Próximamente podrás ver aquí métricas y estadísticas de tu sistema de cobranzas.</p>
        
        <div className="quick-action">
          <p>Mientras tanto, puedes:</p>
          <Link href="/collections" className="action-button">
            <span>📊</span>
            Ir a Cobranzas
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
        }

        .coming-soon-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 64px 32px;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .icon-wrapper {
          display: inline-flex;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
          margin-bottom: 24px;
          color: var(--text-tertiary);
        }

        .coming-soon-card h2 {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .coming-soon-card p {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .quick-action {
          padding-top: 32px;
          border-top: 1px solid var(--border-color);
        }

        .quick-action p {
          margin-bottom: 16px;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: var(--secondary-color);
          transform: translateY(-1px);
        }

        .action-button span {
          font-size: 20px;
        }

        @media (max-width: 768px) {
          .coming-soon-card {
            padding: 48px 24px;
          }

          .dashboard-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}