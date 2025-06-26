// 节点类型枚举
export const NodeTypes = {
  // 基础节点
  ROOT: 'root',

  // 组合节点
  SELECTOR: 'selector',
  SEQUENCE: 'sequence',
  PARALLEL: 'parallel',

  // 装饰器节点
  INVERTER: 'inverter',
  ALWAYS_SUCCEED: 'always_succeed',
  ALWAYS_FAIL: 'always_fail',
  REPEAT: 'repeat',
  RETRY: 'retry',
  DELAY: 'delay',
  TIMEOUT: 'timeout',
  COOLDOWN: 'cooldown',
  RANDOM: 'random',

  // 叶节点
  CONDITION: 'condition'
};

// 节点分类
export const NodeCategories = {
  BASIC: 'basic',
  COMPOSITE: 'composite',
  DECORATOR: 'decorator',
  LEAF: 'leaf'
};

// 节点状态枚举（用于显示）
export const NodeStatus = {
  SUCCESS: '成功',
  FAILURE: '失败',
  RUNNING: '运行中'
};

// 节点状态反向映射（中文到英文）
export const NodeStatusReverse = {
  '成功': 'SUCCESS',
  '失败': 'FAILURE',
  '运行中': 'RUNNING'
};

// 节点元数据定义
export const NodeData = {
  // 基础节点
  [NodeTypes.ROOT]: {
    name: '根节点',
    category: NodeCategories.BASIC,
    description: '行为树的入口点',
    inputs: [],
    outputs: ['子节点'],
    params: [],
    color: '#722ED1',
    customClass: 'node-root'
  },

  // 组合节点
  [NodeTypes.SELECTOR]: {
    name: '选择器',
    category: NodeCategories.COMPOSITE,
    description: '依次尝试子节点，直到找到一个成功的',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      {
        name: '策略',
        key: 'strategy',
        type: 'select',
        options: ['序列', '随机', '权重'],
        default: '序列',
        mapping: {
          '序列': 'SERIAL',
          '随机': 'RANDOM',
          '权重': 'WEIGHT'
        }
      }
    ],
    color: '#165DFF',
    customClass: 'node-selector'
  },

  [NodeTypes.SEQUENCE]: {
    name: '序列',
    category: NodeCategories.COMPOSITE,
    description: '按顺序执行所有子节点，全部成功才返回成功',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      {
        name: '返回策略',
        key: 'returnPolicy',
        type: 'select',
        options: ['立刻返回', '失败重试'],
        default: '立刻返回',
        mapping: {
          '立刻返回': 'ON_FAILURE',
          '失败重试': 'ON_FAILURE_RETRY'
        }
      },
      {
        name: '重试次数',
        key: 'retryCount',
        type: 'number',
        default: 1,
        visible: (params) => params.returnPolicy === '失败重试'
      }
    ],
    color: '#0FC6C2',
    customClass: 'node-sequence'
  },

  [NodeTypes.PARALLEL]: {
    name: '并行',
    category: NodeCategories.COMPOSITE,
    description: '同时执行所有子节点，根据成功/失败阈值决定最终结果',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      {
        name: '成功阈值',
        key: 'successThreshold',
        type: 'number',
        default: -1,
        tooltip: '-1表示全部成功'
      },
      {
        name: '失败阈值',
        key: 'failureThreshold',
        type: 'number',
        default: 1,
        tooltip: '1表示任意失败'
      }
    ],
    color: '#FF7D00',
    customClass: 'node-parallel'
  },

  // 装饰器节点
  [NodeTypes.INVERTER]: {
    name: '反转器',
    category: NodeCategories.DECORATOR,
    description: '将子节点的执行结果反转',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.ALWAYS_SUCCEED]: {
    name: '总是成功',
    category: NodeCategories.DECORATOR,
    description: '无论子节点返回什么结果，都返回成功',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.ALWAYS_FAIL]: {
    name: '总是失败',
    category: NodeCategories.DECORATOR,
    description: '无论子节点返回什么结果，都返回失败',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.REPEAT]: {
    name: '重复器',
    category: NodeCategories.DECORATOR,
    description: '重复执行子节点',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      {
        name: '重复次数',
        key: 'times',
        type: 'number',
        default: -1,
        tooltip: '-1表示无限重复'
      },
      {
        name: '直到失败',
        key: 'untilFail',
        type: 'boolean',
        default: false
      },
      {
        name: '直到成功',
        key: 'untilSuccess',
        type: 'boolean',
        default: false
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.RETRY]: {
    name: '重试器',
    category: NodeCategories.DECORATOR,
    description: '失败时重试子节点',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '最大重试次数', key: 'maxRetries', type: 'number', default: 3 },
      { name: '重试延迟(毫秒)', key: 'retryDelay', type: 'number', default: 1000 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.DELAY]: {
    name: '延迟器',
    category: NodeCategories.DECORATOR,
    description: '在执行子节点前等待一段时间',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '延迟时间(毫秒)', key: 'delay', type: 'number', default: 1000 },
      {
        name: '延迟期间返回运行中',
        key: 'returnRunningDuringDelay',
        type: 'boolean',
        default: true
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.TIMEOUT]: {
    name: '超时器',
    category: NodeCategories.DECORATOR,
    description: '限制子节点的最大执行时间',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '超时时间(毫秒)', key: 'timeout', type: 'number', default: 5000 },
      {
        name: '超时状态',
        key: 'timeoutStatus',
        type: 'select',
        options: ['成功', '失败', '运行中'],
        default: '失败',
        mapping: {
          '成功': 'SUCCESS',
          '失败': 'FAILURE',
          '运行中': 'RUNNING'
        }
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.COOLDOWN]: {
    name: '冷却器',
    category: NodeCategories.DECORATOR,
    description: '限制子节点的执行频率',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '冷却时间(毫秒)', key: 'cooldownTime', type: 'number', default: 1000 },
      {
        name: '返回上次结果',
        key: 'returnLastResult',
        type: 'boolean',
        default: false
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  [NodeTypes.RANDOM]: {
    name: '随机器',
    category: NodeCategories.DECORATOR,
    description: '根据概率决定是否执行子节点',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      {
        name: '概率',
        key: 'probability',
        type: 'number',
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01
      },
      {
        name: '跳过状态',
        key: 'skipStatus',
        type: 'select',
        options: ['成功', '失败', '运行中'],
        default: '失败',
        mapping: {
          '成功': 'SUCCESS',
          '失败': 'FAILURE',
          '运行中': 'RUNNING'
        }
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },

  // 叶节点
  [NodeTypes.CONDITION]: {
    name: '条件',
    category: NodeCategories.LEAF,
    description: '检查黑板中的条件是否满足',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '条件键', key: 'conditionKey', type: 'string', default: '' },
      { name: '检查间隔(毫秒)', key: 'checkInterval', type: 'number', default: 100 }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  }
};

// 组织节点进行展示
export const NodeGroups = [
  {
    title: '基础节点',
    nodes: [NodeTypes.ROOT]
  },
  {
    title: '组合节点',
    nodes: [NodeTypes.SELECTOR, NodeTypes.SEQUENCE, NodeTypes.PARALLEL]
  },
  {
    title: '装饰器节点',
    nodes: [
      NodeTypes.INVERTER,
      NodeTypes.ALWAYS_SUCCEED,
      NodeTypes.ALWAYS_FAIL,
      NodeTypes.REPEAT,
      NodeTypes.RETRY,
      NodeTypes.DELAY,
      NodeTypes.TIMEOUT,
      NodeTypes.COOLDOWN,
      NodeTypes.RANDOM
    ]
  },
  {
    title: '叶节点',
    nodes: [NodeTypes.CONDITION]
  }
];

// 获取节点信息的辅助函数
export const getNodeInfo = (type) => {
  return NodeData[type] || null;
};

// 获取节点分类信息
export const getCategoryClass = (type) => {
  const nodeInfo = getNodeInfo(type);
  return nodeInfo ? nodeInfo.customClass || 'node-default' : 'node-default';
};

// 获取节点颜色
export const getNodeColor = (type) => {
  const nodeInfo = getNodeInfo(type);
  return nodeInfo ? nodeInfo.color || '#86909C' : '#86909C';
};

// 导出参数值转换函数
export const convertParamValue = (paramDef, displayValue) => {
  if (paramDef.mapping && paramDef.mapping[displayValue]) {
    return paramDef.mapping[displayValue];
  }
  return displayValue;
};

// 反向转换函数（从英文到中文）
export const convertParamDisplayValue = (paramDef, actualValue) => {
  if (paramDef.mapping) {
    const reverseMapping = Object.entries(paramDef.mapping).find(([_, v]) => v === actualValue);
    if (reverseMapping) {
      return reverseMapping[0];
    }
  }
  return actualValue;
};
