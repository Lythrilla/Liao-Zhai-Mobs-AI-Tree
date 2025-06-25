import React, { useState, useRef, useEffect, useCallback } from 'react';

const SplitPanel = ({ children, initialRatio = 0.25, minRatio = 0.1, maxRatio = 0.8 }) => {
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);

  // 处理拖拽开始
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 处理拖拽移动
  const handleDrag = useCallback((clientX) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const relativePosition = clientX - containerRect.left;
    
    // 计算新的分割比例，并限制在最小和最大比例之间
    let newRatio = relativePosition / containerWidth;
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    
    setSplitRatio(newRatio);
  }, [minRatio, maxRatio]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleDrag(e.clientX);
    }
  }, [isDragging, handleDrag]);

  // 处理鼠标松开
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 确保有两个子组件
  const [leftComponent, rightComponent] = React.Children.toArray(children).slice(0, 2);

  return (
    <div className="split-panel-container" ref={containerRef}>
      <div 
        className="split-panel-left" 
        style={{ width: `${splitRatio * 100}%` }}
      >
        {leftComponent}
      </div>
      <div 
        className="split-panel-divider"
        ref={dividerRef}
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'col-resize' : 'col-resize' }}
      >
        <div className="divider-line"></div>
      </div>
      <div 
        className="split-panel-right" 
        style={{ width: `${(1 - splitRatio) * 100}%` }}
      >
        {rightComponent}
      </div>

      <style jsx>{`
        .split-panel-container {
          display: flex;
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .split-panel-left, .split-panel-right {
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .split-panel-divider {
          width: 6px;
          height: 100%;
          background-color: transparent;
          position: relative;
          cursor: col-resize;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .divider-line {
          width: 2px;
          height: 100%;
          background-color: var(--border-color);
        }
        
        .split-panel-divider:hover .divider-line {
          background-color: var(--color-primary);
        }
        
        .split-panel-divider:active .divider-line {
          background-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default SplitPanel; 