'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TEXTOS } from '../../utils/constants';
import Image from 'next/image';
import logoCoggni from './Logo-Coggni.png';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, idioma } = useAuth();

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!usuario || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    const result = login(usuario, password);
    if (!result.success) {
      setError(result.error);
    } else {
      setError('');
    }
  };

  const textos = TEXTOS[idioma].login;

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo-section">
          <Image 
            src={logoCoggni} 
            alt="Coggni Logo" 
            className="logo-image"
            width={80}
            height={80}
          />
          <h1>Coggni Cobranzas - Iniciar Sesión</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>{textos.usuario}</label>
            <input
              type="email"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onFocus={() => setError('')}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label>{textos.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setError('')}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-button">
            {textos.ingresar}
          </button>
        </form>

        {error && (
          <div className="status-message error" style={{ display: 'block', marginTop: '16px' }}>
            {error}
          </div>
        )}

        
      </div>
    </div>
  );
}