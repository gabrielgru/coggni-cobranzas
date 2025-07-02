'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TEXTOS } from '../../utils/constants';
import ThemeToggle from '../../components/shared/ThemeToggle';
import LanguageSelector from '../../components/shared/LanguageSelector';
import FileUploadZone from './FileUploadZone';
import OptionalSection from './OptionalSection';
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export default function Dashboard() {
  const { usuarioActual, empresaActual, idioma, logout, changeIdioma } = useAuth();
  const router = useRouter();
  
  // TEMPORAL - Debug
  console.log('Dashboard cargado. Empresa actual:', empresaActual);
  
  // Estados principales
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedContactsFile, setSelectedContactsFile] = useState(null);
  const [fileValidationResult, setFileValidationResult] = useState(null);
  const [contactsValidationResult, setContactsValidationResult] = useState(null);
  // Si la empresa no tiene email, usar solo_whatsapp por defecto
  const [strategy, setStrategy] = useState(
    empresaActual?.campos_contactos.email?.nombre ? 'whatsapp_primero' : 'solo_whatsapp'
  );
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [daysInput, setDaysInput] = useState(7);
  const [updateContacts, setUpdateContacts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ show: false, type: '', title: '', content: '', progress: false });
  
  // Estados UI
  const [showColumns, setShowColumns] = useState({ facturas: false, contactos: false });
  const [showDaysDetail, setShowDaysDetail] = useState(false);
  const [currentProgressStep, setCurrentProgressStep] = useState('');

  const textos = TEXTOS[idioma].dashboard;

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

  // Función para crear el log inicial
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

  // Función para actualizar el log
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
    formData.append('empresa_admin_email', empresaActual.admin_email || '');

    // Debug info
    console.log('=== ENVIANDO A WEBHOOK ===');
    console.log('Webhook Call ID:', webhookCallId);
    console.log('Empresa:', empresaActual.nombre);
    console.log('Estrategia:', strategy);

    const webhookUrl = `${empresaActual.webhook_url}?webhook_call_id=${webhookCallId}`;
    const response = await fetch(webhookUrl, {
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
      title: textos.validando,
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
    setStrategy(empresaActual?.campos_contactos.email?.nombre ? 'whatsapp_primero' : 'solo_whatsapp');
    setIncludeUpcoming(false);
    setUpdateContacts(false);
    setDaysInput(7);
    setStatusMessage({ show: false });
    setCurrentProgressStep('');
  };

  return (
    <div className="app-container">
      <div className="container">
        {/* Header controls con mejor estructura para mobile */}
        <div className="header-controls" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%'
        }}>
          <img 
            src="/Logo-Coggni.png" 
            alt="Coggni" 
            className="header-logo"
            style={{
              height: '32px',
              width: 'auto',
              marginRight: 'auto'
            }}
          />
          {empresaActual.idiomas_disponibles.length > 1 && <LanguageSelector />}
          <ThemeToggle />
        </div>
        
        {/* Header de empresa */}
        <div className="header-section">
          <div className="company-logo">
            <img 
              src={`/company-logos/${empresaActual.id}.png`}
              alt={`${empresaActual.nombre} Logo`} 
              onError={(e) => {
                e.target.src = '/company-logos/default.png';
              }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                objectFit: 'contain',
                backgroundColor: 'white',
                padding: '8px'
              }}
            />
          </div>
          <h1 className="company-name">{empresaActual.nombre}</h1>
          <p className="company-info">
            {usuarioActual} | {empresaActual.paises_telefono.join(', ')} | {empresaActual.monedas.join(', ')}
          </p>

          <button onClick={logout} className="logout-button">
            {textos.cerrarSesion}
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
        {empresaActual.campos_contactos.email?.nombre && (
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
                {empresaActual?.campos_contactos.email?.nombre && (
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
                  <span>{textos.validando}</span>
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
          @media (max-width: 768px) {
            .header-logo {
              height: 28px !important;
            }
            .header-controls {
              margin-bottom: 16px;
            }
            .company-logo img {
              width: 50px !important;
              height: 50px !important;
            }
            .header-section {
              text-align: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}