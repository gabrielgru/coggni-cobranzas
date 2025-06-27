'use client';

export default function OptionalSection({ title, isOpen, onToggle, children }) {
  return (
    <div className={`optional-section ${isOpen ? 'open' : ''}`}>
      <button
        className="section-toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="toggle-title">{title}</span>
        <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
      </button>
      
      {isOpen && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}