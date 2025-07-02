'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Constantes de configuración
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Verificar cada minuto

// Sistema de monitoreo simple
const logError = async (error, context) => {
  console.error(`[${context}] Error:`, error);
  
  // En producción, enviar a servicio de monitoreo
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar con Sentry, DataDog, o tu servicio preferido
    // await sendToMonitoring({ error, context, timestamp: new Date() });
  }
};

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null); // 'client' | 'admin' | null

  // Verificar salud de la base de datos
  const checkDatabaseHealth = async () => {
    console.log('[AuthContext] Database health check started');
    
    if (!supabase) {
      const error = new Error('Supabase client not initialized');
      console.error('[AuthContext] Database health check failed: No client');
      await logError(error, 'DATABASE_INIT');
      throw error;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();
      
      if (error) {
        console.error('[AuthContext] Database health query failed:', error);
        throw error;
      }
      
      console.log('[AuthContext] Database health check passed');
      return true;
    } catch (error) {
      console.error('[AuthContext] Database health check error:', error);
      await logError(error, 'DATABASE_HEALTH_CHECK');
      throw new Error('Database connection failed');
    }
  };

  // Función helper para formatear datos de empresa
  const formatCompanyData = async (companyData) => {
    try {
      // Verificar conexión antes de proceder
      await checkDatabaseHealth();

      let fieldMappings = {
        factura: {},
        cliente: {}
      };
      
      const { data: mappings, error } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('company_id', companyData.id);
      
      console.log('[AuthContext] Raw mappings for company:', companyData.id, mappings);
      console.log('[AuthContext] Client email mapping:', 
        mappings?.find(m => m.internal_field_name === 'client_email')
      );
      console.log('[AuthContext] Total mappings loaded:', mappings?.length);
      
      if (error) {
        await logError(error, 'FIELD_MAPPINGS_FETCH');
        throw new Error('Failed to load field mappings');
      }
      
      if (mappings) {
        // Organizar mappings por file_type
        mappings.forEach(mapping => {
          if (mapping.file_type === 'factura') {
            fieldMappings.factura[mapping.internal_field_name] = {
              column: mapping.company_field_name,
              required: mapping.is_required
            };
          } else if (mapping.file_type === 'cliente') {
            fieldMappings.cliente[mapping.internal_field_name] = {
              column: mapping.company_field_name,
              required: mapping.is_required
            };
          }
        });
      }
      
      // Después de organizar los mappings
      console.log('[AuthContext] Organized fieldMappings:', fieldMappings);
      console.log('[AuthContext] Cliente email mapping:', fieldMappings.cliente.client_email);
      
      // Formatear datos de Supabase al formato esperado por la app
      return {
        id: companyData.id,
        nombre: companyData.name,
        pais: 'UY', // Por ahora hardcoded
        idioma_default: companyData.languages?.[0] || 'es',
        idiomas_disponibles: companyData.languages || ['es'],
        monedas: companyData.currencies || ['$'],
        paises_telefono: ['UY', 'AR', 'ES'], // Por ahora hardcoded
        webhook_url: process.env.NEXT_PUBLIC_WEBHOOK_URL || 
          (process.env.NODE_ENV === 'production' 
            ? 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa'
            : 'https://gabrielgru.app.n8n.cloud/webhook-test/cobranza-multiempresa'
          ),
        admin_email: companyData.admin_email || '',
        
        // Mapear field mappings a la estructura esperada
        campos_facturas: {
          codigo: { 
            nombre: fieldMappings.factura.invoice_client_code?.column || '', 
            requerido: fieldMappings.factura.invoice_client_code?.required !== false 
          },
          // NOTA: El nombre del cliente viene de la ficha de clientes, no de facturas
          nombre: { 
            nombre: 'Nombre', // Placeholder, se obtiene del match con clientes
            requerido: false  // No es requerido en facturas porque viene de clientes
          },
          saldo: { 
            nombre: fieldMappings.factura.invoice_amount?.column || '', 
            requerido: fieldMappings.factura.invoice_amount?.required !== false 
          },
          docum: { 
            nombre: fieldMappings.factura.invoice_number?.column || '', 
            requerido: fieldMappings.factura.invoice_number?.required !== false 
          },
          mon: { 
            nombre: fieldMappings.factura.invoice_currency?.column || '', 
            requerido: fieldMappings.factura.invoice_currency?.required === true || companyData.currencies?.length > 1 
          },
          vencim: { 
            nombre: fieldMappings.factura.invoice_due_date?.column || '', 
            requerido: fieldMappings.factura.invoice_due_date?.required === true 
          },
          referencia: { 
            nombre: '', // Ya no existe en los nuevos mappings
            requerido: false 
          }
        },
        campos_contactos: {
          codigo: { 
            nombre: fieldMappings.cliente.client_code?.column || '', 
            requerido: fieldMappings.cliente.client_code?.required !== false 
          },
          nombre: { 
            nombre: fieldMappings.cliente.client_name?.column || '', 
            requerido: fieldMappings.cliente.client_name?.required !== false 
          },
          email: { 
            nombre: fieldMappings.cliente.client_email?.column || '', 
            requerido: fieldMappings.cliente.client_email?.required === true
          },
          telefono: { 
            nombre: fieldMappings.cliente.client_phone_1?.column || '', 
            requerido: fieldMappings.cliente.client_phone_1?.required !== false 
          },
          contacto1: { 
            nombre: fieldMappings.cliente.client_phone_2?.column || '', 
            requerido: fieldMappings.cliente.client_phone_2?.required === true 
          },
          contacto2: { 
            nombre: fieldMappings.cliente.client_phone_3?.column || '', 
            requerido: fieldMappings.cliente.client_phone_3?.required === true 
          },
          // Campo adicional para La Perla
          alias: {
            nombre: fieldMappings.cliente.client_alias?.column || '',
            requerido: fieldMappings.cliente.client_alias?.required === true
          }
        }
      };

      console.log('[AuthContext] Final campos_contactos.email:', {
        nombre: fieldMappings.cliente.client_email?.column || '',
        requerido: fieldMappings.cliente.client_email?.required === true,
        raw_mapping: fieldMappings.cliente.client_email
      });

    } catch (error) {
      await logError(error, 'FORMAT_COMPANY_DATA');
      throw error;
    }
  };

  // Función helper para manejar cookies
  const setCookie = (name, value, days = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  };

  // Actualizar última actividad
  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    // Actualizar tanto en localStorage como en cookies
    if (userType === 'client') {
      localStorage.setItem('coggni-last-activity', now.toString());
      setCookie('coggni-last-activity', now.toString());
    }
  };

  // Verificar timeout de sesión
  const checkSessionTimeout = () => {
    if (userType !== 'client' || !usuarioActual) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;

    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      console.log('Session timed out due to inactivity');
      logout();
      // Redirigir a login si no estamos ya ahí
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  };

  // Cargar usuario de localStorage al iniciar
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Configurar verificación periódica de timeout
  useEffect(() => {
    if (userType === 'client' && usuarioActual) {
      const interval = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [userType, usuarioActual, lastActivity]);

  // Agregar listeners para actividad del usuario
  useEffect(() => {
    if (userType === 'client' && usuarioActual) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      
      const handleActivity = () => {
        updateActivity();
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [userType, usuarioActual]);

  const checkExistingSession = async () => {
    try {
      const savedUser = localStorage.getItem('coggni-user');
      const savedCompanyId = localStorage.getItem('coggni-company-id');
      const savedUserType = localStorage.getItem('coggni-user-type');
      const savedLastActivity = localStorage.getItem('coggni-last-activity');
      
      if (savedUser && savedCompanyId) {
        // Verificar si es cliente y si la sesión expiró
        if (savedUserType === 'client' && savedLastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(savedLastActivity);
          if (timeSinceLastActivity > SESSION_TIMEOUT) {
            console.log('Previous session expired');
            logout();
            setLoading(false);
            return;
          }
        }

        try {
          // Verificar salud de la base de datos primero
          await checkDatabaseHealth();

          // Verificar que el usuario existe en Supabase
          const { data: userData, error: userError } = await supabase
            .from('company_users')
            .select('*')
            .eq('email', savedUser)
            .eq('company_id', savedCompanyId)
            .single();

          if (userError) {
            await logError(userError, 'USER_VERIFICATION');
            throw new Error('User verification failed');
          }

          if (userData) {
            // Cargar datos de la empresa
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', savedCompanyId)
              .single();

            if (companyError) {
              await logError(companyError, 'COMPANY_FETCH');
              throw new Error('Company data fetch failed');
            }

            if (companyData) {
              const formattedCompany = await formatCompanyData(companyData);
              setUsuarioActual(savedUser);
              setEmpresaActual(formattedCompany);
              setIdioma(companyData.languages?.[0] || 'es');
              setUserType(savedUserType || 'client');
              setLastActivity(savedLastActivity ? parseInt(savedLastActivity) : Date.now());
              setError(null);
            }
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          setError('No se pudo restaurar la sesión. Por favor, inicia sesión nuevamente.');
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setError('Error al verificar la sesión');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('[AuthContext] Login attempt started');
    console.log('[AuthContext] Email:', email);
    console.log('[AuthContext] Supabase client exists:', !!supabase);
    
    // Verificar el cliente de Supabase primero
    if (!supabase) {
      console.error('[AuthContext] CRITICAL: Supabase client is null!');
      console.error('[AuthContext] Check environment variables');
      return { 
        success: false, 
        error: 'Error de configuración. El servicio de base de datos no está disponible.' 
      };
    }
    
    try {
      // Verificar salud de la base de datos primero
      console.log('[AuthContext] Checking database health...');
      await checkDatabaseHealth();
      console.log('[AuthContext] Database health check passed');

      // 1. Verificar que el usuario existe en company_users
      console.log('[AuthContext] Fetching user from company_users...');
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        console.error('[AuthContext] User fetch error:', userError);
        await logError(userError, 'LOGIN_USER_FETCH');
        if (userError.code === 'PGRST116') {
          return { success: false, error: 'Usuario no encontrado' };
        }
        return { success: false, error: `Error al verificar usuario: ${userError.message}` };
      }

      if (!userData) {
        console.log('[AuthContext] No user data found');
        return { success: false, error: 'Usuario no encontrado' };
      }

      console.log('[AuthContext] User found, checking password...');
      
      // 2. Por ahora, verificar contraseña directamente (temporal)
      if (userData.password !== password) {
        console.log('[AuthContext] Password mismatch');
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // 3. Cargar datos de la empresa
      console.log('[AuthContext] Loading company data for ID:', userData.company_id);
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .maybeSingle();

      if (companyError) {
        console.error('[AuthContext] Company fetch error:', companyError);
        await logError(companyError, 'LOGIN_COMPANY_FETCH');
        return { success: false, error: `Error al cargar empresa: ${companyError.message}` };
      }

      if (!companyData) {
        console.error('[AuthContext] No company found with ID:', userData.company_id);
        return { success: false, error: `Empresa no encontrada: ${userData.company_id}` };
      }

      console.log('[AuthContext] Company data loaded successfully');

      // 4. Establecer sesión
      const formattedCompany = await formatCompanyData(companyData);
      console.log('[AuthContext] Session setup complete');
      
      setUsuarioActual(email);
      setEmpresaActual(formattedCompany);
      setIdioma(companyData.languages?.[0] || 'es');
      setUserType('client');
      setLastActivity(Date.now());
      setError(null);
      
      // Guardar en localStorage Y cookies
      localStorage.setItem('coggni-user', email);
      localStorage.setItem('coggni-company-id', userData.company_id);
      localStorage.setItem('coggni-user-type', 'client');
      localStorage.setItem('coggni-last-activity', Date.now().toString());
      
      // También guardar en cookies para el middleware
      setCookie('coggni-user', email);
      setCookie('coggni-company-id', userData.company_id);
      setCookie('coggni-user-type', 'client');
      setCookie('coggni-last-activity', Date.now().toString());
      
      console.log('[AuthContext] Login successful');
      return { success: true };
      
    } catch (error) {
      console.error('[AuthContext] Login error caught:', error);
      console.error('[AuthContext] Error stack:', error.stack);
      await logError(error, 'LOGIN');
      
      // Devolver el error real en desarrollo
      if (process.env.NODE_ENV === 'development') {
        return { 
          success: false, 
          error: `Error: ${error.message}` 
        };
      }
      
      return { 
        success: false, 
        error: 'Error de conexión. Por favor, intenta más tarde.' 
      };
    }
  };

  const logout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    setUserType(null);
    setLastActivity(Date.now());
    setError(null);
    
    // Limpiar localStorage
    localStorage.removeItem('coggni-user');
    localStorage.removeItem('coggni-company-id');
    localStorage.removeItem('coggni-user-type');
    localStorage.removeItem('coggni-last-activity');
    
    // Limpiar cookies
    deleteCookie('coggni-user');
    deleteCookie('coggni-company-id');
    deleteCookie('coggni-user-type');
    deleteCookie('coggni-last-activity');
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
    error,
    userType,
    lastActivity,
    login,
    logout,
    changeIdioma,
    updateActivity
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