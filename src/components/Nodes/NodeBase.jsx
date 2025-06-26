import React, {memo, useEffect, useRef, useState} from 'react';
import {Handle, Position, useUpdateNodeInternals} from '@xyflow/react';
import {getNodeColor, getNodeInfo, convertParamValue, convertParamDisplayValue} from '../../utils/nodeTypes';

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
    const handleParamClick = (e, key, value, paramDef) => {
        e.stopPropagation();

        // 检查参数是否为select类型
        if (paramDef?.type === 'select') {
            setEditingParam(key);
            setShowDropdown(true);
            return;
        }

        // 检查参数是否为布尔类型
        if (paramDef?.type === 'boolean' || typeof value === 'boolean') {
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
    const handleParamDoubleClick = (e, key, value, paramDef) => {
        e.stopPropagation();

        // 检查参数是否为select类型
        if (paramDef?.type === 'select') {
            setEditingParam(key);
            setShowDropdown(true);
            return;
        }

        // 检查参数是否为布尔类型
        if (paramDef?.type === 'boolean' || typeof value === 'boolean') {
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
            const paramDef = nodeInfo?.params?.find(p => p.key === editingParam);
            let newValue = editParamValue;

            // 根据参数定义进行类型转换
            if (paramDef?.type === 'number') {
                newValue = parseFloat(editParamValue) || 0;

                // 应用范围限制
                if (paramDef.min !== undefined && newValue < paramDef.min) {
                    newValue = paramDef.min;
                }
                if (paramDef.max !== undefined && newValue > paramDef.max) {
                    newValue = paramDef.max;
                }
            } else if (paramDef?.type === 'boolean') {
                newValue = editParamValue.toLowerCase() === 'true' || editParamValue === '是';
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
    const handleSelectOption = (option, paramDef) => {
        if (editingParam) {
            // 转换显示值为实际值
            const actualValue = convertParamValue(paramDef, option);

            data.params = {
                ...params,
                [editingParam]: actualValue
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

    // 获取参数的定义
    const getParamDefinition = (key) => {
        if (nodeInfo && nodeInfo.params) {
            return nodeInfo.params.find(p => p.key === key);
        }
        return null;
    };

    // 判断参数是否应该可见
    const isParamVisible = (key) => {
        const paramDef = getParamDefinition(key);
        if (paramDef?.visible && typeof paramDef.visible === 'function') {
            return paramDef.visible(params || {});
        }
        return true;
    };

    // 获取参数的显示值
    const getParamDisplayValue = (key, value) => {
        const paramDef = getParamDefinition(key);

        // 对于select类型，转换为中文显示
        if (paramDef?.type === 'select' && paramDef.mapping) {
            return convertParamDisplayValue(paramDef, value) || value;
        }

        // 对于布尔类型，显示为是/否
        if (paramDef?.type === 'boolean' || typeof value === 'boolean') {
            return value ? '是' : '否';
        }

        return String(value);
    };

    // 获取参数的显示名称
    const getParamDisplayName = (key) => {
        const paramDef = getParamDefinition(key);
        return paramDef?.name || key;
    };

    // 获取参数的提示信息
    const getParamTooltip = (key) => {
        const paramDef = getParamDefinition(key);
        return paramDef?.tooltip || '';
    };

    // 使用参数定义来初始化默认值
    useEffect(() => {
        if (nodeInfo && nodeInfo.params) {
            const defaultParams = {};
            nodeInfo.params.forEach(paramDef => {
                if (params[paramDef.key] === undefined && paramDef.default !== undefined) {
                    defaultParams[paramDef.key] = paramDef.default;
                }
            });

            if (Object.keys(defaultParams).length > 0) {
                data.params = {
                    ...defaultParams,
                    ...params
                };
                updateNodeInternals(id);
            }
        }
    }, [nodeInfo]);

    // 过滤显示的参数
    const visibleParams = nodeInfo?.params?.filter(paramDef => isParamVisible(paramDef.key)) || [];

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
                        {visibleParams.map((paramDef) => {
                            const key = paramDef.key;
                            const value = params[key] ?? paramDef.default;
                            const tooltip = getParamTooltip(key);

                            return (
                                <div key={key} className="param-item" style={{
                                    padding: '1px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    position: 'relative'
                                }}>
                                    <span
                                        style={{color: 'var(--text-secondary)', fontSize: '11px'}}
                                        title={tooltip}
                                    >
                                        {getParamDisplayName(key)}:
                                    </span>
                                    {editingParam === key ? (
                                        paramDef.type === 'select' ? (
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
                                                    {paramDef.options.map((option) => (
                                                        <div
                                                            key={option}
                                                            className="dropdown-option"
                                                            onClick={() => handleSelectOption(option, paramDef)}
                                                            style={{
                                                                padding: '6px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                borderBottom: '1px solid var(--border-color)',
                                                                backgroundColor: getParamDisplayValue(key, value) === option ? 'var(--bg-secondary)' : 'transparent',
                                                                fontWeight: getParamDisplayValue(key, value) === option ? '500' : 'normal'
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
                                                type={paramDef.type === 'number' ? 'number' : 'text'}
                                                value={editParamValue}
                                                onChange={(e) => setEditParamValue(e.target.value)}
                                                onBlur={handleParamEditComplete}
                                                onKeyDown={handleParamKeyDown}
                                                autoFocus
                                                min={paramDef.min}
                                                max={paramDef.max}
                                                step={paramDef.step}
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
                                            onClick={(e) => handleParamClick(e, key, value, paramDef)}
                                            onDoubleClick={(e) => handleParamDoubleClick(e, key, value, paramDef)}
                                        >
                                            {getParamDisplayValue(key, value)}
                                            {paramDef.type === 'select' && (
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
        case 'root':
            return renderEnhancedHandle('source', Position.Bottom, 'children', '子节点');

        case 'selector':
        case 'sequence':
        case 'parallel':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'children', '子节点')}
                </>
            );

        // 装饰器节点有一个输入和一个输出
        case 'inverter':
        case 'always_succeed':
        case 'always_fail':
        case 'repeat':
        case 'retry':
        case 'delay':
        case 'timeout':
        case 'cooldown':
        case 'random':
            return (
                <>
                    {renderEnhancedHandle('target', Position.Top, 'parent', '父节点')}
                    {renderEnhancedHandle('source', Position.Bottom, 'child', '子节点')}
                </>
            );

        // 叶节点只有输入
        case 'condition':
            return renderEnhancedHandle('target', Position.Top, 'parent', '父节点');

        // 默认情况
        default:
            return renderEnhancedHandle('target', Position.Top, 'parent', '父节点');
    }
});

export default memo(NodeBase);
