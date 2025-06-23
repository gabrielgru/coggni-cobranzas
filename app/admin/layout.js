'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import AdminNav from './components/AdminNav';
import '../globals.css';
import './admin-apple.css';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si estamos en la página de login, no verificar auth
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    checkAuth();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        router.push('/admin/login');
      } else if (event === 'SIGNED_IN' && session) {
        // Re-verificar si es admin cuando se loguea
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const checkAuth = async () => {
    try {
      // 1. Verificar si hay sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { session, sessionError });

      if (!session) {
        console.log('No session found, redirecting to login');
        setIsAuthenticated(false);
        setLoading(false);
        router.push('/admin/login');
        return;
      }

      // 2. Verificar si el usuario es admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      console.log('Admin check:', { adminUser, adminError });

      if (adminError || !adminUser) {
        console.log('User is not admin');
        setIsAuthenticated(false);
        setLoading(false);
        router.push('/admin/login?error=unauthorized');
        return;
      }

      // Todo OK - es admin
      setIsAuthenticated(true);
      setUser({
        ...session.user,
        isSuper: adminUser.is_super_admin
      });
      setLoading(false);

    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setLoading(false);
      router.push('/admin/login');
    }
  };

  // Si estamos en login, renderizar solo el children
  if (pathname === '/admin/login') {
    return children;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          Verificando permisos...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1 style={{ marginBottom: '1rem', color: 'var(--error-color, #dc3545)' }}>
            Acceso no autorizado
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            No tienes permisos para acceder a esta sección
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            style={{
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado y es admin
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <AdminNav user={user} />
      <main style={{
        flex: 1,
        padding: '2rem',
        marginLeft: '250px',
        position: 'relative'
      }}>
        {/* Header con info del usuario */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {user?.email}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/admin/login');
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = 'var(--error-color, #dc3545)';
              e.target.style.color = 'var(--error-color, #dc3545)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            Cerrar Sesión
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}