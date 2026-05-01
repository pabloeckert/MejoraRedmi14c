const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { detectDevice } = require('./src/devices/deviceManager');
const { runOptimization } = require('./src/core/optimizerEngine');
const { getRealTimeMetrics } = require('./src/adb/realTimeMetrics');
const { DeviceProfile } = require('./src/devices/deviceProfile');
const logManager = require('./src/logs/logManager');

let mainWindow;
let activeProfiles = new Map(); // deviceId → DeviceProfile

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 650,
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

// ─── Helper: get or create profile ─────────────────────
async function getProfile(deviceId) {
  if (!activeProfiles.has(deviceId)) {
    const profile = new DeviceProfile(deviceId);
    await profile.load();
    activeProfiles.set(deviceId, profile);
  }
  return activeProfiles.get(deviceId);
}

// ─── IPC Handlers ──────────────────────────────────────

ipcMain.handle('detect-device', async () => {
  try {
    const device = await detectDevice();
    // Pre-load profile
    if (device.deviceId) {
      await getProfile(device.deviceId);
    }
    return device;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('run-optimization', async (_event, { deviceId, firstConnection }) => {
  try {
    const result = await runOptimization(deviceId, firstConnection);

    // Update profile with optimization result
    const profile = await getProfile(deviceId);
    await profile.recordOptimization(result);

    // Update profile with latest snapshot
    const lastSnapshot = await logManager.getLastSnapshot(deviceId);
    if (lastSnapshot) {
      await profile.updateWithSnapshot(lastSnapshot);
    }

    return result;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-device-logs', async (_event, { deviceId }) => {
  try {
    return await logManager.getLogs(deviceId);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-real-time-metrics', async (_event, { deviceId }) => {
  try {
    return await getRealTimeMetrics(deviceId);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-device-profile', async (_event, { deviceId }) => {
  try {
    const profile = await getProfile(deviceId);
    return profile.data;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('get-smart-insights', async (_event, { deviceId }) => {
  try {
    const profile = await getProfile(deviceId);
    return {
      insights: profile.getInsights(),
      predictions: profile.getPredictions({}),
    };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('update-profile-snapshot', async (_event, { deviceId, snapshot }) => {
  try {
    const profile = await getProfile(deviceId);
    return await profile.updateWithSnapshot(snapshot);
  } catch (err) {
    return { error: err.message };
  }
});
