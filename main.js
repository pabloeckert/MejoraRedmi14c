const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
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
const benchmark = require('./src/core/benchmark');
const { AnomalyDetector } = require('./src/ml/anomalyDetector');
const extensionManager = require('./src/extensions/extensionManager');
const adb = require('./src/adb/adbClient');

// ── Ciclo 5-7 modules ──
const { FailurePredictor } = require('./src/ml/failurePredictor');
const { ProactiveOptimizer } = require('./src/core/proactiveOptimizer');
const turboMode = require('./src/core/turboMode');
const guardian = require('./src/core/guardian');
const reportExporter = require('./src/core/reportExporter');
const pdfExporter = require('./src/core/pdfExporter');
const advancedExporter = require('./src/core/advancedExporter');
const internalAPI = require('./src/core/internalAPI');
const telemetry = require('./src/core/telemetry');
const { HybridAI } = require('./src/ml/hybridAI');
const { PluginSandbox } = require('./src/extensions/pluginSandbox');

let mainWindow;
let activeProfiles = new Map();

// ── Simple settings store ──
const SETTINGS_PATH = path.join(__dirname, 'settings.json');
let appSettings = {};

async function loadSettings() {
  try {
    if (await fs.pathExists(SETTINGS_PATH)) {
      appSettings = await fs.readJson(SETTINGS_PATH);
    }
  } catch { appSettings = {}; }
}

async function saveSettings() {
  try {
    await fs.writeJson(SETTINGS_PATH, appSettings, { spaces: 2 });
  } catch {}
}

// Initialize settings on startup
loadSettings();

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
  guardian.stopAll();
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

// ═══════════════════════════════════════════════════════
//  IPC: Device
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  IPC: WiFi ADB
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  IPC: Backup
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  IPC: Auto Mode
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  IPC: Scheduler
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  IPC: Notifications
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-notifications', async () => {
  return getPendingNotifications();
});

ipcMain.handle('get-notification-history', async (_e, { limit }) => {
  return await getNotificationHistory(limit || 50);
});

// ═══════════════════════════════════════════════════════
//  IPC: Errors
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-error-stats', async () => {
  return errorHandler.getStats();
});

ipcMain.handle('get-recent-errors', async (_e, { limit }) => {
  return await errorHandler.getRecentErrors(limit || 20);
});

// ═══════════════════════════════════════════════════════
//  IPC: Benchmark
// ═══════════════════════════════════════════════════════

