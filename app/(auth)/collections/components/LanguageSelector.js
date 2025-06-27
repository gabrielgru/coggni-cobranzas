'use client';

import { useState, useRef, useEffect } from 'react';

export default function LanguageSelector({ idioma, idiomas, onChangeIdioma }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languageFlags = {
    es: '🇪🇸',
    en: '🇬🇧',
    pt: '🇵🇹'
  };

  const languageNames = {
    es: 'Español',
    en: 'English',
    pt: 'Português'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-flag">{languageFlags[idioma] || '🌐'}</span>
        <span className="language-code">{idioma.toUpperCase()}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {idiomas.map((lang) => (
            <button
              key={lang}
              className={`language-option ${lang === idioma ? 'active' : ''}`}
              onClick={() => {
                onChangeIdioma(lang);
                setIsOpen(false);
              }}
            >
              <span className="language-flag">{languageFlags[lang] || '🌐'}</span>
              <span className="language-name">{languageNames[lang] || lang}</span>
              {lang === idioma && (
                <svg
                  className="check-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}