import React from 'react';
import ToolbarButton from './ToolbarButton';

const Toolbar = ({ buttons = [] }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {buttons.map((button, index) => {
          if (button.type === 'divider') {
            return (
              <div 
                key={`divider-${index}`} 
                style={{ 
                  width: '1px', 
                  height: '20px', 
                  backgroundColor: 'rgba(229, 230, 235, 0.5)', 
                  margin: '0 8px' 
                }}
              />
            );
          }
          
          // 根据按钮类型选择图标
          let icon;
          switch (button.icon) {
            case 'file-add':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="6" r="2"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="12" x2="8" y2="16"></line>
              <line x1="12" y1="12" x2="16" y2="16"></line>
              <circle cx="8" cy="18" r="2"></circle>
              <circle cx="16" cy="18" r="2"></circle>
              <line x1="18" y1="4" x2="18" y2="8"></line>
              <line x1="16" y1="6" x2="20" y2="6"></line>
            </svg>
              );
              break;
            case 'save':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
              );
              break;
            case 'folder-open':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <polyline points="9 14 12 17 15 14"></polyline>
            </svg>
              );
              break;
            case 'export':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 22a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10z"></path>
              <polyline points="15 2 15 7 20 7"></polyline>
              <path d="M10 12h4"></path>
              <path d="M10 16h2"></path>
              <path d="M8 8h1"></path>
              <path d="M9 8v8"></path>
              <path d="M15 8h1"></path>
            </svg>
              );
              break;
            case 'undo':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
              );
              break;
            case 'redo':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 14 20 9 15 4"></polyline>
              <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
            </svg>
              );
              break;
            case 'copy':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
              );
              break;
            case 'paste':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
              );
              break;
            case 'delete':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
              );
              break;
            case 'zoom-in':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
              );
              break;
            case 'zoom-out':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
              );
              break;
            case 'fullscreen':
              icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <polyline points="8 12 12 8 16 12"></polyline>
              <polyline points="8 12 12 16 16 12"></polyline>
            </svg>
              );
              break;
            case 'group':
              icon = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              );
              break;
            case 'list':
              icon = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              );
              break;
            case 'back':
              icon = (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              );
              break;
            default:
              icon = button.icon; // 如果提供了自定义图标组件
          }
          
          return (
            <ToolbarButton
              key={`button-${index}`}
              onClick={button.onClick}
              title={button.tooltip}
              disabled={button.disabled}
              icon={icon}
        />
          );
        })}
      </div>
    </div>
  );
};

export default Toolbar; 