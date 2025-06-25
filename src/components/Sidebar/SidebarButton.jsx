import React from 'react';

const SidebarButton = ({ collapsed, toggleCollapsed }) => {
  return (
    <button 
      onClick={toggleCollapsed}
      className="sidebar-toggle-button"
      style={{
        position: 'absolute',
        top: '50%',
        right: -16,
        width: 32,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: 'none',
        borderRadius: '0 4px 4px 0',
        cursor: 'pointer',
        zIndex: 100,
        transform: 'translateY(-50%)',
        boxShadow: 'var(--shadow-1)',
        outline: 'none'
      }}
      aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 16 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `rotate(${collapsed ? 0 : 180}deg)`,
          transition: 'transform 0.3s ease'
        }}
      >
        <path 
          d="M10.5 4L6.5 8L10.5 12" 
          stroke="var(--text-primary)" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </button>
  );
};

export default SidebarButton; 