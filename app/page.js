'use client';

import React, { useState, useEffect, useRef } from 'react';
import './globals.css';

// Configuraciones de empresa
const EMPRESAS_CONFIG = {
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
      mon: { nombre: 'Divisa', requerido: true },
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
const TEXTOS = {
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
      completadoEstado: 'Completado'
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
      completadoEstado: 'Completed'
    }
  }
};

export default function CoggniApp() {
  // Estados principales
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [idioma, setIdioma] = useState('es');
  const [tema, setTema] = useState('light');

  // Estados del dashboard
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedContactsFile, setSelectedContactsFile] = useState(null);
  const [fileValidationResult, setFileValidationResult] = useState(null);
  const [contactsValidationResult, setContactsValidationResult] = useState(null);
  const [strategy, setStrategy] = useState('whatsapp_primero');
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [daysInput, setDaysInput] = useState(7);
  const [updateContacts, setUpdateContacts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ show: false, type: '', title: '', content: '', progress: false });

  // Estados UI
  const [showColumns, setShowColumns] = useState({ facturas: false, contactos: false });
  const [showDaysDetail, setShowDaysDetail] = useState(false);
  const [dragging, setDragging] = useState({ facturas: false, contactos: false });

  // Referencias
  const fileInputRef = useRef(null);
  const contactsInputRef = useRef(null);

  // Inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('coggni-theme') || 'light';
    setTema(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Auto-login para demo
  useEffect(() => {
    const usuarioDemo = localStorage.getItem('coggni-user');
    const empresaDemo = localStorage.getItem('coggni-empresa');
    if (usuarioDemo && empresaDemo && EMPRESAS_CONFIG[empresaDemo]) {
      setUsuarioActual(usuarioDemo);
      setEmpresaActual(EMPRESAS_CONFIG[empresaDemo]);
      setIdioma(EMPRESAS_CONFIG[empresaDemo].idioma_default);
    }
  }, []);

  // Funciones
  const toggleTheme = () => {
    const newTheme = tema === 'light' ? 'dark' : 'light';
    setTema(newTheme);
    localStorage.setItem('coggni-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleColumns = (type) => {
    setShowColumns(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleDaysDetail = () => {
    setShowDaysDetail(!showDaysDetail);
  };

  const toggleRemindersSection = () => {
    setIncludeUpcoming(!includeUpcoming);
    if (!includeUpcoming) {
      setDaysInput(7);
    } else {
      setDaysInput(0);
    }
  };

  const toggleContactsSection = () => {
    setUpdateContacts(!updateContacts);
    if (updateContacts) {
      removeContactsFile();
    }
  };

  const incrementDays = () => {
    if (daysInput < 10) {
      setDaysInput(daysInput + 1);
    }
  };

  const decrementDays = () => {
    if (daysInput > 1) {
      setDaysInput(daysInput - 1);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeContactsFile = () => {
    setSelectedContactsFile(null);
    setContactsValidationResult(null);
    if (contactsInputRef.current) contactsInputRef.current.value = '';
  };

  // Función de login
  const handleLogin = (usuario, password) => {
    const credenciales = {
      'dental@dentallink.com': { empresa: 'dental-link', password: 'demo123' },
      'admin@laperla.es': { empresa: 'la-perla', password: 'demo123' },
      'test@testcompany.com': { empresa: 'test-company', password: 'demo123' }
    };

    const cred = credenciales[usuario];
    if (cred && cred.password === password) {
      const empresa = EMPRESAS_CONFIG[cred.empresa];
      setUsuarioActual(usuario);
      setEmpresaActual(empresa);
      setIdioma(empresa.idioma_default);
      localStorage.setItem('coggni-user', usuario);
      localStorage.setItem('coggni-empresa', cred.empresa);
      setStatusMessage({ show: false });
    } else {
      setStatusMessage({ 
        show: true, 
        type: 'error', 
        title: 'Error', 
        content: TEXTOS[idioma].login.error 
      });
    }
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    setEmpresaActual(null);
    localStorage.removeItem('coggni-user');
    localStorage.removeItem('coggni-empresa');
    // Reset todos los estados
    setSelectedFile(null);
    setSelectedContactsFile(null);
    setStatusMessage({ show: false });
  };

  // Manejar archivos
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleContactsSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetContactsFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showStatus('error', 'Error', 'Por favor selecciona un archivo Excel o CSV válido.');
      return;
    }
    
    setSelectedFile(file);
    setFileValidationResult({ valid: true, errors: [], warnings: [], totalRows: 150 });
    showStatus('success', '✓ Archivo válido', `${file.name} - 150 registros encontrados`);
  };

  const validateAndSetContactsFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showStatus('error', 'Error', 'El archivo de contactos debe ser Excel o CSV.');
      return;
    }
    
    setSelectedContactsFile(file);
    setContactsValidationResult({ valid: true, errors: [], warnings: [], totalRows: 80 });
    showStatus('success', '✓ Archivo de contactos válido', `${file.name} - 80 registros encontrados`);
  };

  const showStatus = (type, title, content, progress = false) => {
    setStatusMessage({ show: true, type, title, content, progress });
  };

  const hideStatus = () => {
    setStatusMessage({ show: false });
  };

  // Procesar cobranza
  const processFile = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    showStatus('info', TEXTOS[idioma].dashboard.validando, 'Analizando archivos...', true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showStatus('info', TEXTOS[idioma].dashboard.enviando, 'Enviando archivos para procesamiento...', true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      showStatus('success', TEXTOS[idioma].dashboard.completado, 
        `El proceso de cobranza se ha iniciado correctamente.\n\nEmpresa: ${empresaActual.nombre}\nArchivo: ${selectedFile.name}\nEstrategia: ${strategy}`);
      
      setTimeout(() => {
        setSelectedFile(null);
        setSelectedContactsFile(null);
        setUpdateContacts(false);
        setIncludeUpcoming(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (contactsInputRef.current) contactsInputRef.current.value = '';
        hideStatus();
      }, 3000);
      
    } catch (error) {
      showStatus('error', 'Error en el procesamiento', `Ocurrió un error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Calcular fechas para el ejemplo
  const updateDateExample = () => {
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() + daysInput);
    
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const todayStr = today.toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US', options);
    const untilStr = untilDate.toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US', options);
    
    return { todayStr, untilStr };
  };

  // Componente de Login
  const LoginForm = () => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
      if (usuario && password) {
        handleLogin(usuario, password);
      }
    };

    return (
      <div className="login-container">
        <div className="login-form">
          <div className="logo-section">
            <div className="logo">🏢</div>
            <h1>{TEXTOS[idioma].login.titulo}</h1>
          </div>

          <div className="input-group">
            <label>{TEXTOS[idioma].login.usuario}</label>
            <input
              type="email"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="input-group">
            <label>{TEXTOS[idioma].login.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button onClick={handleSubmit} className="login-button">
            {TEXTOS[idioma].login.ingresar}
          </button>

          {statusMessage.show && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.content}
            </div>
          )}

          <div className="demo-credentials">
            <p><strong>Demo - Dental Link:</strong> dental@dentallink.com / demo123</p>
            <p><strong>Demo - La Perla:</strong> admin@laperla.es / demo123</p>
            <p><strong>Demo - Test Company:</strong> test@testcompany.com / demo123</p>
          </div>
        </div>
      </div>
    );
  };

  // Si no hay usuario logueado, mostrar login
  if (!usuarioActual || !empresaActual) {
    return <LoginForm />;
  }

  const textos = TEXTOS[idioma].dashboard;
  const { todayStr, untilStr } = updateDateExample();

  return (
    <div className="app-container">
      <div className="container">
        {/* Theme Toggle */}
        <div className="theme-toggle" onClick={toggleTheme}>
          <div className={`theme-toggle-slider ${tema === 'dark' ? 'dark' : ''}`}>
            <div className="theme-icon">
              {tema === 'light' ? '☀️' : '🌙'}
            </div>
          </div>
        </div>

        {/* Header de empresa */}
        <div className="header-section">
          <div className="company-logo">🏢</div>
          <h1 className="company-name">{empresaActual.nombre}</h1>
          <p className="company-info">
            {usuarioActual} | {empresaActual.paises_telefono.join(', ')} | {empresaActual.monedas.join(', ')}
          </p>
          
          {empresaActual.idiomas_disponibles.length > 1 && (
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="language-selector"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
          )}

          <button onClick={handleLogout} className="logout-button">
            Salir
          </button>
        </div>

        <h1 className="main-title">{textos.titulo}</h1>

        {/* Archivo de Deudas */}
        <div className="section">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H15M9 15H15M12 3L4 8V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V8L12 3Z"/>
            </svg>
            {textos.fichaFacturas}
          </h2>
          
          <div
            className={`upload-zone ${dragging.facturas ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging({ ...dragging, facturas: true });
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging({ ...dragging, facturas: false });
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging({ ...dragging, facturas: false });
              const file = e.dataTransfer.files[0];
              if (file) validateAndSetFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 10L12 15L17 10M12 15V3M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"/>
            </svg>
            
            <div className="upload-text">{textos.arrastrarArchivo}</div>
            <div className="upload-subtext">{textos.formatosAceptados}</div>
          </div>

          {selectedFile && (
            <div className="file-info">
              <strong>✓</strong> {selectedFile.name}
              <button onClick={removeFile} className="remove-file-btn">
                ✕ {textos.quitar}
              </button>
            </div>
          )}

          <div className="columns-info">
            <div 
              className={`columns-toggle ${showColumns.facturas ? 'expanded' : ''}`}
              onClick={() => toggleColumns('facturas')}
            >
              {textos.columnasRequeridas} <span className="columns-toggle-arrow">▼</span>
            </div>
            
            {showColumns.facturas && (
              <div className="columns-content visible">
                <strong>Columnas requeridas en el archivo:</strong>
                <div className="columns-tags">
                  {Object.values(empresaActual.campos_facturas).map((campo, idx) => (
                    <span key={idx} className="column-tag">
                      {campo.nombre}{campo.requerido ? ' *' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estrategia de Envío */}
        <div className="section">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
            {textos.estrategiaEnvio}
          </h2>
          
          <div className="strategy-cards">
            {[
              { id: 'whatsapp_primero', titulo: textos.whatsappPrioritario, desc: textos.whatsappDesc },
              { id: 'ambos_canales', titulo: textos.ambosCanales, desc: textos.ambosDesc },
              { id: 'solo_whatsapp', titulo: textos.soloWhatsapp, desc: textos.soloWhatsappDesc },
              { id: 'solo_email', titulo: textos.soloEmail, desc: textos.soloEmailDesc }
            ].map((opcion) => (
              <label
                key={opcion.id}
                className={`strategy-card ${strategy === opcion.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={opcion.id}
                  checked={strategy === opcion.id}
                  onChange={(e) => setStrategy(e.target.value)}
                />
                
                <div className="strategy-header">
                  <div className="strategy-icon">
                    {opcion.id === 'solo_whatsapp' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8L12 13L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"/>
                      </svg>
                    )}
                  </div>
                  <div className="strategy-title">{opcion.titulo}</div>
                </div>
                
                <div className="strategy-description">{opcion.desc}</div>
                
                {strategy === opcion.id && (
                  <div className="checkmark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17L4 12"/>
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Incluir facturas próximas a vencer */}
        <div className="optional-section">
          <div className="optional-header" onClick={toggleRemindersSection}>
            <div>
              <div className="optional-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6V12L16 14"/>
                </svg>
                {textos.incluirProximas}
                <span className="optional-badge">{textos.opcional}</span>
              </div>
              <div className="optional-description">
                Cuando está apagado: sólo se incluirán facturas vencidas al momento de envío.
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={includeUpcoming}
                onChange={(e) => {
                  setIncludeUpcoming(e.target.checked);
                  if (!e.target.checked) {
                    setDaysInput(0);
                  } else {
                    setDaysInput(7);
                  }
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {includeUpcoming && (
            <div className="optional-content" style={{ display: 'block' }}>
              <div className="days-input-section">
                <div className="days-input-intro">
                  <strong>{textos.anticipacionIntro}</strong><br/>
                  {textos.anticipacionIntro}
                  <span style={{ marginLeft: '8px' }}>
                    <span className="number-input-container">
                      <input
                        type="number"
                        value={daysInput}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                          setDaysInput(value);
                        }}
                        min="1"
                        max="10"
                        className="number-input"
                      />
                      <div className="number-controls">
                        <button className="number-control" onClick={incrementDays}>▲</button>
                        <button className="number-control" onClick={decrementDays}>▼</button>
                      </div>
                    </span>
                    <span style={{ marginLeft: '8px' }}>{textos.dias}</span>
                  </span>
                </div>
                
                <div 
                  className={`days-detail-toggle ${showDaysDetail ? 'expanded' : ''}`}
                  onClick={toggleDaysDetail}
                >
                  {textos.comoFunciona} <span className="days-detail-toggle-arrow">▼</span>
                </div>
                
                {showDaysDetail && (
                  <div className="days-detail-content visible">
                    <div className="days-example">
                      <strong>📅 {textos.ejemplo}:</strong> {textos.hoy} {todayStr}. {textos.con} <strong>{daysInput} {textos.dias}</strong> {textos.diasAnticipacion} {untilStr}.
                    </div>
                    <div className="days-notes">
                      <div className="days-notes-title">{textos.notasAdicionales}</div>
                      • {textos.unDia}<br/>
                      • {textos.maximoDias}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Base de Contactos Opcional */}
        <div className="optional-section">
          <div className="optional-header" onClick={toggleContactsSection}>
            <div className="optional-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"/>
                <circle cx="8.5" cy="7" r="4"/>
                <path d="M20 8V14M23 11H17"/>
              </svg>
              {textos.actualizarContactos}
              <span className="optional-badge">{textos.opcional}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={updateContacts}
                onChange={(e) => {
                  setUpdateContacts(e.target.checked);
                  if (!e.target.checked) {
                    removeContactsFile();
                  }
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {updateContacts && (
            <div className="optional-content" style={{ display: 'block' }}>
              <div className="optional-note">
                <strong>💡 Nota:</strong> {textos.actualizarDesc}
              </div>
              
              <div
                className={`upload-zone ${dragging.contactos ? 'dragging' : ''}`}
                onClick={() => contactsInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging({ ...dragging, contactos: true });
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragging({ ...dragging, contactos: false });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging({ ...dragging, contactos: false });
                  const file = e.dataTransfer.files[0];
                  if (file) validateAndSetContactsFile(file);
                }}
              >
                <input
                  ref={contactsInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleContactsSelect}
                  style={{ display: 'none' }}
                />
                
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <path d="M20 8V14M23 11H17"/>
                </svg>
                
                <div className="upload-text">Arrastra tu archivo de contactos actualizado</div>
                <div className="upload-subtext">{textos.formatosAceptados}</div>
              </div>

              {selectedContactsFile && (
                <div className="file-info">
                  <strong>✓</strong> {selectedContactsFile.name}
                  <button onClick={removeContactsFile} className="remove-file-btn">
                    ✕ {textos.quitar}
                  </button>
                </div>
              )}

              <div className="columns-info">
                <div 
                  className={`columns-toggle ${showColumns.contactos ? 'expanded' : ''}`}
                  onClick={() => toggleColumns('contactos')}
                >
                  Ver columnas requeridas <span className="columns-toggle-arrow">▼</span>
                </div>
                
                {showColumns.contactos && (
                  <div className="columns-content visible">
                    <strong>Columnas requeridas para actualizar contactos:</strong>
                    <div className="columns-tags">
                      {Object.values(empresaActual.campos_contactos).map((campo, idx) => (
                        <span key={idx} className="column-tag">
                          {campo.nombre}{campo.requerido ? ' *' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resumen y Botón */}
        <div className="process-section">
          {selectedFile && (
            <div className="process-summary" style={{ display: 'block' }}>
              <h3>{textos.resumenConfig}</h3>
              <div className="summary-content">
                <div className="summary-item">
                  <strong>{textos.archivo}:</strong> {selectedFile.name}
                </div>
                <div className="summary-item">
                  <strong>{textos.estrategia}:</strong> {strategy}
                </div>
                <div className="summary-item">
                  <strong>{textos.recordatorios}:</strong> {includeUpcoming ? `${daysInput} ${textos.dias} de anticipación` : 'Solo facturas vencidas hasta el día de hoy'}
                </div>
                {selectedContactsFile && (
                  <div className="summary-item">
                    <strong>{textos.contactos}:</strong> {selectedContactsFile.name}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button
            onClick={processFile}
            disabled={!selectedFile || processing}
            className="process-button"
          >
            {processing ? textos.procesando : textos.procesarCobranza}
          </button>
        </div>

        {statusMessage.show && (
          <div className={`status-message ${statusMessage.type}`} style={{ display: 'block' }}>
            <div className="status-title">{statusMessage.title}</div>
            <div className="status-content">{statusMessage.content}</div>
            
            {statusMessage.progress && (
              <div className="status-progress" style={{ display: 'flex' }}>
                <div className="progress-step active">
                  <span className="progress-dot"></span>
                  <span>{textos.validando}</span>
                </div>
                <div className="progress-step">
                  <span className="progress-dot"></span>
                  <span>{textos.enviando}</span>
                </div>
                <div className="progress-step">
                  <span className="progress-dot"></span>
                  <span>{textos.completadoEstado}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}