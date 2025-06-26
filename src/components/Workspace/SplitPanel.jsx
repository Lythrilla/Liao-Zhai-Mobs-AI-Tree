import React, { useState, useRef, useEffect, useCallback } from 'react';

const SplitPanel = ({ 
  children, 
  initialRatio = 0.5, 
  minRatio = 0.1, 
  maxRatio = 0.9,
  direction = 'horizontal',
  gutterSize = 4,
  style
}) => {
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const gutterRef = useRef(null);

  // 处理拖拽开始
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 处理拖拽移动
  const handleDrag = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 根据方向计算分割比例
    let newRatio;
    if (direction === 'horizontal') {
      const containerWidth = containerRect.width;
      const relativePosition = clientX - containerRect.left;
      newRatio = relativePosition / containerWidth;
    } else {
      const containerHeight = containerRect.height;
      const relativePosition = clientY - containerRect.top;
      newRatio = relativePosition / containerHeight;
    }
    
    // 限制在最小和最大比例之间
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    
    setSplitRatio(newRatio);
  }, [direction, minRatio, maxRatio]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleDrag(e.clientX, e.clientY);
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
      
      // 添加特殊光标到body元素
      if (direction === 'horizontal') {
        document.body.style.cursor = 'col-resize';
      } else {
        document.body.style.cursor = 'row-resize';
      }
      
      // 禁用文本选择以改善用户体验
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 恢复默认光标和文本选择
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  // 确保有两个子组件
  const [firstComponent, secondComponent] = React.Children.toArray(children).slice(0, 2);

  // 生成样式对象
  const isHorizontal = direction === 'horizontal';
  
  const containerStyle = {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: isHorizontal ? 'row' : 'column',
    ...style
  };
  
  const firstPaneStyle = {
    [isHorizontal ? 'width' : 'height']: `${splitRatio * 100}%`,
    position: 'relative',
    overflow: 'hidden'
  };
  
  const secondPaneStyle = {
    [isHorizontal ? 'width' : 'height']: `${(1 - splitRatio) * 100}%`,
    position: 'relative',
    overflow: 'hidden'
  };
  
  const gutterStyle = {
    [isHorizontal ? 'width' : 'height']: `${gutterSize}px`,
    [isHorizontal ? 'height' : 'width']: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
    cursor: isHorizontal ? 'col-resize' : 'row-resize',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    touchAction: 'none'
  };
  
  const gutterLineStyle = {
    [isHorizontal ? 'width' : 'height']: '2px',
    [isHorizontal ? 'height' : 'width']: '100%',
    backgroundColor: '#e0e0e0',
    transition: 'background-color 0.2s'
  };

  return (
    <div 
      className="split-panel-container" 
      ref={containerRef} 
      style={containerStyle}
    >
      <div 
        className="split-panel-first" 
        style={firstPaneStyle}
      >
        {firstComponent}
      </div>
      
      <div 
        className="split-panel-gutter"
        ref={gutterRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={gutterStyle}
      >
        <div 
          className="gutter-line"
          style={{
            ...gutterLineStyle,
            backgroundColor: isDragging ? '#722ED1' : '#e0e0e0'
          }}
        />
      </div>
      
      <div 
        className="split-panel-second" 
        style={secondPaneStyle}
      >
        {secondComponent}
      </div>
    </div>
  );
};

export default SplitPanel; 