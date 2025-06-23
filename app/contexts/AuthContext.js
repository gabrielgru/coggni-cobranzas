'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TEXTOS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);

  // Cargar usuario de localStorage al iniciar
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const savedUser = localStorage.getItem('coggni-user');
      const savedCompanyId = localStorage.getItem('coggni-company-id');
      
      if (savedUser && savedCompanyId) {
        // Verificar que el usuario existe en Supabase
        if (supabase) {
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
              setUsuarioActual(savedUser);
              setEmpresaActual(await formatCompanyData(companyData));
              setIdioma(companyData.languages?.[0] || 'es');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCompanyData = async (companyData) => {
    // Obtener field mappings de la empresa
    let fieldMappings = {};
    
    if (supabase) {
      const { data: mappings } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('company_id', companyData.id);
      
      if (mappings) {
        mappings.forEach(mapping => {
          fieldMappings[mapping.field_type] = mapping.source_column;
        });
      }
    }
    
    // Formatear datos de Supabase al formato esperado por la app
    return {
      id: companyData.id,
      nombre: companyData.name,
      pais: 'UY', // Por ahora hardcoded
      idioma_default: companyData.languages?.[0] || 'es',
      idiomas_disponibles: companyData.languages || ['es'],
      monedas: companyData.currencies || ['

  const login = async (email, password) => {
    try {
      // Si tenemos Supabase, verificar credenciales
      if (supabase) {
        // 1. Verificar que el usuario existe en company_users
        const { data: userData, error: userError } = await supabase
          .from('company_users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError || !userData) {
          return { success: false, error: 'Usuario no encontrado' };
        }

        // 2. Por ahora, verificar contraseña directamente (temporal)
        if (userData.password !== password) {
          return { success: false, error: 'Contraseña incorrecta' };
        }

        // 3. Cargar datos de la empresa
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError || !companyData) {
          return { success: false, error: 'Empresa no encontrada' };
        }

        // 4. Establecer sesión
        setUsuarioActual(email);
        setEmpresaActual(await formatCompanyData(companyData));
        setIdioma(companyData.languages?.[0] || 'es');
        
        // Guardar en localStorage
        localStorage.setItem('coggni-user', email);
        localStorage.setItem('coggni-company-id', userData.company_id);
        
        return { success: true };
        
      } else {
        // Fallback a credenciales hardcoded si no hay Supabase
        const DEMO_CREDENTIALS = {
          'dental@dentallink.com': { empresa: 'dental-link', password: 'demo123' },
          'admin@laperla.es': { empresa: 'la-perla', password: 'demo123' },
          'test@testcompany.com': { empresa: 'test-company', password: 'demo123' }
        };
        
        const cred = DEMO_CREDENTIALS[email];
        if (cred && cred.password === password) {
          // Usar datos hardcoded de constants.js
          const { EMPRESAS_CONFIG } = await import('../utils/constants');
          const empresa = EMPRESAS_CONFIG[cred.empresa];
          
          setUsuarioActual(email);
          setEmpresaActual(empresa);
          setIdioma(empresa.idioma_default);
          
          localStorage.setItem('coggni-user', email);
          localStorage.setItem('coggni-company-id', cred.empresa);
          
          return { success: true };
        }
        
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    localStorage.removeItem('coggni-user');
    localStorage.removeItem('coggni-company-id');
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
}],
      paises_telefono: ['UY', 'AR', 'ES'], // Por ahora hardcoded
      webhook_url: `https://gabrielgru.app.n8n.cloud/webhook/cobranza-${companyData.id}`,
      
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

  const login = async (email, password) => {
    try {
      // Si tenemos Supabase, verificar credenciales
      if (supabase) {
        // 1. Verificar que el usuario existe en company_users
        const { data: userData, error: userError } = await supabase
          .from('company_users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError || !userData) {
          return { success: false, error: 'Usuario no encontrado' };
        }

        // 2. Por ahora, verificar contraseña directamente (temporal)
        if (userData.password !== password) {
          return { success: false, error: 'Contraseña incorrecta' };
        }

        // 3. Cargar datos de la empresa
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError || !companyData) {
          return { success: false, error: 'Empresa no encontrada' };
        }

        // 4. Establecer sesión
        setUsuarioActual(email);
        setEmpresaActual(formatCompanyData(companyData));
        setIdioma(companyData.languages?.[0] || 'es');
        
        // Guardar en localStorage
        localStorage.setItem('coggni-user', email);
        localStorage.setItem('coggni-company-id', userData.company_id);
        
        return { success: true };
        
      } else {
        // Fallback a credenciales hardcoded si no hay Supabase
        const DEMO_CREDENTIALS = {
          'dental@dentallink.com': { empresa: 'dental-link', password: 'demo123' },
          'admin@laperla.es': { empresa: 'la-perla', password: 'demo123' },
          'test@testcompany.com': { empresa: 'test-company', password: 'demo123' }
        };
        
        const cred = DEMO_CREDENTIALS[email];
        if (cred && cred.password === password) {
          // Usar datos hardcoded de constants.js
          const { EMPRESAS_CONFIG } = await import('../utils/constants');
          const empresa = EMPRESAS_CONFIG[cred.empresa];
          
          setUsuarioActual(email);
          setEmpresaActual(empresa);
          setIdioma(empresa.idioma_default);
          
          localStorage.setItem('coggni-user', email);
          localStorage.setItem('coggni-company-id', cred.empresa);
          
          return { success: true };
        }
        
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    localStorage.removeItem('coggni-user');
    localStorage.removeItem('coggni-company-id');
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