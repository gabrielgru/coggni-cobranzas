// ========================================
// ARCHIVO: app/contexts/AuthContext.js
// CONTEXTO DE AUTENTICACIÓN CON SOPORTE SSR
// 
// ¿QUÉ HACE ESTE ARCHIVO?
// Este archivo contiene el contexto de autenticación que maneja todo el estado
// relacionado con el usuario autenticado y su empresa. Es el "cerebro" que
// mantiene la información del usuario disponible en toda la aplicación.
//
// ¿POR QUÉ EXISTE?
// - React Context permite compartir estado entre componentes sin props
// - Evita "prop drilling" (pasar props por muchos niveles)
// - Centraliza la lógica de autenticación
// - Mantiene la sesión del usuario consistente
// - Soporta Server-Side Rendering (SSR) para mejor performance
//
// ¿QUÉ DATOS MANEJA?
// - Usuario autenticado (email, tipo de usuario)
// - Datos de la empresa (configuración, campos, webhook)
// - Estado de carga y errores
// - Idioma seleccionado
//
// ¿CÓMO SE USA?
// - useAuth() hook en cualquier componente
// - initializeWithServerData() para datos del servidor
// - logout() para cerrar sesión
//
// ¿POR QUÉ SOPORTE SSR?
// - Evita problemas con cookies HttpOnly
// - Mejor SEO y performance inicial
// - Datos disponibles inmediatamente
// ========================================

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { cleanupCookies, invalidateSessionCache } from '../utils/cookieManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ========================================
  // FUNCIÓN: Inicializar con datos del servidor
  // 
  // ¿QUÉ HACE ESTA FUNCIÓN?
  // Recibe datos que ya fueron cargados en el servidor y los establece
  // en el contexto. Es la forma más eficiente de inicializar porque
  // evita hacer requests adicionales desde el cliente.
  //
  // ¿POR QUÉ ES IMPORTANTE?
  // - Evita el "loading" inicial molesto
  // - Los datos están disponibles inmediatamente
  // - Mejor experiencia de usuario
  // - Evita problemas de hidratación en SSR
  //
  // ¿CUÁNDO SE USA?
  // - Cuando el usuario viene de una página del servidor
  // - Cuando ya tenemos los datos de la sesión
  // - Para evitar requests duplicados
  // ========================================
  const initializeWithServerData = (userEmail, companyData, userTypeParam) => {
    console.log('[AuthContext] Initializing with server data:', {
      userEmail,
      companyName: companyData?.nombre,
      userType: userTypeParam
    });

    // ESTABLECER DATOS INICIALES
    // Estos datos vienen del servidor y están listos para usar
    setUsuarioActual(userEmail);
    setEmpresaActual(companyData);
    setUserType(userTypeParam);
    setIdioma(companyData?.idiomas_disponibles?.[0] || 'es');
    setError(null);
    setLoading(false);
    setIsInitialized(true);

    console.log('[AuthContext] Server data initialization complete');
  };

  // ========================================
  // FUNCIÓN: Formatear datos de empresa
  // 
  // ¿QUÉ HACE ESTA FUNCIÓN?
  // Convierte los datos raw de la empresa y los field mappings en la estructura
  // que espera el resto de la aplicación. Es como un "traductor" entre la
  // base de datos y el formato que usa el frontend.
  //
  // ¿POR QUÉ ES NECESARIA?
  // - Los datos vienen de Supabase en formato "crudo"
  // - La aplicación espera una estructura específica
  // - Los field mappings definen qué campos tiene cada empresa
  // - Sin esta función, la app no sabría qué campos mostrar
  //
  // ¿QUÉ VALIDA?
  // - Que existan los datos de la empresa
  // - Que existan los field mappings
  // - Que haya al menos un mapping configurado
  // - Si algo falta, lanza un error explícito (no fallbacks engañosos)
  // ========================================
  const formatCompanyData = (companyData, mappings) => {
    console.log('[AuthContext] formatCompanyData - Input:', { 
      companyData, 
      mappingsCount: mappings?.length
    });
    
    // VALIDACIÓN CRÍTICA: Si faltan datos, fallar explícitamente
    // Esto evita que la app "funcione" con datos incompletos
    if (!companyData || !mappings || mappings.length === 0) {
      console.warn('[AuthContext] formatCompanyData - Missing data, using fallback');
      throw new Error(`[AuthContext] Missing required data: companyData=${!!companyData}, mappings=${!!mappings}, mappingsLength=${mappings?.length || 0}`);
    }

    // CREAR ESTRUCTURA DE CAMPOS DINÁMICA
    // Los field mappings definen qué campos tiene cada empresa
    // Esto permite que cada empresa tenga su propia configuración
    const campos_facturas = {};
    const campos_contactos = {};

    // PROCESAR CADA FIELD MAPPING
    // Cada mapping define un campo que la empresa puede usar
    mappings.forEach((mapping) => {
      const campo = {
        nombre: mapping.company_field_name,    // Nombre que ve el usuario
        requerido: mapping.is_required,        // Si es obligatorio
        tipo: mapping.data_type                // Tipo de dato (text, number, email, etc.)
      };

      // CLASIFICAR POR TIPO DE ARCHIVO
      // Los campos se separan entre facturas y contactos
      if (mapping.file_type === 'factura') {
        campos_facturas[mapping.internal_field_name] = campo;
      } else if (mapping.file_type === 'cliente') {
        campos_contactos[mapping.internal_field_name] = campo;
      }
    });

    // RETORNAR ESTRUCTURA FINAL
    // Esta es la estructura que espera el resto de la aplicación
    // NOTA: Sin fallbacks - si algo falta, fallará explícitamente
    return {
      id: companyData.id,                    // ID único de la empresa
      nombre: companyData.name,              // Nombre de la empresa
      monedas: companyData.currencies,       // Monedas que usa la empresa
      idiomas_disponibles: companyData.languages,  // Idiomas disponibles
      paises_telefono: companyData.phone_countries, // Países para teléfonos
      admin_email: companyData.admin_email,  // Email del administrador
      webhook_url: companyData.webhook_url,  // URL del webhook para procesamiento
      country: companyData.country,          // País principal de la empresa
      campos_facturas,                       // Campos dinámicos para facturas
      campos_contactos                       // Campos dinámicos para contactos
    };
  };

  // ========================================
  // FUNCIÓN: Cargar datos de empresa
  // Qué hace: Carga field mappings y estructura la empresa
  // Por qué: Para casos donde no tenemos datos del servidor
  // ========================================
  const cargarDatosEmpresa = async (empresa) => {
    console.log('[AuthContext] Loading data for empresa:', empresa.name);
    
    const supabaseClient = createClient();
    
    const { data: mappings, error: mappingError } = await supabaseClient
      .from('field_mappings')
      .select('*')
      .eq('company_id', empresa.id)
      .order('field_order', { ascending: true });

    if (mappingError) {
      console.error('[AuthContext] Error loading field mappings:', mappingError);
    }
    
    const formattedCompany = formatCompanyData(empresa, mappings);
    setEmpresaActual(formattedCompany);
    setIdioma(empresa.languages?.[0] || 'es');
  };

  // ========================================
  // FUNCIÓN: Cargar datos de usuario
  // Qué hace: Carga usuario y empresa desde la base de datos
  // Por qué: Para casos de autenticación normal (no SSR)
  // ========================================
  const loadUserData = async (authUser) => {
    try {
      console.log('[AuthContext] loadUserData started for:', authUser.email);
      
      const supabaseClient = createClient();
      
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
      await cargarDatosEmpresa(userData.companies);
      
      setUsuarioActual(authUser.email);
      setUserType('client');
      setError(null);
      
    } catch (error) {
      console.error('[AuthContext] loadUserData error:', error);
      setError(error.message || 'Error cargando usuario');
    }
  };

  // ========================================
  // EFECTO: Inicialización del contexto
  // Qué hace: Solo se ejecuta si no hay datos del servidor
  // Por qué: Evitar conflictos con inicialización SSR
  // ========================================
  useEffect(() => {
    // Si ya se inicializó con datos del servidor, no hacer nada
    if (isInitialized) {
      console.log('[AuthContext] Already initialized with server data, skipping client init');
      return;
    }

    let mounted = true;
    
    const initAuth = async () => {
      console.log('[AuthContext] Client-side initialization started');
      const supabase = createClient();
      
      try {
        // Intentar obtener sesión del cliente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('[AuthContext] Session found, loading user data');
          await loadUserData(session.user);
        }
        
        // Configurar listener para cambios
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event);
            
            if (!mounted) return;
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('[AuthContext] User signed in via client');
              await loadUserData(session.user);
            } else if (event === 'SIGNED_OUT') {
              console.log('[AuthContext] User signed out');
              handleSignOut();
            }
          }
        );
        
        if (mounted) {
          setLoading(false);
        }
        
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
  }, [isInitialized]);

  // ========================================
  // FUNCIÓN: Login
  // Qué hace: Autentica usuario y carga datos
  // Por qué: Para formularios de login
  // ========================================
  const login = async (email, password) => {
    console.log('[AuthContext] Attempting login');
    try {
      const supabase = createClient();
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }
      
      console.log('[AuthContext] Login successful');
      return { success: true };
      
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        error: error.message || 'Usuario o contraseña incorrectos'
      };
    }
  };

  // ========================================
  // FUNCIÓN: Logout
  // Qué hace: Cierra sesión y limpia estado
  // Por qué: Para botones de logout
  // ========================================
  const logout = async () => {
    try {
      console.log('[AuthContext] Starting logout process');
      
      invalidateSessionCache();
      cleanupCookies();
      
      const supabase = createClient();
      await supabase.auth.signOut();
      
      handleSignOut();
      
      console.log('[AuthContext] Logout completed successfully');
    } catch (error) {
      console.error('[AuthContext] Error during logout:', error);
      // Limpieza forzada aunque haya error
      cleanupCookies();
      handleSignOut();
    }
  };

  // ========================================
  // FUNCIÓN: Manejar cierre de sesión
  // Qué hace: Limpia el estado local
  // Por qué: Reutilizable para logout y errores
  // ========================================
  const handleSignOut = () => {
    console.log('[AuthContext] Cleaning up auth state');
    setUsuarioActual(null);
    setEmpresaActual(null);
    setUserType(null);
    setError(null);
    setLoading(false);
    setIsInitialized(false);
  };

  // ========================================
  // FUNCIÓN: Resetear contraseña
  // Qué hace: Envía email de reseteo
  // Por qué: Para formularios de recuperación
  // ========================================
  const resetPassword = async (email) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ========================================
  // FUNCIÓN: Cambiar idioma
  // Qué hace: Cambia el idioma si está disponible
  // Por qué: Para selector de idioma
  // ========================================
  const changeIdioma = (nuevoIdioma) => {
    if (empresaActual?.idiomas_disponibles?.includes(nuevoIdioma)) {
      setIdioma(nuevoIdioma);
    }
  };
  
  // ========================================
  // FUNCIÓN: Actualizar actividad
  // Qué hace: Marca timestamp de última actividad
  // Por qué: Para auto-logout por inactividad
  // ========================================
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // ========================================
  // EFECTO: Logout remoto cross-device
  // Qué hace: Escucha eventos de logout de otros dispositivos
  // Por qué: Para sincronización de sesiones
  // ========================================
  useEffect(() => {
    if (!usuarioActual) return;
    
    const supabase = createClient();
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

  // ========================================
  // FUNCIÓN: Logout en todos los dispositivos
  // Qué hace: Envía broadcast y hace logout local
  // Por qué: Para cerrar sesión en todos lados
  // ========================================
  const logoutAllDevices = async () => {
    if (!usuarioActual) return;
    
    const supabase = createClient();
    const channel = supabase.channel(`user-sessions-${usuarioActual}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'logout',
      payload: { timestamp: Date.now() }
    });
    
    await logout();
  };

  // ========================================
  // VALOR DEL CONTEXTO
  // Qué hace: Proporciona todas las funciones y estados
  // Por qué: Para que los componentes puedan usar el contexto
  // ========================================
  const value = {
    usuarioActual,
    empresaActual,
    idioma,
    loading,
    error,
    userType,
    lastActivity,
    isInitialized,
    login,
    logout,
    changeIdioma,
    updateActivity,
    resetPassword,
    logoutAllDevices,
    invalidateSessionCache,
    initializeWithServerData, // ← Nueva función para SSR
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// HOOK: useAuth
// Qué hace: Proporciona acceso al contexto de autenticación
// Por qué: Para que los componentes puedan usar el contexto
// ========================================
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}