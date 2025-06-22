'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from './components/AdminNav';
import '../globals.css';
import './admin-apple.css';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Por ahora, simulamos autenticación
    // TODO: Implementar autenticación real con Supabase Auth
    const checkAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (isAdmin === 'true') {
        setIsAuthenticated(true);
      } else {
        // Temporal: auto-login para desarrollo
        localStorage.setItem('isAdmin', 'true');
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

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
        <p>Cargando panel de administración...</p>
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
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <h1>Acceso no autorizado</h1>
        <p>Debes iniciar sesión como administrador</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <AdminNav />
      <main style={{
        flex: 1,
        padding: '2rem',
        marginLeft: '250px'
      }}>
        {children}
      </main>
    </div>
  );
}