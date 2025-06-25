// 预加载脚本在渲染进程加载之前运行，可以访问Node.js API和DOM
const { contextBridge, ipcRenderer, webFrame } = require('electron');

// 设置默认缩放为75%
webFrame.setZoomFactor(0.75);

// 定义允许的IPC通道
const validInvokeChannels = [
  'save-file', 
  'load-file', 
  'read-directory', 
  'read-file',
  'write-file',
  'create-directory',
  'delete-item',
  'rename-item',
  'select-directory',
  'get-file-info',
  'get-recent-projects',
  'add-recent-project',
  'show-context-menu',
  'launch-app',
  'get-system-drives',
  'save-app-state',
  'get-app-state',
  'validate-behavior-tree'
];

const validReceiveChannels = [
  'context-menu-action',
  'file-updated',
  'directory-updated'
];

// 暴露安全的API到window对象
contextBridge.exposeInMainWorld('electron', {
  // 提供安全的IPC通信
  ipcRenderer: {
    // 发送请求到主进程并等待响应
    invoke: (channel, ...args) => {
      if (validInvokeChannels.includes(channel)) {
        console.log(`IPC调用: ${channel}`);
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`禁止访问IPC通道: ${channel}`));
    },
    
    // 监听来自主进程的消息
    on: (channel, listener) => {
      if (validReceiveChannels.includes(channel)) {
        const wrappedListener = (_, ...args) => listener(...args);
        ipcRenderer.on(channel, wrappedListener);
        return () => ipcRenderer.removeListener(channel, wrappedListener);
      }
      return null;
    }
  }
}); 