ipcMain.handle('run-benchmark', async (_e, { deviceId }) => {
  try { return await benchmark.run(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('compare-benchmark', async (_e, { current, previous }) => {
  try {
    benchmark.results = current;
    return benchmark.compare(previous);
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Anomaly Detection
// ═══════════════════════════════════════════════════════

ipcMain.handle('detect-anomalies', async (_e, { deviceId }) => {
  try {
    const detector = new AnomalyDetector(deviceId);
    return await detector.detect();
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Failure Prediction (Ciclo 5)
// ═══════════════════════════════════════════════════════

ipcMain.handle('predict-failures', async (_e, { deviceId }) => {
  try {
    const predictor = new FailurePredictor(deviceId);
    return await predictor.predict();
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('predict-non-linear', async (_e, { deviceId }) => {
  try {
    const predictor = new FailurePredictor(deviceId);
    const result = await predictor.predict();
    return result.nonLinearPredictions || { available: false, predictions: [] };
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Proactive Optimizer (Ciclo 5)
// ═══════════════════════════════════════════════════════

ipcMain.handle('analyze-proactive', async (_e, { deviceId }) => {
  try {
    const optimizer = new ProactiveOptimizer(deviceId);
    return await optimizer.analyze();
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Turbo Mode (Ciclo 5)
// ═══════════════════════════════════════════════════════

ipcMain.handle('run-turbo', async (_e, { deviceId, options }) => {
  try {
    return await turboMode.activate(deviceId, options || {});
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('turbo-activate', async (_e, { deviceId }) => {
  try { return await turboMode.activate(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('turbo-deactivate', async (_e, { deviceId }) => {
  try { return await turboMode.deactivate(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('turbo-status', async (_e, { deviceId }) => {
  try { return turboMode.getStatus(deviceId); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Guardian Mode (Ciclo 6)
// ═══════════════════════════════════════════════════════

ipcMain.handle('guardian-status', async (_e, { deviceId }) => {
  try { return guardian.getStatus(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('guardian-start', async (_e, { deviceId }) => {
  try { return guardian.start(deviceId); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('guardian-stop', async (_e, { deviceId }) => {
  try { return guardian.stop(deviceId); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Report Export (Ciclo 5)
// ═══════════════════════════════════════════════════════

ipcMain.handle('export-report', async (_e, { deviceId, format }) => {
  try {
    return await reportExporter.export(deviceId, { format });
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('list-reports', async () => {
  try { return await reportExporter.listReports(); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: PDF Export (Ciclo 6)
// ═══════════════════════════════════════════════════════

ipcMain.handle('export-pdf', async (_e, { deviceId }) => {
  try { return await pdfExporter.export(deviceId); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Advanced Export (Ciclo 7)
// ═══════════════════════════════════════════════════════

ipcMain.handle('advanced-export', async (_e, { deviceId, format }) => {
  try {
    switch (format) {
      case 'csv': return await advancedExporter.exportCSV(deviceId);
      case 'xml': return await advancedExporter.exportXML(deviceId);
      case 'bundle': return await advancedExporter.exportBundle(deviceId);
      default: return await advancedExporter.exportBundle(deviceId);
    }
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: System Info (Ciclo 7)
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-system-info', async () => {
  try { return internalAPI.getSystemInfo(); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Telemetry (Ciclo 7)
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-telemetry', async (_e, { deviceId, limit }) => {
  try {
    const events = telemetry.getEvents(deviceId, { limit: limit || 100 });
    const stats = telemetry.getStats(deviceId);
    return { events, stats };
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Hybrid AI Metrics (Ciclo 7)
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-hybrid-ai-metrics', async () => {
  try {
    const hybridAI = new HybridAI();
    return hybridAI.getMetrics();
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Plugins (Ciclo 7)
// ═══════════════════════════════════════════════════════

ipcMain.handle('list-plugins', async () => {
  try {
    const sandbox = new PluginSandbox();
    await sandbox.loadAll();
    return sandbox.list();
  } catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Settings
// ═══════════════════════════════════════════════════════

ipcMain.handle('set-setting', async (_e, { key, value }) => {
  try {
    appSettings[key] = value;
    await saveSettings();
    return { success: true };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('get-setting', async (_e, { key }) => {
  try { return appSettings[key] ?? null; }
  catch (err) { return null; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Extensions
// ═══════════════════════════════════════════════════════

ipcMain.handle('list-extensions', async () => {
  try {
    await extensionManager.loadFromDisk();
    return extensionManager.list();
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('toggle-extension', async (_e, { extensionId, enabled }) => {
  try { return extensionManager.toggle(extensionId, enabled); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('run-extension-script', async (_e, { extensionId, scriptName, deviceId }) => {
  try { return await extensionManager.runScript(extensionId, scriptName, deviceId); }
  catch (err) { return { error: err.message }; }
});

// ═══════════════════════════════════════════════════════
//  IPC: Advanced Diagnostics
// ═══════════════════════════════════════════════════════

ipcMain.handle('run-advanced-diagnostics', async (_e, { deviceId }) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      battery: {},
      thermal: { zones: [] },
      sensors: [],
      radio: {},
      miui: { count: 0, services: [] },
      zombies: { count: 0, processes: [] },
      selfReactivate: { count: 0, services: [] },
    };

    try {
      const battOutput = await adb.run('shell dumpsys battery', deviceId);
      results.battery = parseBatteryDetailed(battOutput);
    } catch {}

    try {
      const thermalOutput = await adb.run('shell dumpsys thermalservice', deviceId);
      results.thermal = parseThermalZones(thermalOutput);
    } catch {}

    try {
      const sensorOutput = await adb.run('shell dumpsys sensorservice', deviceId);
      results.sensors = parseSensors(sensorOutput);
    } catch {}

    try {
      results.radio = {
        wifi: await adb.run('shell settings get global wifi_on', deviceId).then(v => v === '1' ? 'Activo' : 'Inactivo').catch(() => '?'),
        wifiIp: await adb.run('shell ip addr show wlan0', deviceId).then(o => o.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/)?.[1] || 'N/A').catch(() => 'N/A'),
        mobile: await adb.run('shell settings get global mobile_data', deviceId).then(v => v === '1' ? 'Activo' : 'Inactivo').catch(() => '?'),
        carrier: await adb.run('shell getprop gsm.sim.operator.alpha', deviceId).catch(() => '?'),
        networkType: await adb.run('shell getprop gsm.network.type', deviceId).catch(() => '?'),
      };
    } catch {}

    try {
      const svcOutput = await adb.run('shell dumpsys activity services', deviceId);
      results.miui = parseMIUIServices(svcOutput);
    } catch {}

    try {
      const psOutput = await adb.run('shell ps -A -o PID,STAT,NAME', deviceId);
      results.zombies = parseZombies(psOutput);
    } catch {}

    try {
      const disabled = await adb.run('shell pm list packages -d', deviceId);
      const services = await adb.run('shell dumpsys activity services', deviceId);
      results.selfReactivate = parseSelfReactivating(disabled, services);
    } catch {}

    return results;
  } catch (err) { return { error: err.message }; }
});

// ─── Diagnostic Parsers ──────────────────────────────

function parseBatteryDetailed(output) {
  const info = {};
  output.split('\n').forEach(line => {
    const match = line.match(/^\s*(.+?):\s*(.+)$/);
    if (match) info[match[1].trim()] = match[2].trim();
  });
  return info;
}

function parseThermalZones(output) {
  const zones = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/(\w+):\s+(\d+(?:\.\d+)?)°?C?/i);
    if (match) zones.push({ name: match[1], temp: parseFloat(match[2]) });
  }
  if (zones.length === 0) {
    const tempMatch = output.match(/Temperature\s*[:=]\s*(\d+\.?\d*)/gi);
    if (tempMatch) {
      tempMatch.forEach((m, i) => {
        const val = parseFloat(m.match(/(\d+\.?\d*)/)?.[1]);
        if (!isNaN(val)) zones.push({ name: `zone_${i}`, temp: val });
      });
    }
  }
  return { zones };
}

function parseSensors(output) {
  const sensors = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(.+?):\s*(.+)$/);
    if (match && (match[1].includes('Sensor') || match[1].includes('sensor'))) {
      sensors.push({ name: match[1].trim(), value: match[2].trim().slice(0, 50) });
    }
  }
  return sensors.slice(0, 20);
}

function parseMIUIServices(output) {
  const miuiKeywords = ['miui', 'xiaomi', 'hyperos', 'mishare', 'micloud', 'misound', 'securitycenter'];
  const services = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (miuiKeywords.some(k => lower.includes(k))) {
      const match = line.match(/(\S+\/\S+)/);
      if (match && !services.includes(match[1])) services.push(match[1]);
    }
  }
  return { count: services.length, services: services.slice(0, 20) };
}

function parseZombies(output) {
  const zombies = [];
  const lines = output.split('\n');
  for (const line of lines) {
    if (/\bZ\b/.test(line)) {
      const parts = line.trim().split(/\s+/);
      zombies.push({ pid: parts[0], stat: parts[1], name: parts[2] || '' });
    }
  }
  return { count: zombies.length, processes: zombies.slice(0, 10) };
}

function parseSelfReactivating(disabledOutput, servicesOutput) {
  const disabledPackages = disabledOutput.split('\n')
    .filter(l => l.startsWith('package:'))
    .map(l => l.replace('package:', '').trim());

  const selfReactivate = [];
  for (const pkg of disabledPackages) {
    if (servicesOutput.includes(pkg)) {
      selfReactivate.push(pkg);
    }
  }
  return { count: selfReactivate.length, services: selfReactivate.slice(0, 10) };
}
