import React, { useState, useEffect } from 'react';

const FileExplorer = ({ currentDirectory, onFileSelect, onOpenProject, onFileOpen, selectedFile }) => {
  const [fileTree, setFileTree] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [viewMode, setViewMode] = useState('details'); // 'details' or 'list'
  
  // 加载系统盘符
  useEffect(() => {
    const loadDrives = async () => {
      if (window.electron && window.electron.ipcRenderer) {
        try {
          const result = await window.electron.ipcRenderer.invoke('get-system-drives');
          if (result.success) {
            setDrives(result.drives || []);
          } else {
            console.error('加载系统盘符失败:', result.error);
            setError('加载系统盘符失败: ' + result.error);
          }
        } catch (error) {
          console.error('加载系统盘符失败:', error);
          setError('加载系统盘符失败: ' + error.message);
        }
      }
    };
    
    loadDrives();
  }, []);
  
  // 更新面包屑导航
  useEffect(() => {
    if (!currentDirectory) {
      setBreadcrumbs([]);
      return;
    }
    
    // 分割路径
    const parts = currentDirectory.split(/[/\\]/);
    const crumbs = [];
    
    // 构建面包屑
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part && i > 0) continue; // 跳过空部分
      
      // 构建当前路径
      currentPath = i === 0 ? part : `${currentPath}\\${part}`;
      
      crumbs.push({
        name: part || 'Root',
        path: currentPath
      });
    }
    
    setBreadcrumbs(crumbs);
  }, [currentDirectory]);
  
  // 加载目录内容
  useEffect(() => {
    const loadDirectory = async (dirPath) => {
      if (!dirPath) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (window.electron && window.electron.ipcRenderer) {
          const result = await window.electron.ipcRenderer.invoke('read-directory', dirPath);
          if (result.success) {
            // 获取每个文件的详细信息
            const entriesWithInfo = await Promise.all(
              result.entries.map(async (entry) => {
                // 如果不是目录且不是JSON文件，跳过
                if (!entry.isDirectory && !entry.name.toLowerCase().endsWith('.json')) {
                  return null;
                }
                
                try {
                  const fileInfo = await window.electron.ipcRenderer.invoke('get-file-info', entry.path);
                  if (fileInfo.success) {
                    return {
                      ...entry,
                      size: fileInfo.size,
                      lastModified: fileInfo.lastModified,
                      created: fileInfo.created
                    };
                  }
                  return entry;
                } catch (error) {
                  console.error('获取文件信息失败:', error);
                  return entry;
                }
              })
            );
            
            // 过滤掉null值（非目录且非JSON文件）
            const filteredEntries = entriesWithInfo.filter(entry => entry !== null);
            
            // 排序：文件夹优先，然后按名称排序
            filteredEntries.sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1;
              if (!a.isDirectory && b.isDirectory) return 1;
              return a.name.localeCompare(b.name);
            });
            
            setFileTree(filteredEntries);
          } else {
            console.error('加载目录失败:', result.error);
            setError('加载目录失败: ' + result.error);
            setFileTree([]);
          }
        }
      } catch (error) {
        console.error('加载目录失败:', error);
        setError('加载目录失败: ' + error.message);
        setFileTree([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentDirectory) {
      loadDirectory(currentDirectory);
    } else {
      setFileTree([]);
    }
  }, [currentDirectory]);
  
  // 处理文件点击
  const handleFileClick = (file) => {
    if (file.isDirectory) {
      onOpenProject(file.path);
    } else {
      onFileSelect(file);
    }
  };
  
  // 处理文件双击
  const handleFileDoubleClick = (file) => {
    if (!file.isDirectory) {
      onFileOpen(file);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      // 如果是今天
      if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 如果是昨天
      if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 今年内的日期
      if (date.getFullYear() === now.getFullYear()) {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 其他日期
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } catch (error) {
      return '未知时间';
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  // 获取文件图标
  const getFileIcon = (file) => {
    if (file.isDirectory) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5b8c00" strokeWidth="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    // JSON文件图标
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0ad4e" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };
  
  // 切换视图模式
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'details' ? 'list' : 'details');
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      {/* 盘符选择器 */}
      {drives.length > 0 && (
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          flexWrap: 'nowrap'
        }}>
          {drives.map((drive) => (
            <button
              key={drive.name}
              onClick={() => onOpenProject(drive.path)}
              style={{
                padding: '6px 10px',
                background: currentDirectory && currentDirectory.startsWith(drive.path) ? '#f0f0ff' : '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: currentDirectory && currentDirectory.startsWith(drive.path) ? '#722ED1' : '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!(currentDirectory && currentDirectory.startsWith(drive.path))) {
                  e.currentTarget.style.background = '#f9f9f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!(currentDirectory && currentDirectory.startsWith(drive.path))) {
                  e.currentTarget.style.background = '#fff';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM9 3v18M3 9h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {drive.name}
            </button>
          ))}
        </div>
      )}
      
      {/* 面包屑导航 */}
      {currentDirectory && (
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #f0f0f0',
          fontSize: '13px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && (
                <span style={{ color: '#ccc', margin: '0 2px' }}>/</span>
              )}
              <span 
                onClick={() => onOpenProject(crumb.path)}
                style={{ 
                  cursor: 'pointer', 
                  color: index === breadcrumbs.length - 1 ? '#722ED1' : '#666',
                  fontWeight: index === breadcrumbs.length - 1 ? 500 : 400,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (index !== breadcrumbs.length - 1) {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.color = '#722ED1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== breadcrumbs.length - 1) {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* 工具栏 */}
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 返回上级目录按钮 */}
        {currentDirectory && (
          <button
            onClick={() => {
              const parentPath = currentDirectory.split(/[/\\]/).slice(0, -1).join('\\');
              if (parentPath && parentPath.includes(':')) {
                onOpenProject(parentPath);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0ff';
              e.currentTarget.style.color = '#722ED1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#666';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回上级
          </button>
        )}
        
        {/* 视图切换按钮 */}
        <button
          onClick={toggleViewMode}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9f9f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {viewMode === 'details' ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              简洁视图
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              详细视图
            </>
          )}
        </button>
      </div>
      
      {/* 详细视图的表头 */}
      {viewMode === 'details' && (
        <div style={{
          display: 'flex',
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '12px',
          fontWeight: 500,
          color: '#999'
        }}>
          <div style={{ flex: 1, paddingLeft: '26px' }}>名称</div>
          <div style={{ width: '120px' }}>修改日期</div>
          <div style={{ width: '80px', textAlign: 'right' }}>大小</div>
        </div>
      )}
      
      {/* 文件列表 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: viewMode === 'details' ? '0' : '8px'
      }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '20px',
            color: '#999'
          }}>
            <span>加载中...</span>
          </div>
        ) : error ? (
          <div style={{ 
            padding: '16px', 
            color: '#dc3545',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : fileTree.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 20px',
            color: '#999',
            textAlign: 'center'
          }}>
            {currentDirectory ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontSize: '14px', margin: 0 }}>目录为空</p>
                <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>
                  当前目录中没有文件夹或JSON文件
                </p>
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontSize: '14px', margin: 0 }}>请选择一个目录</p>
                <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.7 }}>点击上方的盘符或使用"打开文件夹"按钮</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 文件列表 */}
            {fileTree.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: selectedFile && selectedFile.path === file.path ? '#f0f0ff' : 'transparent',
                  borderBottom: '1px solid #f5f5f5',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!(selectedFile && selectedFile.path === file.path)) {
                    e.currentTarget.style.background = '#f9f9f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(selectedFile && selectedFile.path === file.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ 
                  marginRight: '8px',
                  color: file.isDirectory ? '#5b8c00' : '#666'
                }}>
                  {getFileIcon(file)}
                </div>
                
                {viewMode === 'details' ? (
                  <>
                    <div style={{ 
                      flex: 1, 
                      fontSize: '13px',
                      fontWeight: file.isDirectory ? 500 : 400,
                      color: file.isDirectory ? '#333' : '#555',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {file.name}
                    </div>
                    
                    <div style={{
                      width: '120px',
                      fontSize: '12px',
                      color: '#888',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.lastModified ? formatDate(file.lastModified) : ''}
                    </div>
                    
                    <div style={{
                      width: '80px',
                      fontSize: '12px',
                      color: '#888',
                      textAlign: 'right'
                    }}>
                      {!file.isDirectory && file.size ? formatFileSize(file.size) : ''}
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    flex: 1, 
                    fontSize: '13px',
                    fontWeight: file.isDirectory ? 500 : 400,
                    color: file.isDirectory ? '#333' : '#555',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {file.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 