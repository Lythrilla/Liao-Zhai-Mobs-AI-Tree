const { app, BrowserWindow, ipcMain, dialog, shell, Menu, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const remote = require('@electron/remote/main');

// 初始化@electron/remote
remote.initialize();

let mainWindow;

// 添加最近项目函数定义 - 移到文件顶部以确保在使用前定义
async function addRecentProject(project) {
  try {
    const userDataPath = app.getPath('userData');
    const recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    // 读取现有项目列表
    let projects = [];
    try {
      const content = await fs.promises.readFile(recentProjectsPath, 'utf-8');
      const data = JSON.parse(content);
      projects = data.projects || [];
    } catch (error) {
      // 文件不存在或无法读取，使用空数组
      projects = [];
    }
    
    // 检查项目是否已存在
    const existingIndex = projects.findIndex(p => p.path === project.path);
    if (existingIndex !== -1) {
      // 更新现有项目
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...project,
        lastOpened: new Date().toISOString()
      };
    } else {
      // 添加新项目
      projects.unshift({
        ...project,
        lastOpened: new Date().toISOString()
      });
    }
    
    // 限制最近项目数量为10个
    if (projects.length > 10) {
      projects = projects.slice(0, 10);
    }
    
    // 保存到文件
    await fs.promises.writeFile(recentProjectsPath, JSON.stringify({ projects }), 'utf-8');
    
    return { success: true };
  } catch (error) {
    console.error('添加最近项目失败:', error);
    return { success: false, error: error.message };
  }
}

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
  
  // 创建浏览器窗口 - 无边框样式
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: false, // 无边框模式
    titleBarStyle: 'hidden', // 隐藏标题栏
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
  
  // 启用remote模块
  remote.enable(mainWindow.webContents);

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
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' file: data:; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com"
        ]
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
ipcMain.handle('load-file', async (event, filePath) => {
  try {
    // 如果提供了文件路径，直接加载该文件
    if (filePath) {
      const normalizedPath = path.normalize(filePath);
      console.log('直接加载文件:', normalizedPath);
      
      try {
        // 检查文件是否存在
        const stats = await fs.promises.stat(normalizedPath);
        if (!stats.isFile()) {
          console.error('不是有效的文件:', normalizedPath);
          return { success: false, error: '不是有效的文件' };
        }
        
        // 检查是否是JSON文件
        if (!normalizedPath.toLowerCase().endsWith('.json')) {
          console.error('不是JSON文件:', normalizedPath);
          return { success: false, error: '只能加载JSON文件到编辑器' };
        }
        
        // 读取文件内容
        const data = await fs.promises.readFile(normalizedPath, 'utf-8');
        console.log('文件内容读取成功，长度:', data.length);
        
        try {
          // 解析JSON以验证格式
          const jsonObj = JSON.parse(data);
          console.log('JSON解析成功，包含节点数量:', jsonObj.nodes ? jsonObj.nodes.length : 0);
          
          // 存储当前打开的文件路径
          global.currentOpenFile = {
            path: normalizedPath,
            content: jsonObj
          };
          
          console.log('当前文件已保存到全局变量:', normalizedPath);
          
          // 添加到最近项目
          await addRecentProject({
            path: normalizedPath,
            name: path.basename(normalizedPath),
            lastOpened: new Date().toISOString()
          });
          
          return { success: true, data: jsonObj, filePath: normalizedPath };
        } catch (jsonError) {
          console.error('JSON解析错误:', jsonError.message);
          return { success: false, error: `JSON解析错误: ${jsonError.message}` };
        }
      } catch (error) {
        console.error('加载文件失败:', error);
        return { success: false, error: error.message };
      }
    } 
    // 如果没有提供路径，打开文件选择对话框
    else {
      const { filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'JSON', extensions: ['json'] }
        ]
      });

      if (filePaths && filePaths.length > 0) {
        const filePath = filePaths[0];
        console.log('用户选择的文件:', filePath);
        
        const data = fs.readFileSync(filePath, 'utf-8');
        console.log('文件内容读取成功，长度:', data.length);
        
        // 存储当前打开的文件路径
        try {
          const jsonObj = JSON.parse(data);
          console.log('JSON解析成功，包含节点数量:', jsonObj.nodes ? jsonObj.nodes.length : 0);
          
          global.currentOpenFile = {
            path: filePath,
            content: jsonObj
          };
          
          console.log('当前文件已保存到全局变量:', filePath);
          
          // 添加到最近项目
          await addRecentProject({
            path: filePath,
            name: path.basename(filePath),
            lastOpened: new Date().toISOString()
          });
        } catch (jsonError) {
          console.error('JSON解析错误:', jsonError.message);
          return { success: false, error: `JSON解析错误: ${jsonError.message}` };
        }
        
        return { success: true, data: JSON.parse(data), filePath };
      }
      return { success: false, message: '用户取消加载' };
    }
  } catch (error) {
    console.error('加载文件处理失败:', error);
    return { success: false, error: error.message };
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

// 读取目录内容 - 修复版本
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    // 确保路径格式正确
    let normalizedPath = dirPath;
    if (dirPath.startsWith('file:///')) {
      normalizedPath = decodeURI(dirPath.substr(8)); // 去掉 'file:///' 前缀
    }
    
    // 确保目录存在
    const stats = await fs.promises.stat(normalizedPath);
    if (!stats.isDirectory()) {
      return { success: false, error: '指定的路径不是目录' };
    }
    
    const entries = await fs.promises.readdir(normalizedPath, { withFileTypes: true });
    const result = [];
    
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
    
    return { success: true, entries: result };
  } catch (error) {
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

// 获取系统盘符
ipcMain.handle('get-system-drives', async () => {
  try {
    // Windows系统
    if (process.platform === 'win32') {
      // 使用Node.js的path模块和fs模块
      const drives = [];
      
      // 常见的Windows盘符
      const driveLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                           'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      
      // 检查每个盘符是否存在
      for (const letter of driveLetters) {
        const drivePath = `${letter}:\\`;
        try {
          await fs.promises.access(drivePath, fs.constants.F_OK);
          
          // 获取盘符标签（如果可能）
          let label = '';
          try {
            // 尝试读取卷标，如果失败则使用默认标签
            const { execSync } = require('child_process');
            const output = execSync(`dir ${drivePath} | findstr "Volume"`).toString();
            const match = output.match(/Volume in drive [A-Z] is (.+)/);
            if (match && match[1]) {
              label = match[1].trim();
            }
          } catch (err) {
            // 静默处理卷标获取失败的情况
            label = `本地磁盘 (${letter}:)`;
          }
          
          // 添加到盘符列表
          drives.push({
            name: `${letter}:`,
            path: drivePath,
            label: label || `本地磁盘 (${letter}:)`
          });
        } catch (err) {
          // 盘符不存在或无法访问，跳过
          continue;
        }
      }
      
      console.log('获取到系统盘符:', drives);
      return { success: true, drives };
    } 
    // macOS系统
    else if (process.platform === 'darwin') {
      const { execSync } = require('child_process');
      
      // 使用df命令获取挂载点
      const output = execSync('df -h | grep "/Volumes/"').toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      const drives = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          const path = parts[8];
          const name = path.split('/').pop();
          
          drives.push({
            name,
            path,
            label: name
          });
        }
      }
      
      // 添加根目录
      drives.unshift({
        name: '根目录',
        path: '/',
        label: 'Macintosh HD'
      });
      
      console.log('获取到系统盘符:', drives);
      return { success: true, drives };
    } 
    // Linux系统
    else {
      const { execSync } = require('child_process');
      
      // 使用df命令获取挂载点
      const output = execSync('df -h --output=target').toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      // 跳过标题行
      const drives = [];
      for (let i = 1; i < lines.length; i++) {
        const path = lines[i].trim();
        if (!path || path === '/boot' || path.startsWith('/run/')) continue;
        
        const name = path === '/' ? '根目录' : path.split('/').pop();
        
        drives.push({
          name,
          path,
          label: name
        });
      }
      
      console.log('获取到系统盘符:', drives);
      return { success: true, drives };
    }
  } catch (error) {
    console.error('获取系统盘符失败:', error);
    return { success: false, error: error.message, drives: [] };
  }
});

