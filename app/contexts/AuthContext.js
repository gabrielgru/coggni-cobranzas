// app/contexts/AuthContext.js - Versión actualizada con Supabase Auth

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null);

  // Función helper para formatear datos de empresa (sin cambios)
  const formatCompanyData = async (companyData) => {
    // ... mantener la implementación actual ...
  };

  // Verificar sesión de Supabase Auth al cargar
  useEffect(() => {
    checkAuthSession();
    
    // Suscribirse a cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuthSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserData(session.user);
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (authUser) => {
    try {
      // Obtener datos del usuario desde company_users
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('auth_id', authUser.id)
        .single();

      if (userError) throw userError;

      // Formatear datos de la empresa
      const formattedCompany = await formatCompanyData(userData.companies);
      
      setUsuarioActual(authUser.email);
      setEmpresaActual(formattedCompany);
      setIdioma(userData.companies.languages?.[0] || 'es');
      setUserType('client');
      setError(null);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Error al cargar datos del usuario');
    }
  };

  const login = async (email, password) => {
    console.log('[AuthContext] Attempting login with Supabase Auth');
    
    try {
      // 1. Intentar login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Si falla, verificar si es un usuario no migrado
        if (authError.message.includes('Invalid login credentials')) {
          return await loginLegacy(email, password);
        }
        throw authError;
      }

      // 2. Login exitoso con Supabase Auth
      await loadUserData(authData.user);
      
      // 3. Log de auditoría
      await supabase.from('auth_audit_logs').insert({
        user_email: email,
        company_id: empresaActual?.id,
        action: 'login',
        success: true,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      return { success: true };
      
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      
      // Log intento fallido
      await supabase.from('auth_audit_logs').insert({
        user_email: email,
        action: 'login',
        success: false,
        error_message: error.message,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      return { 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      };
    }
  };

  // Login temporal para usuarios no migrados
  const loginLegacy = async (email, password) => {
    console.log('[AuthContext] Attempting legacy login for unmigrated user');
    
    try {
      // 1. Verificar en company_users
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // 2. Verificar password (temporal - solo para no migrados)
      if (userData.password !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // 3. Si el password es correcto y no está migrado, mostrar mensaje
      if (userData.migration_status === 'pending') {
        return { 
          success: false, 
          error: 'Tu cuenta necesita ser actualizada. Por favor contacta al administrador.',
          needsMigration: true 
        };
      }

      // 4. Si llegamos aquí, hay un problema
      return { 
        success: false, 
        error: 'Error de autenticación. Por favor intenta más tarde.' 
      };
      
    } catch (error) {
      console.error('[AuthContext] Legacy login error:', error);
      return { 
        success: false, 
        error: 'Error de conexión' 
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      handleSignOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSignOut = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    setUserType(null);
    setError(null);
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    usuarioActual,
    empresaActual,
    idioma,
    loading,
    error,
    userType,
    lastActivity,
    login,
    logout,
    changeIdioma,
    updateActivity,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}