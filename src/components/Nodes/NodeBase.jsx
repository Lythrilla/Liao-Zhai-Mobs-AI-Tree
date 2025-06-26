import React, {memo, useEffect, useRef, useState} from 'react';
import {Handle, Position, useUpdateNodeInternals} from '@xyflow/react';
import {getNodeColor, getNodeInfo} from '../../utils/nodeTypes';

// 带悬停效果的连接点标签组件
const PortLabel = ({text, position, left, visible, alwaysShow}) => {
    const style = {
        position: 'absolute',
        fontSize: '9px',
        background: 'rgba(39, 39, 46, 0.85)',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        fontWeight: '500',
        opacity: (visible || alwaysShow) ? 1 : 0,
        transform: `translate(-50%, ${position === 'top' ? '-120%' : '120%'})`,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        ...(position === 'top' ? {top: '-2px'} : {bottom: '-2px'}),
        left: `${left || 50}%`,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
    };

    return (
        <div style={style}>{text}</div>
    );
};

// 增强型连接点组件
const EnhancedHandle = ({type, position, id, style, left, label, onHover, alwaysShowLabels}) => {
    const [hover, setHover] = useState(false);
    const handleRef = useRef(null);

    useEffect(() => {
        if (handleRef.current) {
            handleRef.current.addEventListener('mouseenter', () => {
                setHover(true);
                if (onHover) onHover(id, true);
            });
            handleRef.current.addEventListener('mouseleave', () => {
                setHover(false);
                if (onHover) onHover(id, false);
            });
        }

        return () => {
            if (handleRef.current) {
                handleRef.current.removeEventListener('mouseenter', () => {
                });
                handleRef.current.removeEventListener('mouseleave', () => {
                });
            }
        };
    }, [id, onHover]);

    const enhancedStyle = {
        width: '8px',
        height: '8px',
        background: hover ? '#9254DE' : '#fff',
        border: `2px solid ${hover ? '#722ED1' : '#9254DE'}`,
        boxShadow: hover ? '0 0 0 2px rgba(255, 255, 255, 0.5), 0 0 4px rgba(114, 46, 209, 0.3)' : 'none',
        transition: 'all 0.2s ease',
        zIndex: 10
    };

    return (
        <>
            <Handle
                ref={handleRef}
                type={type}
                position={position}
                id={id}
                style={{...enhancedStyle, left: left ? `${left}%` : undefined}}
            />
            {label && (hover || alwaysShowLabels) &&
                <PortLabel text={label} position={position === Position.Top ? 'top' : 'bottom'} left={left} visible={hover} alwaysShow={alwaysShowLabels}/>}
        </>
    );
};

