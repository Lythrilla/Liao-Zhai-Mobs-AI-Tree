import { NodeTypes, NodeCategories, getNodeInfo } from './nodeTypes';

/**
 * 将ReactFlow节点类型映射到目标格式的节点类型
 */
const mapNodeType = (nodeType, nodeInfo) => {
  if (!nodeInfo) return { type: 'leaf', category: 'action' };

  switch (nodeInfo.category) {
    case NodeCategories.META:
      // 根节点默认作为选择器处理
      return { type: 'composite', category: 'selector' };
    case NodeCategories.COMPOSITE:
      if (nodeType === NodeTypes.SELECTOR) {
        return { type: 'composite', category: 'selector' };
      } else if (nodeType === NodeTypes.SEQUENCE) {
        return { type: 'composite', category: 'sequence' };
      } else if (nodeType === NodeTypes.SIMPLE_PARALLEL) {
        return { type: 'composite', category: 'parallel' };
      }
      return { type: 'composite', category: 'selector' };
    case NodeCategories.DECORATOR:
      if (nodeType === NodeTypes.INVERTER) {
        return { type: 'decorator', category: 'inverter' };
      } else if (nodeType === NodeTypes.REPEAT) {
        return { type: 'decorator', category: 'repeater' };
      } else if (nodeType === NodeTypes.FORCE_SUCCESS) {
        return { type: 'decorator', category: 'force_success' };
      } else if (nodeType === NodeTypes.FORCE_FAILURE) {
        return { type: 'decorator', category: 'force_failure' };
      } else if (nodeType === NodeTypes.COOLDOWN) {
        return { type: 'decorator', category: 'cooldown' };
      } else if (nodeType === NodeTypes.TIMEOUT) {
        return { type: 'decorator', category: 'timeout' };
      }
      return { type: 'decorator', category: 'decorator' };
    case NodeCategories.LEAF:
      if (nodeType === NodeTypes.CONDITION_CHECK ||
          nodeType === NodeTypes.GET_BLACKBOARD_VALUE ||
          nodeType.includes('BLACKBOARD')) {
        return { type: 'leaf', category: 'condition' };
      }
      return { type: 'leaf', category: 'action' };
    case NodeCategories.SERVICE:
      return { type: 'service', category: 'service' };
    case NodeCategories.SUBGRAPH:
      return { type: 'subgraph', category: 'subgraph' };
    default:
      return { type: 'leaf', category: 'action' };
  }
};

/**
 * 构建节点的父子关系映射
 */
const buildParentChildMap = (nodes, edges) => {
  const parentMap = new Map(); // 子节点ID -> 父节点ID
  const childrenMap = new Map(); // 父节点ID -> 子节点ID数组
  
  // 初始化映射
  nodes.forEach(node => {
    childrenMap.set(node.id, []);
  });
  
  // 构建关系
  edges.forEach(edge => {
    const parentId = edge.source;
    const childId = edge.target;
    
    parentMap.set(childId, parentId);
    
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId).push(childId);
  });
  
  return { parentMap, childrenMap };
};

/**
 * 前序遍历获取节点顺序
 */
const preorderTraversal = (rootId, childrenMap, nodes) => {
  const result = [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  const traverse = (nodeId) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    result.push(node);
    
    // 获取子节点并按位置排序（从左到右）
    const children = childrenMap.get(nodeId) || [];
    const sortedChildren = children
      .map(childId => nodeMap.get(childId))
      .filter(Boolean)
      .sort((a, b) => a.position.x - b.position.x); // 按X坐标排序
    
    sortedChildren.forEach(child => {
      traverse(child.id);
    });
  };
  
  traverse(rootId);
  return result;
};

/**
 * 查找根节点
 */
const findRootNode = (nodes, parentMap) => {
  // 查找没有父节点的节点，或者类型为RootNode的节点
  const rootCandidates = nodes.filter(node => 
    !parentMap.has(node.id) || node.type === 'RootNode' || node.data?.nodeType === 'RootNode'
  );
  
  // 优先选择RootNode类型
  const rootNode = rootCandidates.find(node => 
    node.type === 'RootNode' || node.data?.nodeType === 'RootNode'
  ) || rootCandidates[0];
  
  return rootNode;
};

