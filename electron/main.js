const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const isDev = !app.isPackaged;

let mainWindow;
let autoUpdater;

// Auto-updater setup (only in production)
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
  } catch (e) {
    console.log('electron-updater not available:', e.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'MejoraRedmi14c',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d0f14',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
            : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none';"
        ],
      },
    });
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============================================
// IPC Handlers — ADB Operations
// ============================================

// Check if ADB is available
ipcMain.handle('adb-check', async () => {
  try {
    const result = execSync('adb version', { encoding: 'utf8', timeout: 5000 });
    return { available: true, version: result.trim().split('\n')[0] };
  } catch (e) {
    return { available: false, error: e.message };
  }
});

// List connected devices
ipcMain.handle('adb-devices', async () => {
  try {
    const result = execSync('adb devices', { encoding: 'utf8', timeout: 10000 });
    const lines = result.trim().split('\n').slice(1);
    const devices = lines
      .filter(l => l.trim() && !l.startsWith('*'))
      .map(l => {
        const [serial, state] = l.trim().split('\t');
        return { serial, state };
      });
    return { success: true, devices };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Execute ADB command
ipcMain.handle('adb-exec', async (event, command) => {
  return new Promise((resolve) => {
    try {
      // Sanitize: only allow adb commands
      if (!command.startsWith('adb ')) {
        resolve({ success: false, error: 'Solo se permiten comandos ADB' });
        return;
      }

      const proc = spawn('sh', ['-c', command], { timeout: 30000 });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code,
        });
      });

      proc.on('error', (e) => {
        resolve({ success: false, error: e.message });
      });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

// Save script to file
ipcMain.handle('save-script', async (event, content, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar Script',
    defaultPath: defaultName || 'mejora_redmi14c.sh',
    filters: [
      { name: 'Shell Script', extensions: ['sh'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, path: result.filePath };
  }
  return { success: false, canceled: true };
});

// Execute script file
ipcMain.handle('run-script', async (event, scriptPath) => {
  return new Promise((resolve) => {
    try {
      const proc = spawn('bash', [scriptPath], { timeout: 120000 });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        mainWindow.webContents.send('script-output', text);
      });
      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        mainWindow.webContents.send('script-output', text);
      });

      proc.on('close', (code) => {
        resolve({ success: code === 0, stdout, stderr, code });
      });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

// Get device info
ipcMain.handle('device-info', async () => {
  try {
    const model = execSync('adb shell getprop ro.product.model', { encoding: 'utf8', timeout: 5000 }).trim();
    const brand = execSync('adb shell getprop ro.product.brand', { encoding: 'utf8', timeout: 5000 }).trim();
    const android = execSync('adb shell getprop ro.build.version.release', { encoding: 'utf8', timeout: 5000 }).trim();
    const sdk = execSync('adb shell getprop ro.build.version.sdk', { encoding: 'utf8', timeout: 5000 }).trim();
    const miui = execSync('adb shell getprop ro.miui.ui.version.name', { encoding: 'utf8', timeout: 5000 }).trim();

    return {
      success: true,
      info: { model, brand, android, sdk, miui },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ============================================
// IPC Handlers — Auto-Update
// ============================================

ipcMain.handle('update-check', async () => {
  if (!autoUpdater) {
    return { available: false, error: 'Auto-updater not available in dev mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo) {
      return {
        available: true,
        version: result.updateInfo.version,
        releaseDate: result.updateInfo.releaseDate,
        releaseNotes: result.updateInfo.releaseNotes,
      };
    }
    return { available: false };
  } catch (e) {
    return { available: false, error: e.message };
  }
});

ipcMain.handle('update-download', async () => {
  if (!autoUpdater) {
    return { success: false, error: 'Auto-updater not available' };
  }
  try {
    autoUpdater.downloadUpdate();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('update-install', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

// Auto-updater events → renderer
if (autoUpdater) {
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-error', { message: err.message });
    }
  });
}
