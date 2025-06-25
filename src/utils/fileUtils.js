import React from 'react';

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  try {
    const d = new Date(date);
    const now = new Date();
    
    // 格式化选项
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // 如果是今天，只显示时间
    if (d.toDateString() === now.toDateString()) {
      return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 如果是昨天，显示"昨天"加时间
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 如果是今年，不显示年份
    if (d.getFullYear() === now.getFullYear()) {
      return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 其他情况显示完整日期
    return d.toLocaleString('zh-CN', options).replace(/\//g, '-');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '无效日期';
  }
};

/**
 * 文件图标组件
 */
export const FileIcons = {
  // 文件夹图标
  Folder: ({ color = '#FFA000', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
    </svg>
  ),
  
  // 默认文件图标
  File: ({ color = '#607D8B', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  
  // JSON文件图标
  JsonFile: ({ color = '#F57C00', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M10 12a1 1 0 00-1 1v2a1 1 0 01-1 1" fill="none"></path>
      <path d="M16 12a1 1 0 011 1v2a1 1 0 001 1" fill="none"></path>
    </svg>
  ),
  
  // JS文件图标
  JsFile: ({ color = '#FFCA28', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M10 17v-4"></path>
      <path d="M14 17c1.105 0 2-.895 2-2v-1.5c0-1.105-.895-2-2-2"></path>
    </svg>
  ),
  
  // 图像文件图标
  ImageFile: ({ color = '#4CAF50', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  
  // Markdown文件图标
  MarkdownFile: ({ color = '#2196F3', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M9 13h6"></path>
      <path d="M9 17h6"></path>
      <path d="M9 9h1"></path>
    </svg>
  )
};

/**
 * 根据文件信息获取对应的图标
 * @param {Object} file - 文件信息对象
 * @returns {Object} 图标对象，包含组件和颜色
 */
export const getFileIcon = (file) => {
  // 文件夹图标
  if (file.isDirectory) {
    return { component: FileIcons.Folder, color: '#FFA000' };
  }
  
  // 根据文件扩展名获取图标
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'json':
      return { component: FileIcons.JsonFile, color: '#F57C00' };
    case 'js':
    case 'jsx':
      return { component: FileIcons.JsFile, color: '#FFCA28' };
    case 'ts':
    case 'tsx':
      return { component: FileIcons.JsFile, color: '#3178C6' };
    case 'md':
      return { component: FileIcons.MarkdownFile, color: '#2196F3' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return { component: FileIcons.ImageFile, color: '#4CAF50' };
    default:
      return { component: FileIcons.File, color: '#607D8B' };
  }
};

/**
 * 解析文件路径
 * @param {string} filePath - 文件路径
 * @returns {Object} 路径对象，包含目录、文件名和扩展名
 */
export const parsePath = (filePath) => {
  // 处理 Windows 路径分隔符
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // 获取文件名
  const fileName = normalizedPath.split('/').pop();
  
  // 获取目录
  const directory = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
  
  // 获取扩展名
  let extension = '';
  if (fileName.includes('.')) {
    extension = fileName.substring(fileName.lastIndexOf('.') + 1);
  }
  
  return {
    directory,
    fileName,
    extension
  };
};

/**
 * 判断文件是否是文本文件
 * @param {string} extension - 文件扩展名
 * @returns {boolean} 是否是文本文件
 */
export const isTextFile = (extension) => {
  const textExtensions = [
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
    'less', 'xml', 'svg', 'yml', 'yaml', 'ini', 'config', 'sh', 'bash', 'bat',
    'c', 'cpp', 'cs', 'java', 'py', 'rb', 'php', 'go', 'rs', 'swift', 'kt'
  ];
  
  return textExtensions.includes(extension.toLowerCase());
};

/**
 * 判断文件是否是图像文件
 * @param {string} extension - 文件扩展名
 * @returns {boolean} 是否是图像文件
 */
export const isImageFile = (extension) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
  return imageExtensions.includes(extension.toLowerCase());
};

/**
 * 验证JSON是否是行为树格式
 * @param {string} jsonContent - JSON文件内容
 * @returns {Object} 验证结果：{isValid: boolean, message: string}
 */
export const validateBehaviorTree = (jsonContent) => {
  try {
    // 解析JSON
    const parsed = JSON.parse(jsonContent);
    
    // 基本行为树结构验证 - 支持两种格式
    // 1. 包含rootNode和nodes数组
    // 2. 包含nodes数组和edges数组
    if ((!parsed.rootNode && !parsed.edges) || !parsed.nodes || !Array.isArray(parsed.nodes)) {
      return {
        isValid: false,
        message: '不是有效的行为树JSON：缺少必要的结构(nodes数组和rootNode或edges数组)'
      };
    }
    
    // 检查是否有节点
    if (parsed.nodes.length === 0) {
      return {
        isValid: false,
        message: '行为树为空：没有找到节点'
      };
    }
    
    // 检查节点属性
    const hasInvalidNode = parsed.nodes.some(node => {
      return !node.id || !node.type || typeof node.position !== 'object';
    });
    
    if (hasInvalidNode) {
      return {
        isValid: false,
        message: '行为树JSON格式有误：节点缺少必要属性'
      };
    }
    
    // 验证通过
    return {
      isValid: true,
      message: '有效的行为树JSON',
      data: parsed
    };
  } catch (error) {
    // JSON解析错误
    return {
      isValid: false,
      message: `JSON解析错误：${error.message}`
    };
  }
}; 