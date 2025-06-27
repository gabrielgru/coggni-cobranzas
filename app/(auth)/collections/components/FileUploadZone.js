'use client';

import { useCallback } from 'react';

export default function FileUploadZone({
  onFileSelect,
  acceptedFormats,
  maxSizeMB,
  selectedFile,
  validationResult,
  requiredColumns,
  textos,
  fileInputRef,
  isSecondary = false
}) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload-section ${isSecondary ? 'secondary' : ''}`}>
      <div
        className={`file-drop-zone ${selectedFile ? 'has-file' : ''} ${validationResult && !validationResult.isValid ? 'error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        {!selectedFile ? (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">{textos.arrastraArchivo}</p>
            <p className="upload-subtext">{textos.oHazClick}</p>
            <p className="upload-formats">
              {textos.formatosAceptados}: {acceptedFormats.join(', ')} ({textos.maximo} {maxSizeMB}MB)
            </p>
          </>
        ) : (
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
              {validationResult && (
                <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                  {validationResult.isValid ? (
                    <>
                      <p className="success-message">✅ {textos.archivoValido}</p>
                      {validationResult.totalRows && (
                        <p className="file-stats">
                          {textos.total}: {validationResult.totalRows} {textos.filas} | 
                          {textos.validas}: {validationResult.validRows || validationResult.totalRows}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="error-message">❌ {validationResult.error || textos.archivoInvalido}</p>
                      {validationResult.missingColumns?.length > 0 && (
                        <div className="missing-columns">
                          <p>{textos.columnasFaltantes}:</p>
                          <ul>
                            {validationResult.missingColumns.map((col, idx) => (
                              <li key={idx}>{col}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              className="remove-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              title={textos.eliminarArchivo}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      {requiredColumns && requiredColumns.length > 0 && (
        <div className="required-columns-info">
          <p className="info-title">{textos.columnasRequeridas}:</p>
          <div className="columns-list">
            {requiredColumns.map((col, idx) => (
              <span key={idx} className="column-tag">{col}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}