const { app, BrowserWindow, ipcMain, dialog, shell, Menu, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

// 获取应用根目录
function getAppPath() {
  // 开发环境使用当前目录
  if (isDev) {
    return path.resolve('.');
  }
  
  return process.resourcesPath;
}

function createWindow() {
  console.log('创建主窗口');
  console.log('应用路径:', app.getAppPath());
  console.log('用户数据路径:', app.getPath('userData'));
  console.log('是否为开发环境:', isDev);
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // 禁用web安全策略，允许加载本地资源
      allowRunningInsecureContent: true // 允许运行不安全的内容
    },
    icon: path.join(__dirname, './favicon.ico'),
    show: false
  });

  // 加载应用 - 开发环境使用本地服务器，生产环境使用打包后的文件
  let startURL;
  
  if (isDev) {
    startURL = 'http://localhost:3001';
  } else {
    // 生产环境中，尝试多种可能的路径
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(process.resourcesPath, 'build/index.html'),
      path.join(app.getAppPath(), 'build/index.html'),
      path.join(__dirname, '../../../build/index.html'), // 针对asar打包
      path.resolve(__dirname, '../build/index.html')
    ];
    
    // 查找第一个存在的路径
    let foundPath = null;
    for (const p of possiblePaths) {
      console.log('检查路径:', p);
      try {
        if (fs.existsSync(p)) {
          foundPath = p;
          console.log('找到有效路径:', p);
          break;
        }
      } catch (error) {
        console.log('路径检查出错:', p, error.message);
      }
    }
    
    if (foundPath) {
      startURL = `file://${foundPath}`;
    } else {
      console.log('警告: 未找到有效的index.html路径');
      startURL = `file://${path.resolve(__dirname, '../build/index.html')}`;
    }
  }
  
  console.log('应用加载路径:', startURL);
  
  mainWindow.loadURL(startURL);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
    mainWindow.webContents.setZoomFactor(0.75);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('页面加载失败:', errorCode, errorDescription);
  });

  // 打开开发工具
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 当窗口准备好时显示
  mainWindow.once('ready-to-show', () => {
    console.log('窗口准备好显示');
    // 设置窗口缩放为70%
    mainWindow.webContents.setZoomFactor(0.75);
    mainWindow.show();
  });

  // 窗口关闭时的操作
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.on('ready', () => {
  console.log('应用准备就绪');
  
  // 注册自定义协议处理程序
  try {
    protocol.registerFileProtocol('file', (request, callback) => {
      try {
        const url = request.url.substr(7); // 去掉 'file://' 前缀
        console.log('文件协议请求:', url);
        callback({ path: decodeURI(url) });
      } catch (error) {
        console.log('处理文件协议请求失败:', error);
        callback({ error: -2 /* FAILED */ });
      }
    });
    console.log('文件协议注册成功');
  } catch (error) {
    console.log('注册文件协议失败:', error);
  }
  
  // 设置CSP头
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' file: data:"]
      }
    });
  });
  
  createWindow();
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 文件保存处理
ipcMain.handle('save-file', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: '保存行为树',
      defaultPath: 'behavior-tree.json',
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, filePath };
    }
    return { success: false, message: '用户取消保存' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 文件加载处理
ipcMain.handle('load-file', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ]
    });

    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data), filePath };
    }
    return { success: false, message: '用户取消加载' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 处理应用程序启动请求
ipcMain.handle('launch-app', async () => {
  try {
    // 获取构建应用程序的路径
    const appPath = path.join(__dirname, '../build/app/');
    const exePath = path.join(appPath, 'BehaviorTreeExecutor.exe');
    
    // 检查文件是否存在
    if (fs.existsSync(exePath)) {
      // 使用shell.openPath打开应用程序
      await shell.openPath(exePath);
      return { success: true };
    } else {
      // 应用程序不存在
      dialog.showMessageBox({
        type: 'error',
        title: '应用启动失败',
        message: '无法找到应用程序执行文件。请确保程序已正确构建。',
        buttons: ['确定']
      });
      return { success: false, error: '应用程序不存在' };
    }
  } catch (error) {
    // 处理任何错误
    console.error('启动应用程序时出错:', error);
    dialog.showMessageBox({
      type: 'error',
      title: '应用启动失败',
      message: `启动应用程序时出错: ${error.message}`,
      buttons: ['确定']
    });
    return { success: false, error: error.message };
  }
});

// 处理文件系统路径，确保格式正确
function normalizePath(filePath) {
  // 确保路径使用正确的分隔符
  let normalizedPath = filePath.replace(/\\/g, '/');
  
  // 确保路径以file:///开头
  if (!normalizedPath.startsWith('file:///')) {
    // 如果是Windows路径，添加file:///
    if (normalizedPath.match(/^[a-zA-Z]:/)) {
      normalizedPath = `file:///${normalizedPath}`;
    } 
    // 如果是相对路径，转换为绝对路径
    else if (!normalizedPath.startsWith('/')) {
      const absPath = path.resolve(normalizedPath);
      normalizedPath = `file:///${absPath.replace(/\\/g, '/')}`;
    }
    // 如果是绝对路径但不是file:///开头
    else if (normalizedPath.startsWith('/')) {
      normalizedPath = `file://${normalizedPath}`;
    }
  }
  
  console.log('规范化路径:', filePath, '->', normalizedPath);
  return normalizedPath;
}

// 读取目录内容
ipcMain.handle('read-directory', async (event, dirPath) => {
  console.log('读取目录请求:', dirPath);
  try {
    // 确保路径格式正确
    let normalizedPath = dirPath;
    if (dirPath.startsWith('file:///')) {
      normalizedPath = decodeURI(dirPath.substr(8)); // 去掉 'file:///' 前缀
    }
    
    console.log('规范化后的目录路径:', normalizedPath);
    
    const entries = await fs.promises.readdir(normalizedPath, { withFileTypes: true });
    const result = [];
    
    console.log(`发现 ${entries.length} 个项目在目录 ${normalizedPath}`);
    
    for (const entry of entries) {
      const entryPath = path.join(normalizedPath, entry.name);
      const isDirectory = entry.isDirectory();
      
      result.push({
        name: entry.name,
        path: entryPath,
        isDirectory,
        children: isDirectory ? [] : undefined
      });
    }
    
    // 排序：文件夹优先，然后按名称排序
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    console.log(`成功读取目录 ${normalizedPath}，返回 ${result.length} 个项目`);
    return { success: true, entries: result };
  } catch (error) {
    console.log('读取目录失败:', error);
    return { success: false, error: error.message };
  }
});

// 读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
  console.log('读取文件请求:', filePath);
  try {
    // 确保路径格式正确
    let normalizedPath = filePath;
    if (filePath.startsWith('file:///')) {
      normalizedPath = decodeURI(filePath.substr(8)); // 去掉 'file:///' 前缀
    }
    
    console.log('规范化后的文件路径:', normalizedPath);
    
    const content = await fs.promises.readFile(normalizedPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.log('读取文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 写入文件内容
ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('写入文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 创建目录
ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('创建目录失败:', error);
    return { success: false, error: error.message };
  }
});

// 删除文件或目录
ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const stats = await fs.promises.stat(itemPath);
    
    if (stats.isDirectory()) {
      await fs.promises.rmdir(itemPath, { recursive: true });
    } else {
      await fs.promises.unlink(itemPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('删除项目失败:', error);
    return { success: false, error: error.message };
  }
});

// 重命名文件或目录
ipcMain.handle('rename-item', async (event, { oldPath, newPath }) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('重命名失败:', error);
    return { success: false, error: error.message };
  }
});