/**
 * 转换参数格式并提供默认参数
 */
const convertParameters = (params, nodeInfo, nodeType) => {
  const converted = {};

  // 根据节点类型提供默认参数
  if (nodeType === NodeTypes.SELECTOR || nodeType === 'RootNode') {
    converted.policy = params?.strategy || params?.policy || 'sequence';
  } else if (nodeType === NodeTypes.SEQUENCE) {
    converted.return_policy = params?.return_policy || 'on_failure';
  } else if (nodeType === NodeTypes.REPEAT) {
    converted.count = params?.count || 1;
    converted.until_status = params?.until_status || 'success';
  } else if (nodeType === NodeTypes.INVERTER) {
    converted.negate_output = params?.negate_output !== undefined ? params.negate_output : true;
  } else if (nodeType === NodeTypes.CONDITION_CHECK) {
    converted.check_type = params?.check_type || 'value';
    converted.target = params?.target || 'self';
    converted.comparison = params?.comparison || '==';
    converted.threshold = params?.threshold || 0;
  } else if (nodeType === NodeTypes.MOVE_TO) {
    converted.action_type = params?.action_type || 'move';
    converted.target = params?.target || 'destination';
    converted.speed = params?.speed || 1.0;
  } else if (nodeType === NodeTypes.WAIT) {
    converted.action_type = params?.action_type || 'wait';
    converted.duration = params?.duration || 1.0;
  } else if (nodeType === NodeTypes.SUBGRAPH) {
    converted.description = params?.subgraphDescription || '子图节点';
  }

  // 复制用户设置的参数，覆盖默认值
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(key => {
      const value = params[key];

      if (nodeInfo && nodeInfo.params) {
        const paramDef = nodeInfo.params.find(p => p.key === key);
        if (paramDef) {
          switch (paramDef.type) {
            case 'number':
              converted[key] = typeof value === 'number' ? value : parseFloat(value) || paramDef.default || 0;
              break;
            case 'select':
              converted[key] = value || paramDef.default || (paramDef.options && paramDef.options[0]);
              break;
            case 'string':
            default:
              converted[key] = value || paramDef.default || '';
              break;
          }
        } else {
          converted[key] = value;
        }
      } else {
        converted[key] = value;
      }
    });
  }

  return converted;
};

/**
 * 处理子图节点
 */
const processSubgraph = (node, nodes, edges) => {
  const { childNodes = [], childEdges = [] } = node.data;
  
  // 如果没有子节点，返回空结构
  if (!childNodes || childNodes.length === 0) {
    return {
      subgraphNodes: [],
      internalRoot: null
    };
  }
  
  // 构建子图内部的父子关系
  const { parentMap, childrenMap } = buildParentChildMap(childNodes, childEdges);
  
  // 查找子图内部的根节点
  const internalRootNode = findRootNode(childNodes, parentMap);
  if (!internalRootNode) {
    return {
      subgraphNodes: [],
      internalRoot: null
    };
  }
  
  // 前序遍历获取子图内部节点顺序
  const orderedSubgraphNodes = preorderTraversal(internalRootNode.id, childrenMap, childNodes);
  
  // 转换子图内部节点
  const convertedSubgraphNodes = orderedSubgraphNodes.map(subNode => {
    const nodeInfo = getNodeInfo(subNode.data?.nodeType || subNode.type);
    const { type, category } = mapNodeType(subNode.data?.nodeType || subNode.type, nodeInfo);
    const children = childrenMap.get(subNode.id) || [];
    const parameters = convertParameters(subNode.data?.params, nodeInfo, subNode.data?.nodeType || subNode.type);

    const convertedNode = {
      id: subNode.id,
      type,
      category,
      name: subNode.data?.label || nodeInfo?.name || subNode.type,
      position: {
        x: Math.round(subNode.position.x),
        y: Math.round(subNode.position.y)
      },
      parameters,
      parentSubgraph: node.id
    };

    // 根据节点类型添加子节点信息
    if (type === 'composite' || type === 'service') {
      // 组合节点和服务节点可以有多个子节点
      if (children.length > 0) {
        // 按位置排序子节点
        const sortedChildren = children
          .map(childId => childNodes.find(n => n.id === childId))
          .filter(Boolean)
          .sort((a, b) => a.position.x - b.position.x)
          .map(child => child.id);
        convertedNode.children = sortedChildren;
      }
    } else if (type === 'decorator') {
      // 装饰器节点只能有一个子节点
      if (children.length > 0) {
        convertedNode.child = children[0];
      }
    }

    return convertedNode;
  });
  
  return {
    subgraphNodes: convertedSubgraphNodes,
    internalRoot: internalRootNode.id
  };
};

