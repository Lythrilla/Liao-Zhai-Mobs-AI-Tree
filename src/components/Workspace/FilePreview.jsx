import React, { useState, useEffect } from 'react';

const FilePreview = ({ file, onOpenEditor }) => {
  const [content, setContent] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isJsonView, setIsJsonView] = useState(true); // 切换JSON视图和原始视图
  
  useEffect(() => {
    if (!file) return;
    
    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      setParsedJson(null);
      
      try {
        if (window.electron && window.electron.ipcRenderer) {
          // 只预览JSON文件
          if (file.name.endsWith('.json')) {
            const result = await window.electron.ipcRenderer.invoke('read-file', file.path);
            if (result.success) {
              try {
                // 尝试解析JSON
                const jsonObj = JSON.parse(result.content);
                setContent(JSON.stringify(jsonObj, null, 2));
                setParsedJson(jsonObj);
              } catch (jsonError) {
                // 如果解析失败，直接显示内容
                setContent(result.content);
                setError(`JSON解析错误: ${jsonError.message}`);
              }
            } else {
              setError(`无法读取文件: ${result.error}`);
            }
          } else {
            setError('不支持预览此类型的文件，仅支持JSON文件');
          }
        } else {
          setError('Electron IPC不可用，无法读取文件');
        }
      } catch (error) {
        setError(`读取文件失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadFileContent();
  }, [file]);
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      return '未知时间';
    }
  };
  
  // 检测行为树JSON结构
  const isBehaviorTree = (json) => {
    if (!json) return false;
    
    // 检查是否有行为树的特征
    return (
      (json.rootNode && Array.isArray(json.nodes)) || // 第一种格式
      (Array.isArray(json.nodes) && Array.isArray(json.edges)) // 第二种格式
    );
  };
  
  // 获取行为树节点数量
  const getNodeCount = (json) => {
    if (!json || !json.nodes) return 0;
    return json.nodes.length;
  };
  
  // 获取行为树结构信息
  const getBehaviorTreeInfo = (json) => {
    if (!json) return null;
    
    let rootNodeId = null;
    let nodeTypes = {};
    let maxDepth = 0;
    
    // 获取根节点ID
    if (json.rootNode) {
      rootNodeId = json.rootNode;
    } else if (json.nodes && json.nodes.length > 0) {
      // 尝试找出根节点（没有父节点的节点）
      if (json.edges) {
        const childNodeIds = json.edges.map(edge => edge.target);
        rootNodeId = json.nodes.find(node => !childNodeIds.includes(node.id))?.id;
      }
    }
    
    // 统计节点类型
    if (json.nodes) {
      json.nodes.forEach(node => {
        if (node.type) {
          nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
        }
      });
    }
    
    // 计算树的最大深度
    if (json.nodes && json.edges) {
      const nodeMap = {};
      json.nodes.forEach(node => {
        nodeMap[node.id] = { ...node, children: [] };
      });
      
      json.edges.forEach(edge => {
        if (nodeMap[edge.source] && nodeMap[edge.target]) {
          nodeMap[edge.source].children.push(nodeMap[edge.target]);
        }
      });
      
      const calculateDepth = (nodeId, depth = 1) => {
        if (!nodeMap[nodeId] || !nodeMap[nodeId].children.length) {
          return depth;
        }
        
        return Math.max(...nodeMap[nodeId].children.map(child => 
          calculateDepth(child.id, depth + 1)
        ));
      };
      
      if (rootNodeId) {
        maxDepth = calculateDepth(rootNodeId);
      }
    }
    
    return {
      nodeCount: getNodeCount(json),
      rootNodeId,
      nodeTypes,
      maxDepth
    };
  };
  
  // 处理在编辑器中打开
  const handleOpenInEditor = () => {
    if (file && onOpenEditor) {
      onOpenEditor(file.path);
    }
  };
  
  // 如果没有选择文件
  if (!file) {
    return null;
  }
  
  // 获取行为树信息
  const behaviorTreeInfo = isBehaviorTree(parsedJson) ? getBehaviorTreeInfo(parsedJson) : null;
  
  // 文件类型和颜色
  const isJsonFile = file.name.endsWith('.json');
  const iconColor = isJsonFile ? '#722ED1' : '#5b8c00';
  const bgColor = isJsonFile ? '#f3f0ff' : '#f6ffed';
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 文件信息头部 */}
      <div style={{ 
        padding: '0 0 16px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* 文件图标 */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            flexShrink: 0
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M9 16s.5-1 2-1 2.5 1 4 1 2-1 2-1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* 文件名和路径 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {file.name}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px'
            }}>
              <span style={{
                backgroundColor: bgColor,
                color: iconColor,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase'
              }}>
                {file.name.split('.').pop()}
              </span>
              <span style={{ 
                fontSize: '13px',
                color: '#999',
              }}>
                {formatFileSize(file.size || 0)}
              </span>
              <span style={{ 
                fontSize: '13px',
                color: '#999',
              }}>
                {formatDate(file.lastModified)}
              </span>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <button
            onClick={handleOpenInEditor}
            style={{
              padding: '8px 16px',
              background: '#722ED1',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5b25a8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#722ED1';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            在编辑器中打开
          </button>
        </div>
        
        {/* 文件路径 */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#666',
          wordBreak: 'break-all',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4'
        }}>
          {file.path}
        </div>
      </div>
      
      {/* 行为树信息卡片 */}
      {behaviorTreeInfo && (
        <div style={{
          marginBottom: '16px',
          background: '#f9f9fb',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid #eee'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#722ED1" strokeWidth="2">
              <path d="M12 3v18M5.5 5.5h13M5.5 12h13M5.5 18.5h13" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            行为树信息
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: '#fff',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>节点数量</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{behaviorTreeInfo.nodeCount}</div>
            </div>
            
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: '#fff',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>树的深度</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{behaviorTreeInfo.maxDepth || '未知'}</div>
            </div>
            
            {behaviorTreeInfo.rootNodeId && (
              <div style={{
                padding: '10px',
                borderRadius: '8px',
                background: '#fff',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>根节点ID</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {behaviorTreeInfo.rootNodeId}
                </div>
              </div>
            )}
          </div>
          
          {/* 节点类型统计 */}
          {Object.keys(behaviorTreeInfo.nodeTypes).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ 
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333'
              }}>
                节点类型统计
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {Object.entries(behaviorTreeInfo.nodeTypes).map(([type, count]) => (
                  <div 
                    key={type}
                    style={{
                      padding: '4px 10px',
                      background: '#f0f0ff',
                      color: '#722ED1',
                      borderRadius: '4px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{type}</span>
                    <span style={{ 
                      background: '#722ED1',
                      color: '#fff',
                      height: '18px',
                      minWidth: '18px',
                      borderRadius: '9px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '0 4px'
                    }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 内容预览区域 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 预览控制栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 600,
            color: '#333'
          }}>
            文件内容预览
          </h3>
          
          {parsedJson && !error && (
            <div style={{
              display: 'flex',
              background: '#f0f2f5',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={() => setIsJsonView(true)}
                style={{
                  padding: '4px 10px',
                  background: isJsonView ? '#fff' : 'transparent',
                  color: isJsonView ? '#722ED1' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: isJsonView ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                格式化视图
              </button>
              <button
                onClick={() => setIsJsonView(false)}
                style={{
                  padding: '4px 10px',
                  background: !isJsonView ? '#fff' : 'transparent',
                  color: !isJsonView ? '#722ED1' : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: !isJsonView ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                原始视图
              </button>
            </div>
          )}
        </div>
        
        {/* 内容区域 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999'
            }}>
              <span>加载中...</span>
            </div>
          ) : error ? (
            <div style={{
              padding: '16px',
              color: '#ff4d4f',
              fontSize: '14px'
            }}>
              {error}
            </div>
          ) : (
            <pre style={{
              margin: 0,
              padding: '16px',
              fontSize: '14px',
              fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#333',
              overflow: 'auto',
              height: '100%'
            }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview; 