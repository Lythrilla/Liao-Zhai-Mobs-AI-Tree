// 节点类型枚举
export const NodeTypes = {
  // 元节点
  ROOT: 'RootNode',
  SUBGRAPH: 'SubgraphNode',
  
  // 组合节点
  SELECTOR: 'Selector',
  SEQUENCE: 'Sequence',
  SIMPLE_PARALLEL: 'SimpleParallel',
  
  // 装饰器节点
  INVERTER: 'Inverter',
  FORCE_SUCCESS: 'ForceSuccess',
  FORCE_FAILURE: 'ForceFailure',
  REPEAT: 'Repeat',
  COOLDOWN: 'Cooldown',
  TIMEOUT: 'Timeout',
  BLACKBOARD: 'Blackboard',
  
  // 叶节点
  WAIT: 'Wait',
  PRINT_STRING: 'PrintString',
  SET_BLACKBOARD_VALUE: 'SetBlackboardValue',
  GET_BLACKBOARD_VALUE: 'GetBlackboardValue',
  MOVE_TO: 'MoveTo',
  LEAVE_MOVE_TO: 'LeaveMoveTo',
  ROTATE: 'Rotate',
  PLAY_ANIMATION: 'PlayAnimation',
  PLAY_SOUND: 'PlaySound',
  CONDITION_CHECK: 'ConditionCheck',
  EXECUTE_ACTION: 'ExecuteAction',
  
  // 服务节点
  PARALLEL: 'Parallel',
  BLACKBOARD_MONITOR: 'BlackboardMonitorService',
  DISTANCE_CHECK: 'DistanceCheckService',
  LINE_OF_SIGHT: 'LineOfSightService',
  PATROL: 'PatrolService',
  STATE_UPDATE: 'StateUpdateService',
  RANDOM_VALUE: 'RandomValueService'
};

// 节点分类
export const NodeCategories = {
  META: 'meta',
  COMPOSITE: 'composite',
  DECORATOR: 'decorator',
  LEAF: 'leaf',
  SERVICE: 'service',
  SUBGRAPH: 'subgraph'
};

