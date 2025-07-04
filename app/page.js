'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { usuarioActual, empresaActual, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (usuarioActual && empresaActual) {
        // Usuario autenticado - redirigir a dashboard
        router.push('/collections'); // Redirigir a collections en vez de /auth
      } else {
        // No autenticado - redirigir a login
        router.push('/login');
      }
    }
  }, [usuarioActual, empresaActual, loading, router]);

  // Mientras verifica autenticación, mostrar loading
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