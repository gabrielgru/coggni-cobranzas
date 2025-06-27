'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Constantes de configuración
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Verificar cada minuto

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userType, setUserType] = useState(null); // 'client' | 'admin' | null

  // Función helper para formatear datos de empresa
  const formatCompanyData = async (companyData) => {
    // Obtener field mappings de la empresa
    let fieldMappings = {};
    
    if (supabase) {
      try {
        const { data: mappings } = await supabase
          .from('field_mappings')
          .select('*')
          .eq('company_id', companyData.id);
        
        if (mappings) {
          mappings.forEach(mapping => {
            fieldMappings[mapping.field_type] = mapping.source_column;
          });
        }
      } catch (error) {
        console.error('Error loading field mappings:', error);
      }
    }
    
    // Formatear datos de Supabase al formato esperado por la app
    return {
      id: companyData.id,
      nombre: companyData.name,
      pais: 'UY', // Por ahora hardcoded
      idioma_default: companyData.languages?.[0] || 'es',
      idiomas_disponibles: companyData.languages || ['es'],
      monedas: companyData.currencies || ['$'],
      paises_telefono: ['UY', 'AR', 'ES'], // Por ahora hardcoded
      webhook_url: 'https://gabrielgru.app.n8n.cloud/webhook-test/cobranza-multiempresa',
      admin_email: companyData.admin_email || '',
      
      // Mapear field mappings a la estructura esperada
      campos_facturas: {
        codigo: { nombre: fieldMappings['invoice_codigo'] || 'Código', requerido: true },
        nombre: { nombre: fieldMappings['invoice_nombre'] || 'Nombre', requerido: true },
        saldo: { nombre: fieldMappings['invoice_saldo'] || 'Saldo', requerido: true },
        docum: { nombre: fieldMappings['invoice_docum'] || 'Docum', requerido: true },
        mon: { nombre: fieldMappings['invoice_mon'] || 'Mon', requerido: companyData.currencies?.length > 1 },
        vencim: { nombre: fieldMappings['invoice_vencim'] || 'Vencim', requerido: false },
        referencia: { nombre: fieldMappings['invoice_referencia'] || 'Referencia', requerido: false }
      },
      campos_contactos: {
        codigo: { nombre: fieldMappings['contact_codigo'] || 'Código', requerido: true },
        nombre: { nombre: fieldMappings['contact_nombre'] || 'Nombre', requerido: true },
        email: { nombre: fieldMappings['contact_email'] || 'Email', requerido: true },
        telefono: { nombre: fieldMappings['contact_telefono'] || 'Teléfono', requerido: true },
        contacto1: { nombre: fieldMappings['contact_contacto1'] || 'Contacto 1', requerido: false },
        contacto2: { nombre: fieldMappings['contact_contacto2'] || 'Contacto 2', requerido: false }
      }
    };
  };

  // Función para usar datos hardcoded como fallback
  const loadFallbackCompanyData = async (companyId) => {
    try {
      const { EMPRESAS_CONFIG } = await import('../utils/constants');
      return EMPRESAS_CONFIG[companyId];
    } catch (error) {
      console.error('Error loading fallback data:', error);
      return null;
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

        // Verificar que el usuario existe en Supabase
        if (supabase) {
          try {
            const { data: userData } = await supabase
              .from('company_users')
              .select('*')
              .eq('email', savedUser)
              .eq('company_id', savedCompanyId)
              .single();

            if (userData) {
              // Cargar datos de la empresa
              const { data: companyData } = await supabase
                .from('companies')
                .select('*')
                .eq('id', savedCompanyId)
                .single();

              if (companyData) {
                const formattedCompany = await formatCompanyData(companyData);
                setUsuarioActual(savedUser);
                setEmpresaActual(formattedCompany);
                setIdioma(companyData.languages?.[0] || 'es');
                setUserType(savedUserType || 'client');
                setLastActivity(savedLastActivity ? parseInt(savedLastActivity) : Date.now());
              }
            }
          } catch (supabaseError) {
            console.error('Supabase error, falling back:', supabaseError);
            // Intentar cargar datos de fallback
            const fallbackData = await loadFallbackCompanyData(savedCompanyId);
            if (fallbackData) {
              setUsuarioActual(savedUser);
              setEmpresaActual(fallbackData);
              setIdioma(fallbackData.idioma_default);
              setUserType(savedUserType || 'client');
              setLastActivity(Date.now());
            }
          }
        } else {
          // No hay Supabase, usar fallback
          const fallbackData = await loadFallbackCompanyData(savedCompanyId);
          if (fallbackData) {
            setUsuarioActual(savedUser);
            setEmpresaActual(fallbackData);
            setIdioma(fallbackData.idioma_default);
            setUserType(savedUserType || 'client');
            setLastActivity(Date.now());
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Si tenemos Supabase, verificar credenciales
      if (supabase) {
        try {
          // 1. Verificar que el usuario existe en company_users
          const { data: userData, error: userError } = await supabase
            .from('company_users')
            .select('*')
            .eq('email', email)
            .single();

          if (userError || !userData) {
            throw new Error('Usuario no encontrado');
          }

          // 2. Por ahora, verificar contraseña directamente (temporal)
          if (userData.password !== password) {
            throw new Error('Contraseña incorrecta');
          }

          // 3. Cargar datos de la empresa
          console.log('Buscando empresa con ID:', userData.company_id);
          
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userData.company_id)
            .maybeSingle(); // Cambiado de .single() a .maybeSingle()

          console.log('Resultado empresa:', companyData, 'Error:', companyError);

          if (companyError || !companyData) {
            throw new Error(`Empresa no encontrada: ${userData.company_id}`);
          }

          // 4. Establecer sesión
          const formattedCompany = await formatCompanyData(companyData);
          setUsuarioActual(email);
          setEmpresaActual(formattedCompany);
          setIdioma(companyData.languages?.[0] || 'es');
          setUserType('client');
          setLastActivity(Date.now());
          
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
          
          return { success: true };
          
        } catch (supabaseError) {
          console.error('Supabase login error:', supabaseError);
          // Intentar con credenciales de fallback
          const fallbackResult = await tryFallbackLogin(email, password);
          if (fallbackResult.success) {
            return fallbackResult;
          }
          throw supabaseError;
        }
      } else {
        // No hay Supabase, usar fallback directamente
        return await tryFallbackLogin(email, password);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  };

  const tryFallbackLogin = async (email, password) => {
    const DEMO_CREDENTIALS = {
      'dental@dentallink.com': { empresa: 'dental-link', password: 'demo123' },
      'admin@laperla.es': { empresa: 'la-perla', password: 'demo123' },
      'test@testcompany.com': { empresa: 'test-company', password: 'demo123' }
    };
    
    const cred = DEMO_CREDENTIALS[email];
    if (cred && cred.password === password) {
      const empresa = await loadFallbackCompanyData(cred.empresa);
      
      if (empresa) {
        setUsuarioActual(email);
        setEmpresaActual(empresa);
        setIdioma(empresa.idioma_default);
        setUserType('client');
        setLastActivity(Date.now());
        
        localStorage.setItem('coggni-user', email);
        localStorage.setItem('coggni-company-id', cred.empresa);
        localStorage.setItem('coggni-user-type', 'client');
        localStorage.setItem('coggni-last-activity', Date.now().toString());
        
        // También guardar en cookies
        setCookie('coggni-user', email);
        setCookie('coggni-company-id', cred.empresa);
        setCookie('coggni-user-type', 'client');
        setCookie('coggni-last-activity', Date.now().toString());
        
        return { success: true };
      }
    }
    
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    setUserType(null);
    setLastActivity(Date.now());
    
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