/**
 * 导出为目标JSON格式
 */
export const exportToBehaviorTreeJson = (nodes, edges, options = {}) => {
  const {
    name = "行为树",
    description = "基础怪物行为树",
    version = "1.0"
  } = options;

  if (!nodes || nodes.length === 0) {
    return {
      version,
      name,
      description,
      root: null,
      nodes: []
    };
  }

  // 过滤掉隐藏的节点和边
  const visibleNodes = nodes.filter(node => !node.hidden);
  const visibleEdges = edges.filter(edge => !edge.hidden);

  // 构建父子关系
  const { parentMap, childrenMap } = buildParentChildMap(visibleNodes, visibleEdges);

  // 查找根节点
  const rootNode = findRootNode(visibleNodes, parentMap);
  if (!rootNode) {
    throw new Error('未找到根节点');
  }

  // 前序遍历获取节点顺序
  const orderedNodes = preorderTraversal(rootNode.id, childrenMap, visibleNodes);

  // 存储所有节点，包括子图内部节点
  let allConvertedNodes = [];
  let subgraphsMap = new Map(); // 子图ID -> 内部根节点ID

  // 转换节点格式
  const convertedNodes = orderedNodes.map((node) => {
    const nodeInfo = getNodeInfo(node.data?.nodeType || node.type);
    const { type, category } = mapNodeType(node.data?.nodeType || node.type, nodeInfo);
    const children = childrenMap.get(node.id) || [];
    const parameters = convertParameters(node.data?.params, nodeInfo, node.data?.nodeType || node.type);

    const convertedNode = {
      id: node.id,
      type,
      category,
      name: node.data?.label || nodeInfo?.name || node.type,
      position: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y)
      },
      parameters
    };

    // 处理子图节点
    if (type === 'subgraph') {
      const { subgraphNodes, internalRoot } = processSubgraph(node, nodes, edges);
      if (internalRoot) {
        convertedNode.internalRoot = internalRoot;
        subgraphsMap.set(node.id, internalRoot);
        allConvertedNodes = [...allConvertedNodes, ...subgraphNodes];
      }
    }

    // 根据节点类型添加子节点信息
    if (type === 'composite' || type === 'service') {
      // 组合节点和服务节点可以有多个子节点
      if (children.length > 0) {
        // 按位置排序子节点
        const sortedChildren = children
          .map(childId => visibleNodes.find(n => n.id === childId))
          .filter(Boolean)
          .sort((a, b) => a.position.x - b.position.x)
          .map(child => child.id);
        convertedNode.children = sortedChildren;
      }
    } else if (type === 'decorator') {
      // 装饰器节点只能有一个子节点
      if (children.length > 0) {
        convertedNode.child = children[0];
      }
    }

    return convertedNode;
  });

  // 合并所有节点
  allConvertedNodes = [...convertedNodes, ...allConvertedNodes];

  return {
    version,
    name,
    description,
    root: rootNode.id,
    nodes: allConvertedNodes,
    subgraphs: Object.fromEntries(subgraphsMap)
  };
};
