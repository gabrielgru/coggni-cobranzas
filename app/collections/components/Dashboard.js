'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TEXTOS } from '../../utils/constants';
import ThemeToggle from '../../components/shared/ThemeToggle';
import LanguageSelector from '../../components/shared/LanguageSelector';
import FileUploadZone from './FileUploadZone';
import OptionalSection from './OptionalSection';
import { useRouter } from 'next/navigation';

// Utilidad para buscar por tipo de campo
const hasFieldOfType = (campos, tipo) => {
  return Object.values(campos || {}).some(campo => campo.tipo === tipo);
};

export default function Dashboard() {
  const { usuarioActual, empresaActual, idioma, logout, changeIdioma, isLoadingEmpresa } = useAuth();
  const router = useRouter();
  
  // Estados principales
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
  const [currentProgressStep, setCurrentProgressStep] = useState('');

  // Estado para forzar re-render del logo
  const [logoKey, setLogoKey] = useState(0);

  const textos = TEXTOS[idioma].dashboard;

  // NUEVO: Effect para detectar cambios de empresa
  useEffect(() => {
    if (!empresaActual) return;
    
    console.log('🔄 Empresa cambió a:', empresaActual.nombre);
    
    // Resetear el formulario cuando cambia la empresa
    resetForm();
    
    // Actualizar estrategia por defecto según la nueva empresa
    const nuevaEstrategia = hasFieldOfType(empresaActual.campos_contactos, 'email') 
      ? 'whatsapp_primero' 
      : 'solo_whatsapp';
    setStrategy(nuevaEstrategia);
    
    // Forzar re-render del logo cambiando la key
    setLogoKey(prev => prev + 1);
    
    // Actualizar idioma si es necesario
    if (empresaActual.idiomas_disponibles && !empresaActual.idiomas_disponibles.includes(idioma)) {
      changeIdioma(empresaActual.idiomas_disponibles[0]);
    }
  }, [empresaActual?.id]); // Detectar cambios en el ID de la empresa

  // Funciones de UI
  const toggleColumns = (type) => {
    setShowColumns(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleDaysDetail = () => {
    setShowDaysDetail(!showDaysDetail);
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

  // Manejar cambios en los toggles opcionales
  const handleIncludeUpcomingToggle = () => {
    const newValue = !includeUpcoming;
    setIncludeUpcoming(newValue);
    if (!newValue) {
      setDaysInput(0);
    } else {
      setDaysInput(7);
    }
  };

  const handleUpdateContactsToggle = () => {
    const newValue = !updateContacts;
    setUpdateContacts(newValue);
    if (!newValue) {
      setSelectedContactsFile(null);
      setContactsValidationResult(null);
    }
  };

  // Validación de archivos
  const handleFileValidation = (result) => {
    setFileValidationResult(result);
  };

  const handleContactsValidation = (result) => {
    setContactsValidationResult(result);
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

  const { todayStr, untilStr } = updateDateExample();

  // Verificar si se puede procesar
  const canProcess = () => {
    if (!selectedFile || !fileValidationResult || !fileValidationResult.valid) {
      return false;
    }
    
    if (updateContacts && selectedContactsFile) {
      return contactsValidationResult && contactsValidationResult.valid;
    }
    
    return true;
  };

  // ========================================
  // FUNCIÓN: Crear log inicial de procesamiento en Supabase
  // Guarda un registro del inicio del procesamiento para trazabilidad y debugging
  // ========================================
  const createProcessingLog = async (webhookCallId, startTime) => {
    const logPayload = {
      webhook_call_id: webhookCallId,
      status: 'processing',
      user_email: usuarioActual,
      company_id: empresaActual.id,
      company_name: empresaActual.nombre,
      invoice_file_name: selectedFile.name,
      invoice_records_total: fileValidationResult.totalRows || 0,
      invoice_records_valid: fileValidationResult.validRows || (fileValidationResult.totalRows - (fileValidationResult.errors?.length || 0)),
      invoice_records_invalid: fileValidationResult.errors?.length || 0,
      contacts_file_name: selectedContactsFile?.name || null,
      contacts_records_total: contactsValidationResult?.totalRows || null,
      contacts_records_valid: contactsValidationResult ? (contactsValidationResult.validRows || (contactsValidationResult.totalRows - (contactsValidationResult.errors?.length || 0))) : null,
      contacts_records_invalid: contactsValidationResult?.errors?.length || null,
      strategy: strategy,
      days_anticipation: includeUpcoming ? daysInput : 0,
      processing_status: 'processing',
      user_agent: navigator.userAgent,
      started_at: startTime.toISOString(),
      files_uploaded: {
        invoices: selectedFile.name,
        contacts: selectedContactsFile?.name || null
      }
    };

    const response = await fetch('/api/log-processing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear el registro de procesamiento');
    }

    return result.data;
  };

  // ========================================
  // FUNCIÓN: Actualizar log de procesamiento en Supabase
  // Permite marcar el procesamiento como success, error, etc. para trazabilidad
  // ========================================
  const updateProcessingLog = async (logId, status) => {
    try {
      await fetch('/api/log-processing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: logId,
          status: status,
          processing_status: status,
          completed_at: new Date().toISOString(),
          messages_to_send: fileValidationResult.validRows || (fileValidationResult.totalRows - (fileValidationResult.errors?.length || 0)),
          updated_at: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Error al actualizar log:', err);
    }
  };

  // ========================================
  // FUNCIÓN: getWebhookUrlFromDB (versión con API route)
  // 
  // ¿QUÉ HACE ESTA FUNCIÓN?
  // Obtiene la URL del webhook desde la base de datos a través de una
  // API route segura en lugar de acceder directamente a Supabase.
  //
  // ¿POR QUÉ CAMBIÓ?
  // - Antes: Intentaba usar service role en el frontend (inseguro/imposible)
  // - Ahora: Llama a una API route que valida permisos en el backend
  // - Evita exponer credenciales y mantiene la seguridad
  //
  // ¿CÓMO FUNCIONA?
  // 1. Hace un POST a /api/get-webhook-url con el company_id
  // 2. La API valida que el usuario tenga permisos
  // 3. Si todo está bien, devuelve la URL
  // 4. Si hay error, propaga el mensaje al usuario
  //
  // ¿CUÁNDO SE USA?
  // - En sendToWebhook() antes de enviar los archivos
  // - Cada vez que se procesa una cobranza
  // ========================================
  const getWebhookUrlFromDB = async (companyId) => {
    try {
      console.log('[Dashboard] Obteniendo URL de webhook para empresa:', companyId);
      
      // ========================================
      // Llamar a la API route interna
      // NOTA: No necesitamos autenticación adicional aquí porque
      // las cookies de sesión se envían automáticamente
      // ========================================
      const response = await fetch('/api/get-webhook-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });

      // ========================================
      // Manejo de respuestas de error
      // La API puede devolver: 401 (no auth), 403 (no permisos), 
      // 404 (no webhook), 500 (error servidor)
      // ========================================
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Dashboard] Error obteniendo webhook URL:', {
          status: response.status,
          error: errorData.error
        });
        
        // Mensajes de error personalizados según el código
        if (response.status === 401) {
          throw new Error('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a esta empresa.');
        } else if (response.status === 404) {
          throw new Error('No se encontró un webhook activo para la empresa. Contacta al administrador.');
        } else {
          throw new Error(errorData.error || 'Error obteniendo la configuración del webhook.');
        }
      }

      // ========================================
      // Extraer y validar la URL
      // ========================================
      const { url } = await response.json();
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        console.error('[Dashboard] URL de webhook inválida recibida:', url);
        throw new Error('La URL del webhook es inválida. Contacta al administrador.');
      }

      console.log('[Dashboard] URL de webhook obtenida exitosamente');
      return url;
      
    } catch (error) {
      // ========================================
      // Manejo de errores de red o inesperados
      // ========================================
      console.error('[Dashboard] Error en getWebhookUrlFromDB:', error);
      
      // Si el error ya tiene un mensaje personalizado, usarlo
      if (error.message) {
        throw error;
      }
      
      // Error genérico para casos no manejados
      throw new Error('Error de conexión al obtener la configuración. Intenta nuevamente.');
    }
  };

  // Función para enviar al webhook
  const sendToWebhook = async (webhookCallId) => {
    const formData = new FormData();
    
    // Agregar webhook_call_id
    formData.append('webhook_call_id', webhookCallId);
    
    // Archivos
    formData.append('file', selectedFile);
    if (selectedContactsFile) {
      formData.append('contactsFile', selectedContactsFile);
      formData.append('hasUpdatedContacts', 'true');
    } else {
      formData.append('hasUpdatedContacts', 'false');
    }
    
    // Configuración
    formData.append('estrategia_envio', strategy);
    formData.append('dias_anticipacion_vencimiento', includeUpcoming ? daysInput : 0);
    formData.append('timestamp', new Date().toISOString());
    
    // Información de la empresa
    formData.append('empresa_id', empresaActual.id);
    formData.append('empresa_nombre', empresaActual.nombre);
    formData.append('empresa_monedas', JSON.stringify(empresaActual.monedas));
    formData.append('empresa_paises_telefono', JSON.stringify(empresaActual.paises_telefono));
    formData.append('empresa_admin_email', empresaActual.admin_email);
    formData.append('empresa_country', empresaActual.country);

    // === NUEVO: Obtener la URL del webhook desde la tabla webhooks ===
    const webhookUrl = await getWebhookUrlFromDB(empresaActual.id);
    console.log('URL del webhook que se usará (desde tabla webhooks):', webhookUrl);
    if (!webhookUrl || typeof webhookUrl !== 'string' || webhookUrl.trim() === '') {
      throw new Error('No se encontró la URL del webhook para la empresa en la tabla webhooks. Verifica la configuración.');
    }

    // Debug info
    console.log('=== ENVIANDO A WEBHOOK ===');
    console.log('Webhook Call ID:', webhookCallId);
    console.log('Empresa:', empresaActual.nombre);
    console.log('Estrategia:', strategy);

    const fullWebhookUrl = `${webhookUrl}?webhook_call_id=${webhookCallId}`;
    const response = await fetch(fullWebhookUrl, {
      method: 'POST',
      body: formData
    });

    console.log('📡 Respuesta del webhook:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  };

  // Procesar cobranza - Función principal mejorada
  const processFile = async () => {
    if (!canProcess()) return;

    setProcessing(true);
    setCurrentProgressStep('validating');
    setStatusMessage({
      show: true,
      type: 'info',
      title: textos.preparando,
      content: 'Analizando archivos...',
      progress: true
    });

    // Generar webhook_call_id una sola vez
    const webhookCallId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Webhook Call ID generado:', webhookCallId);
    
    let logId = null;
    const startTime = new Date();

    try {
      // PASO 1: Crear log inicial
      try {
        const logData = await createProcessingLog(webhookCallId, startTime);
        logId = logData.id;
        console.log('✅ Log creado exitosamente:', logId);
      } catch (logError) {
        console.error('❌ Error crítico al crear log:', logError);
        throw new Error('No se pudo inicializar el procesamiento. Por favor, intenta nuevamente.');
      }

      // AGREGAR AQUÍ EL TIMEOUT
      setTimeout(async () => {
        if (logId) {
          try {
            const response = await fetch(`/api/processing-status/${logId}`);
            const data = await response.json();
            
            if (data.status === 'processing') {
              // Aún procesando después de 5 minutos = error
              await updateProcessingLog(logId, 'error');
              console.log('⚠️ Proceso marcado como error por timeout');
            }
          } catch (error) {
            console.error('Error verificando timeout:', error);
          }
        }
      }, 300000); // 5 minutos

      // Simular progreso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // PASO 2: Cambiar a enviando
      setCurrentProgressStep('sending');
      setStatusMessage({
        show: true,
        type: 'info',
        title: textos.enviando,
        content: 'Enviando archivos para procesamiento...',
        progress: true
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // PASO 3: Enviar al webhook
      try {
        await sendToWebhook(webhookCallId);
      } catch (webhookError) {
        console.error('❌ Error al enviar al webhook:', webhookError);
        
        // Actualizar log con error
        if (logId) {
          await updateProcessingLog(logId, 'error');
        }
        
        throw new Error(`Error al comunicarse con el servidor de procesamiento: ${webhookError.message}`);
      }

      // PASO 4: Procesamiento exitoso
      setCurrentProgressStep('completed');
      
      // Actualizar log como completado
      if (logId) {
        await updateProcessingLog(logId, 'success');
      }
      
      // Guardar resumen del procesamiento
      const resumenProcesamiento = {
        archivo: selectedFile.name,
        registros: fileValidationResult.totalRows || 0,
        registrosValidos: fileValidationResult.validRows || (fileValidationResult.totalRows - (fileValidationResult.errors?.length || 0)),
        advertencias: fileValidationResult.warnings || 0,
        estrategia: getStrategyName(strategy),
        empresa: empresaActual.nombre,
        timestamp: new Date().toISOString(),
        diasAnticipacion: includeUpcoming ? daysInput : 0,
        archivoContactos: selectedContactsFile?.name || null,
        contactosActualizados: updateContacts,
        idioma: idioma,
        // Estructura detallada
        facturas: {
          fileName: selectedFile.name,
          totalRecords: fileValidationResult.totalRows || 0,
          validRecords: fileValidationResult.validRows || (fileValidationResult.totalRows - (fileValidationResult.errors?.length || 0)),
          invalidRecords: fileValidationResult.errors?.length || 0
        },
        contactos: selectedContactsFile ? {
          fileName: selectedContactsFile.name,
          totalRecords: contactsValidationResult?.totalRows || 0,
          validRecords: contactsValidationResult ? (contactsValidationResult.validRows || (contactsValidationResult.totalRows - (contactsValidationResult.errors?.length || 0))) : 0,
          invalidRecords: contactsValidationResult?.errors?.length || 0
        } : null
      };
      
      // Guardar en localStorage
      localStorage.setItem('ultimoProcesamiento', JSON.stringify(resumenProcesamiento));
      
      console.log('🔵 Procesamiento completado, redirigiendo...');

      // Mostrar mensaje de éxito
      setStatusMessage({
        show: true,
        type: 'success',
        title: textos.completado,
        content: 'Redirigiendo a página de confirmación...',
        progress: false
      });
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push('/collections/success');
      }, 1500);
      
    } catch (error) {
      // Manejo centralizado de errores
      console.error('Error en procesamiento:', error);
      
      // Actualizar log con error si existe
      if (logId) {
        try {
          await updateProcessingLog(logId, 'error');
        } catch (updateError) {
          console.error('Error al actualizar log de error:', updateError);
        }
      }

      // Mostrar mensaje de error al usuario
      setStatusMessage({
        show: true,
        type: 'error',
        title: 'Error en el procesamiento',
        content: error.message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        progress: false
      });
      
      setProcessing(false);
    }
  };

  const getStrategyName = (strategyId) => {
    const names = {
      'whatsapp_primero': textos.whatsappPrioritario,
      'ambos_canales': textos.ambosCanales,
      'solo_whatsapp': textos.soloWhatsapp,
      'solo_email': textos.soloEmail
    };
    return names[strategyId] || strategyId;
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedContactsFile(null);
    setFileValidationResult(null);
    setContactsValidationResult(null);
    setIncludeUpcoming(false);
    setUpdateContacts(false);
    setDaysInput(7);
    setStatusMessage({ show: false });
    setCurrentProgressStep('');
    setShowColumns({ facturas: false, contactos: false });
    setShowDaysDetail(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Si no hay empresa actual o está cargando, mostrar loading
  if (!empresaActual || isLoadingEmpresa) {
    return (
      <div className="app-container">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Cargando información de la empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        {/* Header mejorado con diseño profesional */}
        <div className="app-header">
          {/* Barra superior con logo y controles */}
          <div className="top-bar">
            <img 
              src="/Logo-Coggni.png" 
              alt="Coggni" 
              className="coggni-logo"
            />
            <div className="top-controls">
              {empresaActual.idiomas_disponibles.length > 1 && <LanguageSelector />}
              <ThemeToggle />
            </div>
          </div>
          
          {/* Información de la empresa */}
          <div className="company-section">
            <div className="company-header">
              <div className="company-logo-wrapper">
                <img 
                  key={logoKey} // Forzar re-render cuando cambia empresa
                  src={`/company-logos/${empresaActual.id}.png`}
                  alt={`${empresaActual.nombre} Logo`} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  className="company-logo-img"
                />
                <div className="company-logo-fallback" style={{ display: 'none' }}>
                  <span>{empresaActual.nombre.charAt(0)}</span>
                </div>
              </div>
              
              <div className="company-details">
                <h1 className="company-name">{empresaActual.nombre}</h1>
                <p className="company-info">
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {usuarioActual}
                  </span>
                  <span className="info-separator">•</span>
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {empresaActual.paises_telefono.join(', ')}
                  </span>
                  <span className="info-separator">•</span>
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    {empresaActual.monedas.join(' / ')}
                  </span>
                </p>
              </div>
              
              <button onClick={handleLogout} className="logout-button-modern">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="logout-text">{textos.cerrarSesion}</span>
              </button>
            </div>
          </div>
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
          
          <FileUploadZone
            type="facturas"
            file={selectedFile}
            onFileSelect={setSelectedFile}
            onValidationComplete={handleFileValidation}
            onRemove={() => {
              setSelectedFile(null);
              setFileValidationResult(null);
            }}
          />

          <div className="columns-info">
            <div 
              className={`columns-toggle ${showColumns.facturas ? 'expanded' : ''}`}
              onClick={() => toggleColumns('facturas')}
            >
              {textos.columnasRequeridas} <span className="columns-toggle-arrow">▼</span>
            </div>
            
            {showColumns.facturas && (
              <div className="columns-content visible">
                <strong>{textos.columnasRequeridasArchivo}</strong>
                <div className="columns-tags">
                  {Object.entries(empresaActual.campos_facturas).map(([key, campo], idx) => {
                    // Si es moneda y solo hay una, no mostrar como requerido
                    const isRequired = key === 'mon' && empresaActual.monedas.length === 1 
                      ? false 
                      : campo.requerido;
                    
                    return campo.nombre ? (
                      <span key={idx} className="column-tag">
                        {campo.nombre}{isRequired ? ' *' : ''}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estrategia de Envío - Solo mostrar si la empresa tiene email disponible */}
        {hasFieldOfType(empresaActual.campos_contactos, 'email') && (
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
                  role="radio"
                  aria-checked={strategy === opcion.id}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={opcion.id}
                    checked={strategy === opcion.id}
                    onChange={(e) => setStrategy(e.target.value)}
                    aria-label={opcion.titulo}
                  />
                  
                  <div className="strategy-header">
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
        )}

        {/* Incluir facturas próximas a vencer */}
        <OptionalSection
          title={textos.incluirProximas}
          description={textos.cuandoApagado}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6V12L16 14"/>
            </svg>
          }
          isOpen={includeUpcoming}
          onToggle={handleIncludeUpcomingToggle}
        >
          <div className="days-input-section">
            <div className="days-input-intro">
              <strong>{textos.anticipacionVencimientos}</strong><br/>
              {textos.anticipacionIntro}
              <span style={{ marginLeft: '8px' }}>
                <span className="number-input-container" style={{ display: 'inline-block', width: '80px' }}>
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
                    aria-label="Días de anticipación"
                  />
                  <div className="number-controls">
                    <button className="number-control" onClick={incrementDays} aria-label="Aumentar días">▲</button>
                    <button className="number-control" onClick={decrementDays} aria-label="Disminuir días">▼</button>
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
        </OptionalSection>

        {/* Base de Contactos Opcional */}
        <OptionalSection
          title={textos.actualizarContactos}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8V14M23 11H17"/>
            </svg>
          }
          isOpen={updateContacts}
          onToggle={handleUpdateContactsToggle}
        >
          <div className="optional-note">
            <strong>💡 {textos.nota}:</strong> {textos.actualizarDesc}
          </div>
          
          <FileUploadZone
            type="contactos"
            file={selectedContactsFile}
            onFileSelect={setSelectedContactsFile}
            onValidationComplete={handleContactsValidation}
            onRemove={() => {
              setSelectedContactsFile(null);
              setContactsValidationResult(null);
            }}
          />

          <div className="columns-info">
            <div 
              className={`columns-toggle ${showColumns.contactos ? 'expanded' : ''}`}
              onClick={() => toggleColumns('contactos')}
            >
              {textos.columnasRequeridas} <span className="columns-toggle-arrow">▼</span>
            </div>
            
            {showColumns.contactos && (
              <div className="columns-content visible">
                <strong>{textos.columnasRequeridasActualizar}</strong>
                <div className="columns-tags">
                  {Object.values(empresaActual.campos_contactos).map((campo, idx) => (
                    campo.nombre ? (
                      <span key={idx} className="column-tag">
                        {campo.nombre}{campo.requerido ? ' *' : ''}
                      </span>
                    ) : null
                  ))}
                </div>
              </div>
            )}
          </div>
        </OptionalSection>

        {/* Resumen y Botón */}
        <div className="process-section">
          {selectedFile && (
            <div className="process-summary" style={{ display: 'block' }}>
              <h3>{textos.resumenConfig}</h3>
              <div className="summary-content">
                <div className="summary-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
                    <path d="M9 11l3 3L22 4"/>
                  </svg>
                  <span><strong>{textos.archivo}:</strong> {selectedFile.name}</span>
                </div>
                {/* Solo mostrar estrategia si la empresa tiene email */}
                {hasFieldOfType(empresaActual.campos_contactos, 'email') && (
                  <div className="summary-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
                      <path d="M9 11l3 3L22 4"/>
                    </svg>
                    <span><strong>{textos.estrategia}:</strong> {getStrategyName(strategy)}</span>
                  </div>
                )}
                <div className="summary-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
                    <path d="M9 11l3 3L22 4"/>
                  </svg>
                  <span>
                    <strong>{textos.recordatorios}:</strong> {includeUpcoming ? `${daysInput} ${textos.dias} de anticipación` : textos.soloFacturasVencidas}
                  </span>
                </div>
                {selectedContactsFile && (
                  <div className="summary-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
                      <path d="M9 11l3 3L22 4"/>
                    </svg>
                    <span><strong>{textos.contactos}:</strong> {selectedContactsFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button
            onClick={processFile}
            disabled={!canProcess() || processing}
            className="process-button"
            aria-label="Procesar cobranza"
          >
            {processing ? textos.procesando : textos.procesarCobranza}
          </button>
        </div>

        {statusMessage.show && (
          <div className={`status-message ${statusMessage.type}`} style={{ display: 'block' }} role="status" aria-live="polite">
            <div className="status-title">{statusMessage.title}</div>
            <div className="status-content" style={{ whiteSpace: 'pre-line' }}>{statusMessage.content}</div>
            {statusMessage.progress && (
              <div className="status-progress" style={{ display: 'flex' }}>
                <div className={`progress-step ${currentProgressStep === 'validating' ? 'active' : ''} ${['sending', 'completed'].includes(currentProgressStep) ? 'completed' : ''}`}>
                  <span className="progress-dot"></span>
                  <span>{textos.preparando}</span>
                </div>
                <div className={`progress-step ${currentProgressStep === 'sending' ? 'active' : ''} ${currentProgressStep === 'completed' ? 'completed' : ''}`}>
                  <span className="progress-dot"></span>
                  <span>{textos.enviando}</span>
                </div>
                <div className={`progress-step ${currentProgressStep === 'completed' ? 'active completed' : ''}`}>
                  <span className="progress-dot"></span>
                  <span>{textos.completadoEstado}</span>
                </div>
              </div>
            )}
          </div>
        )}
        <style jsx>{`
          .app-header {
            background: var(--bg-primary);
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 24px;
            overflow: hidden;
          }

          .top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
          }

          .coggni-logo {
            height: 40px;
            width: auto;
            object-fit: contain;
          }

          .top-controls {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .company-section {
            padding: 24px;
          }

          .company-header {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }

          .company-logo-wrapper {
            position: relative;
            width: 80px;
            height: 80px;
            flex-shrink: 0;
          }

          .company-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 16px;
            background: white;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .company-logo-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            color: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .company-details {
            flex: 1;
            min-width: 0;
          }

          .company-name {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.2;
          }

          .company-info {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-secondary);
            font-size: 14px;
            flex-wrap: wrap;
          }

          .info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .info-item svg {
            opacity: 0.6;
          }

          .info-separator {
            color: var(--border-color);
          }

          .logout-button-modern {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            color: var(--text-primary);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            white-space: nowrap;
          }

          .logout-button-modern:hover {
            background: var(--bg-hover);
            border-color: var(--primary-color);
            color: var(--primary-color);
          }

          .logout-text {
            display: inline;
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .app-header {
              border-radius: 0;
              margin: -16px -16px 20px -16px;
            }

            .top-bar {
              padding: 12px 16px;
            }

            .coggni-logo {
              height: 32px;
            }

            .company-section {
              padding: 20px 16px;
            }

            .company-header {
              flex-direction: column;
              text-align: center;
              gap: 16px;
            }

            .company-logo-wrapper {
              width: 72px;
              height: 72px;
              margin: 0 auto;
            }

            .company-name {
              font-size: 24px;
            }

            .company-info {
              justify-content: center;
              font-size: 13px;
            }

            .info-separator {
              display: none;
            }

            .info-item {
              padding: 4px 8px;
              background: var(--bg-secondary);
              border-radius: 20px;
            }

            .logout-button-modern {
              width: 100%;
              justify-content: center;
              margin-top: 16px;
            }

            .logout-text {
              display: none;
            }

            .logout-button-modern svg {
              margin: 0;
            }
          }

          @media (max-width: 480px) {
            .top-controls {
              gap: 8px;
            }

            .company-logo-wrapper {
              width: 64px;
              height: 64px;
            }

            .company-name {
              font-size: 22px;
            }
          }

          /* Dark mode adjustments */
          [data-theme="dark"] .app-header {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          [data-theme="dark"] .company-logo-img {
            background: var(--bg-secondary);
          }

          [data-theme="dark"] .logout-button-modern:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}