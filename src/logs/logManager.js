/**
 * Log Manager - Sistema de logs por dispositivo
 * Registra todo: apps, batería, procesos, temperatura, errores
 */

const fs = require('fs-extra');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');

/**
 * Registra un evento de optimización
 */
async function logOptimization(deviceId, data) {
  await fs.ensureDir(LOGS_DIR);
  const logFile = path.join(LOGS_DIR, `${deviceId}.json`);

  let logs = [];
  if (await fs.pathExists(logFile)) {
    logs = await fs.readJson(logFile);
  }

  logs.push({
    timestamp: new Date().toISOString(),
    ...data,
  });

  await fs.writeJson(logFile, logs, { spaces: 2 });
}

/**
 * Registra snapshot completo del dispositivo
 */
async function logDeviceSnapshot(deviceId, snapshot) {
  await logOptimization(deviceId, {
    type: 'snapshot',
    apps: snapshot.apps || [],
    battery: snapshot.battery || {},
    temperature: snapshot.temperature || null,
    processes: snapshot.processes || [],
    usageStats: snapshot.usageStats || [],
    errors: snapshot.errors || [],
  });
}

/**
 * Registra resultado de optimización
 */
async function logOptimizationResult(deviceId, result) {
  await logOptimization(deviceId, {
    type: 'optimization',
    mode: result.mode, // 'max' o 'smart'
    actions: result.actions || [],
    bloatwareRemoved: result.bloatwareRemoved || 0,
    servicesDisabled: result.servicesDisabled || 0,
    cacheClearedMb: result.cacheClearedMb || 0,
    durationMs: result.durationMs || 0,
    success: result.success !== false,
    errors: result.errors || [],
  });
}

/**
 * Obtiene todos los logs de un dispositivo
 */
async function getLogs(deviceId) {
  const logFile = path.join(LOGS_DIR, `${deviceId}.json`);
  if (await fs.pathExists(logFile)) {
    return await fs.readJson(logFile);
  }
  return [];
}

/**
 * Obtiene el último snapshot del dispositivo
 */
async function getLastSnapshot(deviceId) {
  const logs = await getLogs(deviceId);
  const snapshots = logs.filter(l => l.type === 'snapshot');
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/**
 * Obtiene historial de optimizaciones
 */
async function getOptimizationHistory(deviceId) {
  const logs = await getLogs(deviceId);
  return logs.filter(l => l.type === 'optimization');
}

/**
 * Analiza tendencias (para ML)
 */
async function analyzeTrends(deviceId) {
  const logs = await getLogs(deviceId);
  const snapshots = logs.filter(l => l.type === 'snapshot');

  if (snapshots.length < 2) return null;

  const trends = {
    batteryDrainRate: [],
    temperatureTrend: [],
    topApps: {},
    commonProcesses: {},
  };

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];

    if (prev.battery?.level && curr.battery?.level) {
      trends.batteryDrainRate.push(
        parseInt(prev.battery.level) - parseInt(curr.battery.level)
      );
    }

    if (curr.temperature) {
      trends.temperatureTrend.push(curr.temperature);
    }

    // Contar apps más usadas
    if (curr.usageStats) {
      for (const app of curr.usageStats) {
        trends.topApps[app.package] = (trends.topApps[app.package] || 0) + app.totalTimeMs;
      }
    }
  }

  return trends;
}

module.exports = {
  logOptimization,
  logDeviceSnapshot,
  logOptimizationResult,
  getLogs,
  getLastSnapshot,
  getOptimizationHistory,
  analyzeTrends,
};
