// ========================================
// ARCHIVO: app/utils/cookieManager.js
// UTILIDADES MEJORADAS PARA COOKIES
// 
// CAMBIOS IMPLEMENTADOS:
// 1. Nueva función cleanupSupabaseCookies()
// 2. cleanupCookies() ahora limpia TODO por defecto
// 3. Mejor debugging de cookies
// ========================================

export const COGGNI_COOKIES = [
  'coggni-user',
  'coggni-company-id',
  'coggni-user-type',
  'coggni-last-activity',
  'coggni-session-cache',
  'coggni-force-revalidate'
];

/**
 * Limpia TODAS las cookies (Coggni + Supabase)
 * @param {Object} options - Opciones de limpieza
 * @param {Array} options.except - Cookies a mantener
 * @param {string} options.domain - Dominio de las cookies
 * @param {boolean} options.includeSupabase - Si limpiar cookies de Supabase (default: true)
 */
export const cleanupCookies = (options = {}) => {
  const { 
    except = [], 
    domain = null,
    includeSupabase = true // NUEVO: Por defecto limpia TODO
  } = options;
  
  if (typeof document === 'undefined') {
    console.warn('[CookieManager] cleanupCookies called in non-browser environment');
    return;
  }
  
  // Limpiar cookies de Coggni
  COGGNI_COOKIES.forEach(cookieName => {
    if (!except.includes(cookieName)) {
      // Limpiar con y sin domain para asegurar eliminación completa
      document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}; path=/`;
      if (domain) {
        document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}; path=/; domain=${domain}`;
      }
      // También intentar con subpath
      document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}; path=/collections`;
      document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}; path=/login`;
    }
  });
  
  // NUEVO: Limpiar cookies de Supabase si se solicita
  if (includeSupabase) {
    cleanupSupabaseCookies();
  }
  
  console.log('[CookieManager] Cookies cleaned except:', except);
};

/**
 * NUEVA FUNCIÓN: Limpia específicamente las cookies de Supabase
 * Busca cookies que empiecen con 'sb-' o contengan 'supabase'
 */
export const cleanupSupabaseCookies = () => {
  if (typeof document === 'undefined') {
    console.warn('[CookieManager] cleanupSupabaseCookies called in non-browser environment');
    return;
  }
  
  console.log('[CookieManager] Cleaning Supabase cookies...');
  
  // Obtener todas las cookies
  const allCookies = document.cookie.split(';');
  let cleanedCount = 0;
  
  allCookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Identificar cookies de Supabase
    if (name && (name.startsWith('sb-') || name.includes('supabase'))) {
      // Intentar eliminar con diferentes combinaciones
      const paths = ['/', '/login', '/collections', '/api'];
      const domains = [
        '',
        window.location.hostname,
        `.${window.location.hostname}`,
        'localhost',
        '.localhost'
      ];
      
      // Probar todas las combinaciones de path y domain
      paths.forEach(path => {
        domains.forEach(domain => {
          const cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}`;
          document.cookie = cookieString;
        });
      });
      
      console.log('[CookieManager] Attempted to remove Supabase cookie:', name);
      cleanedCount++;
    }
  });
  
  console.log(`[CookieManager] Cleaned ${cleanedCount} Supabase cookies`);
};

/**
 * Verifica la integridad de las cookies de sesión
 * @param {Request} request - Request object de Next.js
 * @returns {boolean} true si las cookies están en estado consistente
 */
export const verifyCookieIntegrity = (request) => {
  const userCookie = request.cookies.get('coggni-user');
  const typeCookie = request.cookies.get('coggni-user-type');
  const activityCookie = request.cookies.get('coggni-last-activity');
  
  // Si no hay ninguna cookie, está OK (usuario no autenticado)
  const allCookies = [userCookie, typeCookie, activityCookie];
  const cookieCount = allCookies.filter(Boolean).length;
  
  if (cookieCount === 0) {
    return true; // Estado limpio
  }
  
  // Si hay algunas pero no todas, es un estado inconsistente
  if (cookieCount < 3) {
    console.warn('[CookieManager] Inconsistent cookie state:', {
      hasUser: !!userCookie,
      hasType: !!typeCookie,
      hasActivity: !!activityCookie
    });
    return false;
  }
  
  // Verificar que los valores no estén vacíos
  if (!userCookie.value || !typeCookie.value || !activityCookie.value) {
    console.warn('[CookieManager] Empty cookie values detected');
    return false;
  }
  
  return true;
};

/**
 * Obtiene el valor de una cookie
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} Valor de la cookie o null
 */
export const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Establece una cookie con opciones predeterminadas seguras
 * @param {string} name - Nombre de la cookie
 * @param {string} value - Valor de la cookie
 * @param {Object} options - Opciones adicionales
 */
export const setCookie = (name, value, options = {}) => {
  if (typeof document === 'undefined') return;
  
  const defaults = {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 días por defecto
  };
  
  const finalOptions = { ...defaults, ...options };
  
  let cookieString = `${name}=${value}`;
  
  Object.entries(finalOptions).forEach(([key, val]) => {
    if (val === true) {
      cookieString += `; ${key}`;
    } else if (val !== false && val !== undefined) {
      cookieString += `; ${key}=${val}`;
    }
  });
  
  document.cookie = cookieString;
};

/**
 * Invalida el cache de sesión
 */
export const invalidateSessionCache = () => {
  setCookie('coggni-session-cache', '', { maxAge: 0 });
  setCookie('coggni-force-revalidate', 'true', { maxAge: 5 });
  console.log('[CookieManager] Session cache invalidated');
};

/**
 * Obtiene información de depuración sobre las cookies
 * MEJORADO: Ahora incluye cookies de Supabase
 * @returns {Object} Estado actual de TODAS las cookies
 */
export const debugCookies = () => {
  const cookies = {
    coggni: {},
    supabase: {},
    other: {}
  };
  
  // Debug cookies de Coggni
  COGGNI_COOKIES.forEach(name => {
    const value = getCookieValue(name);
    cookies.coggni[name] = value || 'not set';
  });
  
  // Debug TODAS las cookies
  if (typeof document !== 'undefined') {
    const allCookies = document.cookie.split(';');
    
    allCookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      if (eqPos > -1) {
        const name = cookie.substr(0, eqPos).trim();
        const value = cookie.substr(eqPos + 1).trim();
        
        if (name.startsWith('sb-') || name.includes('supabase')) {
          cookies.supabase[name] = value.substring(0, 20) + '...'; // Solo primeros 20 chars por seguridad
        } else if (!COGGNI_COOKIES.includes(name)) {
          cookies.other[name] = value.substring(0, 20) + '...';
        }
      }
    });
  }
  
  return cookies;
};

/**
 * NUEVA FUNCIÓN: Limpieza total para logout
 * Limpia absolutamente todas las cookies relacionadas con la sesión
 */
export const performCompleteLogout = () => {
  console.log('[CookieManager] Performing complete logout cleanup...');
  
  // 1. Limpiar cookies de Coggni
  cleanupCookies({ includeSupabase: true });
  
  // 2. Invalidar cache
  invalidateSessionCache();
  
  // 3. Limpiar localStorage y sessionStorage
  if (typeof window !== 'undefined') {
    try {
      // Limpiar items específicos de Supabase
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Lo mismo para sessionStorage
      keysToRemove.length = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('[CookieManager] Cleaned localStorage and sessionStorage');
    } catch (e) {
      console.error('[CookieManager] Error cleaning storage:', e);
    }
  }
  
  console.log('[CookieManager] Complete logout cleanup finished');
};