// ========================================
// THEME TOGGLE MEJORADO
// Qué hace: Botón de cambio de tema con mejor contraste
// Por qué: La luna no se veía bien en dark mode
// ========================================

'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-button" 
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <div className="toggle-wrapper">
        {/* Sol para modo claro */}
        <svg 
          className={`toggle-icon sun-icon ${theme === 'light' ? 'active' : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        
        {/* Luna para modo oscuro */}
        <svg 
          className={`toggle-icon moon-icon ${theme === 'dark' ? 'active' : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>

      <style jsx>{`
        .theme-toggle-button {
          position: relative;
          width: 44px;
          height: 44px;
          padding: 0;
          background: var(--sage-100, #dad7cd);
          border: 1px solid var(--dashboard-border, #e5e5e5);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mejora el contraste en dark mode */
        :global([data-theme="dark"]) .theme-toggle-button {
          background: var(--forest-500, #344e41);
          border-color: var(--forest-400, #3a5a40);
        }

        .theme-toggle-button:hover {
          transform: scale(1.05);
          background: var(--sage-200, #a3b18a);
        }

        :global([data-theme="dark"]) .theme-toggle-button:hover {
          background: var(--forest-400, #3a5a40);
        }

        .theme-toggle-button:active {
          transform: scale(0.95);
        }

        .toggle-wrapper {
          position: relative;
          width: 20px;
          height: 20px;
        }

        .toggle-icon {
          position: absolute;
          top: 0;
          left: 0;
          transition: all 0.3s ease;
          color: var(--forest-400, #3a5a40);
        }

        /* Icono activo en light mode */
        .toggle-icon.sun-icon.active {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .toggle-icon.sun-icon:not(.active) {
          opacity: 0;
          transform: scale(0.8) rotate(180deg);
        }

        /* Icono activo en dark mode - MEJORADO */
        :global([data-theme="dark"]) .toggle-icon.moon-icon.active {
          opacity: 1;
          transform: scale(1) rotate(0deg);
          color: var(--sage-100, #dad7cd); /* Color claro para mejor contraste */
        }

        .toggle-icon.moon-icon:not(.active) {
          opacity: 0;
          transform: scale(0.8) rotate(-180deg);
        }

        /* Animación suave */
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Focus styles para accesibilidad */
        .theme-toggle-button:focus-visible {
          outline: 2px solid var(--forest-300, #588157);
          outline-offset: 2px;
        }

        /* Versión minimalista alternativa si prefieres */
        .theme-toggle-button.minimal {
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
        }

        .theme-toggle-button.minimal:hover {
          background: var(--dashboard-hover);
        }
      `}</style>
    </button>
  );
}