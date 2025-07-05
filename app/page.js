// ========================================
// ARCHIVO: app/page.js
// PÁGINA PRINCIPAL CON LECTURA SSR DE SESIÓN  
// Qué hace: Lee la sesión del servidor y la pasa al cliente
// Por qué: Las cookies HttpOnly no son accesibles desde JS cliente
// ========================================

import React from 'react';
import { createClient } from './utils/supabase/server';
import DashboardClient from './components/DashboardClient';
import { redirect } from 'next/navigation';

// ========================================
// FUNCIÓN: Obtener sesión del servidor
// Qué hace: Lee la sesión usando el cliente del servidor
// Por qué: Solo el servidor puede leer cookies HttpOnly
// ========================================
async function getServerSession() {
  console.log('[Server] Getting session from server...');
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Server] Error getting user:', error);
      return null;
    }
    
    console.log('[Server] User session found:', user?.email);
    return user;
  } catch (error) {
    console.error('[Server] Exception getting user:', error);
    return null;
  }
}

// ========================================
// FUNCIÓN: Obtener datos de usuario completos
// Qué hace: Si hay sesión, obtiene datos de empresa y field mappings
// Por qué: Necesitamos toda la data para inicializar el contexto
// ========================================
async function getUserData(user) {
  if (!user) return null;
  
  console.log('[Server] Loading user data for:', user.email);
  const supabase = createClient();
  
  try {
    // Cargar datos del usuario con su empresa
    const { data: userData, error: userError } = await supabase
      .from('company_users')
      .select('*, companies(*)')
      .eq('auth_id', user.id)
      .single();
      
    if (userError) {
      console.error('[Server] Error loading user data:', userError);
      return null;
    }
    
    if (!userData || !userData.companies) {
      console.error('[Server] No user data or company found');
      return null;
    }
    
    console.log('[Server] User data loaded:', {
      user: userData.email,
      company: userData.companies.name
    });
    
    // Cargar field mappings
    const { data: mappings, error: mappingError } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('company_id', userData.companies.id)
      .order('field_order', { ascending: true });
    
    if (mappingError) {
      console.error('[Server] Error loading field mappings:', mappingError);
      // No return null aquí, los mappings son opcionales
    }
    
    console.log('[Server] Field mappings loaded:', mappings?.length || 0);
    
    return {
      user: user,
      userData: userData,
      mappings: mappings || []
    };
    
  } catch (error) {
    console.error('[Server] Exception loading user data:', error);
    return null;
  }
}

// ========================================
// COMPONENTE: Página principal del servidor
// Qué hace: Server Component que lee la sesión y redirige o renderiza
// Por qué: Server Components pueden leer cookies HttpOnly
// ========================================
export default async function HomePage() {
  console.log('[Server] HomePage - Starting server-side session check...');
  
  // Leer sesión del servidor
  const user = await getServerSession();
  
  // Si no hay usuario, redirigir a login
  if (!user) {
    console.log('[Server] No user found, redirecting to login');
    redirect('/login');
  }
  
  // Cargar datos completos del usuario
  const fullUserData = await getUserData(user);
  
  if (!fullUserData) {
    console.log('[Server] Could not load user data, redirecting to login');
    redirect('/login');
  }
  
  console.log('[Server] All data loaded successfully, rendering dashboard');
  console.log('[Server] User:', user.email);
  console.log('[Server] Company:', fullUserData.userData.companies.name);
  console.log('[Server] Field mappings:', fullUserData.mappings.length);
  
  // Renderizar el componente cliente con los datos del servidor
  return (
    <DashboardClient 
      initialUser={user}
      initialUserData={fullUserData.userData}
      initialMappings={fullUserData.mappings}
    />
  );
}