// 基础节点组件，所有节点类型继承自此组件
const NodeBase = ({data, selected, type, id, settings = {}}) => {
    const {label, description, params = {}, nodeType} = data;
    const [editing, setEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(label);
    const [editingParam, setEditingParam] = useState(null);
    const [editParamValue, setEditParamValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredPort, setHoveredPort] = useState(null);
    const dropdownRef = useRef(null);
    const updateNodeInternals = useUpdateNodeInternals();

    // 获取节点信息，用于获取参数定义
    const nodeInfo = getNodeInfo(nodeType || type);

    // 根据节点类型获取主色调
    const nodeColor = getNodeColor(nodeType || type);

    // 当节点数据变化时，强制更新节点内部状态
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, data, params, label, description, updateNodeInternals]);

    // 双击处理 - 标题编辑
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setEditLabel(label || (nodeInfo ? nodeInfo.name : type));
        setEditing(true);
    };

    const handlePortHover = (portId, isHovered) => {
        setHoveredPort(isHovered ? portId : null);
    };

    // 单击参数编辑，下拉框和布尔值可以直接点击切换
    const handleParamClick = (e, key, value) => {
        e.stopPropagation();

        // 检查参数是否为select类型
        const paramDef = nodeInfo?.params?.find(p => p.key === key);
        if (paramDef?.type === 'select') {
            setEditingParam(key);
            setShowDropdown(true);
            return;
        }

        // 检查参数是否为布尔类型
        if (typeof value === 'boolean') {
            // 直接切换布尔值
            data.params = {
                ...params,
                [key]: !value
            };
            // 强制更新节点内部状态
            updateNodeInternals(id);
        }
    }

    // 双击参数编辑
    const handleParamDoubleClick = (e, key, value) => {
        e.stopPropagation();

        // 检查参数是否为select类型
        const paramDef = nodeInfo?.params?.find(p => p.key === key);
        if (paramDef?.type === 'select') {
            setEditingParam(key);
            setShowDropdown(true);
            return;
        }

        // 检查参数是否为布尔类型
        if (typeof value === 'boolean') {
            // 直接切换布尔值
            data.params = {
                ...params,
                [key]: !value
            };
            // 强制更新节点内部状态
            updateNodeInternals(id);
            return;
        }

        setEditingParam(key);
        setEditParamValue(String(value || ''));
    };

    // 编辑完成 - 标题
    const handleEditComplete = () => {
        if (editLabel.trim() !== '') {
            data.label = editLabel;
        }
        setEditing(false);
    };

    // 编辑完成 - 参数
    const handleParamEditComplete = () => {
        if (editingParam) {
            // 根据原参数类型进行转换
            const originalValue = params?.[editingParam];
            let newValue = editParamValue;

            if (typeof originalValue === 'number') {
                newValue = parseFloat(editParamValue) || 0;
            } else if (typeof originalValue === 'boolean') {
                newValue = editParamValue.toLowerCase() === 'true';
            }

            // 更新参数
            data.params = {
                ...params,
                [editingParam]: newValue
            };

            // 强制更新节点内部状态
            updateNodeInternals(id);
        }

        setEditingParam(null);
        setShowDropdown(false);
    };

    // 处理下拉选择
    const handleSelectOption = (option) => {
        if (editingParam) {
            data.params = {
                ...params,
                [editingParam]: option
            };

            // 强制更新节点内部状态
            updateNodeInternals(id);

            setEditingParam(null);
            setShowDropdown(false);
        }
    };

    // 按下回车确认编辑
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleEditComplete();
        }
    };

    // 参数编辑按键处理
    const handleParamKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleParamEditComplete();
        }
    };

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 获取参数的选项（如果是select类型）
    const getParamOptions = (key) => {
        if (nodeInfo && nodeInfo.params) {
            const paramDef = nodeInfo.params.find(p => p.key === key);
            return paramDef?.options || [];
        }
        return [];
    };

    // 判断参数是否为select类型
    const isSelectParam = (key) => {
        if (nodeInfo && nodeInfo.params) {
            const paramDef = nodeInfo.params.find(p => p.key === key);
            return paramDef?.type === 'select';
        }
        return false;
    };

    // 判断参数是否应该可见
    const isParamVisible = (key) => {
        if (nodeInfo && nodeInfo.params) {
            const paramDef = nodeInfo.params.find(p => p.key === key);
            if (paramDef?.visible && typeof paramDef.visible === 'function') {
                return paramDef.visible(params || {});
            }
        }
        return true;
    };

    // 获取节点参数的定义
    const getParamDefinitions = () => {
        if (nodeInfo && nodeInfo.params) {
            return nodeInfo.params;
        }
        return [];
    };

    // 过滤显示的参数，只显示应该可见的参数
    const visibleParams = Object.entries(params || {}).filter(([key]) => isParamVisible(key));

    // 获取参数的显示名称
    const getParamDisplayName = (key) => {
        if (nodeInfo && nodeInfo.params) {
            const paramDef = nodeInfo.params.find(p => p.key === key);
            return paramDef?.name || key;
        }
        return key;
    };

    return (
        <div className={`bt-node ${selected ? 'selected' : ''}`}>
            <div className="node-header" style={{borderBottom: `1px solid ${nodeColor}30`}}>
                <div className="node-icon" style={{color: nodeColor}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="4" fill={nodeColor} fillOpacity="0.3"/>
                        <path d="M12 6V18M6 12H18" stroke={nodeColor} strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                </div>
                {editing ? (
                    <input
                        className="node-title-edit"
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onBlur={handleEditComplete}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                ) : (
                    <div className="node-title" onDoubleClick={handleDoubleClick}>
                        {label || (nodeInfo ? nodeInfo.name : type)}
                    </div>
                )}
            </div>

            <div className="node-content">
                {description && <div className="node-description">{description}</div>}

                {/* 显示节点参数 */}
                {visibleParams.length > 0 && (
                    <div className="node-params" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        {visibleParams.map(([key, value]) => {
                            // 跳过权重参数，除非它是唯一的参数
                            if (key === 'weight' && visibleParams.length > 1) return null;

                            return (
                                <div key={key} className="param-item" style={{
                                    padding: '1px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    position: 'relative'
                                }}>
                  <span style={{color: 'var(--text-secondary)', fontSize: '11px'}}>
                    {getParamDisplayName(key)}:
                  </span>
                                    {editingParam === key ? (
                                        isSelectParam(key) ? (
                                            showDropdown && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="param-dropdown"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        zIndex: 100,
                                                        background: 'white',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        width: '120px',
                                                        maxHeight: '150px',
                                                        overflowY: 'auto'
                                                    }}
                                                >
                                                    {getParamOptions(key).map((option) => (
                                                        <div
                                                            key={option}
                                                            className="dropdown-option"
                                                            onClick={() => handleSelectOption(option)}
                                                            style={{
                                                                padding: '6px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                borderBottom: '1px solid var(--border-color)',
                                                                backgroundColor: option === value ? 'var(--bg-secondary)' : 'transparent',
                                                                fontWeight: option === value ? '500' : 'normal'
                                                            }}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        ) : (
                                            <input
                                                className="param-edit"
                                                type="text"
                                                value={editParamValue}
                                                onChange={(e) => setEditParamValue(e.target.value)}
                                                onBlur={handleParamEditComplete}
                                                onKeyDown={handleParamKeyDown}
                                                autoFocus
                                                style={{
                                                    width: '80px',
                                                    padding: '1px 4px',
                                                    fontSize: '12px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '3px'
                                                }}
                                            />
                                        )
                                    ) : (
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                            onClick={(e) => handleParamClick(e, key, value)}
                                            onDoubleClick={(e) => handleParamDoubleClick(e, key, value)}
                                        >
                      {typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}
                                            {isSelectParam(key) && (
                                                <svg
                                                    width="10"
                                                    height="10"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    style={{marginLeft: '2px', opacity: 0.5}}
                                                >
                                                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                    </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 使用增强型渲染连接点组件，传递设置 */}
            <RenderEnhancedHandles nodeType={nodeType || type} onPortHover={handlePortHover} settings={settings}/>
        </div>
    );
};

// 使用增强型连接点的渲染函数
const RenderEnhancedHandles = memo(({nodeType, onPortHover, settings}) => {
    const alwaysShowLabels = settings?.alwaysShowLabels || false;

    // 渲染增强型连接点的帮助函数
    const renderEnhancedHandle = (type, position, id, label, left = null) => {
        return (
            <EnhancedHandle
                type={type}
                position={position}
                id={id}
                label={label}
                left={left}
                onHover={onPortHover}
                alwaysShowLabels={alwaysShowLabels}
            />
        );
    };

    // 根据节点类型判断连接点布局
    switch (nodeType) {
        case 'basic':
        case 'RootNode':
            return renderEnhancedHandle('source', Position.Bottom, 'children', '起始');

        case 'Selector':
        case 'Sequence':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'children', '子节点')}
                </>
            );

        case 'SimpleParallel':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'primaryTask', '主任务', 30)}
                    {renderEnhancedHandle('source', Position.Bottom, 'secondaryTask', '次要任务', 70)}
                </>
            );

        // 装饰器节点有一个输入和一个输出
        case 'Inverter':
        case 'ForceSuccess':
        case 'ForceFailure':
        case 'Repeat':
        case 'Cooldown':
        case 'Timeout':
        case 'Blackboard':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'child', '子节点')}
                </>
            );

        // 服务节点的连接点布局
        case 'Parallel':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'children', '子节点')}
                </>
            );

        case 'BlackboardMonitorService':
        case 'PatrolService':
        case 'StateUpdateService':
        case 'RandomValueService':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'child', '子节点')}
                </>
            );

        case 'DistanceCheckService':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'tooClose', '太近', 25)}
                    {renderEnhancedHandle('source', Position.Bottom, 'inRange', '适中', 50)}
                    {renderEnhancedHandle('source', Position.Bottom, 'tooFar', '太远', 75)}
                </>
            );

        case 'LineOfSightService':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'visible', '可见', 35)}
                    {renderEnhancedHandle('source', Position.Bottom, 'notVisible', '不可见', 65)}
                </>
            );

        // 叶节点只有输入
        case 'Wait':
        case 'PrintString':
        case 'SetBlackboardValue':
        case 'GetBlackboardValue':
        case 'MoveTo':
        case 'LeaveMoveTo':
        case 'Rotate':
            return renderEnhancedHandle('target', Position.Top, 'parent', '父节点');

        // 默认情况
        default:
            return renderEnhancedHandle('target', Position.Top, 'parent', '父节点');
    }
});

export default memo(NodeBase);