// 节点元数据定义
export const NodeData = {
  // 元节点
  [NodeTypes.ROOT]: {
    name: '根节点',
    category: NodeCategories.META,
    description: '行为树的入口点',
    inputs: [],
    outputs: ['起始'],
    params: [],
    color: '#722ED1',
    customClass: 'node-root'
  },
  
  // 控制流节点
  [NodeTypes.SELECTOR]: {
    name: '选择器',
    category: NodeCategories.COMPOSITE,
    description: '从左到右执行子节点，其中一个子节点成功时将停止执行。如果子节点成功，则选择器成功；如果所有子节点都失败，选择器也失败。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '选择策略', key: 'strategy', type: 'select', options: ['序列', '随机', '权重'], default: '序列' }
    ],
    color: '#165DFF',
    customClass: 'node-selector'
  },
  
  [NodeTypes.SEQUENCE]: {
    name: '序列',
    category: NodeCategories.COMPOSITE,
    description: '从左到右执行子节点，有子节点失败则停止。如果所有子节点都成功，则序列成功；如果有任一子节点失败，则序列失败。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '失败策略', key: 'failurePolicy', type: 'select', options: ['立刻返回', '结束全部', '重试'], default: '立刻返回' },
      { 
        name: '重试次数', 
        key: 'retryCount', 
        type: 'number',
        default: 1,
        visible: (params) => params.failurePolicy === '重试'
      }
    ],
    color: '#0FC6C2',
    customClass: 'node-sequence'
  },
  
  [NodeTypes.SIMPLE_PARALLEL]: {
    name: '简单平行',
    category: NodeCategories.COMPOSITE,
    description: '允许一个主任务节点与次要任务同时执行。主任务完成后，根据结束模式决定是立即结束还是等待次要任务完成。',
    inputs: ['父节点'],
    outputs: ['主任务', '次要任务'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '结束模式', key: 'endMode', type: 'select', options: ['立即结束', '等待完成'], default: '立即结束' },
      { 
        name: '超时时间(秒)', 
        key: 'timeout', 
        type: 'number',
        default: 0,
        visible: (params) => params.endMode === '等待完成'
      }
    ],
    color: '#FF7D00',
    customClass: 'node-parallel'
  },
  
  // 修饰节点
  [NodeTypes.INVERTER]: {
    name: '反转器',
    category: NodeCategories.DECORATOR,
    description: '反转子节点的结果。子节点成功则返回失败，子节点失败则返回成功。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.FORCE_SUCCESS]: {
    name: '强制成功',
    category: NodeCategories.DECORATOR,
    description: '无论子节点结果如何，该装饰器都返回成功。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.FORCE_FAILURE]: {
    name: '强制失败',
    category: NodeCategories.DECORATOR,
    description: '无论子节点结果如何，该装饰器都返回失败。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.REPEAT]: {
    name: '重复器',
    category: NodeCategories.DECORATOR,
    description: '重复执行子节点指定的次数或无限次。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '重复模式', key: 'repeatMode', type: 'select', options: ['固定次数', '无限重复', '直到失败', '直到成功'], default: '固定次数' },
      { 
        name: '重复次数', 
        key: 'repeatCount', 
        type: 'number',
        default: 1,
        visible: (params) => params.repeatMode === '固定次数'
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.COOLDOWN]: {
    name: '冷却器',
    category: NodeCategories.DECORATOR,
    description: '在指定的冷却时间内阻止子节点执行。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '冷却时间(秒)', key: 'cooldownTime', type: 'number', default: 1.0 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.TIMEOUT]: {
    name: '超时器',
    category: NodeCategories.DECORATOR,
    description: '为子节点的执行设置时间限制，如果子节点在指定时间内未完成，则中止并返回失败。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '超时时间(秒)', key: 'timeoutDuration', type: 'number', default: 5.0 }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  [NodeTypes.BLACKBOARD]: {
    name: '黑板检查',
    category: NodeCategories.DECORATOR,
    description: '检查黑板上的值，根据条件决定是否执行子节点。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '键名', key: 'keyName', type: 'string', default: '' },
      { name: '操作符', key: 'operator', type: 'select', options: ['等于', '不等于', '大于', '小于', '大于等于', '小于等于', '已设置', '未设置'], default: '等于' },
      { name: '值类型', key: 'valueType', type: 'select', options: ['数字', '文本', '布尔'], default: '数字' },
      { 
        name: '比较值', 
        key: 'numericValue', 
        type: 'number',
        default: 0,
        visible: (params) => params.valueType === '数字' && !['已设置', '未设置'].includes(params.operator)
      },
      { 
        name: '比较值', 
        key: 'textValue', 
        type: 'string',
        default: '',
        visible: (params) => params.valueType === '文本' && !['已设置', '未设置'].includes(params.operator)
      },
      { 
        name: '比较值', 
        key: 'boolValue', 
        type: 'select',
        options: ['真', '假'],
        default: '真',
        visible: (params) => params.valueType === '布尔' && !['已设置', '未设置'].includes(params.operator)
      }
    ],
    color: '#F7BA1E',
    customClass: 'node-decorator'
  },
  
  // 叶节点
  [NodeTypes.WAIT]: {
    name: '等待',
    category: NodeCategories.LEAF,
    description: '暂停执行指定的时间。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '等待模式', key: 'waitMode', type: 'select', options: ['固定时间', '随机时间', '黑板值'], default: '固定时间' },
      { 
        name: '等待时间(秒)', 
        key: 'waitTime', 
        type: 'number',
        default: 1.0,
        visible: (params) => params.waitMode === '固定时间'
      },
      { 
        name: '最小时间(秒)', 
        key: 'minTime', 
        type: 'number',
        default: 0.5,
        visible: (params) => params.waitMode === '随机时间'
      },
      { 
        name: '最大时间(秒)', 
        key: 'maxTime', 
        type: 'number',
        default: 2.0,
        visible: (params) => params.waitMode === '随机时间'
      },
      { 
        name: '黑板键名', 
        key: 'blackboardKey', 
        type: 'string',
        default: '',
        visible: (params) => params.waitMode === '黑板值'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.MOVE_TO]: {
    name: '移动到',
    category: NodeCategories.LEAF,
    description: '移动AI实体到指定位置。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '目标类型', key: 'targetType', type: 'select', options: ['仇恨目标', '坐标', '黑板对象', '玩家'], default: '黑板对象' },
      { name: '接受半径', key: 'acceptRadius', type: 'number', default: 1.0 },
      { name: '使用寻路', key: 'usePathfinding', type: 'select', options: ['是', '否'], default: '是' },
      { 
        name: '目标X', 
        key: 'targetX', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '目标Y', 
        key: 'targetY', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '目标Z', 
        key: 'targetZ', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '黑板键名', 
        key: 'blackboardKey', 
        type: 'string',
        default: '',
        visible: (params) => params.targetType === '黑板对象'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.LEAVE_MOVE_TO]: {
    name: '远离',
    category: NodeCategories.LEAF,
    description: '使AI实体远离指定位置。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '目标类型', key: 'targetType', type: 'select', options: ['仇恨目标', '坐标', '黑板对象', '玩家'], default: '黑板对象' },
      { name: '距离', key: 'distance', type: 'number', default: 1.0 },
      { name: '使用寻路', key: 'usePathfinding', type: 'select', options: ['是', '否'], default: '是' },
      { 
        name: '目标X', 
        key: 'targetX', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '目标Y', 
        key: 'targetY', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '目标Z', 
        key: 'targetZ', 
        type: 'number',
        default: 0,
        visible: (params) => params.targetType === '坐标'
      },
      { 
        name: '黑板键名', 
        key: 'blackboardKey', 
        type: 'string',
        default: '',
        visible: (params) => params.targetType === '黑板对象'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.ROTATE]: {
    name: '旋转',
    category: NodeCategories.LEAF,
    description: '旋转AI实体朝向指定方向。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '旋转模式', key: 'rotateMode', type: 'select', options: ['朝向目标', '指定角度', '随机旋转'], default: '朝向目标' },
      { name: '旋转速度', key: 'rotateSpeed', type: 'number', default: 180 },
      { 
        name: '目标黑板键', 
        key: 'targetKey', 
        type: 'string',
        default: '',
        visible: (params) => params.rotateMode === '朝向目标'
      },
      { 
        name: '目标偏航角', 
        key: 'targetYaw', 
        type: 'number',
        default: 0,
        visible: (params) => params.rotateMode === '指定角度'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.PRINT_STRING]: {
    name: '打印字符串',
    category: NodeCategories.LEAF,
    description: '输出调试信息。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '打印模式', key: 'printMode', type: 'select', options: ['固定文本', '黑板值', '格式化文本'], default: '固定文本' },
      { 
        name: '文本', 
        key: 'text', 
        type: 'string',
        default: 'Hello World',
        visible: (params) => params.printMode === '固定文本'
      },
      { 
        name: '黑板键名', 
        key: 'blackboardKey', 
        type: 'string',
        default: '',
        visible: (params) => params.printMode === '黑板值'
      },
      { 
        name: '格式字符串', 
        key: 'formatString', 
        type: 'string',
        default: '值: {0}',
        visible: (params) => params.printMode === '格式化文本'
      },
      { 
        name: '黑板键名', 
        key: 'blackboardKey', 
        type: 'string',
        default: '',
        visible: (params) => params.printMode === '格式化文本'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.SET_BLACKBOARD_VALUE]: {
    name: '设置黑板值',
    category: NodeCategories.LEAF,
    description: '在黑板上设置指定键的值。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '键名', key: 'keyName', type: 'string', default: '' },
      { name: '值类型', key: 'valueType', type: 'select', options: ['目标', '数字', '文本', '布尔', '向量'], default: '数字' },
      { 
        name: '值', 
        key: 'numericValue', 
        type: 'number',
        default: 0,
        visible: (params) => params.valueType === '数字'
      },
      { 
        name: '值', 
        key: 'textValue', 
        type: 'string',
        default: '',
        visible: (params) => params.valueType === '文本'
      },
      { 
        name: '值', 
        key: 'boolValue', 
        type: 'select',
        options: ['真', '假'],
        default: '真',
        visible: (params) => params.valueType === '布尔'
      },
      { 
        name: 'X', 
        key: 'vectorX', 
        type: 'number',
        default: 0,
        visible: (params) => params.valueType === '向量'
      },
      { 
        name: 'Y', 
        key: 'vectorY', 
        type: 'number',
        default: 0,
        visible: (params) => params.valueType === '向量'
      },
      { 
        name: 'Z', 
        key: 'vectorZ', 
        type: 'number',
        default: 0,
        visible: (params) => params.valueType === '向量'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.GET_BLACKBOARD_VALUE]: {
    name: '获取黑板值',
    category: NodeCategories.LEAF,
    description: '从黑板获取指定键的值。',
    inputs: ['父节点'],
    outputs: ['值'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '键名', key: 'keyName', type: 'string', default: '' }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.PLAY_ANIMATION]: {
    name: '播放动画',
    category: NodeCategories.LEAF,
    description: '播放指定的动画。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '动画名称', key: 'animationName', type: 'string', default: '' },
      { name: '循环播放', key: 'loopAnimation', type: 'select', options: ['是', '否'], default: '否' },
      { name: '混合时间', key: 'blendTime', type: 'number', default: 0.2 }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.PLAY_SOUND]: {
    name: '播放声音',
    category: NodeCategories.LEAF,
    description: '播放指定的音效。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '声音名称', key: 'soundName', type: 'string', default: '' },
      { name: '声音类型', key: 'soundType', type: 'select', options: ['2D', '3D定位'], default: '2D' },
      { name: '音量', key: 'volume', type: 'number', default: 1.0 },
      { 
        name: '位置黑板键', 
        key: 'positionKey', 
        type: 'string',
        default: '',
        visible: (params) => params.soundType === '3D定位'
      },
      { 
        name: '衰减距离', 
        key: 'attenuationDistance', 
        type: 'number',
        default: 1000,
        visible: (params) => params.soundType === '3D定位'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.CONDITION_CHECK]: {
    name: '条件检查',
    category: NodeCategories.LEAF,
    description: '检查各种游戏条件。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '条件类型', key: 'conditionType', type: 'select', options: ['距离检查', '血量检查', '能量检查', '自定义黑板'], default: '距离检查' },
      { 
        name: '目标黑板键', 
        key: 'targetKey', 
        type: 'string',
        default: '',
        visible: (params) => params.conditionType === '距离检查'
      },
      { 
        name: '最大距离', 
        key: 'maxDistance', 
        type: 'number',
        default: 100.0,
        visible: (params) => params.conditionType === '距离检查'
      },
      { 
        name: '血量黑板键', 
        key: 'healthKey', 
        type: 'string',
        default: 'Health',
        visible: (params) => params.conditionType === '血量检查'
      },
      { 
        name: '最小血量', 
        key: 'minHealth', 
        type: 'number',
        default: 50.0,
        visible: (params) => params.conditionType === '血量检查'
      },
      { 
        name: '能量黑板键', 
        key: 'energyKey', 
        type: 'string',
        default: 'Energy',
        visible: (params) => params.conditionType === '能量检查'
      },
      { 
        name: '最小能量', 
        key: 'minEnergy', 
        type: 'number',
        default: 30.0,
        visible: (params) => params.conditionType === '能量检查'
      },
      { 
        name: '键名', 
        key: 'customKey', 
        type: 'string',
        default: '',
        visible: (params) => params.conditionType === '自定义黑板'
      },
      { 
        name: '操作符', 
        key: 'customOperator', 
        type: 'select',
        options: ['等于', '不等于', '大于', '小于'],
        default: '等于',
        visible: (params) => params.conditionType === '自定义黑板'
      },
      { 
        name: '比较值', 
        key: 'customValue', 
        type: 'string',
        default: '',
        visible: (params) => params.conditionType === '自定义黑板'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  [NodeTypes.EXECUTE_ACTION]: {
    name: '执行动作',
    category: NodeCategories.LEAF,
    description: '执行游戏中的各种动作。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '动作类型', key: 'actionType', type: 'select', options: ['攻击', '技能', '交互', '拾取'], default: '攻击' },
      { 
        name: '目标黑板键', 
        key: 'targetKey', 
        type: 'string',
        default: 'Target',
        visible: (params) => params.actionType === '攻击'
      },
      { 
        name: '攻击范围', 
        key: 'attackRange', 
        type: 'number',
        default: 2.0,
        visible: (params) => params.actionType === '攻击'
      },
      { 
        name: '技能名称', 
        key: 'skillName', 
        type: 'string',
        default: '',
        visible: (params) => params.actionType === '技能'
      },
      { 
        name: '目标黑板键', 
        key: 'skillTargetKey', 
        type: 'string',
        default: '',
        visible: (params) => params.actionType === '技能'
      },
      { 
        name: '交互对象键', 
        key: 'interactKey', 
        type: 'string',
        default: '',
        visible: (params) => params.actionType === '交互'
      },
      { 
        name: '交互类型', 
        key: 'interactType', 
        type: 'string',
        default: '使用',
        visible: (params) => params.actionType === '交互'
      },
      { 
        name: '物品黑板键', 
        key: 'itemKey', 
        type: 'string',
        default: '',
        visible: (params) => params.actionType === '拾取'
      },
      { 
        name: '拾取范围', 
        key: 'pickupRange', 
        type: 'number',
        default: 1.5,
        visible: (params) => params.actionType === '拾取'
      }
    ],
    color: '#00B42A',
    customClass: 'node-action'
  },
  
  // 添加服务节点数据定义
  [NodeTypes.PARALLEL]: {
    name: '完整平行',
    category: NodeCategories.SERVICE,
    description: '允许所有子节点同时执行，根据成功/失败条件决定整个节点的执行结果。',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '成功策略', key: 'successPolicy', type: 'select', options: ['全部成功', '任一成功', '指定数量成功'], default: '全部成功' },
      { name: '失败策略', key: 'failurePolicy', type: 'select', options: ['任一失败', '全部失败', '指定数量失败'], default: '任一失败' }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.BLACKBOARD_MONITOR]: {
    name: '黑板监控服务',
    category: NodeCategories.SERVICE,
    description: '定期检查黑板上的值变化。',
    inputs: ['父节点'],
    outputs: ['值变化事件'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '监控键名', key: 'monitorKey', type: 'string', default: '' },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 0.1 },
      { name: '值变化时通知', key: 'notifyOnChange', type: 'select', options: ['是', '否'], default: '是' }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.DISTANCE_CHECK]: {
    name: '距离检查服务',
    category: NodeCategories.SERVICE,
    description: '定期检查与目标的距离。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '目标黑板键', key: 'targetKey', type: 'string', default: '' },
      { name: '检测范围', key: 'detectionRange', type: 'number', default: 500.0 },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 0.2 },
      { name: '距离存储键', key: 'distanceKey', type: 'string', default: 'TargetDistance' }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.LINE_OF_SIGHT]: {
    name: '视线检查服务',
    category: NodeCategories.SERVICE,
    description: '定期检查是否能看到目标。',
    inputs: ['父节点'],
    outputs: ['目标'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '目标黑板键', key: 'targetKey', type: 'string', default: '' },
      { name: '视觉范围', key: 'sightRange', type: 'number', default: 1000.0 },
      { name: '视觉角度', key: 'sightAngle', type: 'number', default: 90.0 },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 0.3 },
      { name: '可见性存储键', key: 'visibilityKey', type: 'string', default: 'CanSeeTarget' }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.PATROL]: {
    name: '巡逻服务',
    category: NodeCategories.SERVICE,
    description: '管理AI的巡逻行为。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '巡逻模式', key: 'patrolMode', type: 'select', options: ['循环', '往返', '随机'], default: '循环' },
      { name: '巡逻点数组键', key: 'patrolPointsKey', type: 'string', default: 'PatrolPoints' },
      { name: '当前索引键', key: 'currentIndexKey', type: 'string', default: 'CurrentPatrolIndex' },
      { name: '下个点键', key: 'nextPointKey', type: 'string', default: 'NextPatrolPoint' },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 1.0 }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.STATE_UPDATE]: {
    name: '状态更新服务',
    category: NodeCategories.SERVICE,
    description: '定期更新AI的状态信息。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '生命值键', key: 'healthKey', type: 'string', default: 'Health' },
      { name: '能量键', key: 'energyKey', type: 'string', default: 'Energy' },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 0.5 },
      { name: '启用生命恢复', key: 'enableHealthRegen', type: 'select', options: ['是', '否'], default: '否' },
      { name: '启用能量恢复', key: 'enableEnergyRegen', type: 'select', options: ['是', '否'], default: '否' }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  [NodeTypes.RANDOM_VALUE]: {
    name: '随机值服务',
    category: NodeCategories.SERVICE,
    description: '定期生成随机值并存储到黑板。',
    inputs: ['父节点'],
    outputs: [],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '值类型', key: 'valueType', type: 'select', options: ['数字', '布尔', '选择'], default: '数字' },
      { name: '输出键名', key: 'outputKey', type: 'string', default: 'RandomValue' },
      { name: '更新间隔(秒)', key: 'updateInterval', type: 'number', default: 2.0 },
      { name: '最小值', key: 'minValue', type: 'number', default: 0 },
      { name: '最大值', key: 'maxValue', type: 'number', default: 100 }
    ],
    color: '#86909C',
    customClass: 'node-service'
  },
  
  // 添加Subgraph节点定义
  [NodeTypes.SUBGRAPH]: {
    name: '子图',
    category: NodeCategories.SUBGRAPH,
    description: '将多个节点组合成一个单独的节点，可以展开和折叠',
    inputs: ['父节点'],
    outputs: ['子节点'],
    params: [
      { name: '权重', key: 'weight', type: 'number', default: 1 },
      { name: '描述', key: 'subgraphDescription', type: 'string', default: '子图节点' }
    ],
    color: '#722ED1',
    customClass: 'node-subgraph'
  }
};

