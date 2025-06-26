import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import NodeCanvas from './components/Canvas/NodeCanvas';
import Toolbar from './components/Toolbar/Toolbar';
import TitleBar from './components/Toolbar/TitleBar';
import NodePalette from './components/Sidebar/NodePalette';
import PropertyPanel from './components/Sidebar/PropertyPanel';
import { SettingsButton, SettingsPanel } from './components/Modal/SettingsPanel';
import { exportToBehaviorTreeJson } from './utils/exportUtils';
import WorkspaceHome from './components/Workspace';
import Breadcrumb from './components/Workspace/Breadcrumb';

// 默认设置
const defaultSettings = {
  alwaysShowLabels: false
};

// 移除了工作空间路由组件

// 主编辑器组件
const EditorApp = () => {
  // 状态管理
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [fileLoadAttempted, setFileLoadAttempted] = useState(false);

  // 设置状态
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('btEditorSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [showSettings, setShowSettings] = useState(false);

  // 历史记录状态
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef(null);
  const [clipboard, setClipboard] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const [subgraphs, setSubgraphs] = useState({});
  const [currentSubgraph, setCurrentSubgraph] = useState(null);
  const [subgraphHistory, setSubgraphHistory] = useState([]);
  const [showSubgraphList, setShowSubgraphList] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const subgraphPanelRef = useRef(null);

  const navigate = useNavigate();

  // 添加到历史记录
  const addToHistory = useCallback((nodes, edges) => {
    // 如果节点为空，不添加历史记录
    if (!nodes || nodes.length === 0) {
      return;
    }

    // 创建当前状态的深拷贝
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges || []))
    };

    // 如果历史记录为空，直接添加
    if (history.length === 0) {
      setHistory([currentState]);
      setHistoryIndex(0);
      setCanUndo(false);
      setCanRedo(false);
      return;
    }

    // 如果我们在历史记录中间进行了编辑，则删除当前索引之后的所有历史
    const newHistory = history.slice(0, historyIndex + 1);

    // 检查是否与最后一个历史状态相同（避免重复添加相同状态）
    const lastState = newHistory[newHistory.length - 1];
    if (lastState &&
        JSON.stringify(lastState.nodes) === JSON.stringify(currentState.nodes) &&
        JSON.stringify(lastState.edges) === JSON.stringify(currentState.edges)) {
      return; // 状态相同，不添加
    }

    // 添加新状态到历史
    newHistory.push(currentState);

    // 更新历史记录和索引
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // 更新撤销/重做按钮状态
    setCanUndo(newHistory.length > 1);
    setCanRedo(false);
  }, [history, historyIndex]);

  // 更新节点参数
  const updateNodeParams = useCallback((nodeId, params, updatedData = null) => {
    if (canvasRef.current) {
      // 创建新的data对象，确保React能检测到变化
      let newData;
      if (updatedData) {
        // 如果提供了完整的更新数据，直接使用
        newData = {
          ...updatedData,
          params: { ...params }
        };
      } else {
        // 获取当前节点数据
        const currentNode = canvasRef.current.getNodes().find(n => n.id === nodeId);
        if (currentNode) {
          // 否则只更新参数
          newData = {
            ...currentNode.data,
            params: { ...params }
          };
        } else {
          return; // 节点不存在
        }
      }

      // 使用新方法更新节点数据
      canvasRef.current.updateNodeData(nodeId, newData);
      
      // 获取更新后的节点
      const allNodes = canvasRef.current.getNodes();
      const updatedNode = allNodes.find(n => n.id === nodeId);
      
      // 如果更新的是当前选中的节点，更新选中节点状态
      if (selectedNode && selectedNode.id === nodeId) {
        if (updatedNode) {
          setSelectedNode(updatedNode);
        }
      }

      // 添加到历史记录
      addToHistory(allNodes, canvasRef.current.getEdges());
    }
  }, [selectedNode, addToHistory]);

  // 添加自定义事件监听器，处理节点参数变更
  useEffect(() => {
    const handleNodeParamChanged = (event) => {
      const { nodeId, params, paramKey, paramValue } = event.detail;
      
      // 如果有完整的参数对象，直接使用
      if (params) {
        updateNodeParams(nodeId, params);
      } 
      // 否则尝试更新单个参数
      else if (nodeId && paramValue !== undefined) {
        // 获取当前节点
        const currentNode = canvasRef.current.getNodes().find(n => n.id === nodeId);
        if (currentNode && currentNode.data && currentNode.data.params) {
          const updatedParams = {
            ...currentNode.data.params,
            // 如果有paramKey使用它，否则尝试猜测
            ...(paramKey ? { [paramKey]: paramValue } : {})
          };
          updateNodeParams(nodeId, updatedParams);
        }
      }
    };

    // 添加事件监听器
    document.addEventListener('bt:node:param:changed', handleNodeParamChanged);
    
    // 清理函数
    return () => {
      document.removeEventListener('bt:node:param:changed', handleNodeParamChanged);
    };
  }, [updateNodeParams, canvasRef]);

  // 初始化历史记录
  const initializeHistory = useCallback(() => {
    if (canvasRef.current) {
      const initialNodes = canvasRef.current.getNodes();
      const initialEdges = canvasRef.current.getEdges();

      if (initialNodes.length > 0) {
        const initialState = { nodes: initialNodes, edges: initialEdges };
        setHistory([initialState]);
        setHistoryIndex(0);
        setCanUndo(false);
        setCanRedo(false);

        console.log('历史记录已初始化', initialState);
      }
    }
  }, [canvasRef]);

  // 初始化历史记录
  useEffect(() => {
    const timer = setTimeout(initializeHistory, 100);
    return () => clearTimeout(timer);
  }, [initializeHistory]);

  // 新建行为树
  const handleNew = useCallback(() => {
    if (canvasRef.current) {
      if (history.length > 1) {
        if (!window.confirm('是否创建新的行为树？当前未保存的更改将丢失。')) {
          return;
        }
      }

      const initialNodes = [
        {
          id: 'root',
          type: 'root',
          position: { x: 250, y: 0 },
          data: {
            label: '根节点',
            nodeType: 'basic',
            description: '行为树的起始节点，所有行为树必须从此节点开始'
          },
          className: 'node-root'
        }
      ];
      const initialEdges = [];

      canvasRef.current.setNodes(initialNodes);
      canvasRef.current.setEdges(initialEdges);

      setSelectedNode(null);

      setTimeout(() => {
        const newHistoryState = { nodes: initialNodes, edges: initialEdges };
        setHistory([newHistoryState]);
        setHistoryIndex(0);
        setCanUndo(false);
        setCanRedo(false);
      }, 0);

      if (window.electron && window.electron.ipcRenderer) {
        try {
          window.electron.ipcRenderer.invoke('store-current-file', {
            path: null,
            content: null
          }).then(() => {
            console.log('已清除当前文件信息');
          }).catch(error => {
            console.error('清除当前文件信息失败:', error);
          });
        } catch (error) {
          console.error('尝试清除当前文件信息时出错:', error);
        }
      }
    }
  }, [history, canvasRef]);

  // 检查是否有通过IPC加载的文件
  useEffect(() => {
    if (fileLoadAttempted) {
      return;
    }

    const checkLoadedFile = async () => {
      setFileLoadAttempted(true);

      if (window.electron && window.electron.ipcRenderer) {
        try {
          console.log('检查是否有已加载的文件...');
          const result = await window.electron.ipcRenderer.invoke('get-current-file');
          console.log('获取到文件结果:', result);

          if (result && result.success && result.data) {
            console.log('从IPC获取到已加载的文件:', result.filePath);
            console.log('文件数据类型:', typeof result.data);
            console.log('文件数据包含节点数量:', result.data.nodes ? result.data.nodes.length : 0);

            if (canvasRef.current && result.data) {
              console.log('开始加载文件到编辑器...');
              const loadResult = canvasRef.current.loadFromJson(result.data);
              console.log('加载文件结果:', loadResult);

              if (loadResult) {
                console.log('初始化历史记录...');
                initializeHistory();
              }
            }
          } else {
            console.log('没有已加载的文件或加载失败，创建新的行为树');
            handleNew();
          }
        } catch (error) {
          console.log('尝试获取已加载文件出错:', error.message);
          handleNew();
        }
      } else {
        console.log('没有Electron环境，创建新的行为树');
        handleNew();
      }
    };

    checkLoadedFile();
  }, [fileLoadAttempted, initializeHistory, handleNew]);

  // 处理设置变更
  const handleSettingChange = useCallback((key, value) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [key]: value };
      return newSettings;
    });
  }, []);

  // 处理节点选择
  const handleNodeSelected = useCallback((node) => {
    if (node) {
    setSelectedNode(node);
      setSelectedNodes([node]); // 使用单选模式
        } else {
      setSelectedNode(null);
      setSelectedNodes([]);
    }
  }, []);

  // 处理多选变化
  const handleSelectionChange = useCallback((selection) => {
    // 添加空值检查
    if (!selection) {
      setSelectedNodes([]);
      setSelectedNode(null);
      return;
    }

    const { nodes } = selection;

    // 更新选中节点列表
    if (nodes && nodes.length > 0) {
      // 查找最新节点数据，确保我们有最新状态
      const latestNodes = canvasRef.current ? canvasRef.current.getNodes() : [];
      const updatedNodes = nodes.map(node => {
        // 找到对应的最新节点数据
        const latestNode = latestNodes.find(n => n.id === node.id);
        return latestNode || node;
      });
      
      setSelectedNodes(updatedNodes);

      // 如果只选择了一个节点，也更新selectedNode
      if (updatedNodes.length === 1) {
        setSelectedNode(updatedNodes[0]);
      } else if (updatedNodes.length > 1) {
        // 多选状态下，保持最后选中的节点作为主选中节点
        // 如果之前没有选择节点，则使用第一个作为主选中节点
        if (!selectedNode || !updatedNodes.some(n => n.id === selectedNode.id)) {
          setSelectedNode(updatedNodes[0]);
        } else if (selectedNode) {
          // 更新当前选中节点的最新数据
          const latestSelectedNode = updatedNodes.find(n => n.id === selectedNode.id);
          if (latestSelectedNode && latestSelectedNode !== selectedNode) {
            setSelectedNode(latestSelectedNode);
          }
        }
        console.log(`已选中${updatedNodes.length}个节点`);
      }
    } else {
      // 如果没有选中的节点，清空列表
      setSelectedNodes([]);
      setSelectedNode(null);
    }
  }, [selectedNode, canvasRef]);

  // 更新节点参数
  const handleCanvasChange = useCallback(() => {
    if (canvasRef.current) {
      // 获取当前状态
      const currentNodes = canvasRef.current.getNodes();
      const currentEdges = canvasRef.current.getEdges();

      // 如果历史记录为空，或者当前状态与最后一个历史记录不同，则添加到历史
      if (history.length === 0 || historyIndex < 0) {
        addToHistory(currentNodes, currentEdges);
        return;
      }

      // 获取最后一个历史记录
      const lastHistory = history[historyIndex];

      // 检查是否有实质性变化（节点数量或边数量变化）
      const nodesChanged = currentNodes.length !== lastHistory.nodes.length;
      const edgesChanged = currentEdges.length !== lastHistory.edges.length;

      // 如果有变化，添加到历史记录
      if (nodesChanged || edgesChanged) {
        addToHistory(currentNodes, currentEdges);
      }
    }
  }, [addToHistory, history, historyIndex, canvasRef]);

  // 保存行为树
  const handleSave = useCallback(() => {
    if (canvasRef.current) {
      // 使用导出方法获取JSON数据
      const jsonData = canvasRef.current.exportToJson();

      // 创建一个Blob对象并生成下载链接
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // 创建一个临时的链接元素并模拟点击
      const a = document.createElement('a');
      a.href = url;
      a.download = 'behavior_tree.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // 导出为JSON格式
  const handleExportJson = useCallback(() => {
    if (canvasRef.current) {
      try {
        const nodes = canvasRef.current.getNodes();
        const edges = canvasRef.current.getEdges();

        // 使用导出工具函数转换格式
        const behaviorTreeData = exportToBehaviorTreeJson(nodes, edges, {
          name: "行为树",
          description: "基础怪物行为树",
          version: "1.0"
        });

        // 创建一个Blob对象并生成下载链接
        const jsonData = JSON.stringify(behaviorTreeData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 创建一个临时的链接元素并模拟点击
        const a = document.createElement('a');
        a.href = url;
        a.download = 'behavior_tree_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('行为树已导出为JSON格式');
      } catch (error) {
        console.error('导出JSON时发生错误:', error);
        alert('导出失败: ' + error.message);
      }
    }
  }, []);

  const handleLoad = useCallback(() => {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);

          if (data.nodes && data.edges && canvasRef.current) {
            canvasRef.current.setNodes(data.nodes);
            canvasRef.current.setEdges(data.edges);

            // 添加到历史记录
            addToHistory(data.nodes, data.edges);
          }
        } catch (error) {
          console.error('加载文件时出错:', error);
          alert('加载文件失败，请检查文件格式是否正确。');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }, [addToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];

      if (canvasRef.current && previousState) {
        canvasRef.current.setNodes(previousState.nodes);
        canvasRef.current.setEdges(previousState.edges);
        setHistoryIndex(newIndex);

        // 更新撤销/重做按钮状态
        setCanUndo(newIndex > 0);
        setCanRedo(newIndex < history.length - 1);
      }
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];

      if (canvasRef.current && nextState) {
        canvasRef.current.setNodes(nextState.nodes);
        canvasRef.current.setEdges(nextState.edges);
        setHistoryIndex(newIndex);

        // 更新撤销/重做按钮状态
        setCanUndo(newIndex > 0);
        setCanRedo(newIndex < history.length - 1);
      }
    }
  }, [history, historyIndex]);

  // 删除选中节点
  const handleDelete = useCallback(() => {
    if (canvasRef.current && selectedNode) {
      const nodes = canvasRef.current.getNodes();
      const edges = canvasRef.current.getEdges();

      // 检查是否是根节点
      const isRootNode = selectedNode.id === 'root' || selectedNode.type === 'basic';

      // 计算根节点的数量
      const rootNodeCount = nodes.filter(node =>
        node.id === 'root' || node.type === 'basic'
      ).length;

      // 如果是最后一个根节点，不允许删除
      if (isRootNode && rootNodeCount <= 1) {
        alert('至少需要保留一个根节点');
        return;
      }

      // 检查节点是否有关联的边（子节点）
      const hasConnectedEdges = edges.some(edge => edge.source === selectedNode.id);

      // 检查节点是否有数据
      const hasData = selectedNode.data &&
                     (selectedNode.data.params ||
                      (selectedNode.data.label && selectedNode.data.label !== '根节点' && selectedNode.data.label !== selectedNode.type));

      // 如果节点有子节点或有数据，提示确认
      if ((hasConnectedEdges || hasData) &&
          !window.confirm(`确定要删除${hasConnectedEdges ? '含有子节点' : ''}${hasConnectedEdges && hasData ? '且' : ''}${hasData ? '含有数据' : ''}的节点吗？`)) {
        return;
      }

      // 过滤掉选中的节点
      const updatedNodes = nodes.filter(node => node.id !== selectedNode.id);

      // 过滤掉与删除节点相关的边
      const updatedEdges = edges.filter(edge =>
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );

      // 更新画布
      canvasRef.current.setNodes(updatedNodes);
      canvasRef.current.setEdges(updatedEdges);

      // 清除选中状态
      setSelectedNode(null);

      // 添加到历史记录
      addToHistory(updatedNodes, updatedEdges);
    }
  }, [selectedNode, addToHistory]);

  // 处理节点拖拽开始
  const handleDragStart = useCallback((event, nodeType) => {
    if (canvasRef.current && canvasRef.current.onDragStart) {
      canvasRef.current.onDragStart(event, nodeType);
    }
  }, []);

  // 处理节点拖拽结束
  const handleDragEnd = useCallback((event) => {
    if (canvasRef.current && canvasRef.current.onDragEnd) {
      canvasRef.current.onDragEnd(event);
    }
  }, []);

  // 复制选中节点
  const handleCopy = useCallback(() => {
    // 确保有选中的节点
    if (!selectedNode) {
      console.log("没有选中的节点可复制");
      return;
    }

    // 检查是否是子图节点
    const isSubgraph = selectedNode.type === 'SubgraphNode' || selectedNode.data?.nodeType === 'SubgraphNode';

    try {
      // 深拷贝选中节点，去除可能引起循环引用的属性
      const nodeCopy = JSON.parse(JSON.stringify({
        ...selectedNode,
        __rf: undefined,
        positionAbsolute: undefined
      }));

      // 如果是子图节点，确保其样式设置正确
      if (isSubgraph) {
        // 确保子图不会变灰
        nodeCopy.style = {
          ...(nodeCopy.style || {}),
          opacity: 1,
          zIndex: 10
        };

        // 确保childNodes中的每个节点数据都被正确保留
        if (nodeCopy.data?.childNodes) {
          nodeCopy.data.childNodes = nodeCopy.data.childNodes.map(childNode => ({
            ...childNode,
            hidden: false, // 确保在复制时不会隐藏
            style: {
              ...(childNode.style || {}),
              opacity: 1 // 确保不透明度为1
            }
          }));
        }
      }

      // 存储到剪贴板
      setClipboard(nodeCopy);
      console.log("已复制节点到剪贴板:", nodeCopy.type || nodeCopy.data?.nodeType);
    } catch (error) {
      console.error("复制节点时出错:", error);
    }
  }, [selectedNode]);

  // 粘贴节点
  const handlePaste = useCallback(() => {
    if (clipboard && canvasRef.current) {
      const nodes = canvasRef.current.getNodes();
      const edges = canvasRef.current.getEdges();

      // 创建新节点ID
      const newId = `${clipboard.type}_${Math.random().toString(36).substr(2, 9)}`;

      // 计算新节点位置 - 如果有选中节点，则在其附近粘贴，否则在视口中心
      let newPosition;
      if (selectedNode) {
        newPosition = {
          x: selectedNode.position.x + 100,
          y: selectedNode.position.y + 50
        };
      } else {
        // 尝试获取当前视口中心位置
        try {
          if (canvasRef.current.getViewport) {
            const { x: viewportX, y: viewportY, zoom } = canvasRef.current.getViewport();
            // 将视口中心转换为画布坐标
            newPosition = {
              x: (window.innerWidth / 2 - viewportX) / zoom,
              y: (window.innerHeight / 2 - viewportY) / zoom
            };
          } else {
            // 如果getViewport不可用，使用默认位置
            newPosition = {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            };
          }
        } catch (error) {
          console.error("获取视口信息失败:", error);
          // 使用默认位置
          newPosition = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          };
        }
      }

      // 创建新节点
      const newNode = {
        ...clipboard,
        id: newId,
        position: newPosition,
        selected: true,
        style: {
          ...(clipboard.style || {}),
          opacity: 1 // 确保不透明度为1，防止显示灰色
        }
      };

      // 如果是子图节点，更新子图内部节点的ID引用
      if (newNode.type === 'SubgraphNode' || newNode.data?.nodeType === 'SubgraphNode') {
        // 为子图内的节点和边创建新的ID
        const idMapping = {}; // 旧ID -> 新ID

        // 处理子图内部节点
        if (newNode.data?.childNodes && newNode.data.childNodes.length > 0) {
          newNode.data.childNodes = newNode.data.childNodes.map(childNode => {
            const childNodeNewId = `${childNode.type || childNode.data?.nodeType || 'node'}_${Math.random().toString(36).substr(2, 9)}`;
            idMapping[childNode.id] = childNodeNewId;

            return {
              ...childNode,
              id: childNodeNewId,
              data: {
                ...childNode.data,
                parentSubgraph: newId
              },
              style: {
                ...(childNode.style || {}),
                opacity: 1
              },
              hidden: false
            };
          });
        }

        // 处理子图内部边
        if (newNode.data?.childEdges && newNode.data.childEdges.length > 0) {
          newNode.data.childEdges = newNode.data.childEdges.map(edge => {
            const sourceId = idMapping[edge.source] || edge.source;
            const targetId = idMapping[edge.target] || edge.target;

            return {
              ...edge,
              id: `e_${sourceId}_${targetId}_${Math.random().toString(36).substr(2, 5)}`,
              source: sourceId,
              target: targetId
            };
          });
        }

        // 更新子图外部连接
        if (newNode.data?.externalConnections) {
          const newExternalConnections = {
            inputs: [],
            outputs: []
          };

          if (newNode.data.externalConnections.inputs) {
            newExternalConnections.inputs = newNode.data.externalConnections.inputs.map(conn => ({
              ...conn,
              targetId: idMapping[conn.targetId] || conn.targetId
            }));
          }

          if (newNode.data.externalConnections.outputs) {
            newExternalConnections.outputs = newNode.data.externalConnections.outputs.map(conn => ({
              ...conn,
              sourceId: idMapping[conn.sourceId] || conn.sourceId
            }));
          }

          newNode.data.externalConnections = newExternalConnections;
        }

        // 确保onOpenSubgraph函数被正确设置
        newNode.data.onOpenSubgraph = (subgraphId) => {
          // 在运行时打开子图，而不是直接引用 handleOpenSubgraph
          if (canvasRef.current) {
            // 保存当前状态到历史
            if (!currentSubgraph) {
              setSubgraphHistory(prev => [...prev, {
                nodes: canvasRef.current.getNodes(),
                edges: canvasRef.current.getEdges()
              }]);
            }

            // 获取子图节点
            const subgraphNode = canvasRef.current.getNodes().find(node => node.id === subgraphId);
            if (subgraphNode && subgraphNode.data) {
              // 设置当前子图
              setCurrentSubgraph(subgraphId);

              // 显示子图内容
              const { childNodes = [], childEdges = [] } = subgraphNode.data;

              // 清除当前画布
              canvasRef.current.setNodes([]);
              canvasRef.current.setEdges([]);

              // 延迟一下再设置子图内容，避免渲染问题
              setTimeout(() => {
                // 显示子图内容
                canvasRef.current.setNodes(childNodes.map(node => ({
                  ...node,
                  hidden: false,
                  data: {
                    ...node.data,
                    parentSubgraph: subgraphId
                  }
                })));

                canvasRef.current.setEdges(childEdges.map(edge => ({
                  ...edge,
                  hidden: false
                })));
              }, 50);
            }
          }
        };

        // 如果新子图已添加到子图列表，更新子图列表
        setSubgraphs(prev => ({
          ...prev,
          [newId]: {
            id: newId,
            name: newNode.data.label || '子图',
            nodeCount: newNode.data.childNodes?.length || 0
          }
        }));

        console.log("已粘贴子图节点:", newId, "包含", newNode.data.childNodes?.length || 0, "个子节点");
      }

      // 添加新节点
      const updatedNodes = nodes.map(node => ({...node, selected: false})).concat(newNode);

      // 更新画布
      canvasRef.current.setNodes(updatedNodes);

      // 选中新节点
      setSelectedNode(newNode);

      // 添加到历史记录
      addToHistory(updatedNodes, edges);
    }
  }, [clipboard, addToHistory, selectedNode, canvasRef, setSubgraphs, currentSubgraph, setSubgraphHistory]);

  // 显示右键菜单
  const handleContextMenu = useCallback((event, node) => {
    event.preventDefault();
    if (node) {
      setSelectedNode(node);
    }

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      onCanvas: !node // 标记是否在画布上右键
    });
  }, []);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    // 使用ReactFlow内置的缩放控制
    if (canvasRef.current) {
      const instance = canvasRef.current.getReactFlowInstance?.();
      if (instance) {
        instance.zoomIn();
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    // 使用ReactFlow内置的缩放控制
    if (canvasRef.current) {
      const instance = canvasRef.current.getReactFlowInstance?.();
      if (instance) {
        instance.zoomOut();
      }
    }
  }, []);

  const handleZoomReset = useCallback(() => {
    // 使用ReactFlow内置的缩放控制
    if (canvasRef.current) {
      const instance = canvasRef.current.getReactFlowInstance?.();
      if (instance) {
        instance.setViewport({ x: 0, y: 0, zoom: 1 });
      }
    }
  }, []);

  // 创建子图
  const handleCreateSubgraph = useCallback(() => {
    // 检查是否有足够的节点被选中
    if (!selectedNodes || selectedNodes.length <= 1) {
      alert('请先选择至少两个节点来创建子图');
      return;
    }

    console.log("创建子图，选中节点数:", selectedNodes.length);

    if (canvasRef.current) {
      const selectedNodeIds = selectedNodes.map(node => node.id);
      console.log("选中节点IDs:", selectedNodeIds);

      // 检查选中的节点是否有效
      if (selectedNodeIds.length === 0) {
        alert('无法创建子图：选中的节点无效');
        return;
      }

      // 调用Canvas组件的createSubgraph方法
      const subgraphId = canvasRef.current.createSubgraph(selectedNodeIds);

      if (subgraphId) {
        console.log("子图创建成功，ID:", subgraphId);

        // 添加到子图列表
        setSubgraphs(prev => ({
          ...prev,
          [subgraphId]: {
            id: subgraphId,
            name: '子图',
            nodeCount: selectedNodes.length
          }
        }));

        // 清除选择
        setSelectedNodes([]);
        setSelectedNode(null);
      } else {
        console.error("创建子图失败");
        alert('创建子图失败，请重试');
      }
    } else {
      console.error("Canvas引用不可用");
      alert('创建子图失败：Canvas不可用');
    }
  }, [selectedNodes, canvasRef]);

  // 打开子图
  const handleOpenSubgraph = useCallback((subgraphId) => {
    // 保存当前状态到历史
    if (!currentSubgraph) {
      setSubgraphHistory([...subgraphHistory, {
        nodes: canvasRef.current.getNodes(),
        edges: canvasRef.current.getEdges()
      }]);
    }

    // 获取子图节点
    const subgraphNode = canvasRef.current.getNodes().find(node => node.id === subgraphId);
    if (subgraphNode && subgraphNode.data) {
      // 设置当前子图
      setCurrentSubgraph(subgraphId);

      // 显示子图内容
      const { childNodes = [], childEdges = [] } = subgraphNode.data;

      // 清除当前画布
      canvasRef.current.setNodes([]);
      canvasRef.current.setEdges([]);

      // 延迟一下再设置子图内容，避免渲染问题
      setTimeout(() => {
        // 显示子图内容
        canvasRef.current.setNodes(childNodes.map(node => ({
          ...node,
          hidden: false,
          data: {
            ...node.data,
            parentSubgraph: subgraphId
          }
        })));

        canvasRef.current.setEdges(childEdges.map(edge => ({
          ...edge,
          hidden: false
        })));
      }, 50);
    }
  }, [currentSubgraph, subgraphHistory, canvasRef]);

  // 返回上级
  const handleReturnFromSubgraph = useCallback(() => {
    if (subgraphHistory.length > 0) {
      // 获取上一级状态
      const lastState = subgraphHistory[subgraphHistory.length - 1];

      // 恢复上一级状态
      canvasRef.current.setNodes(lastState.nodes);
      canvasRef.current.setEdges(lastState.edges);

      // 更新历史
      setSubgraphHistory(subgraphHistory.slice(0, -1));
      setCurrentSubgraph(null);
    }
  }, [subgraphHistory, canvasRef]);

  // 重命名子图
  const handleRenameSubgraph = useCallback((subgraphId, newName) => {
    // 更新子图列表
    setSubgraphs(prev => ({
      ...prev,
      [subgraphId]: {
        ...prev[subgraphId],
        name: newName
      }
    }));

    // 更新节点标签
    if (canvasRef.current) {
      const nodes = canvasRef.current.getNodes();
      const updatedNodes = nodes.map(node => {
        if (node.id === subgraphId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newName
            }
          };
        }
        return node;
      });

      canvasRef.current.setNodes(updatedNodes);
    }
  }, [canvasRef]);

  // 切换子图列表显示
  const toggleSubgraphList = useCallback(() => {
    setShowSubgraphList(prev => !prev);
  }, []);

  // 处理子图面板拖动开始
  const handlePanelDragStart = useCallback((e) => {
    setIsDragging(true);

    // 获取鼠标初始位置
    const startX = e.clientX;
    const startY = e.clientY;

    // 获取面板初始位置
    const panel = subgraphPanelRef.current;
    const rect = panel.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    const handleDragMove = (e) => {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    e.preventDefault();
  }, []);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 如果焦点在输入框中，不处理快捷键
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // 获取当前是否有修饰键按下
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // Ctrl+Z: 撤销
      if (ctrlOrCmd && event.key === 'z' && !shift) {
        event.preventDefault();
        if (canUndo) handleUndo();
        return;
      }

      // Ctrl+Shift+Z 或 Ctrl+Y: 重做
      if ((ctrlOrCmd && event.key === 'z' && shift) || (ctrlOrCmd && event.key === 'y')) {
        event.preventDefault();
        if (canRedo) handleRedo();
        return;
      }

      // Delete 或 Backspace: 删除选中节点
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        event.preventDefault();
        handleDelete();
        return;
      }

      // Ctrl+S: 保存
      if (ctrlOrCmd && event.key === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      // Ctrl+O: 加载
      if (ctrlOrCmd && event.key === 'o') {
        event.preventDefault();
        handleLoad();
        return;
      }

      // Ctrl+N: 新建
      if (ctrlOrCmd && event.key === 'n') {
        event.preventDefault();
        handleNew();
        return;
      }

      // Ctrl+Plus: 放大
      if (ctrlOrCmd && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        handleZoomIn();
        return;
      }

      // Ctrl+Minus: 缩小
      if (ctrlOrCmd && event.key === '-') {
        event.preventDefault();
        handleZoomOut();
        return;
      }

      // Ctrl+0: 重置缩放
      if (ctrlOrCmd && event.key === '0') {
        event.preventDefault();
        handleZoomReset();
        return;
      }

      // F2: 重命名节点
      if (event.key === 'F2' && selectedNode) {
        event.preventDefault();
        // 如果有选中的节点，触发编辑标签
        const newLabel = prompt('请输入节点名称:', selectedNode.data.label);
        if (newLabel !== null && newLabel.trim() !== '') {
          const updatedNodes = canvasRef.current.getNodes().map(node => {
            if (node.id === selectedNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: newLabel.trim()
                }
              };
            }
            return node;
          });
          canvasRef.current.setNodes(updatedNodes);
          addToHistory(updatedNodes, canvasRef.current.getEdges());
        }
        return;
      }

      // Ctrl+C: 复制
      if (ctrlOrCmd && event.key === 'c') {
        event.preventDefault();
        if (selectedNode) {
          handleCopy();
        }
        return;
      }

      // Ctrl+V: 粘贴
      if (ctrlOrCmd && event.key === 'v') {
        event.preventDefault();
        if (clipboard) {
          handlePaste();
        }
        return;
      }

      // Esc: 关闭右键菜单
      if (event.key === 'Escape' && contextMenu.visible) {
        event.preventDefault();
        hideContextMenu();
        return;
      }
    };

    // 点击其他地方关闭右键菜单
    const handleClickOutside = (event) => {
      // 检查点击是否在右键菜单外部
      if (contextMenu.visible) {
        const menuElement = document.querySelector('.context-menu');
        if (menuElement && !menuElement.contains(event.target)) {
          hideContextMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleDelete,
    handleSave,
    handleLoad,
    handleNew,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    selectedNode,
    addToHistory,
    canvasRef,
    handleCopy,
    handlePaste,
    clipboard,
    contextMenu.visible,
    hideContextMenu
  ]);

  // 处理节点双击事件
  const handleNodeDoubleClick = useCallback((event, node) => {

  }, []);

  // 右键菜单项
  const contextMenuItems = useMemo(() => {
    if (contextMenu.onCanvas) {
      // 在画布上右键的菜单项
      return [
        { label: '粘贴', onClick: handlePaste, disabled: !clipboard },
        { type: 'divider' },
        { label: '重置视图', onClick: handleZoomReset }
      ];
    } else {
      // 在节点上右键的菜单项
      return [
        { label: '复制', onClick: handleCopy, disabled: !selectedNode },
        { label: '删除', onClick: handleDelete, disabled: !selectedNode },
        { type: 'divider' },
        { label: '重命名', onClick: () => {
          if (selectedNode) {
            const newLabel = prompt('请输入节点名称:', selectedNode.data.label);
            if (newLabel !== null && newLabel.trim() !== '') {
              const updatedNodes = canvasRef.current.getNodes().map(node => {
                if (node.id === selectedNode.id) {
          return {
                    ...node,
            data: {
                      ...node.data,
              label: newLabel.trim()
            }
          };
        }
                return node;
      });
      canvasRef.current.setNodes(updatedNodes);
              addToHistory(updatedNodes, canvasRef.current.getEdges());
            }
          }
          hideContextMenu();
        }, disabled: !selectedNode }
      ];
    }
  }, [contextMenu, clipboard, selectedNode, handleCopy, handlePaste, handleDelete, addToHistory, hideContextMenu, canvasRef]);

  // 更新工具栏按钮
  const toolbarButtons = [
    { icon: 'file-add', tooltip: '新建', onClick: handleNew },
    { icon: 'save', tooltip: '保存', onClick: handleSave },
    { icon: 'folder-open', tooltip: '打开', onClick: handleLoad },
    { icon: 'export', tooltip: '导出JSON', onClick: handleExportJson },
    { type: 'divider' },
    { icon: 'undo', tooltip: '撤销', onClick: handleUndo, disabled: !canUndo },
    { icon: 'redo', tooltip: '重做', onClick: handleRedo, disabled: !canRedo },
    { type: 'divider' },
    { icon: 'copy', tooltip: '复制', onClick: handleCopy, disabled: !selectedNode },
    { icon: 'paste', tooltip: '粘贴', onClick: handlePaste, disabled: !clipboard },
    { icon: 'delete', tooltip: '删除', onClick: handleDelete, disabled: !selectedNode },
    { type: 'divider' },
    { icon: 'zoom-in', tooltip: '放大', onClick: handleZoomIn },
    { icon: 'zoom-out', tooltip: '缩小', onClick: handleZoomOut },
    { icon: 'fullscreen', tooltip: '重置视图', onClick: handleZoomReset },
    { type: 'divider' },
    { icon: 'group', tooltip: '创建子图', onClick: handleCreateSubgraph, disabled: selectedNodes.length <= 1 },
    { icon: 'list', tooltip: '子图列表', onClick: toggleSubgraphList },
    ...(currentSubgraph ? [{ icon: 'back', tooltip: '返回上级', onClick: handleReturnFromSubgraph }] : [])
  ];

  // 更新NodeCanvas的回调函数
  const canvasCallbacks = {
    onSelectionChange: handleSelectionChange,
    onNodesChange: handleCanvasChange,
    onEdgesChange: handleCanvasChange,
    onConnect: handleCanvasChange,
    onContextMenu: handleContextMenu,
    onNodeDoubleClick: handleNodeDoubleClick,
    onOpenSubgraph: handleOpenSubgraph
  };

  // 处理导航回工作区
  const handleNavigateToWorkspace = useCallback(() => {
    navigate('/workspace');
  }, [navigate]);

  return (
    <div className="app-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      border: 'none'
    }}>
      {/* 自定义标题栏 */}
      <TitleBar title={`行为树编辑器 ${currentSubgraph ? ` - ${subgraphs[currentSubgraph]?.name || '子图'}` : ''}`} />

      {/* 主要内容区域 */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
      {/* 侧边栏 */}
        <div className="sidebar" style={{
          width: '240px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)'
        }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* 节点面板 */}
          <div style={{ flex: 1, overflow: 'auto', height: '100%' }}>
            <NodePalette
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collapsed={false}
            />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
        <div className="main-content" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        {/* 工具栏 */}
        <Toolbar buttons={toolbarButtons} />

        {/* 面包屑导航 */}
        <div className="editor-breadcrumb" style={{
          padding: '4px 8px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <span
            className="home-link"
            onClick={handleNavigateToWorkspace}
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            工作区
          </span>
          <span style={{ margin: '0 6px', color: 'var(--text-disabled)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </span>
          <span style={{ fontSize: '14px' }}>编辑器</span>
        </div>

        {/* 当前位置指示 */}
        {currentSubgraph && (
            <div className="breadcrumb" style={{
              padding: '4px 8px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center'
            }}>
            <span
              onClick={handleReturnFromSubgraph}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px'
              }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                </svg>
              主画布
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 6px' }}>
                  <path d="M9 6l6 6-6 6"/>
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              {subgraphs[currentSubgraph]?.name || '子图'}
            </span>
          </div>
        )}

        {/* 节点画布 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
        <ReactFlowProvider>
          <NodeCanvas
            ref={canvasRef}
            {...canvasCallbacks}
            settings={settings}
          />
        </ReactFlowProvider>
          </div>
      </div>

      {/* 右侧属性面板 */}
      <div className="right-panel" style={{
        width: '280px',
        borderLeft: '1px solid var(--border-color)',
        overflow: 'auto',
        height: '100%',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <PropertyPanel
          selectedNode={selectedNode}
          updateNodeParams={updateNodeParams}
          collapsed={false}
        />
        </div>
      </div>

      {/* 子图列表 */}
      {showSubgraphList && (
        <div
          className="subgraph-list-panel"
          style={{
            position: 'absolute',
            top: '100px',
            left: 'calc(50% - 150px)',
            width: '300px',
            zIndex: 1000,
            background: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            cursor: isDragging ? 'grabbing' : 'default',
            fontSize: '13px'
          }}
          ref={subgraphPanelRef}
        >
          <div
            className="subgraph-list-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'grab',
              userSelect: 'none'
            }}
            onMouseDown={handlePanelDragStart}
          >
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>子图列表</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={toggleSubgraphList}
              style={{
                background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            </div>
          </div>
          <div
            className="subgraph-list-content"
            style={{
              padding: '12px',
              maxHeight: '350px',
              overflowY: 'auto'
            }}
          >
            {Object.keys(subgraphs).length === 0 ? (
              <div
                className="no-subgraphs"
              style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '24px 0',
                  fontStyle: 'italic',
                  fontSize: '12px'
                }}
              >
                暂无子图
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.values(subgraphs).map(subgraph => (
                  <li
                    key={subgraph.id}
                    className="subgraph-item"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      className="subgraph-item-name"
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '2px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {subgraph.name}
                    </div>
                    <div
                      className="subgraph-item-info"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                      }}
                    >
                      包含 {subgraph.nodeCount} 个节点
                    </div>
                    <div
                      className="subgraph-item-actions"
                      style={{
                        display: 'flex',
                        gap: '6px'
                      }}
                    >
                      <button
                        onClick={() => handleOpenSubgraph(subgraph.id)}
                        style={{
                          background: '#722ED1',
                          color: 'white',
                border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: 1,
                          transition: 'all 0.2s ease',
                          fontWeight: 500
              }}
            >
                        打开
            </button>
              <button
                onClick={() => {
                          const newName = prompt('请输入子图名称:', subgraph.name);
                          if (newName && newName.trim() !== '') {
                            handleRenameSubgraph(subgraph.id, newName);
                          }
                }}
                style={{
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: 1,
                          transition: 'all 0.2s ease'
                }}
              >
                        重命名
              </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 1000,
            background: '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '5px 0'
          }}
        >
          {contextMenuItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.type === 'divider' ? (
                <div style={{
                  height: '1px',
                  background: 'var(--border-color)',
                  margin: '5px 0'
                }} />
              ) : (
              <button
                className="context-menu-item"
                  onClick={item.onClick}
                  disabled={item.disabled}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 15px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                    cursor: item.disabled ? 'default' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1
                }}
              >
                  {item.label}
              </button>
          )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 设置按钮 */}
      <SettingsButton onClick={() => setShowSettings(true)} />

      {/* 设置面板 */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingChange={handleSettingChange}
      />
    </div>
  );
};

// 主应用组件
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/workspace" element={<WorkspaceHome />} />
        <Route path="/editor" element={<EditorApp />} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
