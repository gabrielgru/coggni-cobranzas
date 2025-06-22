'use client';

import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function Home() {
  const { usuarioActual, empresaActual, loading } = useAuth();

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ display: 'inline-block' }}></div>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, mostrar login
  if (!usuarioActual || !empresaActual) {
    return <Login />;
  }

  // Si hay usuario logueado, mostrar dashboard
  return <Dashboard />;
}