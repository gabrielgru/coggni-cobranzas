'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from '../../collections/components/LanguageSelector';

export default function Sidebar({ modules, activeModule, user, isOpen, onToggle }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <Link href="/" className="logo-link">
            <div className="logo-wrapper">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 80 80" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="logo-icon"
              >
                <rect width="80" height="80" rx="16" fill="var(--primary-color)" fillOpacity="0.1"/>
                <path 
                  d="M25 40C25 31.7157 31.7157 25 40 25C48.2843 25 55 31.7157 55 40C55 48.2843 48.2843 55 40 55C31.7157 55 25 48.2843 25 40Z" 
                  stroke="var(--primary-color)" 
                  strokeWidth="2.5"
                />
                <path 
                  d="M35 40L38.5 43.5L45 37" 
                  stroke="var(--primary-color)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              {isOpen && <span className="logo-text">Coggni</span>}
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className={`nav-item ${activeModule === 'dashboard' ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            {isOpen && <span className="nav-text">Dashboard</span>}
          </Link>

          <div className="nav-section">
            {isOpen && <div className="nav-section-title">MÓDULOS</div>}
            {modules.filter(m => m.enabled).map(module => (
              <Link 
                key={module.id}
                href={module.route} 
                className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{module.icon}</span>
                {isOpen && <span className="nav-text">{module.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {isOpen && (
            <div className="user-section">
              <div className="user-info">
                <div className="user-avatar">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-email">{user.email}</div>
                  <div className="user-company">{user.company}</div>
                </div>
              </div>
            </div>
          )}

          <div className="footer-controls">
            {isOpen && <LanguageSelector />}
            <ThemeToggle />
            <button 
              className="logout-button" 
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {isOpen && <span>Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 260px;
          background: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          z-index: 50;
        }

        .sidebar.collapsed {
          width: 64px;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar.collapsed .sidebar-header {
          padding: 24px 16px;
        }

        .logo-link {
          text-decoration: none;
          display: block;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .nav-section {
          margin-top: 24px;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--primary-color);
          color: white;
        }

        .nav-item.active:hover {
          background: var(--primary-color);
        }

        .nav-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 12px;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-color);
        }

        .user-section {
          margin-bottom: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-email {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-company {
          font-size: 12px;
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .footer-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar.collapsed .footer-controls {
          align-items: center;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: var(--bg-secondary);
          color: var(--error);
          border-color: var(--error);
        }

        .sidebar.collapsed .logout-button {
          width: auto;
          padding: 10px;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar:not(.collapsed) {
            transform: translateX(0);
          }

          .sidebar.collapsed {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}