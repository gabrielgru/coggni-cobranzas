'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Evitar flash de contenido incorrecto
  if (!mounted) {
    return (
      <div className="theme-toggle" style={{ opacity: 0 }}>
        <div className="theme-toggle-slider">
          <div className="theme-icon" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="theme-toggle" 
      onClick={toggleTheme}
      role="button"
      aria-label="Cambiar tema"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      style={{ position: 'relative' }}
    >
      <div className={`theme-toggle-slider ${theme === 'dark' ? 'dark' : ''}`}>
        <svg 
          className="theme-icon sun-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ opacity: theme === 'light' ? 1 : 0 }}
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
        
        <svg 
          className="theme-icon moon-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ 
            position: 'absolute',
            opacity: theme === 'dark' ? 1 : 0 
          }}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>
    </div>
  );
}