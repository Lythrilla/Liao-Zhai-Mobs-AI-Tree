import React, { useState, useEffect } from 'react';
import { NodeGroups, NodeData } from '../../utils/nodeTypes';

const NodePalette = ({ onDragStart, onDragEnd }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  
  // 初始化展开状态
  useEffect(() => {
    const initialState = {};
    NodeGroups.forEach((group, index) => {
      initialState[group.title] = index === 0; // 默认只展开第一组
    });
    setExpandedGroups(initialState);
  }, []);
  
  // 处理组展开/折叠
  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  // 展开/折叠所有组
  const toggleAllGroups = () => {
    const newState = !allExpanded;
    const updatedGroups = {};
    
    NodeGroups.forEach(group => {
      updatedGroups[group.title] = newState;
    });
    
    setExpandedGroups(updatedGroups);
    setAllExpanded(newState);
  };
  
  // 获取节点计数
  const getNodeCount = (group) => {
    return group.nodes.length;
  };
  
  // 计算总节点数
  const getTotalNodeCount = () => {
    return NodeGroups.reduce((total, group) => total + group.nodes.length, 0);
  };
  
  // 处理拖拽开始
  const handleDragStart = (event, nodeType) => {
    if (onDragStart) {
      onDragStart(event, nodeType);
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = (event) => {
    if (onDragEnd) {
      onDragEnd(event);
    }
  };
    
    return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>节点类型</h3>
        <button 
          className="toggle-all-button"
          onClick={toggleAllGroups}
          title={allExpanded ? "全部折叠" : "全部展开"}
        >
          {allExpanded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 15L12 8L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        </div>
        
      <div className="node-groups">
        {NodeGroups.map((group) => {
          const isExpanded = expandedGroups[group.title];
          const nodeCount = getNodeCount(group);
          
          return (
            <div className="node-group" key={group.title}>
              <div 
                className={`group-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleGroup(group.title)}
              >
                <div className="group-title">
                  <span>{group.title}</span>
                  <span className="node-count">{nodeCount}</span>
          </div>
                <div className="group-toggle">
                  {isExpanded ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
        )}
      </div>
              </div>
              
              <div className={`group-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="node-items">
                  {group.nodes.map((nodeType) => {
                    const nodeInfo = NodeData[nodeType];
                    if (!nodeInfo) return null;
                    
                    const nodeColor = nodeInfo.color || '#ccc';
  
  return (
                      <div 
                        className="node-item" 
                        key={nodeType}
                        draggable
                        onDragStart={(e) => handleDragStart(e, nodeType)}
                        onDragEnd={handleDragEnd}
                      >
                        <div 
                          className="node-marker" 
                          style={{ backgroundColor: nodeColor }}
                        ></div>
                        <div className="node-content">
                          <div className="node-name">{nodeInfo.name}</div>
                          <div className="node-description">{nodeInfo.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="palette-footer">
        <small>共 {getTotalNodeCount()} 个节点</small>
        </div>
      
      <style jsx="true">{`
        .node-palette {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background-color: #f9f9f9;
        }
        
        .palette-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        
        .palette-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .toggle-all-button {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          border-radius: 4px;
          padding: 4px;
        }
        
        .toggle-all-button:hover {
          background-color: rgba(0,0,0,0.05);
          color: #333;
        }
        
        .node-groups {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        
        .node-groups::-webkit-scrollbar {
          width: 6px;
        }
        
        .node-groups::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .node-groups::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.2);
          border-radius: 3px;
        }
        
        .node-group {
          margin-bottom: 8px;
          border-radius: 6px;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .group-header:hover {
          background-color: rgba(0,0,0,0.02);
        }
        
        .group-header.expanded {
          border-bottom: 1px solid rgba(0,0,0,0.03);
        }
        
        .group-title {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: #333;
        }
        
        .node-count {
          background-color: rgba(0,0,0,0.05);
          color: #666;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
        }
        
        .group-toggle {
          color: #999;
          transition: transform 0.2s ease;
        }
        
        .group-header.expanded .group-toggle {
          transform: rotate(0deg);
        }
        
        .group-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        
        .group-content.expanded {
          max-height: 1000px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
        }
        
        .node-items {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .node-item {
          position: relative;
          border-radius: 4px;
          background-color: #fff;
          padding: 8px 12px;
          cursor: grab;
          transition: all 0.2s ease;
          display: flex;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.08);
        }
        
        .node-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-color: rgba(0,0,0,0.12);
        }
        
        .node-item:active {
          cursor: grabbing;
          transform: scale(0.98);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .node-marker {
          width: 3px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
        }
        
        .node-content {
          margin-left: 8px;
          flex: 1;
        }
        
        .node-name {
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 2px;
          color: #333;
        }
        
        .node-description {
          font-size: 12px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .palette-footer {
          padding: 8px 16px;
          border-top: 1px solid rgba(0,0,0,0.06);
          color: #999;
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default NodePalette; 