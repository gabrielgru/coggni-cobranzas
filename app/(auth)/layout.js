'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '../contexts/ThemeContext';

// Session Context
const SessionContext = createContext({});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

// Session Provider
function SessionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Parsear cookie de sesión
  useEffect(() => {
    const checkSession = () => {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});

      if (cookies['coggni-session']) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(cookies['coggni-session']));
          setSession(sessionData);
        } catch (error) {
          console.error('Error parsing session:', error);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    checkSession();
  }, [router]);

  // Timer para warning de timeout (25 minutos)
  useEffect(() => {
    let warningTimer;
    let countdownInterval;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      setShowTimeoutWarning(false);
      setTimeLeft(30);

      warningTimer = setTimeout(() => {
        setShowTimeoutWarning(true);
        setTimeLeft(5 * 60); // 5 minutos restantes

        countdownInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 25 * 60 * 1000); // 25 minutos
    };

    // Reset timers en cada cambio de ruta o interacción
    resetTimers();

    const handleActivity = () => {
      if (!showTimeoutWarning) {
        resetTimers();
      }
    };

    // Escuchar eventos de actividad
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, showTimeoutWarning]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const extendSession = () => {
    setShowTimeoutWarning(false);
    // El middleware actualizará la cookie automáticamente en la próxima request
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, logout: handleLogout }}>
      {children}
      
      {/* Modal de advertencia de timeout */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Sesión por expirar
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tu sesión expirará en <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={extendSession}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Extender sesión
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}

// Layout principal
export default function AuthLayout({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header con info de sesión */}
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold gradient-text">COGGNI</h1>
                </div>
                <SessionInfo />
              </div>
            </div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SessionProvider>
    </ThemeProvider>
  );
}

// Componente de información de sesión
function SessionInfo() {
  const { session, logout } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {session.companyName}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {session.userId}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {session.companyName}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}