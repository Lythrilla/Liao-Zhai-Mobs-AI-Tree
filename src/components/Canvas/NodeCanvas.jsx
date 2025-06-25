import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'react-flow-renderer';
import NodeBase from '../Nodes/NodeBase';
import SubgraphNode from '../Nodes/SubgraphNode';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { NodeTypes } from '../../utils/nodeTypes';

// 注册自定义节点
const nodeTypes = {
  default: NodeBase,
  RootNode: NodeBase,
  SubgraphNode: SubgraphNode,
  Selector: NodeBase,
  Sequence: NodeBase,
  SimpleParallel: NodeBase,
  Inverter: NodeBase,
  ForceSuccess: NodeBase,
  ForceFailure: NodeBase,
  Repeat: NodeBase,
  Cooldown: NodeBase,
  Timeout: NodeBase,
  Blackboard: NodeBase,
  Wait: NodeBase,
  PrintString: NodeBase,
  SetBlackboardValue: NodeBase,
  GetBlackboardValue: NodeBase,
  MoveTo: NodeBase,
  LeaveMoveTo: NodeBase,
  Rotate: NodeBase,
  // 注册服务节点类型
  Parallel: NodeBase,
  BlackboardMonitorService: NodeBase,
  DistanceCheckService: NodeBase,
  LineOfSightService: NodeBase,
  PatrolService: NodeBase,
  StateUpdateService: NodeBase,
  RandomValueService: NodeBase
};

// 初始节点
const initialNodes = [
  {
    id: 'root',
    type: 'RootNode',
    position: { x: 250, y: 0 },
    data: { 
      label: '根节点', 
      nodeType: 'RootNode',
      description: '行为树的起始节点，所有行为树必须从此节点开始'
    },
    className: 'node-root'
  }
];

const initialEdges = [];

