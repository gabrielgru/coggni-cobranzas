// ========================================
// ARCHIVO: app/login/page.js
// PÁGINA DE LOGIN CON MANEJO DE TIMEOUT
// 
// CAMBIOS IMPLEMENTADOS:
// 1. Mejor manejo de parámetros de URL para mensajes
// 2. Redirección más confiable después del login
// 3. Mensajes claros para timeout de sesión
// ========================================

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/shared/LoginForm';

// Componente interno que usa useSearchParams
function LoginPageContent() {
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
  }, [hasTimeout, hasError, needsCleanup]);

  // Auto-ocultar mensajes después de 10 segundos
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  // Si ya está autenticado, redirigir a collections
  useEffect(() => {
    if (!authLoading && usuarioActual && empresaActual && !hasRedirected) {
      console.log('[LoginPage] User already authenticated, redirecting...');
      setHasRedirected(true);
      
      // Usar router.push para una navegación más suave
      router.push('/collections');
    }
  }, [usuarioActual, empresaActual, authLoading, router, hasRedirected]);

  // Handler de login exitoso
  const handleLogin = (result) => {
    // El LoginForm ya maneja la redirección internamente
    // Este callback es opcional para lógica adicional
    console.log('[LoginPage] Login successful, redirecting to:', redirectTo);
  };

  // Si está cargando la verificación de auth, mostrar loading
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado y esperando redirect
  if (usuarioActual && empresaActual) {
    return (
      <div className="login-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando tu dashboard...</p>
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
      
      <style jsx>{`
        .loading-state {
          text-align: center;
          padding: 48px;
        }
        
        .spinner-large {
          width: 48px;
          height: 48px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        
        .loading-state p {
          color: var(--text-secondary);
          font-size: 16px;
          margin: 0;
        }
        
        .login-message {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 500px;
          width: calc(100% - 40px);
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideDown 0.3s ease-out;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        .login-message.timeout {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
        }
        
        .login-message.error {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
          color: #991b1b;
        }
        
        .login-message.warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
        }
        
        .message-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        
        .message-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        
        .message-close {
          background: none;
          border: none;
          font-size: 24px;
          line-height: 1;
          color: inherit;
          cursor: pointer;
          padding: 0 0 0 12px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .message-close:hover {
          opacity: 1;
        }
        
        /* Dark mode adjustments */
        [data-theme="dark"] .login-message.timeout {
          background-color: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }
        
        [data-theme="dark"] .login-message.error {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        
        [data-theme="dark"] .login-message.warning {
          background-color: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .login-message {
            font-size: 14px;
            padding: 12px;
          }
          
          .message-icon {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
}

// Componente principal con Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando...</p>
        </div>
        <style jsx>{`
          .loading-state {
            text-align: center;
            padding: 48px;
          }
          
          .spinner-large {
            width: 48px;
            height: 48px;
            border: 3px solid var(--border-color);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          
          .loading-state p {
            color: var(--text-secondary);
            font-size: 16px;
            margin: 0;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}