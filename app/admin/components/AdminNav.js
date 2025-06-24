'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminNav({ isOpen, onToggle }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/companies', label: 'Empresas', icon: '🏢' },
    { href: '/admin/fields', label: 'Mapeo de Campos', icon: '🔤' },
    { href: '/admin/payments', label: 'Config. Pagos', icon: '💳' },
    { href: '/admin/templates', label: 'Plantillas', icon: '📝' },
    { href: '/admin/logs', label: 'Logs de Envío', icon: '📨' },
  ];

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    // En mobile, cerrar el menú al hacer click en un link
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && isOpen && (
        <div 
          className="nav-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: 'block'
          }}
        />
      )}

      <nav className={`admin-nav ${isOpen ? 'open' : ''}`} style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '250px',
        height: '100vh',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
        boxShadow: isMobile ? '2px 0 10px rgba(0, 0, 0, 0.1)' : 'none'
      }}>
        <div className="nav-header" style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            Coggni Admin
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>v1.0</span>
          </h2>
          
          {/* Botón cerrar para mobile */}
          {isMobile && (
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                marginRight: '-8px'
              }}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          )}
        </div>

        <ul className="nav-menu" style={{
          flex: 1,
          listStyle: 'none',
          padding: '16px 0',
          margin: 0,
          overflowY: 'auto'
        }}>
          {navItems.map((item) => (
            <li key={item.href} style={{ margin: '4px 12px' }}>
              <Link 
                href={item.href}
                onClick={handleNavClick}
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--primary-color)' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  fontWeight: '500',
                  background: isActive(item.href) ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                }}
              >
                <span className="nav-icon" style={{
                  fontSize: '20px',
                  width: '28px',
                  textAlign: 'center'
                }}>{item.icon}</span>
                <span className="nav-label" style={{
                  fontSize: '14px'
                }}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-footer" style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Link 
            href="/" 
            onClick={handleNavClick}
            style={{
              display: 'block',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
          >
            ← Volver a la App
          </Link>
        </div>
      </nav>
    </>
  );
}