// Configuración por entorno
const config = {
  development: {
    webhookUrl: 'https://gabrielgru.app.n8n.cloud/webhook-test/cobranza-multiempresa',
    environment: 'development'
  },
  production: {
    webhookUrl: 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-multiempresa',
    environment: 'production'
  }
};

// Determinar el entorno actual
const getCurrentEnvironment = () => {
  if (typeof window !== 'undefined') {
    // Cliente - usar NODE_ENV o detectar por URL
    return process.env.NODE_ENV || 'development';
  } else {
    // Servidor
    return process.env.NODE_ENV || 'development';
  }
};

// Exportar configuración actual
export const getConfig = () => {
  const env = getCurrentEnvironment();
  return config[env] || config.development;
};

// Exportar URL del webhook
export const getWebhookUrl = () => {
  // Prioridad: Variable de entorno > Configuración por entorno
  return process.env.NEXT_PUBLIC_WEBHOOK_URL || getConfig().webhookUrl;
}; 