import React from 'react';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/fileUtils';

const FileItem = ({ file, selected, onClick, onDoubleClick, onContextMenu, viewMode = 'list' }) => {
  // 确保所有文件属性都存在
  const {
    name,
    path,
    isDirectory,
    size = 0,
    lastModified = new Date(),
    type = ''
  } = file;

  // 获取文件图标
  const icon = getFileIcon(file);
  
  // 处理双击事件
  const handleDoubleClick = (e) => {
    console.log('FileItem 双击:', file.name, file.isDirectory);
    if (onDoubleClick) {
      onDoubleClick(file);
    }
  };

  // 列表视图渲染
  if (viewMode === 'list') {
    return (
      <div 
        className={`file-item ${selected ? 'selected' : ''}`}
        onClick={onClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div className="file-name">
          <span className="file-icon">
            {React.createElement(icon.component, { color: icon.color, size: 18 })}
          </span>
          <span className="file-label">{name}</span>
        </div>
        <div className="file-size">
          {!isDirectory ? formatFileSize(size) : '--'}
        </div>
        <div className="file-type">
          {isDirectory ? '文件夹' : (type ? `.${type}` : '未知')}
        </div>
        <div className="file-date">
          {formatDate(lastModified)}
        </div>
        
        <style jsx="true">{`
          .file-item {
            display: flex;
            align-items: center;
            padding: 6px 16px;
            border-radius: 4px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.1s ease;
          }
          
          .file-item:hover {
            background-color: var(--bg-secondary);
          }
          
          .file-item.selected {
            background-color: var(--color-primary-light);
          }
          
          .file-name {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .file-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
          }
          
          .file-label {
            font-size: 14px;
            color: var(--text-primary);
          }
          
          .file-size {
            width: 80px;
            text-align: right;
            font-size: 13px;
            color: var(--text-secondary);
          }
          
          .file-type {
            width: 100px;
            padding: 0 8px;
            font-size: 13px;
            color: var(--text-secondary);
          }
          
          .file-date {
            width: 150px;
            text-align: right;
            font-size: 13px;
            color: var(--text-secondary);
          }
        `}</style>
      </div>
    );
  }
  
  // 网格视图渲染
  return (
    <div 
      className={`file-item-grid ${selected ? 'selected' : ''}`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="file-icon-grid">
        {React.createElement(icon.component, { color: icon.color, size: 40 })}
      </div>
      <div className="file-name-grid">
        <span className="file-label-grid">{name}</span>
      </div>
      <div className="file-info-grid">
        {!isDirectory ? formatFileSize(size) : ''}
      </div>
      
      <style jsx="true">{`
        .file-item-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100px;
          height: 100px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.1s ease;
          overflow: hidden;
        }
        
        .file-item-grid:hover {
          background-color: var(--bg-secondary);
        }
        
        .file-item-grid.selected {
          background-color: var(--color-primary-light);
        }
        
        .file-icon-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50px;
        }
        
        .file-name-grid {
          width: 100%;
          margin-top: 8px;
          text-align: center;
        }
        
        .file-label-grid {
          font-size: 12px;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .file-info-grid {
          margin-top: 4px;
          font-size: 11px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default FileItem; 