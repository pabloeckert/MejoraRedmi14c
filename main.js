const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { detectDevice } = require('./src/devices/deviceManager');
const { runOptimization } = require('./src/core/optimizerEngine');
const { getRealTimeMetrics } = require('./src/adb/realTimeMetrics');
const { DeviceProfile } = require('./src/devices/deviceProfile');
const logManager = require('./src/logs/logManager');
const backupManager = require('./src/core/backupManager');
const autoMode = require('./src/core/autoMode');
const scheduler = require('./src/core/scheduler');
const wifiAdb = require('./src/adb/wifi');
const errorHandler = require('./src/core/errorHandler');
const { sendNotification, getPendingNotifications, getNotificationHistory } = require('./src/ui/notifications');

let mainWindow;
let activeProfiles = new Map();

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

  // Auto mode status → UI
  autoMode.onStatusChange = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-mode-status', status);
    }
  };
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  scheduler.stop();
  autoMode.stop();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── Helper ────────────────────────────────────────────
async function getProfile(deviceId) {
  if (!activeProfiles.has(deviceId)) {
    const profile = new DeviceProfile(deviceId);
    await profile.load();
    activeProfiles.set(deviceId, profile);
  }
  return activeProfiles.get(deviceId);
}

// ─── IPC: Device ───────────────────────────────────────

ipcMain.handle('detect-device', async () => {
  try {
    const device = await detectDevice();
    if (device.deviceId) await getProfile(device.deviceId);
    return device;
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('run-optimization', async (_e, { deviceId, firstConnection }) => {
  try {
    const result = await runOptimization(deviceId, firstConnection);
    const profile = await getProfile(deviceId);
    await profile.recordOptimization(result);
    const lastSnapshot = await logManager.getLastSnapshot(deviceId);
    if (lastSnapshot) await profile.updateWithSnapshot(lastSnapshot);
    return result;
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('get-device-logs', async (_e, { deviceId }) => {
  try { return await logManager.getLogs(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('get-real-time-metrics', async (_e, { deviceId }) => {
  try { return await getRealTimeMetrics(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('get-device-profile', async (_e, { deviceId }) => {
  try { return (await getProfile(deviceId)).data; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('get-smart-insights', async (_e, { deviceId }) => {
  try {
    const profile = await getProfile(deviceId);
    return { insights: profile.getInsights(), predictions: profile.getPredictions({}) };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('update-profile-snapshot', async (_e, { deviceId, snapshot }) => {
  try { return (await getProfile(deviceId)).updateWithSnapshot(snapshot); }
  catch (err) { return { error: err.message }; }
});

// ─── IPC: WiFi ADB ────────────────────────────────────

ipcMain.handle('wifi-connect', async (_e, { deviceId }) => {
  try { return await wifiAdb.connectOverWifi(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('wifi-verify', async (_e, { deviceId }) => {
  try { return await wifiAdb.verifyWifiConnection(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('wifi-disconnect', async (_e, { deviceId }) => {
  try { await wifiAdb.disconnect(deviceId); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

// ─── IPC: Backup ──────────────────────────────────────

ipcMain.handle('create-backup', async (_e, { deviceId }) => {
  try { return await backupManager.createBackup(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('list-backups', async (_e, { deviceId }) => {
  try { return await backupManager.listBackups(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('rollback', async (_e, { deviceId, timestamp }) => {
  try {
    const backup = timestamp ? await backupManager.loadBackup(deviceId, timestamp) : null;
    return await backupManager.rollback(deviceId, backup);
  } catch (err) { return { error: err.message }; }
});

// ─── IPC: Auto Mode ───────────────────────────────────

ipcMain.handle('auto-mode-toggle', async (_e, { enabled }) => {
  try {
    if (enabled) autoMode.start();
    else autoMode.stop();
    return { active: autoMode.isActive() };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('auto-mode-status', async () => {
  return { active: autoMode.isActive() };
});

// ─── IPC: Scheduler ───────────────────────────────────

ipcMain.handle('scheduler-add-job', async (_e, config) => {
  try { return scheduler.addJob(config); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('scheduler-remove-job', async (_e, { jobId }) => {
  try { scheduler.removeJob(jobId); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('scheduler-toggle-job', async (_e, { jobId, enabled }) => {
  try { scheduler.toggleJob(jobId, enabled); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('scheduler-list-jobs', async () => {
  try { return scheduler.listJobs(); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('scheduler-start', async () => {
  try { scheduler.start(); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('scheduler-stop', async () => {
  try { scheduler.stop(); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

// ─── IPC: Notifications ───────────────────────────────

ipcMain.handle('get-notifications', async () => {
  return getPendingNotifications();
});

ipcMain.handle('get-notification-history', async (_e, { limit }) => {
  return await getNotificationHistory(limit || 50);
});

// ─── IPC: Errors ──────────────────────────────────────

ipcMain.handle('get-error-stats', async () => {
  return errorHandler.getStats();
});

ipcMain.handle('get-recent-errors', async (_e, { limit }) => {
  return await errorHandler.getRecentErrors(limit || 20);
});
