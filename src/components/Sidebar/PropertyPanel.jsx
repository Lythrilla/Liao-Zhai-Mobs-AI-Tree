import React, { memo, useState, useEffect, useCallback } from 'react';
import { getNodeInfo } from '../../utils/nodeTypes';

const PropertyPanel = ({ selectedNode, updateNodeParams, collapsed }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localParams, setLocalParams] = useState({});
  
  // 处理参数变化 - 确保useCallback在所有条件语句之前
  const handleParamChange = useCallback((key, value, nodeId) => {
    // 更新本地状态
    setLocalParams(prevParams => {
      const updatedParams = {
        ...prevParams,
        [key]: value
      };
      
      // 更新节点参数
      if (selectedNode) {
        updateNodeParams(selectedNode.id, updatedParams);
      }
      
      return updatedParams;
    });
  }, [selectedNode, updateNodeParams]);
  
  // 当选中节点变化时，更新本地参数状态
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
      // 确保params存在
      const params = selectedNode.data.params || {};
      setLocalParams({...params});
    } else {
      setLocalParams({});
    }
  }, [selectedNode]);
  
  if (!selectedNode || collapsed) {
    return (
      <div className="property-panel" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        opacity: 0.6,
        padding: '20px' 
      }}>
        {!collapsed && <span>请选择一个节点查看属性</span>}
      </div>
    );
  }

  const { id, type, data } = selectedNode;
  const nodeInfo = getNodeInfo(type);
  
  if (!nodeInfo) {
    return (
      <div className="property-panel">
        <p>未知节点类型: {type}</p>
      </div>
    );
  }
  
  const { name, description, params: paramDefs = [], color } = nodeInfo;
  
  // 处理节点标签编辑
  const handleLabelEdit = (newLabel) => {
    if (newLabel && newLabel.trim() !== '') {
      // 创建新的节点数据对象
      const updatedData = {
        ...selectedNode.data,
        label: newLabel.trim()
      };
      
      // 更新节点
      const updatedParams = {...localParams};
      updateNodeParams(id, updatedParams, updatedData);
    }
    setEditingField(null);
  };
  
  // 处理描述编辑
  const handleDescriptionEdit = (newDesc) => {
    if (newDesc && newDesc.trim() !== '') {
      // 创建新的节点数据对象
      const updatedData = {
        ...selectedNode.data,
        description: newDesc.trim()
      };
      
      // 更新节点
      const updatedParams = {...localParams};
      updateNodeParams(id, updatedParams, updatedData);
    }
    setEditingField(null);
  };
  
  // 双击编辑处理
  const handleDoubleClick = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };
  
  // 编辑完成
  const handleEditComplete = () => {
    if (editingField === 'label') {
      handleLabelEdit(editValue);
    } else if (editingField === 'description') {
      handleDescriptionEdit(editValue);
    }
  };
  
  // 按键处理
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };
  
  // 检查参数是否应该可见
  const isParamVisible = (param) => {
    const { visible } = param;
    if (!visible || typeof visible !== 'function') {
      return true;
    }
    
    // 使用本地状态来确定可见性
    return visible(localParams);
  };
  
  // 根据参数类型渲染不同的编辑控件
  const renderParamInput = (param) => {
    const { key, name, type, options = [] } = param;
    
    // 检查参数是否应该可见
    if (!isParamVisible(param)) {
      return null;
    }
    
    const value = localParams[key] !== undefined ? localParams[key] : param.default;
    
    switch (type) {
      case 'string':
        return (
          <input
            type="text"
            className="property-input"
            value={value || ''}
            onChange={(e) => handleParamChange(key, e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            className="property-input"
            value={value || 0}
            onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
            step="0.1"
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
          />
        );
        
      case 'boolean':
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id={`param-${id}-${key}`}
              checked={value || false}
              onChange={(e) => handleParamChange(key, e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px' }}
            />
            <label htmlFor={`param-${id}-${key}`} style={{ cursor: 'pointer' }}>
              {value ? '是' : '否'}
            </label>
          </div>
        );
        
      case 'select':
        return (
          <select
            className="property-input"
            value={value || options[0]}
            onChange={(e) => handleParamChange(key, e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
          >
            {options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      default:
        return (
          <input
            type="text"
            className="property-input"
            value={value || ''}
            onChange={(e) => handleParamChange(key, e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
          />
        );
    }
  };
  
  // 过滤显示的参数定义，只显示应该可见的参数
  const visibleParamDefs = paramDefs.filter(param => isParamVisible(param));
  
  return (
    <div className="property-panel" style={{ padding: '16px' }}>
      <div className="property-section">
        <div className="property-section-title" style={{ 
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px'
        }}>
          节点信息
        </div>
        
        <div className="property-item" style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 500,
            marginBottom: '8px',
            color: color || 'var(--text-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {editingField === 'label' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditComplete}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: color
                }}
              />
            ) : (
              <span 
                onDoubleClick={() => handleDoubleClick('label', data.label || name)}
                style={{ cursor: 'pointer' }}
              >
                {data.label || name}
              </span>
            )}
            <small style={{ 
              fontSize: '11px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '2px 6px',
              borderRadius: '10px'
            }}>
              {type}
            </small>
          </div>
          
          {editingField === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleEditComplete();
                }
                if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          ) : (
            <div 
              style={{ 
            fontSize: '13px',
            color: 'var(--text-secondary)',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}
              onDoubleClick={() => handleDoubleClick('description', data.description || description)}
              title="双击编辑描述"
            >
              {data.description || description}
          </div>
          )}
          
          <div style={{ 
            fontSize: '12px',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            ID: {id}
          </div>
        </div>
      </div>
      
      {visibleParamDefs.length > 0 && (
        <div className="property-section">
          <div className="property-section-title" style={{ 
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px'
          }}>
            参数设置
          </div>
          
          {visibleParamDefs.map(param => (
            <div key={param.key} className="property-item" style={{ marginBottom: '12px' }}>
              <label 
                className="property-label" 
                style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {param.name}
              </label>
              {renderParamInput(param)}
              {param.description && (
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  marginTop: '4px' 
                }}>
                  {param.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(PropertyPanel); 