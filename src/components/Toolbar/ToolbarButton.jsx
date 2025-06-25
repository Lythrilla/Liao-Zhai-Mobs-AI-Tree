import React, { useState } from 'react';

const ToolbarButton = ({ onClick, title, icon, disabled = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className="tool-button-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative' }}
    >
    <button
      className={`tool-button ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          margin: '0 4px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)'
      }}
    >
      {icon}
      </button>
      
      {showTooltip && (
        <div 
          className="tooltip"
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

export default ToolbarButton; 