'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/shared/LoginForm';

export default function LoginPage() {
  const { usuarioActual, empresaActual, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Debug logs
  console.log('[LoginPage] Render', {
    usuarioActual: usuarioActual || null,
    empresaActual: empresaActual ? {...empresaActual, campos_facturas: '...', campos_contactos: '...'} : null,
    authLoading,
    hasRedirected
  });

  // Si ya está autenticado, redirigir a collections
  useEffect(() => {
    if (!authLoading && usuarioActual && empresaActual && !hasRedirected) {
      console.log('[LoginPage] Should redirect! Refreshing router...');
      setHasRedirected(true);
      
      // CRÍTICO: Invalidar el cache del router
      router.refresh();
      
      // Dar tiempo para que el refresh surta efecto
      setTimeout(() => {
        console.log('[LoginPage] Redirecting to /collections...');
        // Solución nuclear: bypass completo del router
        window.location.href = '/collections';
      }, 100);
    }
  }, [usuarioActual, empresaActual, authLoading, router, hasRedirected]);

  const handleLoginSuccess = () => {
    console.log('[LoginPage] Login successful, waiting for context update...');
    // NO hacer redirect aquí
  };

  // Si está cargando la verificación de auth, mostrar loading
  if (authLoading) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ display: 'inline-block' }}></div>
          <p style={{ marginTop: '16px' }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado y esperando redirect
  if (usuarioActual && empresaActual) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ display: 'inline-block' }}></div>
          <p style={{ marginTop: '16px' }}>Cargando tu dashboard...</p>
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