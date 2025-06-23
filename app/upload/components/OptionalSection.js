'use client';

import React from 'react';

export default function OptionalSection({ 
  title, 
  description, 
  icon, 
  isOpen, 
  onToggle, 
  children 
}) {
  return (
    <div className="optional-section">
      <div 
        className="optional-header" 
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div>
          <div className="optional-title">
            {icon}
            {title}
            <span className="optional-badge">Opcional</span>
          </div>
          {description && (
            <div className="optional-description">
              {description}
            </div>
          )}
        </div>
        
        <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isOpen}
            onChange={onToggle}
            aria-label={`Activar ${title}`}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      {isOpen && (
        <div className="optional-content" style={{ display: 'block' }}>
          {children}
        </div>
      )}
    </div>
  );
}