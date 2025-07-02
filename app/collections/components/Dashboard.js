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

  // Procesar cobranza
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

    // Generar webhook_call_id una sola vez AL INICIO
    const webhookCallId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Webhook Call ID generado:', webhookCallId);
    
    // Crear registro de log al iniciar
    let logId = null;
    const startTime = new Date();

    try {
      // Insertar log inicial en backend (API)
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

      const logData = result.data;
      logId = logData.id;
      console.log('✅ Log guardado exitosamente en processing_logs:');
      console.log('- ID del registro:', logId);
      console.log('- webhook_call_id:', logData.webhook_call_id);
      console.log('- Datos completos:', logData);
    } catch (err) {
      console.error('❌ Error al insertar log:', err);
      setStatusMessage({
        show: true,
        type: 'error',
        title: 'Error al iniciar procesamiento',
        content: 'No se pudo crear el registro de procesamiento. Por favor, intenta nuevamente.',
        progress: false
      });
      setProcessing(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCurrentProgressStep('sending');
    setStatusMessage({
      show: true,
      type: 'info',
      title: textos.enviando,
      content: 'Enviando archivos para procesamiento...',
      progress: true
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Preparar FormData para webhook
    const formData = new FormData();
    
    // IMPORTANTE: Agregar webhook_call_id al FormData
    formData.append('webhook_call_id', webhookCallId);
    
    formData.append('file', selectedFile);
    formData.append('estrategia_envio', strategy);
    formData.append('dias_anticipacion_vencimiento', includeUpcoming ? daysInput : 0);
    formData.append('timestamp', new Date().toISOString());
    
    // TEMPORAL - Para debugging
    console.log('=== ENVIANDO A WEBHOOK ===');
    console.log('Webhook Call ID en FormData:', webhookCallId);
    console.log('Empresa ID:', empresaActual.id);
    console.log('Empresa Nombre:', empresaActual.nombre);
    console.log('Webhook URL base:', empresaActual.webhook_url);
    console.log('URL completa con query param:', `${empresaActual.webhook_url}?webhook_call_id=${webhookCallId}`);
    
    // Agregar información de la empresa
    formData.append('empresa_id', empresaActual.id);
    formData.append('empresa_nombre', empresaActual.nombre);
    formData.append('empresa_monedas', JSON.stringify(empresaActual.monedas));
    formData.append('empresa_paises_telefono', JSON.stringify(empresaActual.paises_telefono));
    formData.append('empresa_admin_email', empresaActual.admin_email || '');
    
    if (selectedContactsFile) {
      formData.append('contactsFile', selectedContactsFile);
      formData.append('hasUpdatedContacts', 'true');
    } else {
      formData.append('hasUpdatedContacts', 'false');
    }

    // Envío real a webhook
    console.log('🚀 Enviando FormData al webhook...');
    const webhookUrl = `${empresaActual.webhook_url}?webhook_call_id=${webhookCallId}`;
    console.log('URL final:', webhookUrl);
    
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

    setCurrentProgressStep('completed');
    
    // Actualizar log como completado
    if (logId) {
      try {
        await fetch('/api/log-processing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: logId,
            status: 'success',
            processing_status: 'success',
            completed_at: new Date().toISOString(),
            messages_to_send: fileValidationResult.validRows || (fileValidationResult.totalRows - (fileValidationResult.errors?.length || 0)),
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('Error al actualizar log:', err);
      }
    }
    
    // Guardar resumen del procesamiento exitoso con estructura mejorada
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
      // Nueva estructura detallada
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
    
    // DEBUG: Verificar que se guardó
    console.log('🔵 [Dashboard] Guardando en localStorage:', resumenProcesamiento);
    const verificar = localStorage.getItem('ultimoProcesamiento');
    console.log('🔵 [Dashboard] Verificación inmediata:', verificar ? 'SÍ existe' : 'NO existe');
    console.log('🔵 [Dashboard] Redirigiendo en 1.5 segundos...');

    // Mostrar mensaje de éxito brevemente antes de redirigir
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
    // En caso de error, mantener en la misma página
    setStatusMessage({
      show: true,
      type: 'error',
      title: 'Error en el procesamiento',
      content: `Ocurrió un error: ${error.message}`,
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
  setStrategy('whatsapp_primero');
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
      <div className="header-controls">
        {empresaActual.idiomas_disponibles.length > 1 && <LanguageSelector />}
        <ThemeToggle />
      </div>
      
      {/* Header de empresa */}
      <div className="header-section">
        <div className="company-logo">🏢</div>
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
                  
                  return (
                    <span key={idx} className="column-tag">
                      {campo.nombre}{isRequired ? ' *' : ''}
                    </span>
                  );
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
                  <span key={idx} className="column-tag">
                    {campo.nombre}{campo.requerido ? ' *' : ''}
                  </span>
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
              <div className="summary-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                <span><strong>{textos.estrategia}:</strong> {getStrategyName(strategy)}</span>
              </div>
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
    </div>
  </div>
);
}