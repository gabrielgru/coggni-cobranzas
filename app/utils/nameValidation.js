// Configuración y patrones para validación de nombres sospechosos
export const NOMBRE_SOSPECHOSO_CONFIG = {
  maxLength: 80,
  maxNumbersPercent: 30, // 30% del nombre son números
  scriptPatterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*= /gi, // onclick=, onload=, etc.
    /<[^>]+>/g, // Cualquier tag HTML
    /\beval\s*\(/gi,
    /\balert\s*\(/gi,
    /\bconfirm\s*\(/gi,
    /\bprompt\s*\(/gi
  ],
  sqlPatterns: [
    /(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|CREATE|ALTER|EXEC|EXECUTE)\b.*\b(TABLE|DATABASE|FROM|WHERE|INTO)\b)/gi,
    /(--)|(\/\*.*\*\/)/g, // Comentarios SQL
    /(';)|(";)|(\s+OR\s+\d+\s*=\s*\d+)|(\s+AND\s+\d+\s*=\s*\d+)/gi,
    /\b(WAITFOR|DELAY|SLEEP)\b/gi
  ],
  specialCharsPatterns: [
    /[<>{}|\\`^~\[\]]/g, // Caracteres peligrosos
    /[\u0000-\u001F\u007F-\u009F]/g, // Caracteres de control
    /[\uD800-\uDFFF]/g, // Surrogates mal formados
  ],
  spamPatterns: [
    /\$\$\$+/g,
    /!!!+/g,
    /\?\?\?+/g,
    /CLICK\s*HERE/gi,
    /FREE\s*MONEY/gi,
    /CONGRATULATIONS/gi,
    /YOU\s*WON/gi,
    /EARN\s*MONEY/gi,
    /MAKE\s*\$\d+/gi
  ],
  reasons: {
    tooLong: 'Nombre demasiado largo',
    tooManyNumbers: 'Demasiados números en el nombre',
    hasScript: 'Contiene código script',
    hasSql: 'Posible SQL injection',
    hasSpecialChars: 'Caracteres especiales peligrosos',
    hasEmoji: 'Contiene emojis',
    hasEmail: 'Email dentro del nombre',
    hasUrl: 'URL dentro del nombre',
    startsWithNumber: 'Comienza con números',
    hasSlash: 'Contiene barras',
    hasQuotes: 'Contiene comillas',
    hasSpam: 'Patrón de spam detectado',
    isEmpty: 'Nombre vacío después de limpieza'
  }
};

// Solo preparar para análisis, NO limpiar
export function prepareForAnalysis(texto) {
  if (!texto) return '';
  return texto.trim(); // Solo quitar espacios de inicio/fin
}

export function detectarNombreSospechoso(nombreOriginal, nombreParaAnalisis) {
  const razones = [];
  // Si después de preparar queda vacío
  if (!nombreParaAnalisis || nombreParaAnalisis.trim() === '') {
    return {
      esSospechoso: true,
      razones: [NOMBRE_SOSPECHOSO_CONFIG.reasons.isEmpty],
      nivelRiesgo: 'alto'
    };
  }
  // 1. Verificar longitud
  if (nombreOriginal.length > NOMBRE_SOSPECHOSO_CONFIG.maxLength) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.tooLong);
  }
  // 2. Verificar si comienza con números
  if (/^\d/.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.startsWithNumber);
  }
  // 3. Calcular porcentaje de números
  const numerosCant = (nombreOriginal.match(/\d/g) || []).length;
  const porcentajeNumeros = (numerosCant / nombreOriginal.length) * 100;
  if (porcentajeNumeros > NOMBRE_SOSPECHOSO_CONFIG.maxNumbersPercent) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.tooManyNumbers);
  }
  // 4. Detectar scripts
  for (const pattern of NOMBRE_SOSPECHOSO_CONFIG.scriptPatterns) {
    if (pattern.test(nombreOriginal)) {
      razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasScript);
      break;
    }
  }
  // 5. Detectar SQL injection
  for (const pattern of NOMBRE_SOSPECHOSO_CONFIG.sqlPatterns) {
    if (pattern.test(nombreOriginal)) {
      razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasSql);
      break;
    }
  }
  // 6. Detectar caracteres especiales peligrosos
  for (const pattern of NOMBRE_SOSPECHOSO_CONFIG.specialCharsPatterns) {
    if (pattern.test(nombreOriginal)) {
      razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasSpecialChars);
      break;
    }
  }
  // 7. Detectar emojis (en el nombre original)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu;
  if (emojiRegex.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasEmoji);
  }
  // 8. Detectar email dentro del nombre
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasEmail);
  }
  // 9. Detectar URL
  const urlRegex = /(https?:\/\/|www\.)[^\s]+/gi;
  if (urlRegex.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasUrl);
  }
  // 10. Detectar slashes/barras
  if (/[\/\\]/.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasSlash);
  }
  // 11. Detectar comillas (después de normalización)
  if (/"/.test(nombreOriginal)) {
    razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasQuotes);
  }
  // 12. Detectar patrones de spam
  for (const pattern of NOMBRE_SOSPECHOSO_CONFIG.spamPatterns) {
    if (pattern.test(nombreOriginal.toUpperCase())) {
      razones.push(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasSpam);
      break;
    }
  }
  let nivelRiesgo = 'bajo';
  if (razones.length > 0) {
    if (razones.includes(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasScript) ||
        razones.includes(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasSql) ||
        razones.includes(NOMBRE_SOSPECHOSO_CONFIG.reasons.hasEmail) ||
        razones.includes(NOMBRE_SOSPECHOSO_CONFIG.reasons.isEmpty)) {
      nivelRiesgo = 'alto';
    } else if (razones.length >= 2) {
      nivelRiesgo = 'medio';
    }
  }
  return {
    esSospechoso: razones.length > 0,
    razones: razones,
    nivelRiesgo: nivelRiesgo
  };
}

export function validateContactNameSecurity(nombreOriginal) {
  const nombreParaAnalisis = prepareForAnalysis(nombreOriginal);
  const deteccion = detectarNombreSospechoso(nombreOriginal, nombreParaAnalisis);
  return {
    isSecure: !deteccion.esSospechoso,
    securityWarnings: deteccion.razones,
    riskLevel: deteccion.nivelRiesgo,
    requiresReview: deteccion.esSospechoso,
    originalName: nombreOriginal // Sin cambios
  };
} 