// 选择目录对话框
ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { success: true, dirPath: result.filePaths[0] };
  } catch (error) {
    console.error('选择目录失败:', error);
    return { success: false, error: error.message };
  }
});

// 验证行为树JSON (服务器端验证)
ipcMain.handle('validate-behavior-tree', async (event, filePath) => {
  console.log('验证行为树JSON:', filePath);
  try {
    // 确保路径格式正确
    let normalizedPath = filePath;
    if (filePath.startsWith('file:///')) {
      normalizedPath = decodeURI(filePath.substr(8)); // 去掉 'file:///' 前缀
    }
    
    console.log('规范化后的文件路径:', normalizedPath);
    
    // 读取文件内容
    const content = await fs.promises.readFile(normalizedPath, 'utf-8');
    let jsonContent;
    
    try {
      // 解析JSON
      jsonContent = JSON.parse(content);
    } catch (parseError) {
      console.log('JSON解析错误:', parseError);
      return {
        isValid: false,
        message: `JSON解析错误: ${parseError.message}`
      };
    }
    
    // 基本行为树结构验证 - 支持两种格式
    // 1. 包含rootNode和nodes数组
    // 2. 包含nodes数组和edges数组
    if ((!jsonContent.rootNode && !jsonContent.edges) || !jsonContent.nodes || !Array.isArray(jsonContent.nodes)) {
      console.log('行为树格式无效: 缺少必要的结构');
      return {
        isValid: false,
        message: '不是有效的行为树JSON：缺少必要的结构(nodes数组和rootNode或edges数组)'
      };
    }
    
    // 检查是否有节点
    if (jsonContent.nodes.length === 0) {
      console.log('行为树为空: 没有节点');
      return {
        isValid: false,
        message: '行为树为空：没有找到节点'
      };
    }
    
    // 检查节点属性
    const hasInvalidNode = jsonContent.nodes.some(node => {
      return !node.id || !node.type || typeof node.position !== 'object';
    });
    
    if (hasInvalidNode) {
      console.log('行为树格式有误: 节点缺少必要属性');
      return {
        isValid: false,
        message: '行为树JSON格式有误：节点缺少必要属性'
      };
    }
    
    // 验证通过
    console.log('行为树验证通过');
    return {
      isValid: true,
      message: '有效的行为树JSON',
      path: normalizedPath,
      name: path.basename(normalizedPath)
    };
  } catch (error) {
    console.log('验证行为树失败:', error);
    return {
      isValid: false,
      message: `读取或验证文件失败: ${error.message}`
    };
  }
}); 