'use client';

import React, { useRef, useState } from 'react';
import { validateFacturasFile, validateContactsFile, generateErrorReport, downloadReport } from '../../utils/fileValidation';
import { useAuth } from '../../contexts/AuthContext';
import { TEXTOS } from '../../utils/constants';

export default function FileUploadZone({ 
  type = 'facturas', // 'facturas' o 'contactos'
  onFileSelect,
  onValidationComplete,
  file,
  onRemove
}) {
  const [dragging, setDragging] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const fileInputRef = useRef(null);
  const { empresaActual, idioma } = useAuth();
  const textos = TEXTOS[idioma].dashboard;

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor selecciona un archivo Excel o CSV válido.');
      return;
    }

    // Llamar al callback inmediatamente para mostrar el archivo
    onFileSelect(selectedFile);

    // Validar archivo según tipo
    try {
      let result;
      if (type === 'facturas') {
        result = await validateFacturasFile(selectedFile, empresaActual);
      } else {
        result = await validateContactsFile(selectedFile, empresaActual);
      }
      
      setValidationResult(result);
      onValidationComplete(result);
    } catch (error) {
      console.error('Error validando archivo:', error);
      const errorResult = {
        valid: false,
        errors: [`Error al procesar el archivo: ${error.message}`],
        warnings: []
      };
      setValidationResult(errorResult);
      onValidationComplete(errorResult);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleRemove = () => {
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  const handleDownloadReport = () => {
    if (!validationResult || !file) return;
    
    const reportContent = generateErrorReport(
      validationResult, 
      file.name,
      type === 'facturas' ? 'Facturas' : 'Contactos'
    );
    
    const fileName = `reporte_errores_${type}_${new Date().getTime()}.txt`;
    downloadReport(reportContent, fileName);
  };

  const renderValidationResults = () => {
    if (!validationResult) return null;

    if (validationResult.valid && validationResult.warnings.length === 0) {
      return (
        <div className="validation-results success">
          <div className="validation-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
              <path d="M9 11l3 3L22 4"/>
            </svg>
            {textos.archivoValido}
          </div>
          <div className="validation-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
              <path d="M9 11l3 3L22 4"/>
            </svg>
            {validationResult.totalRows} {textos.registrosEncontrados}
          </div>
        </div>
      );
    } else if (validationResult.errors.length > 0) {
      return (
        <div className="validation-results error">
          <div className="validation-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {validationResult.errors.length} {textos.erroresEncontrados}
          </div>
          <div className="validation-details">
            {validationResult.errors.slice(0, 5).map((error, idx) => (
              <div key={idx} className="validation-item">{error}</div>
            ))}
            {validationResult.errors.length > 5 && (
              <div className="validation-item">... y {validationResult.errors.length - 5} errores más</div>
            )}
          </div>
          {validationResult.errors.length > 1 && (
            <button className="download-report-btn" onClick={handleDownloadReport}>
              {textos.descargarReporte}
            </button>
          )}
        </div>
      );
    } else if (validationResult.warnings.length > 0) {
      return (
        <div className="validation-results warning">
          <div className="validation-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {validationResult.warnings.length} {textos.advertencias}
          </div>
          <div className="validation-details">
            {validationResult.warnings.slice(0, 5).map((warning, idx) => (
              <div key={idx} className="validation-item">{warning}</div>
            ))}
            {validationResult.warnings.length > 5 && (
              <div className="validation-item">... y {validationResult.warnings.length - 5} advertencias más</div>
            )}
          </div>
          {validationResult.warnings.length > 1 && (
            <button className="download-report-btn" onClick={handleDownloadReport}>
              {textos.descargarReporte}
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={`Zona para cargar archivo de ${type}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
          aria-label={`Seleccionar archivo de ${type}`}
        />
        
        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {type === 'facturas' ? (
            <path d="M7 10L12 15L17 10M12 15V3M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"/>
          ) : (
            <>
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8V14M23 11H17"/>
            </>
          )}
        </svg>
        
        <div className="upload-text">{textos.arrastrarArchivo}</div>
        <div className="upload-subtext">{textos.formatosAceptados}</div>
      </div>

      {file && (
        <div className="file-info success-animation" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="validation-icon" style={{ flexShrink: 0 }}>
            <path d="M9 11l3 3L22 4"/>
          </svg>
          <span style={{ flex: 1 }}>{file.name}</span>
          <button onClick={handleRemove} className="remove-file-btn">
            ✕ {textos.quitar}
          </button>
        </div>
      )}

      {renderValidationResults()}
    </>
  );
}