// 获取当前已加载的文件
ipcMain.handle('get-current-file', async () => {
  try {
    if (global.currentOpenFile) {
      return { 
        success: true, 
        data: global.currentOpenFile.content,
        filePath: global.currentOpenFile.path
      };
    }
    return { success: false, message: '没有已加载的文件' };
  } catch (error) {
    console.error('获取当前文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 存储当前文件数据
ipcMain.handle('store-current-file', async (event, fileData) => {
  try {
    if (!fileData || (fileData.path === null && fileData.content === null)) {
      console.log('清除当前文件数据');
      global.currentOpenFile = null;
      return { success: true };
    }
    
    if (!fileData.path || !fileData.content) {
      return { success: false, error: '无效的文件数据' };
    }
    
    console.log('存储当前文件数据到全局变量:', fileData.path);
    
    global.currentOpenFile = {
      path: fileData.path,
      content: fileData.content
    };
    
    return { success: true };
  } catch (error) {
    console.error('存储当前文件数据失败:', error);
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

// 获取文件信息
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    // 确保路径格式正确
    let normalizedPath = filePath;
    if (filePath.startsWith('file:///')) {
      normalizedPath = decodeURI(filePath.substr(8)); // 去掉 'file:///' 前缀
    }
    
    console.log('获取文件信息:', normalizedPath);
    
    // 获取文件状态
    const stats = await fs.promises.stat(normalizedPath);
    
    return {
      success: true,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      lastModified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString()
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 获取最近项目
ipcMain.handle('get-recent-projects', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    // 检查文件是否存在
    try {
      await fs.promises.access(recentProjectsPath, fs.constants.F_OK);
    } catch (error) {
      // 文件不存在，创建空的最近项目列表
      await fs.promises.writeFile(recentProjectsPath, JSON.stringify({ projects: [] }), 'utf-8');
      return { success: true, projects: [] };
    }
    
    // 读取文件内容
    const content = await fs.promises.readFile(recentProjectsPath, 'utf-8');
    const data = JSON.parse(content);
    
    return { success: true, projects: data.projects || [] };
  } catch (error) {
    console.error('获取最近项目失败:', error);
    return { success: false, error: error.message, projects: [] };
  }
});

// 添加最近项目
ipcMain.handle('add-recent-project', async (event, project) => {
  try {
    return await addRecentProject(project);
  } catch (error) {
    console.error('添加最近项目失败:', error);
    return { success: false, error: error.message };
  }
});

// 窗口控制 - 同步消息处理
ipcMain.on('window-minimize-sync', (event) => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize-sync', (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close-sync', (event) => {
  if (mainWindow) mainWindow.close();
});

// 窗口控制
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return { success: true };
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return { success: true, isMaximized: mainWindow.isMaximized() };
  } else {
    return { success: false, error: 'mainWindow不存在' };
  }
});

ipcMain.handle('window-unmaximize', () => {
  if (mainWindow && mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }
  return { success: true };
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
  return { success: true };
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
}); 