const NodeCanvas = forwardRef(({ 
  onSelectionChange, 
  onNodesChange: onNodesChangeExternal,
  onEdgesChange: onEdgesChangeExternal,
  onConnect: onConnectExternal,
  onContextMenu,
  onNodeDoubleClick,
  onOpenSubgraph,
  settings = {}
}, ref) => {
  const reactFlowWrapper = useRef(null);
  // 状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowInstance = useReactFlow();
  
  // 创建一个带有settings属性的nodeTypes对象
  const nodeTypesWithSettings = useMemo(() => {
    // 对每个节点类型应用设置
    const enhancedTypes = {};
    Object.keys(nodeTypes).forEach(type => {
      const NodeComponent = nodeTypes[type];
      enhancedTypes[type] = (props) => <NodeComponent {...props} settings={settings} />;
    });
    return enhancedTypes;
  }, [settings]);
  
  // 引用拖放钩子来处理拖放事件
  const { dragHandlers, dropHandlers, onDragStart, onDragEnd } = useDragAndDrop(
    reactFlowInstance, 
    nodes, 
    setNodes
  );
  
  // 节点变化处理
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    if (onNodesChangeExternal) {
      onNodesChangeExternal();
    }
  }, [onNodesChange, onNodesChangeExternal]);
  
  // 边缘变化处理
  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    if (onEdgesChangeExternal) {
      onEdgesChangeExternal();
    }
  }, [onEdgesChange, onEdgesChangeExternal]);
  
  // 连接边缘更新处理函数
  const handleConnect = useCallback(
    (connection) => {
      // 执行适当的边缘验证
      setEdges((eds) => addEdge({
        ...connection,
        animated: true,
        style: { stroke: '#722ED1' }
      }, eds));
      
      // 通知父组件连接已更改
      if (onConnectExternal) {
        onConnectExternal();
      }
    },
    [setEdges, onConnectExternal]
  );
  
  // 选择节点处理函数
  const onSelectionChangeHandler = useCallback(
    ({ nodes }) => {
      // 当选择发生变化时，将完整的选择结果传递给父组件
      if (onSelectionChange) {
        onSelectionChange({ nodes });
      }
      
      // 更新内部选中节点状态
    const selectedNode = nodes.length > 0 ? nodes[0] : null;
      setSelectedNode(selectedNode);
      
      // 添加日志以便调试
      if (nodes.length > 0) {
        console.log(`NodeCanvas: 选中了 ${nodes.length} 个节点`);
      } else {
        console.log('NodeCanvas: 没有选中节点');
    }
    },
    [onSelectionChange]
  );
  
  // 节点双击处理函数
  const handleNodeDoubleClick = useCallback(
    (event, node) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(event, node);
      }
    },
    [onNodeDoubleClick]
  );
  
  // 缩放控制
  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);
  
  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);
  
  const zoomReset = useCallback(() => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  }, [reactFlowInstance]);
  
  // 创建子图
  const createSubgraph = useCallback((selectedNodeIds) => {
    if (!selectedNodeIds || selectedNodeIds.length === 0) return;
    
    // 获取选中的节点
    const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
    if (selectedNodes.length === 0) return;
    
    // 计算子图的位置（选中节点的中心点）
    const positions = selectedNodes.map(node => node.position);
    const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    
    // 获取与选中节点相关的边
    const relatedEdges = edges.filter(edge => 
      selectedNodeIds.includes(edge.source) || selectedNodeIds.includes(edge.target)
    );
    
    // 找出子图的外部连接
    const externalConnections = {
      inputs: [],
      outputs: []
    };
    
    edges.forEach(edge => {
      // 如果源在子图内，目标在外部
      if (selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)) {
        externalConnections.outputs.push({
          sourceId: edge.source,
          sourceHandle: edge.sourceHandle,
          targetId: edge.target,
          targetHandle: edge.targetHandle
        });
      }
      
      // 如果目标在子图内，源在外部
      if (!selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target)) {
        externalConnections.inputs.push({
          sourceId: edge.source,
          sourceHandle: edge.sourceHandle,
          targetId: edge.target,
          targetHandle: edge.targetHandle
        });
      }
    });
    
    // 创建子图节点
    const subgraphId = `subgraph_${Date.now()}`;
    const subgraphNode = {
      id: subgraphId,
      type: 'SubgraphNode',
      position: { x: centerX, y: centerY },
      data: {
        label: '子图',
        nodeType: 'SubgraphNode',
        description: `包含 ${selectedNodes.length} 个节点的子图`,
        childNodes: selectedNodes.map(node => ({ 
          ...node,
          data: {
            ...node.data,
            // 确保我们保留所有原始数据
          }
        })),
        childEdges: relatedEdges.map(edge => ({ ...edge })),
        onOpenSubgraph: onOpenSubgraph,
        externalConnections
      },
      style: {
        opacity: 1, // 确保不透明度为1
        zIndex: 10  // 确保子图显示在顶层
      }
    };
    
    // 更新节点，将选中的节点标记为子图的一部分并隐藏
    const updatedNodes = nodes.map(node => {
      if (selectedNodeIds.includes(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            parentSubgraph: subgraphId
          },
          hidden: true, // 初始状态下隐藏子图内的节点
          style: {
            ...node.style,
            opacity: 0 // 确保完全隐藏
          }
        };
      }
      return node;
    });
    
    // 添加子图节点
    const newNodes = [...updatedNodes, subgraphNode];
    setNodes(newNodes);
    
    // 过滤掉所有与子图内部节点相关的边
    const filteredEdges = edges.filter(edge => {
      // 如果边的源和目标都在子图内，或者其中之一在子图内，则过滤掉
      const sourceInSubgraph = selectedNodeIds.includes(edge.source);
      const targetInSubgraph = selectedNodeIds.includes(edge.target);
      
      // 保留与子图无关的边
      return !(sourceInSubgraph || targetInSubgraph);
    });
    
    // 创建从子图到外部的新边
    const newEdges = [...filteredEdges];
    
    // 为每个外部输入创建一条新边
    externalConnections.inputs.forEach(conn => {
      newEdges.push({
        id: `e_${conn.sourceId}_${subgraphId}`,
        source: conn.sourceId,
        target: subgraphId,
        sourceHandle: conn.sourceHandle,
        targetHandle: 'parent',
        animated: true,
        style: { stroke: '#722ED1' }
      });
    });
    
    // 为每个外部输出创建一条新边
    externalConnections.outputs.forEach(conn => {
      newEdges.push({
        id: `e_${subgraphId}_${conn.targetId}`,
        source: subgraphId,
        target: conn.targetId,
        sourceHandle: 'children',
        targetHandle: conn.targetHandle,
        animated: true,
        style: { stroke: '#722ED1' }
      });
    });
    
    setEdges(newEdges);
    
    // 选中新创建的子图节点
    setSelectedNode(subgraphNode);
    
    return subgraphId;
  }, [nodes, edges, setNodes, setEdges, onOpenSubgraph]);
  
  // 暴露内部方法供父组件调用
  useImperativeHandle(ref, () => ({
    // 获取当前画布上的所有节点
    getNodes: () => nodes,
    
    // 获取当前画布上的所有边
    getEdges: () => edges,
    
    // 设置节点
    setNodes: (newNodes) => setNodes(newNodes),
    
    // 设置边
    setEdges: (newEdges) => setEdges(newEdges),
    
    // 拖拽开始
    onDragStart,
    
    // 拖拽结束
    onDragEnd,
    
    // 缩放控制
    zoomIn,
    zoomOut,
    zoomReset,
    
    // 获取当前视图状态
    getViewport: () => reactFlowInstance.getViewport(),
    
    // 子图相关功能
    createSubgraph,
    
    // 导出为JSON数据
    exportToJson: () => {
      return JSON.stringify({
        nodes: nodes.map(node => ({
          ...node,
          // 移除可能引起循环引用的属性
          __rf: undefined,
          positionAbsolute: undefined
        })),
        edges: edges
      }, null, 2);
    }
  }));
  
  return (
    <div className="canvas-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={onSelectionChangeHandler}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypesWithSettings}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        onDragOver={dragHandlers.onDragOver}
        onDrop={dropHandlers.onDrop}
        onNodeContextMenu={(event, node) => onContextMenu && onContextMenu(event, node)}
        onPaneContextMenu={(event) => onContextMenu && onContextMenu(event, null)}
        multiSelectionKeyCode="Shift"
        selectionKeyCode={null}
        selectionOnDrag={true}
        selectNodesOnDrag={false}
        elementsSelectable={true}
        deleteKeyCode="Delete"
        panOnDrag={[0, 1, 2]}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => n.selected ? '#722ED1' : '#ddd'}
          nodeColor={(n) => n.selected ? '#f0e6fd' : '#fff'}
        />
        <Background color="#f5f5f5" gap={16} />
      </ReactFlow>
    </div>
  );
});

NodeCanvas.displayName = 'NodeCanvas';

export default NodeCanvas; 