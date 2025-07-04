// app/contexts/AuthContext.js - Versión simplificada sin multiempresa

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { cleanupCookies, invalidateSessionCache, setCookie as setCookieUtil } from '../utils/cookieManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const getSupabase = () => createClient();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
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

  // Cargar datos específicos de la empresa
  const cargarDatosEmpresa = async (empresa) => {
    console.log('[AuthContext] Loading data for empresa:', empresa.name);
    
    const supabaseClient = getSupabase();
    
    // Cargar field mappings
    const { data: mappings, error: mappingError } = await supabaseClient
      .from('field_mappings')
      .select('*')
      .eq('company_id', empresa.id)
      .order('field_order', { ascending: true });

    console.log('[AuthContext] Query params:', { company_id: empresa.id });
    console.log('[AuthContext] Mappings response:', { mappings, error: mappingError });
    
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

  const loadUserData = async (authUser) => {
    try {
      console.log('[AuthContext] loadUserData started for:', authUser.email);
      
      const supabaseClient = getSupabase();
      
      // Cargar datos del usuario con su empresa
      const { data: userData, error: userError } = await supabaseClient
        .from('company_users')
        .select('*, companies(*)')
        .eq('auth_id', authUser.id)
        .single();
        
      if (userError) {
        console.error('[AuthContext] Error loading user:', userError);
        setError(userError.message || 'Error cargando usuario');
        return;
      }
      
      if (!userData || !userData.companies) {
        console.error('[AuthContext] No userData or company found');
        setError('No se encontró el usuario o empresa');
        return;
      }
      
      console.log('[AuthContext] User data loaded:', userData);
      
      // Cargar datos de la empresa del usuario
      await cargarDatosEmpresa(userData.companies);
      
      setUsuarioActual(authUser.email);
      setUserType('client');
      setError(null);
      
    } catch (error) {
      console.error('[AuthContext] loadUserData error:', error);
      setError(error.message || 'Error cargando usuario');
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const supabase = getSupabase();
      
      try {
        // Suscribirse a cambios de auth
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event, session?.user?.email);
            
            if (!mounted) return;
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Usuario se loguea
              console.log('[AuthContext] User signed in, loading data...');
              await loadUserData(session.user);
              setLoading(false);
            } else if (event === 'SIGNED_OUT') {
              // Usuario hace logout
              handleSignOut();
            } else if (event === 'INITIAL_SESSION') {
              // Verificar sesión inicial
              if (session?.user) {
                console.log('[AuthContext] Initial session found, loading data...');
                await loadUserData(session.user);
              } else {
                console.log('[AuthContext] No initial session');
              }
              setLoading(false);
            }
          }
        );
        
        // Verificar sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          setLoading(false);
        } else if (!session) {
          console.log('[AuthContext] No active session');
          setLoading(false);
        }
        // Si hay sesión, esperar a que onAuthStateChange la maneje
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthContext] Error in initAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    console.log('[AuthContext] Attempting login with Supabase Auth');
    try {
      const supabase = getSupabase();
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }
      
      // ✅ ESPERAR a que se complete la carga de datos
      console.log('[AuthContext] Login successful, waiting for data load...');
      
      // Esperar hasta que los datos estén cargados o timeout
      let attempts = 0;
      const maxAttempts = 30; // 3 segundos máximo (30 * 100ms)
      
      while (attempts < maxAttempts) {
        if (usuarioActual && empresaActual) {
          console.log('[AuthContext] Data loaded successfully');
          return { success: true };
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      console.warn('[AuthContext] Timeout waiting for data load, but login was successful');
      return { success: true }; // Fallback - el login fue exitoso aunque no se cargaron los datos inmediatamente
      
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        error: error.message || 'Usuario o contraseña incorrectos'
      };
    }
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
    setLoading(false);
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