// app/contexts/AuthContext.js - Versión con Field Mappings funcionando

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [isLoadingEmpresa, setIsLoadingEmpresa] = useState(false);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null);

  // Función helper para formatear datos de empresa
  const formatCompanyData = (companyData, mappings) => {
    console.log('[AuthContext] formatCompanyData - Input:', { 
      companyData, 
      mappingsCount: mappings?.length,
      firstMapping: mappings?.[0]
    });
    
    if (!companyData || !mappings || mappings.length === 0) {
      console.warn('[AuthContext] formatCompanyData - Missing data');
      return null;
    }

    // Estructurar campos por tipo
    const campos_facturas = {};
    const campos_contactos = {};

    console.log('[AuthContext] Processing mappings...');
    
    mappings.forEach((mapping, index) => {
      console.log(`[AuthContext] Processing mapping ${index}:`, {
        file_type: mapping.file_type,
        internal_field_name: mapping.internal_field_name,
        company_field_name: mapping.company_field_name,
        is_required: mapping.is_required,
        data_type: mapping.data_type
      });

      const campo = {
        nombre: mapping.company_field_name,
        requerido: mapping.is_required,
        tipo: mapping.data_type || 'text'
      };

      if (mapping.file_type === 'factura') {
        campos_facturas[mapping.internal_field_name] = campo;
        console.log(`[AuthContext] Added to campos_facturas:`, mapping.internal_field_name);
      } else if (mapping.file_type === 'cliente') {
        campos_contactos[mapping.internal_field_name] = campo;
        console.log(`[AuthContext] Added to campos_contactos:`, mapping.internal_field_name);
      } else {
        console.warn(`[AuthContext] Unknown file_type:`, mapping.file_type);
      }
    });

    // Copias nuevas para evitar problemas de referencia
    const campos_facturas_copy = { ...campos_facturas };
    const campos_contactos_copy = { ...campos_contactos };

    console.log('[AuthContext] After processing - campos_facturas:', campos_facturas_copy);
    console.log('[AuthContext] After processing - campos_contactos:', campos_contactos_copy);

    const formattedData = {
      id: companyData.id,
      nombre: companyData.name,
      monedas: companyData.currencies || ['$'],
      idiomas_disponibles: companyData.languages || ['es'],
      paises_telefono: companyData.phone_countries || ['UY', 'AR', 'ES'],
      admin_email: companyData.admin_email,
      webhook_url: companyData.webhook_url || 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
      campos_facturas: campos_facturas_copy,
      campos_contactos: campos_contactos_copy
    };

    console.log('[AuthContext] formatCompanyData - Final Output:', {
      id: formattedData.id,
      nombre: formattedData.nombre,
      campos_facturas_keys: Object.keys(formattedData.campos_facturas),
      campos_contactos_keys: Object.keys(formattedData.campos_contactos),
      full_data: formattedData
    });
    
    return formattedData;
  };

  // Verificar sesión de Supabase Auth al cargar
  useEffect(() => {
    checkAuthSession();
    
    // Suscribirse a cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
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
      console.log('[AuthContext] Current session:', session?.user?.email);
      
      if (session?.user) {
        await loadUserData(session.user);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (authUser) => {
    try {
      console.log('[AuthContext] loadUserData started for:', authUser.email);
      setIsLoadingEmpresa(true);
      
      // 1. Cargar datos del usuario y empresa
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('auth_id', authUser.id)
        .single();

      if (userError) {
        console.error('[AuthContext] Error loading user:', userError);
        throw userError;
      }
      
      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      console.log('[AuthContext] User data loaded:', userData.email, userData.company_id);

      // 2. Cargar field mappings con query mejorada
      const company_id = userData.companies.id;
      console.log('[AuthContext] Loading field mappings for company:', company_id);

      // Primero verificar si tenemos una sesión válida
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[AuthContext] No active session when loading field mappings');
        throw new Error('No active session');
      }

      // Query mejorada con más logging
      const { data: mappings, error: mappingError } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('company_id', company_id)
        .order('field_order', { ascending: true });

      if (mappingError) {
        console.error('[AuthContext] Error loading field mappings:', mappingError);
        // No lanzar error aquí, intentar continuar con datos básicos
      }

      console.log('[AuthContext] Field mappings loaded:', {
        count: mappings?.length || 0,
        mappings: mappings
      });

      // 3. Formatear datos de la empresa
      let formattedCompany;
      
      if (mappings && mappings.length > 0) {
        formattedCompany = formatCompanyData(userData.companies, mappings);
      } else {
        // Fallback con estructura mínima para que funcione
        console.warn('[AuthContext] No field mappings found, using fallback structure');
        formattedCompany = {
          id: userData.companies.id,
          nombre: userData.companies.name,
          monedas: userData.companies.currencies || ['$'],
          idiomas_disponibles: userData.companies.languages || ['es'],
          paises_telefono: userData.companies.phone_countries || ['UY', 'AR', 'ES'],
          admin_email: userData.companies.admin_email,
          webhook_url: userData.companies.webhook_url || 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
          campos_facturas: {
            invoice_number: { nombre: 'Número', requerido: true, tipo: 'text' },
            invoice_amount: { nombre: 'Monto', requerido: true, tipo: 'number' },
            due_date: { nombre: 'Vencimiento', requerido: false, tipo: 'date' }
          },
          campos_contactos: {
            client_email: { nombre: 'Email', requerido: true, tipo: 'email' },
            client_name: { nombre: 'Nombre', requerido: true, tipo: 'text' },
            client_phone: { nombre: 'Teléfono', requerido: false, tipo: 'phone' }
          }
        };
      }

      // 4. Establecer estado
      setUsuarioActual(authUser.email);
      setEmpresaActual(formattedCompany);
      setIdioma(userData.companies.languages?.[0] || 'es');
      setUserType('client');
      setError(null);
      
      console.log('[AuthContext] User data loaded successfully');
      
    } catch (error) {
      console.error('[AuthContext] Error loading user data:', error);
      setError('Error al cargar datos del usuario');
      handleSignOut();
    } finally {
      setIsLoadingEmpresa(false);
    }
  };

  // Helper para setear cookies
  const setCookie = (name, value, days = 7) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
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

      // 2. Login exitoso - los datos se cargarán via onAuthStateChange
      console.log('[AuthContext] Login successful, waiting for auth state change');

      // 3. Log de auditoría (sin await para no bloquear)
      supabase.from('auth_audit_logs').insert({
        user_email: email,
        company_id: authData.user.user_metadata?.company_id,
        action: 'login',
        success: true,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      }).then(() => {
        console.log('[AuthContext] Audit log created');
      }).catch(error => {
        console.error('[AuthContext] Error creating audit log:', error);
      });

      // CRÍTICO: Setear cookies inmediatamente después del login exitoso
      setCookie('coggni-user', authData.user.email);
      setCookie('coggni-user-type', 'client');
      setCookie('coggni-last-activity', Date.now().toString());
      // Esperar a que las cookies se propaguen
      await new Promise(resolve => setTimeout(resolve, 50));

      return { success: true };
      
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      
      // Log intento fallido
      supabase.from('auth_audit_logs').insert({
        user_email: email,
        action: 'login',
        success: false,
        error_message: error.message,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      }).catch(console.error);

      return { 
        success: false, 
        error: error.message || 'Usuario o contraseña incorrectos' 
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
      if (!userData.auth_id || userData.migration_status === 'pending') {
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

  const changeIdioma = (nuevoIdioma) => {
    if (empresaActual?.idiomas_disponibles?.includes(nuevoIdioma)) {
      setIdioma(nuevoIdioma);
    }
  };
  
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  const value = {
    usuarioActual,
    empresaActual,
    idioma,
    loading,
    isLoadingEmpresa,
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

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}