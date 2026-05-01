const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { detectDevice } = require('./src/devices/deviceManager');
const { runOptimization } = require('./src/core/optimizerEngine');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'Phone Optimizer - Pablo & Sindy',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : false,
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC Handlers ──────────────────────────────────────

ipcMain.handle('detect-device', async () => {
  try {
    return await detectDevice();
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('run-optimization', async (_event, { deviceId, firstConnection }) => {
  try {
    return await runOptimization(deviceId, firstConnection);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-device-logs', async (_event, { deviceId }) => {
  try {
    const logManager = require('./src/logs/logManager');
    return logManager.getLogs(deviceId);
  } catch (err) {
    return { error: err.message };
  }
});
