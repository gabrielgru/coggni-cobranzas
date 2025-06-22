// Configuraciones de empresa
export const EMPRESAS_CONFIG = {
  'dental-link': {
    id: 'dental-link',
    nombre: 'Dental Link',
    pais: 'UY',
    idioma_default: 'es',
    idiomas_disponibles: ['es'],
    monedas: ['$', 'U$S'],
    paises_telefono: ['UY', 'AR', 'ES'],
    webhook_url: 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-automatica-dl',
    campos_facturas: {
      codigo: { nombre: 'Código', requerido: true },
      nombre: { nombre: 'Nombre', requerido: true },
      saldo: { nombre: 'Saldo', requerido: true },
      docum: { nombre: 'Docum', requerido: true },
      mon: { nombre: 'Mon', requerido: true },
      vencim: { nombre: 'Vencim', requerido: false },
      referencia: { nombre: 'Referencia', requerido: false }
    },
    campos_contactos: {
      codigo: { nombre: 'Código', requerido: true },
      nombre: { nombre: 'Nombre', requerido: true },
      email: { nombre: 'Email', requerido: true },
      telefono: { nombre: 'Teléfono', requerido: true },
      contacto1: { nombre: 'Contacto 1', requerido: false },
      contacto2: { nombre: 'Contacto 2', requerido: false }
    }
  },
  'la-perla': {
    id: 'la-perla',
    nombre: 'La Perla',
    pais: 'ES',
    idioma_default: 'es',
    idiomas_disponibles: ['es'],
    monedas: ['EUR'],
    paises_telefono: ['ES', 'FR', 'IT'],
    webhook_url: 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-la-perla',
    campos_facturas: {
      codigo: { nombre: 'Código Cliente', requerido: true },
      nombre: { nombre: 'Razón Social', requerido: true },
      saldo: { nombre: 'Importe Pendiente', requerido: true },
      docum: { nombre: 'Nº Factura', requerido: true },
      mon: { nombre: 'Divisa', requerido: false },
      vencim: { nombre: 'Fecha Vto', requerido: false },
      referencia: { nombre: 'Referencia', requerido: false }
    },
    campos_contactos: {
      codigo: { nombre: 'Código Cliente', requerido: true },
      nombre: { nombre: 'Razón Social', requerido: true },
      email: { nombre: 'Correo Electrónico', requerido: true },
      telefono: { nombre: 'Teléfono Principal', requerido: true },
      contacto1: { nombre: 'Contacto Comercial', requerido: false },
      contacto2: { nombre: 'Contacto Administrativo', requerido: false }
    }
  },
  'test-company': {
    id: 'test-company',
    nombre: 'Test Company',
    pais: 'US',
    idioma_default: 'en',
    idiomas_disponibles: ['en', 'es'],
    monedas: ['U$S'],
    paises_telefono: ['US', 'CA', 'MX'],
    webhook_url: 'https://gabrielgru.app.n8n.cloud/webhook/cobranza-test',
    campos_facturas: {
      codigo: { nombre: 'Customer Code', requerido: true },
      nombre: { nombre: 'Customer Name', requerido: true },
      saldo: { nombre: 'Outstanding Balance', requerido: true },
      docum: { nombre: 'Invoice Number', requerido: true },
      mon: { nombre: 'Currency', requerido: true },
      vencim: { nombre: 'Due Date', requerido: false },
      referencia: { nombre: 'Reference', requerido: false }
    },
    campos_contactos: {
      codigo: { nombre: 'Customer Code', requerido: true },
      nombre: { nombre: 'Customer Name', requerido: true },
      email: { nombre: 'Email Address', requerido: true },
      telefono: { nombre: 'Phone Number', requerido: true },
      contacto1: { nombre: 'Primary Contact', requerido: false },
      contacto2: { nombre: 'Secondary Contact', requerido: false }
    }
  }
};

