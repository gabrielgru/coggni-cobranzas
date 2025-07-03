// app/contexts/AuthContext.js - Versión con Field Mappings funcionando

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { cleanupCookies, invalidateSessionCache, setCookie as setCookieUtil } from '../utils/cookieManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // CAMBIO: No uses useState para el cliente
  // const [supabase] = useState(() => createClient());
  // En su lugar, crea una función que siempre devuelva un cliente fresco
  const getSupabase = () => createClient();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [isLoadingEmpresa, setIsLoadingEmpresa] = useState(false);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null);
  // NUEVOS ESTADOS PARA MULTI-EMPRESA
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  const loadUserData = async (authUser) => {
    try {
      console.log('[AuthContext] loadUserData started for:', authUser.email);
      setIsLoadingEmpresa(true);
      const supabaseClient = getSupabase();
      // 1. Cargar datos del usuario
      const { data: userData, error: userError } = await supabaseClient
        .from('company_users')
        .select('*, companies(*)')
        .eq('auth_id', authUser.id)
        .single();
      if (userError) {
        console.error('[AuthContext] Error loading user:', userError);
        throw userError;
      }
      console.log('[AuthContext] User data loaded:', userData);
      // Verificar si es super admin
      if (userData.is_super_admin) {
        console.log('[AuthContext] User is super admin, loading all companies');
        setIsSuperAdmin(true);
        // Cargar TODAS las empresas activas
        const { data: allCompanies, error: companiesError } = await supabaseClient
          .from('companies')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (!companiesError && allCompanies) {
          setEmpresasDisponibles(allCompanies);
          // Si hay empresa guardada en localStorage, usarla
          const savedEmpresaId = localStorage.getItem('selectedEmpresaId');
          const empresaSeleccionada = savedEmpresaId 
            ? allCompanies.find(c => c.id === savedEmpresaId) || allCompanies[0]
            : allCompanies[0];
          await cargarDatosEmpresa(empresaSeleccionada, supabaseClient);
        }
      } else {
        // Usuario normal - una sola empresa
        setEmpresasDisponibles([userData.companies]);
        await cargarDatosEmpresa(userData.companies, supabaseClient);
      }
      setUsuarioActual(authUser.email);
      setUserType('client');
      setError(null);
    } catch (error) {
      console.error('[AuthContext] loadUserData error:', error);
      setError(error.message || 'Error cargando usuario');
    } finally {
      setIsLoadingEmpresa(false);
    }
  };

  // Nueva función para cargar datos específicos de una empresa
  const cargarDatosEmpresa = async (empresa, supabaseClient) => {
    console.log('[AuthContext] Loading data for empresa:', empresa.name);
    // Cargar field mappings
    const { data: mappings, error: mappingError } = await supabaseClient
      .from('field_mappings')
      .select('*')
      .eq('company_id', empresa.id)
      .order('field_order', { ascending: true });
    if (mappingError) {
      console.error('[AuthContext] Error loading field mappings:', mappingError);
    }
    console.log('[AuthContext] Field mappings loaded:', {
      count: mappings?.length || 0,
      mappings: mappings
    });
    // Formatear datos de la empresa
    let formattedCompany;
    if (mappings && mappings.length > 0) {
      formattedCompany = formatCompanyData(empresa, mappings);
    } else {
      console.warn('[AuthContext] No field mappings found, using fallback structure');
      formattedCompany = {
        id: empresa.id,
        nombre: empresa.name,
        monedas: empresa.currencies || ['$'],
        idiomas_disponibles: empresa.languages || ['es'],
        paises_telefono: empresa.phone_countries || ['UY', 'AR', 'ES'],
        admin_email: empresa.admin_email,
        webhook_url: empresa.webhook_url || 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
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
    setEmpresaActual(formattedCompany);
    setIdioma(empresa.languages?.[0] || 'es');
  };

  // Nueva función para cambiar de empresa (solo para super admins)
  const cambiarEmpresa = async (empresaId) => {
    if (!isSuperAdmin) return;
    const empresa = empresasDisponibles.find(e => e.id === empresaId);
    if (empresa) {
      setIsLoadingEmpresa(true);
      try {
        const supabaseClient = getSupabase();
        await cargarDatosEmpresa(empresa, supabaseClient);
        // Guardar selección en localStorage
        localStorage.setItem('selectedEmpresaId', empresaId);
        console.log('[AuthContext] Changed to empresa:', empresa.name);
      } catch (error) {
        console.error('[AuthContext] Error changing empresa:', error);
        setError(error.message || 'Error cambiando empresa');
      } finally {
        setIsLoadingEmpresa(false);
      }
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    checkAuthSession();
    // Suscribirse a cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          // Esperar un tick antes de cargar datos
          await new Promise(resolve => setTimeout(resolve, 100));
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
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('[AuthContext] No valid user session');
        handleSignOut();
        return;
      }
      console.log('[AuthContext] Valid user:', user.email);
      await loadUserData(user);
    } catch (error) {
      console.error('[AuthContext] Session check error:', error);
      handleSignOut();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('[AuthContext] Attempting login with Supabase Auth');
    try {
      const supabase = getSupabase();
      // 1. Intentar login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authError) {
        throw authError;
      }
      // 2. Login exitoso - los datos se cargarán via onAuthStateChange
      console.log('[AuthContext] Login successful, waiting for auth state change');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        error: error.message || 'Usuario o contraseña incorrectos'
      };
    }
  };

  // Reemplazar la función setCookie para usar la utilidad
  const setCookie = (name, value, options = {}) => {
    setCookieUtil(name, value, options);
  };

  const logout = async () => {
    try {
      invalidateSessionCache();
      cleanupCookies();
      const supabase = getSupabase();
      await supabase.auth.signOut();
      handleSignOut();
      console.log('[AuthContext] Logout completed successfully');
    } catch (error) {
      console.error('[AuthContext] Error during logout:', error);
      cleanupCookies();
      handleSignOut();
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
      const supabase = getSupabase();
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

  // Logout remoto cross-device
  useEffect(() => {
    if (!usuarioActual) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`user-sessions-${usuarioActual}`)
      .on('broadcast', { event: 'logout' }, (payload) => {
        console.log('[AuthContext] Remote logout detected:', payload);
        invalidateSessionCache();
        logout();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioActual]);

  const logoutAllDevices = async () => {
    if (!usuarioActual) return;
    const supabase = getSupabase();
    const channel = supabase.channel(`user-sessions-${usuarioActual}`);
    await channel.send({
      type: 'broadcast',
      event: 'logout',
      payload: { timestamp: Date.now() }
    });
    await logout();
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
    resetPassword,
    logoutAllDevices,
    invalidateSessionCache,
    empresasDisponibles,
    isSuperAdmin,
    cambiarEmpresa,
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