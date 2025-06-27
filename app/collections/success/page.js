'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';

export default function SuccessPage() {
  const router = useRouter();
  const { empresaActual, idioma } = useAuth();
  const [procesamiento, setProcesamiento] = useState(null);
  
  useEffect(() => {
    // Obtener datos del procesamiento desde localStorage
    const datosGuardados = localStorage.getItem('ultimoProcesamiento');
    if (datosGuardados) {
      setProcesamiento(JSON.parse(datosGuardados));
      // Limpiar localStorage después de leer
      localStorage.removeItem('ultimoProcesamiento');
    } else {
      // Si no hay datos, redirigir a collections
      router.push('/collections');
    }
  }, [router]);

  if (!procesamiento) {
    return (
      <div className="app-container">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  // Formatear fecha
  const formatearFecha = (timestamp) => {
    const fecha = new Date(timestamp);
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return fecha.toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US', opciones);
  };

  const textos = {
    es: {
      titulo: '¡Procesamiento Exitoso!',
      subtitulo: 'Tu proceso de cobranza se ha iniciado correctamente',
      resumenTitulo: '📊 Resumen del Procesamiento',
      empresa: 'Empresa',
      archivoFacturas: '📄 Archivo de Facturas',
      archivoContactos: '📋 Archivo de Contactos',
      archivo: 'Archivo',
      totalRegistros: 'Total de registros',
      registrosValidos: 'Registros válidos',
      registrosConErrores: 'Registros con errores',
      configuracion: '⚙️ Configuración',
      estrategia: 'Estrategia',
      diasAnticipacion: 'Días anticipación',
      fechaProcesamiento: 'Fecha procesamiento',
      noAplica: 'No aplica',
      proximosPasos: 'Próximos Pasos',
      paso1: 'Los mensajes se están enviando según la estrategia seleccionada',
      paso2: 'Recibirás un reporte por email cuando el proceso termine',
      paso3: 'Los clientes comenzarán a recibir los recordatorios automáticamente',
      nuevoProcesamiento: 'Nuevo Procesamiento',
      volverInicio: 'Volver al Inicio'
    },
    en: {
      titulo: 'Processing Successful!',
      subtitulo: 'Your collection process has started successfully',
      resumenTitulo: '📊 Processing Summary',
      empresa: 'Company',
      archivoFacturas: '📄 Invoice File',
      archivoContactos: '📋 Contacts File',
      archivo: 'File',
      totalRegistros: 'Total records',
      registrosValidos: 'Valid records',
      registrosConErrores: 'Records with errors',
      configuracion: '⚙️ Configuration',
      estrategia: 'Strategy',
      diasAnticipacion: 'Days in advance',
      fechaProcesamiento: 'Processing date',
      noAplica: 'Not applicable',
      proximosPasos: 'Next Steps',
      paso1: 'Messages are being sent according to the selected strategy',
      paso2: 'You will receive an email report when the process is complete',
      paso3: 'Clients will start receiving reminders automatically',
      nuevoProcesamiento: 'New Processing',
      volverInicio: 'Back to Home'
    }
  };

  const t = textos[procesamiento.idioma || idioma] || textos.es;

  return (
    <div className="app-container">
      <div className="container">
        {/* Header controls */}
        <div className="header-controls">
          {empresaActual && empresaActual.idiomas_disponibles?.length > 1 && <LanguageSelector />}
          <ThemeToggle />
        </div>

        {/* Success Icon and Message */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 30px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
          }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17L4 12"/>
            </svg>
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '10px',
            color: 'var(--text-primary)'
          }}>
            {t.titulo}
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '40px'
          }}>
            {t.subtitulo}
          </p>
        </div>

        {/* Resumen del Procesamiento */}
        <div className="section" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
            {t.resumenTitulo}
          </h2>

          {/* Empresa */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '16px' }}>
              <strong>{t.empresa}:</strong> {procesamiento.empresa}
            </div>
          </div>

          {/* Archivo de Facturas */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              {t.archivoFacturas}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.archivo}:</span> {procesamiento.facturas?.fileName || procesamiento.archivo}
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.totalRegistros}:</span> {procesamiento.facturas?.totalRecords || procesamiento.registros}
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.registrosValidos}:</span>{' '}
                <span style={{ color: '#10b981', fontWeight: '600' }}>
                  {procesamiento.facturas?.validRecords || procesamiento.registrosValidos}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.registrosConErrores}:</span>{' '}
                <span style={{ color: procesamiento.facturas?.invalidRecords > 0 ? '#ef4444' : 'inherit' }}>
                  {procesamiento.facturas?.invalidRecords || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Archivo de Contactos (si aplica) */}
          {procesamiento.contactos && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                {t.archivoContactos}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>• {t.archivo}:</span> {procesamiento.contactos.fileName}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>• {t.totalRegistros}:</span> {procesamiento.contactos.totalRecords}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>• {t.registrosValidos}:</span>{' '}
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    {procesamiento.contactos.validRecords}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>• {t.registrosConErrores}:</span>{' '}
                  <span style={{ color: procesamiento.contactos.invalidRecords > 0 ? '#ef4444' : 'inherit' }}>
                    {procesamiento.contactos.invalidRecords}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configuración */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              {t.configuracion}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.estrategia}:</span> {procesamiento.estrategia}
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.diasAnticipacion}:</span>{' '}
                {procesamiento.diasAnticipacion > 0 ? `${procesamiento.diasAnticipacion} días` : t.noAplica}
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>• {t.fechaProcesamiento}:</span> {formatearFecha(procesamiento.timestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Próximos Pasos */}
        <div className="section" style={{ maxWidth: '800px', margin: '40px auto' }}>
          <h2 style={{ marginBottom: '20px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {t.proximosPasos}
          </h2>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  1
                </div>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{t.paso1}</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  2
                </div>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{t.paso2}</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  3
                </div>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{t.paso3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginTop: '40px',
          marginBottom: '60px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => router.push('/collections')}
            className="process-button"
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '200px'
            }}
          >
            {t.nuevoProcesamiento}
          </button>
          
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '2px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '200px'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.color = 'var(--primary-color)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.color = 'var(--text-primary)';
            }}
          >
            {t.volverInicio}
          </button>
        </div>
      </div>
    </div>
  );
}