// app/utils/cookieManager.js - Utilidades para manejo consistente de cookies

export const COGGNI_COOKIES = [
  'coggni-user',
  'coggni-company-id',
  'coggni-user-type',
  'coggni-last-activity',
  'coggni-session-cache',
  'coggni-force-revalidate'
];

/**
 * Limpia todas las cookies de Coggni
 * @param {Object} options - Opciones de limpieza
 * @param {Array} options.except - Cookies a mantener
 * @param {string} options.domain - Dominio de las cookies
 */
export const cleanupCookies = (options = {}) => {
  const { except = [], domain = null } = options;
  
  if (typeof document === 'undefined') {
    console.warn('[CookieManager] cleanupCookies called in non-browser environment');
    return;
  }
  
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
  
  console.log('[CookieManager] Cookies cleaned except:', except);
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
 * @returns {Object} Estado actual de las cookies
 */
export const debugCookies = () => {
  const cookies = {};
  
  COGGNI_COOKIES.forEach(name => {
    const value = getCookieValue(name);
    cookies[name] = value || 'not set';
  });
  
  return cookies;
};