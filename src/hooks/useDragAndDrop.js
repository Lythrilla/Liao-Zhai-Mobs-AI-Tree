import { useCallback, useRef, useEffect } from 'react';
import { getNodeInfo } from '../utils/nodeTypes';

export const useDragAndDrop = (reactFlowInstance, nodes, setNodes) => {
  // 移除未使用的状态
  // const [dragging, setDragging] = useState(false);
  const draggedNodeRef = useRef(null);

  // 开始拖拽
  const onDragStart = useCallback((event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    
    const nodeInfo = getNodeInfo(nodeType);
    draggedNodeRef.current = {
      type: nodeType,
      data: { 
        label: nodeInfo?.name || nodeType,
        nodeType,
        params: {}
      }
    };
    
    // setDragging(true);
    
    // 延迟一点以允许数据传输设置完成
    setTimeout(() => {
      document.body.style.cursor = 'grabbing';
    }, 10);
  }, []);

  // 拖拽结束
  const onDragEnd = useCallback(() => {
    document.body.style.cursor = 'default';
    // setDragging(false);
    draggedNodeRef.current = null;
  }, []);

  // 处理画布上的放置
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 处理画布上的放置
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        return;
      }

      const nodeType = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeType) {
        return;
      }
      
      // 获取画布容器的边界
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const nodeInfo = getNodeInfo(nodeType);
      
      if (!nodeInfo) {
        console.error(`Unknown node type: ${nodeType}`);
        return;
      }
      
      // 为节点参数设置默认值
      const defaultParams = {};
      if (nodeInfo.params) {
        nodeInfo.params.forEach(param => {
          if (param.default !== undefined) {
            defaultParams[param.key] = param.default;
          }
        });
      }

      // 创建新节点
      const newNode = {
        id: `${nodeType}_${Math.random().toString(36).substr(2, 9)}`,
        type: nodeType,
        position,
        data: {
          label: nodeInfo.name || nodeType,
          nodeType: nodeType,
          description: nodeInfo.description || '',
          params: defaultParams
        },
        className: nodeInfo.customClass || '',
      };
      
      // 添加新节点到现有节点列表
      setNodes([...nodes, newNode]);
      // setDragging(false);
    },
    [reactFlowInstance, nodes, setNodes]
  );
  
  // 清理函数
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  return {
    dragHandlers: {
      onDragOver,
    },
    dropHandlers: {
      onDrop,
    },
    onDragStart,
    onDragEnd,
  };
}; 