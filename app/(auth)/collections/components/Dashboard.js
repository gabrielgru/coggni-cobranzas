'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FileUploadZone from './FileUploadZone';
import OptionalSection from './OptionalSection';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { translations } from '../../../utils/constants';
import { validateFile, validateRequiredColumns } from '../../../utils/fileValidation';
import { supabase } from '../../../lib/supabase';

export default function Dashboard({ empresaActual, idioma, changeIdioma }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedContactsFile, setSelectedContactsFile] = useState(null);
  const [fileValidationResult, setFileValidationResult] = useState(null);
  const [contactsValidationResult, setContactsValidationResult] = useState(null);
  const [strategy, setStrategy] = useState('whatsapp_primero');
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [updateContacts, setUpdateContacts] = useState(false);
  const [daysInput, setDaysInput] = useState(empresaActual.dias_default || 7);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ show: false });
  const [currentProgressStep, setCurrentProgressStep] = useState('');
  const fileInputRef = useRef(null);
  const contactsInputRef = useRef(null);

  const textos = translations[idioma] || translations.es;

  const handleFileSelect = async (file, isContactFile = false) => {
    try {
      if (isContactFile) {
        setSelectedContactsFile(file);
        setContactsValidationResult(null);
      } else {
        setSelectedFile(file);
        setFileValidationResult(null);
      }

      const validationResult = await validateFile(file);
      
      if (validationResult.isValid && validationResult.data) {
        const requiredColumns = isContactFile 
          ? Object.values(empresaActual.campos_contactos)
              .filter(campo => campo.requerido)
              .map(campo => campo.nombre)
          : Object.values(empresaActual.campos_facturas)
              .filter(campo => campo.requerido)
              .map(campo => campo.nombre);

        const columnValidation = validateRequiredColumns(
          validationResult.headers,
          requiredColumns
        );

        validationResult.hasRequiredColumns = columnValidation.isValid;
        validationResult.missingColumns = columnValidation.missingColumns;
        validationResult.foundColumns = columnValidation.foundColumns;

        // Validación de filas
        const validRows = validationResult.data.filter(row => {
          return requiredColumns.every(col => row[col] && row[col].toString().trim() !== '');
        });

        validationResult.validRows = validRows.length;
        validationResult.errors = [];
        
        if (validRows.length < validationResult.data.length) {
          validationResult.errors.push({
            type: 'data',
            message: `${validationResult.data.length - validRows.length} filas tienen campos requeridos vacíos`
          });
        }
      }

      if (isContactFile) {
        setContactsValidationResult(validationResult);
      } else {
        setFileValidationResult(validationResult);
      }

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      const errorResult = {
        isValid: false,
        error: error.message
      };
      
      if (isContactFile) {
        setContactsValidationResult(errorResult);
      } else {
        setFileValidationResult(errorResult);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !fileValidationResult?.isValid) {
      alert(textos.porFavorSeleccioneArchivo);
      return;
    }

    setProcessing(true);
    setStatusMessage({
      show: true,
      type: 'info',
      title: textos.procesando,
      content: textos.preparandoEnvio,
      progress: true
    });

    try {
      // Generar webhook_call_id único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const webhookCallId = `upload_${timestamp}_${randomStr}`;

      // Crear log inicial en Supabase
      let logId = null;
      if (supabase) {
        try {
          const { data: logData, error: logError } = await supabase
            .from('processing_logs')
            .insert({
              webhook_call_id: webhookCallId,
              company_id: empresaActual.id,
              status: 'processing',
              processing_status: 'uploading',
              total_records: fileValidationResult?.totalRows || 0,
              company_name: empresaActual.nombre,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (logError) {
            console.error('Error creando log:', logError);
          } else {
            logId = logData.id;
          }
        } catch (err) {
          console.error('Error con Supabase:', err);
        }
      }

      setCurrentProgressStep('Preparando archivos...');

      const formData = new FormData();
      formData.append('empresa_id', empresaActual.id);
      formData.append('recordatorioArchivo', selectedFile);
      formData.append('estrategia_envio', strategy);
      formData.append('idioma_mensajes', idioma);
      formData.append('solo_con_telefono', strategy === 'solo_whatsapp' ? 'true' : 'false');
      formData.append('solo_con_email', strategy === 'solo_email' ? 'true' : 'false');

      if (selectedContactsFile) {
        formData.append('contactosArchivo', selectedContactsFile);
      }

      if (includeUpcoming) {
        formData.append('dias_preventivo', daysInput.toString());
      }

      setCurrentProgressStep('Enviando a procesamiento...');

      // Webhook URL con query parameter
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
                        'https://gabrielgru.app.n8n.cloud/webhook-test/cobranza-multiempresa';
      
      const response = await fetch(`${webhookUrl}?webhook_call_id=${webhookCallId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      setCurrentProgressStep('Procesamiento iniciado exitosamente');

      // Guardar resumen para página de éxito
      const resumenProcesamiento = {
        timestamp: new Date().toISOString(),
        empresa: empresaActual.nombre,
        totalFacturas: fileValidationResult?.totalRows || 0,
        estrategia: strategy,
        incluyeProximas: includeUpcoming,
        diasProximas: includeUpcoming ? daysInput : null,
        actualizaContactos: updateContacts,
        archivoFacturas: {
          fileName: selectedFile.name,
          totalRecords: fileValidationResult?.totalRows || 0,
          validRecords: fileValidationResult?.validRows || 0,
          invalidRecords: fileValidationResult?.errors?.length || 0
        },
        archivoContactos: selectedContactsFile ? {
          fileName: selectedContactsFile.name,
          totalRecords: contactsValidationResult?.totalRows || 0,
          validRecords: contactsValidationResult?.validRows || 0,
          invalidRecords: contactsValidationResult?.errors?.length || 0
        } : null
      };

      // Guardar en sessionStorage (más seguro que localStorage)
      sessionStorage.setItem('ultimoProcesamiento', JSON.stringify(resumenProcesamiento));

      setStatusMessage({
        show: true,
        type: 'success',
        title: textos.completado,
        content: 'Redirigiendo a página de confirmación...',
        progress: false
      });

      setTimeout(() => {
        router.push('/collections/success');
      }, 1500);

    } catch (error) {
      // Actualizar log con error
      if (supabase && logId) {
        try {
          await supabase
            .from('processing_logs')
            .update({
              status: 'error',
              processing_status: 'error',
              completed_at: new Date().toISOString(),
              error_details: { message: error.message },
              updated_at: new Date().toISOString()
            })
            .eq('id', logId);
        } catch (err) {
          console.error('Error al actualizar log:', err);
        }
      }

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
        {/* Header controls */}
        <div className="header-controls">
          {empresaActual.idiomas_disponibles.length > 1 && <LanguageSelector />}
          <ThemeToggle />
        </div>
        
        {/* Header de empresa */}
        <div className="header">
          <h1 className="main-title gradient-primary">{empresaActual.nombre}</h1>
          <p className="subtitle">{textos.sistemaCobros}</p>
        </div>

        {/* Panel principal */}
        <div className="upload-container glass-effect">
          <h2 className="section-title">
            <span className="icon">📋</span>
            {textos.recordatoriosVencidos}
          </h2>

          <FileUploadZone
            onFileSelect={(file) => handleFileSelect(file, false)}
            acceptedFormats={['.xlsx', '.xls', '.csv']}
            maxSizeMB={10}
            selectedFile={selectedFile}
            validationResult={fileValidationResult}
            requiredColumns={Object.values(empresaActual.campos_facturas)
              .filter(campo => campo.requerido)
              .map(campo => campo.nombre)}
            textos={textos}
            fileInputRef={fileInputRef}
          />

          {/* Secciones opcionales */}
          {empresaActual.usa_recordatorio_preventivo && (
            <OptionalSection
              title={
                <>
                  <span className="icon">📅</span>
                  {textos.facturasPorVencer}
                </>
              }
              isOpen={includeUpcoming}
              onToggle={() => setIncludeUpcoming(!includeUpcoming)}
            >
              <div className="preventive-section">
                <p className="info-text">{textos.incluirFacturasProximas}</p>
                <div className="days-input-group">
                  <label>{textos.diasAnticipacion}:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={daysInput}
                    onChange={(e) => setDaysInput(parseInt(e.target.value) || 7)}
                    className="days-input"
                  />
                  <span className="days-label">{textos.dias}</span>
                </div>
              </div>
            </OptionalSection>
          )}

          {/* Actualización de contactos */}
          <OptionalSection
            title={
              <>
                <span className="icon">👥</span>
                {textos.actualizarContactos}
              </>
            }
            isOpen={updateContacts}
            onToggle={() => setUpdateContacts(!updateContacts)}
          >
            <div className="contacts-update-section">
              <p className="info-text">{textos.subirArchivoContactos}</p>
              
              <FileUploadZone
                onFileSelect={(file) => handleFileSelect(file, true)}
                acceptedFormats={['.xlsx', '.xls', '.csv']}
                maxSizeMB={10}
                selectedFile={selectedContactsFile}
                validationResult={contactsValidationResult}
                requiredColumns={Object.values(empresaActual.campos_contactos)
                  .filter(campo => campo.requerido)
                  .map(campo => campo.nombre)}
                textos={textos}
                fileInputRef={contactsInputRef}
                isSecondary={true}
              />
            </div>
          </OptionalSection>

          {/* Estrategia de envío */}
          <div className="strategy-section">
            <h3 className="section-subtitle">
              <span className="icon">📨</span>
              {textos.estrategiaEnvio}
            </h3>
            <div className="strategy-grid">
              {empresaActual.whatsapp_enabled && empresaActual.email_enabled && (
                <>
                  <label className={`strategy-option ${strategy === 'whatsapp_primero' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="whatsapp_primero"
                      checked={strategy === 'whatsapp_primero'}
                      onChange={(e) => setStrategy(e.target.value)}
                    />
                    <span className="strategy-icon">📱➔📧</span>
                    <span className="strategy-name">{textos.whatsappPrioritario}</span>
                    <span className="strategy-desc">{textos.whatsappPrioritarioDesc}</span>
                  </label>
                  <label className={`strategy-option ${strategy === 'ambos_canales' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="ambos_canales"
                      checked={strategy === 'ambos_canales'}
                      onChange={(e) => setStrategy(e.target.value)}
                    />
                    <span className="strategy-icon">📱+📧</span>
                    <span className="strategy-name">{textos.ambosCanales}</span>
                    <span className="strategy-desc">{textos.ambosCanalesDesc}</span>
                  </label>
                </>
              )}
              {empresaActual.whatsapp_enabled && (
                <label className={`strategy-option ${strategy === 'solo_whatsapp' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="solo_whatsapp"
                    checked={strategy === 'solo_whatsapp'}
                    onChange={(e) => setStrategy(e.target.value)}
                  />
                  <span className="strategy-icon">📱</span>
                  <span className="strategy-name">{textos.soloWhatsapp}</span>
                  <span className="strategy-desc">{textos.soloWhatsappDesc}</span>
                </label>
              )}
              {empresaActual.email_enabled && (
                <label className={`strategy-option ${strategy === 'solo_email' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="solo_email"
                    checked={strategy === 'solo_email'}
                    onChange={(e) => setStrategy(e.target.value)}
                  />
                  <span className="strategy-icon">📧</span>
                  <span className="strategy-name">{textos.soloEmail}</span>
                  <span className="strategy-desc">{textos.soloEmailDesc}</span>
                </label>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="action-buttons">
            <button
              onClick={resetForm}
              className="btn btn-secondary"
              disabled={processing}
            >
              {textos.limpiar}
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={!selectedFile || !fileValidationResult?.isValid || processing}
            >
              {processing ? textos.procesando : textos.procesar}
            </button>
          </div>

          {/* Mensaje de estado */}
          {statusMessage.show && (
            <div className={`status-message ${statusMessage.type}`}>
              <h4>{statusMessage.title}</h4>
              <p>{statusMessage.content}</p>
              {statusMessage.progress && (
                <>
                  <div className="progress-bar">
                    <div className="progress-bar-fill"></div>
                  </div>
                  {currentProgressStep && (
                    <p className="progress-step">{currentProgressStep}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}