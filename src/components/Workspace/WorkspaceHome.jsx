import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileExplorer from './FileExplorer';
import FilePreview from './FilePreview';
import RecentProjects from './RecentProjects';
import SplitPanel from './SplitPanel';
import TitleBar from '../Toolbar/TitleBar';

const WorkspaceHome = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  
  // 加载最近项目
  useEffect(() => {
    const loadRecentProjects = async () => {
      try {
        if (window.electron && window.electron.ipcRenderer) {
          // 从electron加载最近项目
          const result = await window.electron.ipcRenderer.invoke('get-recent-projects');
          if (result.success) {
            setRecentProjects(result.projects || []);
          } else {
            console.error('加载最近项目失败:', result.error);
            setRecentProjects([]);
          }
        } else {
          console.warn('Electron IPC不可用，无法加载最近项目');
          setRecentProjects([]);
        }
      } catch (error) {
        console.error('加载最近项目失败:', error);
        setRecentProjects([]);
      }
    };
    
    // 加载收藏夹
    const loadFavorites = () => {
      try {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('加载收藏夹失败:', error);
      }
    };
    
    loadRecentProjects();
    loadFavorites();
  }, []);
  
  // 处理文件选择
  const handleFileSelect = (file) => {
    // 只允许选择JSON文件
    if (file.name.endsWith('.json')) {
      setSelectedFile(file);
    }
  };
  
  // 处理文件打开
  const handleFileOpen = (file) => {
    // 如果是行为树文件，导航到编辑器
    if (file.name.endsWith('.json')) {
      if (window.electron && window.electron.ipcRenderer) {
        console.log('打开文件:', file.path);
        
        // 1. 首先读取文件内容
        window.electron.ipcRenderer.invoke('read-file', file.path)
          .then(readResult => {
            if (readResult.success) {
              try {
                // 2. 解析JSON内容
                const jsonContent = JSON.parse(readResult.content);
                console.log('成功解析文件内容为JSON:', file.path);
                
                // 3. 存储到全局变量
                window.electron.ipcRenderer.invoke('store-current-file', {
                  path: file.path,
                  content: jsonContent
                }).then(() => {
                  console.log('文件内容已存储到全局变量');
                  
                  // 4. 添加到最近项目
                  window.electron.ipcRenderer.invoke('add-recent-project', {
                    path: file.path,
                    name: file.name,
                    lastOpened: new Date().toISOString()
                  }).then(() => {
                    // 5. 导航到编辑器页面
                    console.log('导航到编辑器页面');
                    navigate('/editor');
                  });
                });
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                alert(`JSON解析错误: ${jsonError.message}`);
              }
            } else {
              console.error('读取文件失败:', readResult.error);
              alert(`读取文件失败: ${readResult.error}`);
            }
          })
          .catch(error => {
            console.error('读取文件出错:', error);
            alert(`读取文件出错: ${error.message}`);
          });
      } else {
        // 降级处理
        navigate('/editor', { state: { filePath: file.path } });
      }
    }
  };
  
  // 处理目录打开
  const handleOpenProject = (dirPath) => {
    setCurrentDirectory(dirPath);
    setSelectedFile(null); // 清除选中的文件
  };
  
  // 处理最近项目点击
  const handleRecentProjectClick = (project) => {
    if (window.electron && window.electron.ipcRenderer) {
      console.log('打开最近项目:', project.path);
      
      // 1. 首先读取文件内容
      window.electron.ipcRenderer.invoke('read-file', project.path)
        .then(readResult => {
          if (readResult.success) {
            try {
              // 2. 解析JSON内容
              const jsonContent = JSON.parse(readResult.content);
              console.log('成功解析文件内容为JSON:', project.path);
              
              // 3. 存储到全局变量
              window.electron.ipcRenderer.invoke('store-current-file', {
                path: project.path,
                content: jsonContent
              }).then(() => {
                console.log('文件内容已存储到全局变量');
                
                // 4. 添加到最近项目
                window.electron.ipcRenderer.invoke('add-recent-project', {
                  path: project.path,
                  name: project.name || project.path.split(/[/\\]/).pop(),
                  lastOpened: new Date().toISOString()
                }).then(() => {
                  // 5. 导航到编辑器页面
                  console.log('导航到编辑器页面');
                  navigate('/editor');
                });
              });
            } catch (jsonError) {
              console.error('JSON解析错误:', jsonError);
              alert(`JSON解析错误: ${jsonError.message}`);
            }
          } else {
            console.error('读取文件失败:', readResult.error);
            alert(`读取文件失败: ${readResult.error}`);
          }
        })
        .catch(error => {
          console.error('读取文件出错:', error);
          alert(`读取文件出错: ${error.message}`);
        });
    } else {
      // 降级处理
      navigate('/editor', { state: { filePath: project.path } });
    }
  };
  
  // 处理选择目录
  const handleSelectDirectory = async () => {
    if (window.electron && window.electron.ipcRenderer) {
      try {
        const result = await window.electron.ipcRenderer.invoke('select-directory');
        if (result.success) {
          setCurrentDirectory(result.dirPath);
          setSelectedFile(null); // 清除选中的文件
        }
      } catch (error) {
        console.error('选择目录失败:', error);
      }
    }
  };
  
  // 添加到收藏夹
  const handleAddToFavorites = () => {
    if (!currentDirectory) return;
    
    const newFavorite = {
      path: currentDirectory,
      name: currentDirectory.split(/[/\\]/).pop() || currentDirectory,
      addedAt: new Date().toISOString()
    };
    
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    
    try {
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('保存收藏夹失败:', error);
    }
  };
  
  // 从收藏夹移除
  const handleRemoveFromFavorites = (path) => {
    const updatedFavorites = favorites.filter(fav => fav.path !== path);
    setFavorites(updatedFavorites);
    
    try {
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('保存收藏夹失败:', error);
    }
  };
  
  // 检查当前目录是否已收藏
  const isCurrentDirectoryFavorited = currentDirectory && 
    favorites.some(fav => fav.path === currentDirectory);
  
  // 新建行为树功能
  const handleNewBehaviorTree = async () => {
    if (window.electron && window.electron.ipcRenderer) {
      try {
        // 清除当前加载的文件信息
        await window.electron.ipcRenderer.invoke('store-current-file', {
          path: null,
          content: null
        });
        console.log('已清除当前文件信息，准备创建新行为树');
      } catch (error) {
        console.error('清除当前文件信息失败:', error);
      }
    }
    // 导航到编辑器页面
    navigate('/editor');
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f7f9fc',
      overflow: 'hidden',
      border: 'none'
    }}>
      {/* 自定义标题栏 */}
      <TitleBar title="行为树编辑器 - 工作区" />
      
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        height: '48px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px',
            fontWeight: 600,
            color: '#333'
          }}>行为树编辑器</h1>
          
          <div style={{ 
            height: '20px', 
            width: '1px', 
            background: '#e8e8e8', 
            margin: '0 16px' 
          }}></div>
          
          <span style={{ 
            fontSize: '14px',
            color: '#666'
          }}>工作空间</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSelectDirectory}
            style={{
              height: '34px',
              padding: '0 16px',
              background: '#fff',
              color: '#333',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#722ED1';
              e.currentTarget.style.color = '#722ED1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9';
              e.currentTarget.style.color = '#333';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
            </svg>
            打开文件夹
          </button>
          
          {currentDirectory && (
            <button 
              onClick={isCurrentDirectoryFavorited ? 
                () => handleRemoveFromFavorites(currentDirectory) : 
                handleAddToFavorites}
              style={{
                height: '34px',
                padding: '0 16px',
                background: '#fff',
                color: isCurrentDirectoryFavorited ? '#f5a623' : '#333',
                border: `1px solid ${isCurrentDirectoryFavorited ? '#f5a623' : '#d9d9d9'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isCurrentDirectoryFavorited) {
                  e.currentTarget.style.borderColor = '#f5a623';
                  e.currentTarget.style.color = '#f5a623';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentDirectoryFavorited) {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#333';
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isCurrentDirectoryFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              {isCurrentDirectoryFavorited ? '取消收藏' : '添加收藏'}
            </button>
          )}
          
          <button 
            onClick={handleNewBehaviorTree}
            style={{
              height: '34px',
              padding: '0 16px',
              background: '#722ED1',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5b25a8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#722ED1';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4V20M4 12H20" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            新建行为树
          </button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        padding: '16px',
        gap: '16px'
      }}>
        {/* 左侧面板 */}
        <div style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 收藏夹卡片 */}
          <div style={{
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '180px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5a623" stroke="none">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                收藏夹
              </h2>
            </div>
            
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '4px'
            }}>
              {favorites.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                  textAlign: 'center',
                  padding: '0 16px'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.5 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p style={{ fontSize: '13px', margin: 0 }}>暂无收藏目录</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {favorites.map((favorite, index) => (
                    <div
                      key={index}
                      onClick={() => handleOpenProject(favorite.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: currentDirectory === favorite.path ? '#f0f0ff' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (currentDirectory !== favorite.path) {
                          e.currentTarget.style.background = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentDirectory !== favorite.path) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={currentDirectory === favorite.path ? "#722ED1" : "#f5a623"} stroke="none" style={{ marginRight: '8px', flexShrink: 0 }}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <div style={{ 
                        flex: 1, 
                        fontSize: '13px',
                        fontWeight: currentDirectory === favorite.path ? 500 : 400,
                        color: currentDirectory === favorite.path ? '#722ED1' : '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {favorite.name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromFavorites(favorite.path);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          opacity: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 1;
                          e.currentTarget.style.color = '#ff4d4f';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = 0;
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 最近项目卡片 */}
          <div style={{
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                最近项目
              </h2>
            </div>
            
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '4px'
            }}>
              <RecentProjects 
                projects={recentProjects} 
                onProjectClick={handleRecentProjectClick} 
              />
            </div>
          </div>
        </div>
        
        {/* 右侧内容区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {/* 文件浏览器头部 */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              文件浏览器
            </h2>
            
            <div style={{ 
              fontSize: '13px', 
              color: '#666',
              maxWidth: '50%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentDirectory ? `当前目录: ${currentDirectory}` : '请选择目录'}
            </div>
          </div>
          
          {/* 文件浏览器内容 */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <SplitPanel 
              direction="horizontal" 
              defaultSizes={[40, 60]} 
              minSize={280}
              style={{ flex: 1 }}
            >
              {/* 左侧文件列表 */}
              <div style={{ 
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #f0f0f0'
              }}>
                <FileExplorer 
                  currentDirectory={currentDirectory}
                  onFileSelect={handleFileSelect}
                  onOpenProject={handleOpenProject}
                  onFileOpen={handleFileOpen}
                  selectedFile={selectedFile}
                />
              </div>
              
              {/* 右侧文件预览 */}
              <div style={{ 
                height: '100%',
                overflow: 'auto',
                padding: '16px'
              }}>
                {selectedFile ? (
                  <FilePreview 
                    file={selectedFile} 
                    onOpenEditor={(filePath) => {
                      // 确保使用传入的filePath参数
                      const path = filePath || selectedFile.path;
                      
                      if (window.electron && window.electron.ipcRenderer) {
                        console.log('在编辑器中打开文件:', path);
                        
                        // 1. 首先读取文件内容
                        window.electron.ipcRenderer.invoke('read-file', path)
                          .then(readResult => {
                            if (readResult.success) {
                              try {
                                // 2. 解析JSON内容
                                const jsonContent = JSON.parse(readResult.content);
                                console.log('成功解析文件内容为JSON:', path);
                                
                                // 3. 存储到全局变量
                                window.electron.ipcRenderer.invoke('store-current-file', {
                                  path: path,
                                  content: jsonContent
                                }).then(() => {
                                  console.log('文件内容已存储到全局变量');
                                  
                                  // 4. 添加到最近项目
                                  window.electron.ipcRenderer.invoke('add-recent-project', {
                                    path: path,
                                    name: path.split(/[/\\]/).pop(),
                                    lastOpened: new Date().toISOString()
                                  }).then(() => {
                                    // 5. 导航到编辑器页面
                                    console.log('导航到编辑器页面');
                                    navigate('/editor');
                                  });
                                });
                              } catch (jsonError) {
                                console.error('JSON解析错误:', jsonError);
                                alert(`JSON解析错误: ${jsonError.message}`);
                              }
                            } else {
                              console.error('读取文件失败:', readResult.error);
                              alert(`读取文件失败: ${readResult.error}`);
                            }
                          })
                          .catch(error => {
                            console.error('读取文件出错:', error);
                            alert(`读取文件出错: ${error.message}`);
                          });
                      } else {
                        navigate('/editor', { state: { filePath: path } });
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#999'
                  }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p style={{ fontSize: '16px', margin: 0 }}>选择一个JSON文件进行预览</p>
                    <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.7 }}>支持预览行为树JSON文件</p>
                  </div>
                )}
              </div>
            </SplitPanel>
          </div>
        </div>
      </div>
      
      {/* 底部状态栏 */}
      <div style={{
        height: '28px',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#999'
      }}>
        <div>行为树编辑器 v1.0.0</div>
      </div>
    </div>
  );
};

export default WorkspaceHome; 