import React, { useState, useEffect } from 'react';

const FilePreview = ({ file, onOpenEditor }) => {
  const [content, setContent] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
      return date.toLocaleString();
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
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 文件信息头部 */}
      <div style={{ 
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {/* 文件图标 */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#f0f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#722ED1'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* 文件名和路径 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px',
              fontWeight: 600,
              color: '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {file.name}
            </h3>
            <p style={{ 
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#666',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {file.path}
            </p>
          </div>
        </div>
        
        {/* 文件详细信息 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '13px',
          color: '#666',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ color: '#999' }}>大小:</span> {formatFileSize(file.size || 0)}
          </div>
          <div>
            <span style={{ color: '#999' }}>修改时间:</span> {formatDate(file.lastModified)}
          </div>
          {file.created && (
            <div>
              <span style={{ color: '#999' }}>创建时间:</span> {formatDate(file.created)}
            </div>
          )}
        </div>
        
        {/* 行为树信息 */}
        {behaviorTreeInfo && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#f9f9ff',
            borderRadius: '6px',
            border: '1px solid #e6e6ff'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '14px',
              fontWeight: 600,
              color: '#722ED1'
            }}>
              行为树信息
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: '#999' }}>节点数量:</span> {behaviorTreeInfo.nodeCount}
              </div>
              {behaviorTreeInfo.maxDepth > 0 && (
                <div>
                  <span style={{ color: '#999' }}>最大深度:</span> {behaviorTreeInfo.maxDepth}
                </div>
              )}
              {behaviorTreeInfo.rootNodeId && (
                <div>
                  <span style={{ color: '#999' }}>根节点ID:</span> {behaviorTreeInfo.rootNodeId}
                </div>
              )}
            </div>
            
            {/* 节点类型统计 */}
            {Object.keys(behaviorTreeInfo.nodeTypes).length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>节点类型:</div>
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  {Object.entries(behaviorTreeInfo.nodeTypes).map(([type, count]) => (
                    <div key={type} style={{
                      padding: '2px 8px',
                      background: '#eeeeff',
                      borderRadius: '12px',
                      color: '#722ED1'
                    }}>
                      {type}: {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 文件内容预览 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
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
            background: '#fff5f5',
            border: '1px solid #ffeeee',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        ) : (
          <pre style={{ 
            margin: 0,
            padding: '16px',
            background: '#f8f9fa',
            border: '1px solid #eee',
            borderRadius: '4px',
            fontSize: '13px',
            lineHeight: 1.5,
            fontFamily: 'Consolas, monospace',
            overflow: 'auto',
            color: '#333',
            whiteSpace: 'pre-wrap'
          }}>
            {content}
          </pre>
        )}
      </div>
      
      {/* 底部操作栏 */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button 
          onClick={() => {
            if (file && file.path.endsWith('.json')) {
              window.electron?.ipcRenderer.invoke('validate-behavior-tree', file.path)
                .then(result => {
                  if (result.isValid) {
                    alert('行为树验证通过！');
                  } else {
                    alert(`行为树验证失败: ${result.message}`);
                  }
                })
                .catch(err => {
                  alert(`验证过程出错: ${err.message}`);
                });
            }
          }}
          style={{
            padding: '8px 16px',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#333',
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
          验证行为树
        </button>
        
        <button 
          onClick={handleOpenInEditor}
          style={{
            padding: '8px 16px',
            background: '#722ED1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#fff',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5b25a8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#722ED1';
          }}
        >
          在编辑器中打开
        </button>
      </div>
    </div>
  );
};

export default FilePreview; 