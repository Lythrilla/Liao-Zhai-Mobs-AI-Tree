import React, { useState, useEffect } from 'react';

const TitleBar = ({ title }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  
  useEffect(() => {
    // 监听窗口最大化状态
    const checkMaximized = async () => {
      if (window.electron && window.electron.windowControls) {
        try {
          const isMax = await window.electron.windowControls.isMaximized();
          setIsMaximized(isMax);
        } catch (error) {
          // 忽略错误
        }
      }
    };
    
    // 初始检查
    checkMaximized();
    
    // 添加事件监听器
    window.addEventListener('resize', checkMaximized);
    
    return () => {
      window.removeEventListener('resize', checkMaximized);
    };
  }, []);
  
  // 窗口控制处理函数
  const handleMinimize = () => {
    if (window.electron && window.electron.windowControls) {
      window.electron.windowControls.minimize();
    }
  };
  
  const handleMaximize = () => {
    if (window.electron && window.electron.windowControls) {
      window.electron.windowControls.maximize();
      // 状态将通过resize事件更新
    }
  };
  
  const handleClose = () => {
    if (window.electron && window.electron.windowControls) {
      window.electron.windowControls.close();
    }
  };
  
  return (
    <div className="title-bar" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '32px',
      background: '#1f1f1f',
      WebkitAppRegion: 'drag', // 允许窗口拖动
      color: '#fff',
      padding: '0 12px',
      fontSize: '12px'
    }}>
      <div className="title-bar-left" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div className="title-bar-icon" style={{
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="#722ED1" fillOpacity="0.6" />
            <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="title-bar-title">
          {title || "行为树编辑器"}
        </div>
      </div>
      
      <div className="title-bar-controls" style={{
        display: 'flex',
        WebkitAppRegion: 'no-drag' // 禁止拖动
      }}>
        <button 
          className="title-bar-button title-bar-minimize"
          onClick={handleMinimize}
          style={{
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            color: '#fff',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 6h8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
        
        <button 
          className="title-bar-button title-bar-maximize"
          onClick={handleMaximize}
          style={{
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            color: '#fff',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="4.5" width="5" height="5" stroke="currentColor" />
              <path d="M4.5 4.5V2.5H9.5V7.5H7.5" stroke="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="2.5" width="7" height="7" stroke="currentColor" />
            </svg>
          )}
        </button>
        
        <button 
          className="title-bar-button title-bar-close"
          onClick={handleClose}
          style={{
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            color: '#fff',
            cursor: 'pointer',
            outline: 'none',
            ':hover': {
              background: '#e81123'
            }
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 