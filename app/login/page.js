'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/shared/LoginForm';

export default function LoginPage() {
  const { usuarioActual, empresaActual, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/collections';
  const hasTimeout = searchParams.get('timeout') === 'true';
  const hasError = searchParams.get('error') === 'middleware';
  const needsCleanup = searchParams.get('cleanup') === 'true';

  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [messageText, setMessageText] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);

  // Mostrar mensajes según parámetros de la URL
  useEffect(() => {
    if (hasTimeout) {
      setMessageType('timeout');
      setMessageText('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
      setShowMessage(true);
    } else if (hasError) {
      setMessageType('error');
      setMessageText('Ocurrió un error al verificar tu sesión. Por favor, intenta nuevamente.');
      setShowMessage(true);
    } else if (needsCleanup) {
      setMessageType('warning');
      setMessageText('Se detectó un estado inconsistente. Por favor, inicia sesión nuevamente.');
      setShowMessage(true);
    }
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [hasTimeout, hasError, needsCleanup, showMessage]);

  // Si ya está autenticado, redirigir a collections
  useEffect(() => {
    if (!authLoading && usuarioActual && empresaActual && !hasRedirected) {
      setHasRedirected(true);
      router.refresh();
      setTimeout(() => {
        window.location.href = '/collections';
      }, 100);
    }
  }, [usuarioActual, empresaActual, authLoading, router, hasRedirected]);

  // Handler de login exitoso
  const handleLogin = async (credentials) => {
    // credentials: { email, password }
    // El login real se hace en LoginForm, aquí solo redirect
    window.location.href = redirectTo;
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
      {showMessage && (
        <div className={`login-message ${messageType}`}>
          <div className="message-content">
            {messageType === 'timeout' && (
              <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            )}
            {messageType === 'error' && (
              <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12" y2="16"/>
              </svg>
            )}
            {messageType === 'warning' && (
              <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12" y2="17"/>
              </svg>
            )}
            <span>{messageText}</span>
          </div>
          <button 
            className="message-close" 
            onClick={() => setShowMessage(false)}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}
      <LoginForm onLogin={handleLogin} />
    </div>
  );
}