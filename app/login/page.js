'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { TEXTOS } from '../utils/constants';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, idioma, usuarioActual, empresaActual, loading: authLoading } = useAuth();
  const router = useRouter();

  // Si ya está autenticado, redirigir a collections
  useEffect(() => {
    if (!authLoading && usuarioActual && empresaActual) {
      router.push('/collections');
    }
  }, [usuarioActual, empresaActual, authLoading, router]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!usuario || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    // Console log para debug
    console.log('Login attempt:', { 
      usuario, 
      userType: 'client',
      timestamp: new Date().toISOString() 
    });

    try {
      const result = await login(usuario, password);
      
      if (result.success) {
        // Redirigir a collections después del login exitoso
        router.push('/collections');
      } else {
        setError(result.error || 'Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
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

  const textos = TEXTOS[idioma]?.login || TEXTOS.es.login;

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo-section">
          <div className="logo-image-wrapper">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 80 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="logo-svg"
            >
              <rect width="80" height="80" rx="16" fill="var(--primary-color)" fillOpacity="0.1"/>
              <path 
                d="M25 40C25 31.7157 31.7157 25 40 25C48.2843 25 55 31.7157 55 40C55 48.2843 48.2843 55 40 55C31.7157 55 25 48.2843 25 40Z" 
                stroke="var(--primary-color)" 
                strokeWidth="2.5"
              />
              <path 
                d="M35 40L38.5 43.5L45 37" 
                stroke="var(--primary-color)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="login-title-modern">Coggni</h1>
          <p className="login-subtitle">Cobranzas</p>
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
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
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
        <div className="session-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Tu sesión expirará después de 30 minutos de inactividad</span>
        </div>
      </div>

      <style jsx>{`
        .logo-image-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .logo-svg {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }

        .login-subtitle {
          color: var(--text-secondary);
          font-size: 16px;
          margin-top: -8px;
          margin-bottom: 32px;
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
      `}</style>
    </div>
  );
}