// 组织节点进行展示
export const NodeGroups = [
  {
    title: '元节点',
    nodes: [NodeTypes.ROOT]
  },
  {
    title: '组合节点',
    nodes: [NodeTypes.SELECTOR, NodeTypes.SEQUENCE, NodeTypes.SIMPLE_PARALLEL]
  },
  {
    title: '装饰器节点',
    nodes: [
      NodeTypes.INVERTER, 
      NodeTypes.FORCE_SUCCESS, 
      NodeTypes.FORCE_FAILURE,
      NodeTypes.REPEAT,
      NodeTypes.COOLDOWN,
      NodeTypes.TIMEOUT,
      NodeTypes.BLACKBOARD
    ]
  },
  {
    title: '叶节点',
    nodes: [
      NodeTypes.WAIT, 
      NodeTypes.PRINT_STRING, 
      NodeTypes.SET_BLACKBOARD_VALUE,
      NodeTypes.GET_BLACKBOARD_VALUE,
      NodeTypes.MOVE_TO,
      NodeTypes.LEAVE_MOVE_TO,
      NodeTypes.ROTATE,
      NodeTypes.PLAY_ANIMATION,
      NodeTypes.PLAY_SOUND,
      NodeTypes.CONDITION_CHECK,
      NodeTypes.EXECUTE_ACTION
    ]
  },
  {
    title: '服务节点',
    nodes: [
      NodeTypes.PARALLEL,
      NodeTypes.BLACKBOARD_MONITOR,
      NodeTypes.DISTANCE_CHECK,
      NodeTypes.LINE_OF_SIGHT,
      NodeTypes.PATROL,
      NodeTypes.STATE_UPDATE,
      NodeTypes.RANDOM_VALUE
    ]
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