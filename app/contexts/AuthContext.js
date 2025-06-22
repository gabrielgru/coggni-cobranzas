'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EMPRESAS_CONFIG, DEMO_CREDENTIALS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);

  // Cargar usuario de localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('coggni-user');
    const savedEmpresa = localStorage.getItem('coggni-empresa');
    
    if (savedUser && savedEmpresa && EMPRESAS_CONFIG[savedEmpresa]) {
      setUsuarioActual(savedUser);
      setEmpresaActual(EMPRESAS_CONFIG[savedEmpresa]);
      setIdioma(EMPRESAS_CONFIG[savedEmpresa].idioma_default);
    }
    
    setLoading(false);
  }, []);

  const login = (usuario, password) => {
    const cred = DEMO_CREDENTIALS[usuario];
    
    if (cred && cred.password === password) {
      const empresa = EMPRESAS_CONFIG[cred.empresa];
      setUsuarioActual(usuario);
      setEmpresaActual(empresa);
      setIdioma(empresa.idioma_default);
      
      // Guardar en localStorage
      localStorage.setItem('coggni-user', usuario);
      localStorage.setItem('coggni-empresa', cred.empresa);
      
      return { success: true };
    }
    
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    localStorage.removeItem('coggni-user');
    localStorage.removeItem('coggni-empresa');
  };

  const changeIdioma = (nuevoIdioma) => {
    if (empresaActual?.idiomas_disponibles.includes(nuevoIdioma)) {
      setIdioma(nuevoIdioma);
    }
  };

  const value = {
    usuarioActual,
    empresaActual,
    idioma,
    loading,
    login,
    logout,
    changeIdioma
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}