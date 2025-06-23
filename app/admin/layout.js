'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import AdminNav from './components/AdminNav';
import '../globals.css';
import '../admin-modern.css'; // Cambiado a admin-modern.css

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
            className="btn-primary"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado y es admin
  return (
    <div className="admin-layout">
      <AdminNav user={user} />
      
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title">
            {/* Título dinámico según la página */}
          </div>
          
          <div className="header-user">
            <span className="user-email">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/admin/login');
              }}
              className="btn-logout"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}