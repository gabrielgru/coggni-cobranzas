// CREAR NUEVO ARCHIVO con el siguiente contenido:

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'

const supabase = createClient()

export default function MobileDebug() {
  const [info, setInfo] = useState({
    loading: true,
    timestamp: new Date().toISOString()
  })
  
  useEffect(() => {
    const runDiagnostics = async () => {
      const diagnostics = {
        // Información del navegador
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          cookiesEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          language: navigator.language,
        },
        
        // Información del dispositivo
        device: {
          isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
          isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
          isAndroid: /Android/i.test(navigator.userAgent),
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          pixelRatio: window.devicePixelRatio,
        },
        
        // Estado del almacenamiento
        storage: {
          localStorage: testStorage('localStorage'),
          sessionStorage: testStorage('sessionStorage'),
          cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
        },
        
        // Variables de entorno
        environment: {
          nodeEnv: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
          supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        },
        
        // Estado de Supabase
        supabase: {
          clientExists: !!supabase,
          clientType: typeof supabase,
        },
        
        // Timestamp
        timestamp: new Date().toISOString(),
      }
      
      // Test de conexión a Supabase
      console.log('[MobileDebug] Testing Supabase connection...');
      const connectionTest = await testSupabaseConnection();
      diagnostics.supabase.connectionTest = connectionTest;
      
      // Intentar una query directa
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('count')
            .limit(1);
          
          diagnostics.supabase.queryTest = {
            success: !error,
            error: error?.message || null,
            hasData: !!data,
          };
        } catch (err) {
          diagnostics.supabase.queryTest = {
            success: false,
            error: err.message,
            errorType: err.constructor.name,
          };
        }
      } else {
        diagnostics.supabase.queryTest = {
          success: false,
          error: 'Supabase client is null',
        };
      }
      
      setInfo(diagnostics);
    };
    
    runDiagnostics();
  }, []);
  
  // Función helper para probar storage
  function testStorage(type) {
    try {
      const storage = window[type];
      const testKey = `test-${Date.now()}`;
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return 'Available';
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
  
  // Función para copiar al portapapeles
  const copyToClipboard = () => {
    const text = JSON.stringify(info, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('Diagnostic info copied to clipboard!');
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mobile Debug Info</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Diagnostic Information</h2>
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Copy to Clipboard
            </button>
          </div>
          
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
        
        {/* Quick status indicators */}
        <div className="grid grid-cols-2 gap-4">
          <StatusCard
            title="Supabase Client"
            status={info.supabase?.clientExists}
            detail={info.supabase?.clientExists ? 'Initialized' : 'Not initialized'}
          />
          <StatusCard
            title="Connection Test"
            status={info.supabase?.connectionTest?.success}
            detail={info.supabase?.connectionTest?.error || 'Connected'}
          />
          <StatusCard
            title="Environment"
            status={info.environment?.supabaseUrl !== 'NOT SET'}
            detail={info.environment?.nodeEnv}
          />
          <StatusCard
            title="Storage"
            status={info.storage?.localStorage === 'Available'}
            detail={info.storage?.localStorage}
          />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, status, detail }) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      status ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{detail}</p>
      <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
        status ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
      }`}>
        {status ? '✓ OK' : '✗ Error'}
      </div>
    </div>
  );
}