import React, { useMemo } from 'react';
import path from 'path-browserify';

const Breadcrumb = ({ path: currentPath, onNavigate }) => {
  // 解析路径为面包屑导航项
  const pathSegments = useMemo(() => {
    if (!currentPath) return [];
    
    // 处理 Windows 路径
    const isWindowsPath = /^[a-zA-Z]:\\/.test(currentPath);
    const normalizedPath = currentPath.replace(/\\/g, '/');
    
    // 将路径分割成片段
    let segments = normalizedPath.split('/').filter(Boolean);
    
    // Windows 路径特殊处理（例如 C:\）
    if (isWindowsPath) {
      const drive = currentPath.substring(0, 3); // 例如 "C:\"
      segments = [drive, ...segments];
    } else if (normalizedPath.startsWith('/')) {
      // Unix 路径以 / 开头
      segments = ['/', ...segments];
    }
    
    // 生成每个片段的完整路径
    return segments.map((segment, index) => {
      if (isWindowsPath && index === 0) {
        // Windows 驱动器
        return { name: segment, path: segment };
      }
      
      if (!isWindowsPath && index === 0 && segment === '/') {
        // Unix 根目录
        return { name: 'Root', path: '/' };
      }
      
      const previousSegments = segments.slice(0, index);
      let fullPath;
      
      if (isWindowsPath) {
        if (index === 0) {
          fullPath = segment;
        } else {
          fullPath = previousSegments[0] + '\\' + previousSegments.slice(1).concat(segment).join('\\');
        }
      } else {
        if (previousSegments[0] === '/') {
          fullPath = '/' + previousSegments.slice(1).concat(segment).join('/');
        } else {
          fullPath = previousSegments.concat(segment).join('/');
        }
      }
      
      return { name: segment, path: fullPath };
    });
  }, [currentPath]);

  // 处理点击面包屑项，导航到该路径
  const handleClick = (segmentPath) => {
    if (onNavigate) {
      onNavigate(segmentPath);
    }
  };

  return (
    <div className="breadcrumb">
      {pathSegments.length === 0 ? (
        <div className="breadcrumb-placeholder">选择一个文件夹</div>
      ) : (
        <>
          {pathSegments.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="breadcrumb-separator">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </span>
              )}
              <span 
                className="breadcrumb-item"
                onClick={() => handleClick(segment.path)}
                title={segment.path}
              >
                {index === 0 && (
                  <span className="breadcrumb-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                )}
                <span className="breadcrumb-label">
                  {segment.name}
                </span>
              </span>
            </React.Fragment>
          ))}
        </>
      )}

      <style jsx>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none; /* Firefox */
          padding: 4px;
          height: 32px;
        }
        
        .breadcrumb::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Edge */
        }
        
        .breadcrumb-placeholder {
          font-style: italic;
          color: var(--text-secondary);
        }
        
        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
        }
        
        .breadcrumb-item:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .breadcrumb-separator {
          margin: 0 2px;
          display: flex;
          align-items: center;
          color: var(--text-disabled);
        }
        
        .breadcrumb-icon {
          margin-right: 4px;
          display: flex;
          align-items: center;
        }
        
        .breadcrumb-label {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default Breadcrumb; 