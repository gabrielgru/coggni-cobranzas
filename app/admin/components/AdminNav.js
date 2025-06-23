'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/companies', label: 'Empresas', icon: '🏢' },
    { href: '/admin/fields', label: 'Mapeo de Campos', icon: '🔤' },
    { href: '/admin/payments', label: 'Config. Pagos', icon: '💳' },
    { href: '/admin/templates', label: 'Plantillas', icon: '📝' },
    { href: '/admin/logs', label: 'Logs', icon: '📋' },
  ];

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="admin-nav" style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '250px',
      height: '100vh',
      background: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      <div className="nav-header" style={{
        padding: '24px',
        borderBottom: '1px solid var(--border-color)'
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
        <Link href="/" style={{
          display: 'block',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          fontSize: '14px'
        }}>
          ← Volver a la App
        </Link>
      </div>
    </nav>
  );
}