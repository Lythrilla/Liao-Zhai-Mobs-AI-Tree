import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';
import { getNodeColor } from '../../utils/nodeTypes';

// 子图节点组件
const SubgraphNode = ({ data, selected, id, settings = {} }) => {
  const { 
    label, 
    description, 
    params = {}, 
    childNodes = [], 
    childEdges = [] 
  } = data;
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeColor = getNodeColor('SubgraphNode');

  // 当节点数据变化时，强制更新节点内部状态
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data, params, label, description, updateNodeInternals]);

  // 打开子图编辑页面
  const openSubgraph = () => {
    if (data.onOpenSubgraph) {
      data.onOpenSubgraph(id);
    }
  };

  // 连接点样式
  const handleStyle = {
    width: '8px',
    height: '8px',
    background: '#fff',
    border: `2px solid ${nodeColor}`,
    zIndex: 5
  };

  return (
    <div className={`bt-node node-subgraph ${selected ? 'selected' : ''}`} style={{
      backgroundColor: 'var(--bg-primary)',
      opacity: 1, // 确保不透明度为1，防止显示灰色
      boxShadow: selected ? '0 0 0 2px rgba(114, 46, 209, 0.5)' : 'none',
      border: `1px solid ${selected ? nodeColor : 'var(--border-color)'}`,
    }}>
      <div className="node-header" style={{ 
        borderBottom: `1px solid ${nodeColor}30`,
        background: `${nodeColor}08`,
        padding: '8px 10px',
      }}>
        <div className="node-icon" style={{ color: nodeColor }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill={nodeColor} fillOpacity="0.3" />
            <path d="M6 8h12M6 12h12M6 16h12" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="node-title" style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          {label || '子图'}
        </div>
      </div>
      
      <div className="node-content">
        {description && <div className="node-description">{description}</div>}
        
        {/* 显示子图内容摘要 */}
        <div className="subgraph-summary" style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          margin: '5px 0'
        }}>
          包含 {childNodes.length} 个节点, {childEdges.length} 个连接
        </div>
        
        {/* 打开子图按钮 */}
        <div 
          className="subgraph-open"
          onClick={openSubgraph}
          style={{ 
            marginTop: '8px',
            padding: '4px 8px',
            borderRadius: '4px',
            background: `${nodeColor}20`,
            color: nodeColor,
            fontSize: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            ':hover': {
              background: `${nodeColor}30`,
            }
          }}
        >
          打开子图
        </div>
      </div>
      
      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="parent"
        style={handleStyle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="children"
        style={handleStyle}
      />
    </div>
  );
};

export default memo(SubgraphNode); 