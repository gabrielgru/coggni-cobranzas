// ========================================
// ARCHIVO: app/components/shared/LoginForm.js
// FORMULARIO DE LOGIN MEJORADO
// 
// CAMBIOS IMPLEMENTADOS:
// 1. Mejor feedback visual durante el proceso de login
// 2. Redirección más suave después del login exitoso
// 3. Manejo mejorado de errores y estados de carga
// ========================================

'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TEXTOS } from '../../utils/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginForm({ 
  onSuccess, 
  showSessionNote = true,
  customTitle = null 
}) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, idioma } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    console.log('[LoginForm] Submit started');
    console.log('[LoginForm] Email:', usuario);
    console.log('[LoginForm] Browser:', navigator.userAgent);
    
    if (!usuario || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[LoginForm] Calling login...');
      const result = await login(usuario, password);
      console.log('[LoginForm] Login result:', result);
      
      if (result.success) {
        console.log('[LoginForm] Login successful');
        setLoginSuccess(true);
        
        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Esperar un momento para mostrar el estado de éxito
        // y luego redirigir de forma más suave
        setTimeout(() => {
          // Usar router.push en lugar de window.location para una transición más suave
          router.push('/collections');
        }, 500);
        
      } else {
        console.error('[LoginForm] Login failed:', result.error);
        // Mostrar el error real que viene del backend
        setError(result.error || 'Usuario o contraseña incorrectos');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[LoginForm] Login exception:', err);
      console.error('[LoginForm] Error stack:', err.stack);
      
      // En desarrollo, mostrar el error real
      if (process.env.NODE_ENV === 'development') {
        setError(`Error: ${err.message}`);
      } else {
        setError('Error al iniciar sesión. Por favor intente nuevamente.');
      }
      setIsLoading(false);
    }
  };

  const textos = TEXTOS[idioma]?.login || TEXTOS.es.login;

  // Si el login fue exitoso, mostrar mensaje de éxito
  if (loginSuccess) {
    return (
      <div className="login-form">
        <div className="success-state">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="success-title">¡Bienvenido!</h2>
          <p className="success-message">Iniciando sesión...</p>
          <div className="spinner-container">
            <span className="spinner"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form">
      <div className="logo-section">
        {/* Logo real de la empresa */}
        <div className="logo-wrapper">
          <Image 
            src="/Logo-Coggni.png" 
            alt="Coggni Logo" 
            width={80}
            height={80}
            priority
            className="logo-image"
          />
        </div>
        
        <h1 className="login-title-modern">
          {customTitle || 'Coggni Cobranzas'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">{textos.usuario}</label>
          <input
            id="email"
            type="email"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            onFocus={() => setError('')}
            autoComplete="username"
            disabled={isLoading}
            placeholder="correo@empresa.com"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">{textos.password}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setError('')}
            autoComplete="current-password"
            disabled={isLoading}
            placeholder="••••••••"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSubmit(e);
              }
            }}
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading || !usuario || !password}
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ marginRight: '8px' }}></span>
              Iniciando sesión...
            </>
          ) : (
            textos.ingresar
          )}
        </button>
      </form>

      {error && (
        <div className="status-message error" style={{ display: 'block', marginTop: '16px' }}>
          {error}
        </div>
      )}

      {/* Nota sobre el timeout de sesión */}
      {showSessionNote && (
        <div className="session-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Tu sesión expirará después de 30 minutos de inactividad</span>
        </div>
      )}

      <style jsx>{`
        .logo-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .logo-wrapper :global(.logo-image) {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .login-title-modern {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 32px 0;
          text-align: center;
        }

        .success-state {
          text-align: center;
          padding: 48px 24px;
        }

        .success-icon {
          margin-bottom: 24px;
          color: #10b981;
          display: inline-block;
          animation: checkmark 0.5s ease-in-out;
        }

        .success-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .success-message {
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }

        .spinner-container {
          margin-top: 24px;
        }

        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(-45deg);
          }
          100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }

        .session-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          padding: 12px;
          background-color: var(--bg-secondary);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .session-note svg {
          flex-shrink: 0;
          color: var(--text-tertiary);
        }

        [data-theme="dark"] .session-note {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-title-modern {
            font-size: 24px;
          }
          
          .success-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}