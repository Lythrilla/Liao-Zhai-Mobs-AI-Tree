import React, { useState, useEffect, useCallback } from 'react';
import FileItem from './FileItem';
import { formatFileSize, formatDate } from '../../utils/fileUtils';

const FileExplorer = ({ currentDirectory, onFileSelect, onOpenProject, selectedFile }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState({ field: 'name', direction: 'asc' });
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [drives, setDrives] = useState([]);
  const [isDrivesLoading, setIsDrivesLoading] = useState(false);

  // 加载系统盘符
  useEffect(() => {
    const loadSystemDrives = async () => {
      if (window.electron && window.electron.ipcRenderer) {
        try {
          setIsDrivesLoading(true);
          const result = await window.electron.ipcRenderer.invoke('get-system-drives');
          if (result.success) {
            setDrives(result.drives);
          } else {
            console.error('获取系统盘符失败:', result.error);
          }
        } catch (error) {
          console.error('获取系统盘符错误:', error);
        } finally {
          setIsDrivesLoading(false);
        }
      }
    };
    
    loadSystemDrives();
  }, []);

  // 加载目录内容
  const loadDirectory = useCallback(async (directoryPath) => {
    if (!directoryPath) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      if (window.electron && window.electron.ipcRenderer) {
        console.log('读取目录:', directoryPath);
        const result = await window.electron.ipcRenderer.invoke('read-directory', directoryPath);
        
        if (result.success) {
          // 添加额外文件信息
          const filesWithInfo = await Promise.all(result.entries.map(async (entry) => {
            if (window.electron && window.electron.ipcRenderer) {
              // 获取文件信息（大小、最后修改时间等）
              console.log('获取文件信息:', entry.path);
              const fileInfo = await window.electron.ipcRenderer.invoke('get-file-info', entry.path);
              return {
                ...entry,
                size: fileInfo.size || 0,
                lastModified: fileInfo.lastModified || new Date(),
                type: entry.name.split('.').pop() || ''
              };
            }
            return entry;
          }));
          
          // 过滤，只显示文件夹和JSON文件
          const filteredFiles = filesWithInfo.filter(file => 
            file.isDirectory || file.name.toLowerCase().endsWith('.json')
          );
          
          setFiles(filteredFiles);
        } else {
          setError(`无法读取目录: ${result.error}`);
          setFiles([]);
        }
      } else {
        console.error('Electron IPC不可用');
        setError('Electron IPC不可用');
      }
    } catch (error) {
      console.error('读取目录失败:', error);
      setError(`读取目录失败: ${error.message}`);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 目录变化时加载目录内容
  useEffect(() => {
    if (currentDirectory) {
      loadDirectory(currentDirectory);
    } else {
      // 如果没有选择目录，清空文件列表
      setFiles([]);
      setError('');
    }
  }, [currentDirectory, loadDirectory]);

  // 处理文件排序
  const handleSort = (field) => {
    setSortOrder(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 排序文件列表
  const sortedFiles = [...files].sort((a, b) => {
    // 文件夹始终排在文件前面
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    // 根据排序字段排序
    const { field, direction } = sortOrder;
    
    if (field === 'name') {
      return direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    
    if (field === 'size') {
      return direction === 'asc' ? a.size - b.size : b.size - a.size;
    }
    
    if (field === 'type') {
      return direction === 'asc' 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    }
    
    if (field === 'lastModified') {
      const dateA = new Date(a.lastModified);
      const dateB = new Date(b.lastModified);
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    return 0;
  });

  // 处理双击文件/文件夹
  const handleDoubleClick = (file) => {
    console.log('双击文件/文件夹:', file);
    
    if (file.isDirectory) {
      console.log('打开目录:', file.path);
      onOpenProject(file.path);
    } else if (file.path.endsWith('.json')) {
      console.log('选择JSON文件:', file.path);
      onFileSelect(file);
    }
  };

  // 处理右键菜单
  const handleContextMenu = async (e, file) => {
    e.preventDefault();
    
    if (window.electron && window.electron.ipcRenderer) {
      console.log('显示上下文菜单:', file.path);
      await window.electron.ipcRenderer.invoke('show-context-menu', {
        type: file.isDirectory ? 'directory' : 'file',
        path: file.path
      });
    } else {
      console.error('Electron IPC不可用');
    }
  };

  // 处理切换视图模式
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // 处理盘符选择
  const handleDriveSelect = (drive) => {
    onOpenProject(drive.path);
  };

  // 如果没有选择目录，显示盘符选择界面
  if (!currentDirectory) {
    return (
      <div className="file-explorer">
        <div className="file-explorer-drives">
          <h3>选择磁盘</h3>
          <div className="drives-container">
            {isDrivesLoading ? (
              <div className="loading-drives">加载磁盘中...</div>
            ) : drives.length === 0 ? (
              <div className="no-drives">未找到可用磁盘</div>
            ) : (
              <div className="drives-grid">
                {drives.map((drive) => (
                  <div 
                    key={drive.path} 
                    className="drive-item"
                    onClick={() => handleDriveSelect(drive)}
                  >
                    <div className="drive-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4a6dff" strokeWidth="1.5">
                        <path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1.5"></path>
                        <path d="M2 10h20"></path>
                        <path d="M6 14h.01"></path>
                        <path d="M10 14h.01"></path>
                      </svg>
                    </div>
                    <div className="drive-name">{drive.name}</div>
                    <div className="drive-label">{drive.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <style jsx="true">{`
          .file-explorer {
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: var(--bg-primary);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .file-explorer-drives {
            display: flex;
            flex-direction: column;
            padding: 24px;
            height: 100%;
          }
          
          .file-explorer-drives h3 {
            margin: 0 0 20px 0;
            font-weight: 500;
            color: var(--text-primary);
          }
          
          .drives-container {
            flex: 1;
          }
          
          .loading-drives, .no-drives {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: var(--text-secondary);
          }
          
          .drives-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 16px;
          }
          
          .drive-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            border-radius: 8px;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .drive-item:hover {
            background-color: var(--bg-secondary-hover);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .drive-icon {
            margin-bottom: 12px;
          }
          
          .drive-name {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          
          .drive-label {
            font-size: 12px;
            color: var(--text-secondary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="file-explorer">
      <div className="file-explorer-toolbar">
        <div className="file-explorer-header">
          <div className="column name" onClick={() => handleSort('name')}>
            名称
            {sortOrder.field === 'name' && (
              <span className="sort-indicator">
                {sortOrder.direction === 'asc' ? ' ▲' : ' ▼'}
              </span>
            )}
          </div>
          <div className="column size" onClick={() => handleSort('size')}>
            大小
            {sortOrder.field === 'size' && (
              <span className="sort-indicator">
                {sortOrder.direction === 'asc' ? ' ▲' : ' ▼'}
              </span>
            )}
          </div>
          <div className="column type" onClick={() => handleSort('type')}>
            类型
            {sortOrder.field === 'type' && (
              <span className="sort-indicator">
                {sortOrder.direction === 'asc' ? ' ▲' : ' ▼'}
              </span>
            )}
          </div>
          <div className="column date" onClick={() => handleSort('lastModified')}>
            修改日期
            {sortOrder.field === 'lastModified' && (
              <span className="sort-indicator">
                {sortOrder.direction === 'asc' ? ' ▲' : ' ▼'}
              </span>
            )}
          </div>
        </div>
        <div className="view-controls">
          <button 
            className={`view-control-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
            title="列表视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
            </svg>
          </button>
          <button 
            className={`view-control-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('grid')}
            title="网格视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={`file-explorer-content ${viewMode}`}>
        {isLoading ? (
          <div className="loading-indicator">加载中...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : sortedFiles.length === 0 ? (
          <div className="empty-folder">此文件夹为空</div>
        ) : (
          sortedFiles.map((file) => (
            <FileItem 
              key={file.path} 
              file={file} 
              selected={selectedFile && selectedFile.path === file.path}
              onClick={() => onFileSelect(file)}
              onDoubleClick={() => handleDoubleClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              viewMode={viewMode}
            />
          ))
        )}
      </div>

      <style jsx="true">{`
        .file-explorer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg-primary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .file-explorer-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-primary);
        }
        
        .view-controls {
          display: flex;
          gap: 4px;
        }
        
        .view-control-btn {
          background: transparent;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
        }
        
        .view-control-btn:hover {
          background-color: var(--bg-secondary-hover);
          color: var(--text-primary);
        }
        
        .view-control-btn.active {
          color: var(--color-primary);
          background-color: var(--color-primary-light);
        }
        
        .file-explorer-header {
          display: flex;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-color);
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--bg-secondary);
        }
        
        .column {
          cursor: pointer;
          user-select: none;
        }
        
        .column:hover {
          color: var(--text-primary);
        }
        
        .column.name {
          flex: 1;
        }
        
        .column.size {
          width: 80px;
          text-align: right;
        }
        
        .column.type {
          width: 100px;
          padding: 0 8px;
        }
        
        .column.date {
          width: 150px;
          text-align: right;
        }
        
        .sort-indicator {
          font-size: 10px;
          vertical-align: middle;
        }
        
        .file-explorer-content {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }
        
        .file-explorer-content.list {
          display: flex;
          flex-direction: column;
        }
        
        .file-explorer-content.grid {
          display: flex;
          flex-wrap: wrap;
          padding: 16px;
          gap: 16px;
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: var(--text-secondary);
        }
        
        .error-message {
          padding: 16px;
          color: var(--color-danger);
          text-align: center;
        }
        
        .empty-folder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: var(--text-secondary);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default FileExplorer; 