// Textos por idioma
export const TEXTOS = {
  es: {
    login: {
      titulo: 'Coggni - Iniciar Sesión',
      usuario: 'Correo Electrónico',
      password: 'Contraseña',
      ingresar: 'Ingresar',
      error: 'Usuario o contraseña incorrectos'
    },
    dashboard: {
      titulo: 'Sistema de Cobranza Automática',
      cerrarSesion: 'Salir',
      fichaFacturas: 'Ficha Facturas',
      estrategiaEnvio: 'Estrategia de Envío',
      arrastrarArchivo: 'Arrastra tu archivo aquí o haz clic para seleccionar',
      formatosAceptados: 'Formatos aceptados: Excel (.xlsx, .xls) o CSV',
      columnasRequeridas: 'Ver columnas requeridas',
      procesarCobranza: 'Procesar Cobranza',
      incluirProximas: 'Incluir facturas próximas a vencer',
      actualizarContactos: 'Actualizar Base de Contactos',
      opcional: 'Opcional',
      dias: 'días',
      whatsappPrioritario: 'WhatsApp Prioritario',
      ambosCanales: 'Ambos Canales',
      soloWhatsapp: 'Solo WhatsApp',
      soloEmail: 'Solo Email',
      resumenConfig: 'Resumen de tu configuración:',
      archivo: 'Archivo',
      estrategia: 'Estrategia',
      recordatorios: 'Recordatorios',
      contactos: 'Contactos',
      procesando: 'Procesando...',
      completado: '¡Proceso completado!',
      error: 'Error',
      whatsappDesc: 'Envía primero por WhatsApp cuando esté disponible. Si el cliente no tiene WhatsApp registrado, se enviará automáticamente por Email.',
      ambosDesc: 'Envía por WhatsApp y Email simultáneamente cuando ambos estén disponibles. Máximo alcance garantizado.',
      soloWhatsappDesc: 'Envía únicamente por WhatsApp. Los clientes sin WhatsApp registrado no recibirán el recordatorio.',
      soloEmailDesc: 'Envía únicamente por correo electrónico. Los clientes sin Email registrado no recibirán el recordatorio.',
      anticipacionIntro: 'Seleccione la cantidad de días de anticipación:',
      comoFunciona: '¿Cómo funciona?',
      ejemplo: 'Ejemplo',
      hoy: 'Hoy es',
      con: 'Con',
      diasAnticipacion: 'días de anticipación, se incluirán facturas que venzan hasta el',
      notasAdicionales: 'Notas adicionales:',
      unDia: 'Un valor de 1 día incluye facturas que vencen mañana.',
      maximoDias: 'El máximo configurable es de 10 días de anticipación.',
      actualizarDesc: 'Solo es necesario actualizar si tienes nuevos números de WhatsApp o Emails. El sistema utilizará automáticamente la base de datos vigente si no subes un archivo nuevo.',
      quitar: 'Quitar',
      validando: 'Validando...',
      enviando: 'Enviando...',
      completadoEstado: 'Completado',
      archivoValido: 'Archivo válido',
      registrosEncontrados: 'registros encontrados',
      erroresEncontrados: 'errores encontrados',
      advertencias: 'advertencias',
      descargarReporte: 'Descargar reporte de errores',
      soloFacturasVencidas: 'Solo facturas vencidas hasta el día de hoy',
      columnasRequeridasArchivo: 'Columnas requeridas en el archivo:',
      anticipacionVencimientos: 'Anticipación de vencimientos:',
      nota: 'Nota',
      columnasRequeridasActualizar: 'Columnas requeridas para actualizar contactos:',
      cuandoApagado: 'Cuando está apagado: sólo se incluirán facturas vencidas al momento de envío.'
    }
  },
  en: {
    login: {
      titulo: 'Coggni - Sign In',
      usuario: 'Email Address',
      password: 'Password',
      ingresar: 'Sign In',
      error: 'Invalid username or password'
    },
    dashboard: {
      titulo: 'Automated Collection System',
      cerrarSesion: 'Log out',
      fichaFacturas: 'Invoice File',
      estrategiaEnvio: 'Sending Strategy',
      arrastrarArchivo: 'Drag your file here or click to select',
      formatosAceptados: 'Accepted formats: Excel (.xlsx, .xls) or CSV',
      columnasRequeridas: 'View required columns',
      procesarCobranza: 'Process Collection',
      incluirProximas: 'Include upcoming invoices',
      actualizarContactos: 'Update Contact Database',
      opcional: 'Optional',
      dias: 'days',
      whatsappPrioritario: 'WhatsApp Priority',
      ambosCanales: 'Both Channels',
      soloWhatsapp: 'WhatsApp Only',
      soloEmail: 'Email Only',
      resumenConfig: 'Configuration summary:',
      archivo: 'File',
      estrategia: 'Strategy',
      recordatorios: 'Reminders',
      contactos: 'Contacts',
      procesando: 'Processing...',
      completado: 'Process completed!',
      error: 'Error',
      whatsappDesc: 'Send first via WhatsApp when available. If customer has no registered WhatsApp, will automatically send via Email.',
      ambosDesc: 'Send via WhatsApp and Email simultaneously when both are available. Maximum reach guaranteed.',
      soloWhatsappDesc: 'Send only via WhatsApp. Customers without registered WhatsApp will not receive reminders.',
      soloEmailDesc: 'Send only via email. Customers without registered Email will not receive reminders.',
      anticipacionIntro: 'Select the number of days in advance:',
      comoFunciona: 'How does it work?',
      ejemplo: 'Example',
      hoy: 'Today is',
      con: 'With',
      diasAnticipacion: 'days anticipation, invoices due until',
      notasAdicionales: 'Additional notes:',
      unDia: 'A value of 1 day includes invoices due tomorrow.',
      maximoDias: 'Maximum configurable is 10 days anticipation.',
      actualizarDesc: 'Only necessary to update if you have new WhatsApp numbers or Emails. The system will automatically use the current database if you don\'t upload a new file.',
      quitar: 'Remove',
      validando: 'Validating...',
      enviando: 'Sending...',
      completadoEstado: 'Completed',
      archivoValido: 'Valid file',
      registrosEncontrados: 'records found',
      erroresEncontrados: 'errors found',
      advertencias: 'warnings',
      descargarReporte: 'Download error report',
      soloFacturasVencidas: 'Only invoices due up to today',
      columnasRequeridasArchivo: 'Required columns in file:',
      anticipacionVencimientos: 'Due date anticipation:',
      nota: 'Note',
      columnasRequeridasActualizar: 'Required columns to update contacts:',
      cuandoApagado: 'When off: only overdue invoices at the time of sending will be included.'
    }
  }
};

// Credenciales demo
export const DEMO_CREDENTIALS = {
  'dental@dentallink.com': { empresa: 'dental-link', password: 'demo123' },
  'admin@laperla.es': { empresa: 'la-perla', password: 'demo123' },
  'test@testcompany.com': { empresa: 'test-company', password: 'demo123' }
};