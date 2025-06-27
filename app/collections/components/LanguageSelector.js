'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LANGUAGE_OPTIONS = {
  es: { label: 'Español', flag: '🇪🇸' },
  en: { label: 'English', flag: '🇺🇸' }
};

export default function LanguageSelector() {
  const { idioma, changeIdioma, empresaActual } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Solo mostrar si la empresa tiene múltiples idiomas
  if (!empresaActual || empresaActual.idiomas_disponibles.length <= 1) {
    return null;
  }

  const currentLanguage = LANGUAGE_OPTIONS[idioma] || LANGUAGE_OPTIONS.es;

  return (
    <div className="language-selector-container" ref={dropdownRef}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar idioma"
        aria-expanded={isOpen}
      >
        <span className="language-icon">🌐</span>
        <span className="language-code">{idioma.toUpperCase()}</span>
        <svg 
          className={`language-arrow ${isOpen ? 'open' : ''}`} 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {empresaActual.idiomas_disponibles.map(lang => {
            const option = LANGUAGE_OPTIONS[lang];
            if (!option) return null;
            
            return (
              <button
                key={lang}
                className={`language-option ${lang === idioma ? 'active' : ''}`}
                onClick={() => {
                  changeIdioma(lang);
                  setIsOpen(false);
                }}
              >
                <span className="language-flag">{option.flag}</span>
                <span className="language-label">{option.label}</span>
                {lang === idioma && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .language-selector-container {
          position: relative;
        }

        .language-selector-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .language-selector-button:hover {
          background-color: var(--bg-tertiary);
          border-color: var(--primary-color);
        }

        .language-icon {
          font-size: 16px;
          line-height: 1;
        }

        .language-code {
          font-weight: 600;
        }

        .language-arrow {
          transition: transform 0.2s ease;
        }

        .language-arrow.open {
          transform: rotate(180deg);
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 160px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px var(--shadow-color);
          overflow: hidden;
          z-index: 50;
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
        }

        .language-option:hover {
          background-color: var(--bg-secondary);
        }

        .language-option.active {
          background-color: var(--bg-secondary);
          color: var(--primary-color);
          font-weight: 500;
        }

        .language-flag {
          font-size: 20px;
        }

        .language-label {
          flex: 1;
        }

        .language-option svg {
          color: var(--primary-color);
        }

        @media (max-width: 640px) {
          .language-selector-button {
            padding: 6px 10px;
            font-size: 13px;
          }
          
          .language-dropdown {
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}