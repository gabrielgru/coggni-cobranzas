'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../layout';

export default function SuccessPage() {
  const router = useRouter();
  const { session } = useSession();
  const [processingData, setProcessingData] = useState(null);

  useEffect(() => {
    // Recuperar datos del procesamiento
    const savedData = sessionStorage.getItem('ultimoProcesamiento');
    if (savedData) {
      setProcessingData(JSON.parse(savedData));
      // Limpiar después de mostrar
      sessionStorage.removeItem('ultimoProcesamiento');
    } else {
      // Si no hay datos, redirigir a collections
      router.push('/collections');
    }
  }, [router]);

  const getStrategyDisplay = (strategy) => {
    const strategies = {
      'whatsapp_primero': { icon: '📱➔📧', name: 'WhatsApp prioritario' },
      'ambos_canales': { icon: '📱+📧', name: 'Ambos canales' },
      'solo_whatsapp': { icon: '📱', name: 'Solo WhatsApp' },
      'solo_email': { icon: '📧', name: 'Solo Email' }
    };
    return strategies[strategy] || { icon: '📨', name: strategy };
  };

  if (!processingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const strategyInfo = getStrategyDisplay(processingData.estrategia);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Procesamiento Exitoso!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Los recordatorios han sido enviados a procesamiento
          </p>
        </div>

        {/* Processing Summary */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resumen del Procesamiento
            </h2>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Company Info */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Empresa:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {processingData.empresa}
              </span>
            </div>

            {/* Files Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Archivos Procesados
              </h3>
              
              {/* Main File */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {processingData.archivoFacturas.fileName}
                    </p>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{processingData.archivoFacturas.totalRecords} registros totales</span>
                      <span className="mx-2">•</span>
                      <span className="text-green-600 dark:text-green-400">
                        {processingData.archivoFacturas.validRecords} válidos
                      </span>
                      {processingData.archivoFacturas.invalidRecords > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-red-600 dark:text-red-400">
                            {processingData.archivoFacturas.invalidRecords} con errores
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts File if exists */}
              {processingData.archivoContactos && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👥</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {processingData.archivoContactos.fileName}
                      </p>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>{processingData.archivoContactos.totalRecords} contactos</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600 dark:text-green-400">
                          {processingData.archivoContactos.validRecords} actualizados
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estrategia de envío:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{strategyInfo.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {strategyInfo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            {(processingData.incluyeProximas || processingData.actualizaContactos) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Opciones adicionales
                </h3>
                <div className="space-y-1">
                  {processingData.incluyeProximas && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Incluye facturas por vencer ({processingData.diasProximas} días)</span>
                    </div>
                  )}
                  {processingData.actualizaContactos && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Actualización de contactos activada</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Procesado el {new Date(processingData.timestamp).toLocaleString()}
              </p>
              <button
                onClick={() => router.push('/collections')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Nueva carga
                <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Los mensajes están siendo procesados. Recibirás una confirmación por email cuando se complete el envío.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}