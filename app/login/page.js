'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/shared/LoginForm';

export default function LoginPage() {
  const { usuarioActual, empresaActual, loading: authLoading } = useAuth();
  const router = useRouter();

  // Si ya está autenticado, redirigir a collections
  useEffect(() => {
    if (!authLoading && usuarioActual && empresaActual) {
      router.push('/collections');
    }
  }, [usuarioActual, empresaActual, authLoading, router]);

  const handleLoginSuccess = () => {
    router.push('/collections');
  };

  // Si está cargando la verificación de auth, mostrar loading
  if (authLoading) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ display: 'inline-block' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <LoginForm 
        onSuccess={handleLoginSuccess}
        showSessionNote={true}
      />
    </div>
  );
}