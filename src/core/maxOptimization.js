/**
 * Max Optimization Engine - Primera conexión
 * Optimización máxima absoluta: limpieza profunda, rendimiento extremo
 */

const adb = require('../adb/adbClient');
const scripts = require('../adb/scripts');
const logManager = require('../logs/logManager');

/**
 * Ejecuta optimización máxima (primera conexión)
 * @param {string} deviceId - Serial del dispositivo
 * @returns {Object} Resultado de la optimización
 */
async function maxOptimization(deviceId) {
  const startTime = Date.now();
  const result = {
    mode: 'max',
    actions: [],
    bloatwareRemoved: 0,
    servicesDisabled: 0,
    cacheClearedMb: 0,
    errors: [],
    success: true,
  };

  console.log(`[MAX] Iniciando optimización máxima para ${deviceId}`);

  try {
    // ── PASO 1: Snapshot pre-optimización ──────────────
    console.log('[MAX] 1/7 Capturando snapshot del dispositivo...');
    const preSnapshot = await captureSnapshot(deviceId);
    await logManager.logDeviceSnapshot(deviceId, preSnapshot);
    result.actions.push('snapshot_captured');

    // ── PASO 2: Eliminación profunda de bloatware ─────
    console.log('[MAX] 2/7 Eliminando bloatware...');
    const bloatware = scripts.generateBloatwareRemovalScript(deviceId);
    let removedCount = 0;
    for (const item of bloatware) {
      try {
        await adb.shell(deviceId, item.command);
        removedCount++;
      } catch (err) {
        result.errors.push({ action: 'bloatware', package: item.package, error: err.message });
      }
    }
    result.bloatwareRemoved = removedCount;
    result.actions.push(`bloatware_removed_${removedCount}`);
    console.log(`[MAX] Bloatware eliminado: ${removedCount}/${bloatware.length}`);

    // ── PASO 3: Desactivar servicios de MIUI ──────────
    console.log('[MAX] 3/7 Desactivando servicios MIUI...');
    for (const svc of scripts.MIUI_SERVICES_TO_DISABLE) {
      try {
        await adb.run(`shell am force-stop ${svc.split('/')[0]}`, deviceId);
        result.servicesDisabled++;
      } catch {}
    }
    result.actions.push(`miui_services_disabled_${result.servicesDisabled}`);

    // ── PASO 4: Ajustes de rendimiento máximo ─────────
    console.log('[MAX] 4/7 Aplicando ajustes de rendimiento...');
    const perfScript = scripts.generatePerformanceScript();
    for (const item of perfScript) {
      try {
        await adb.run(`shell ${item.command}`, deviceId);
      } catch (err) {
        result.errors.push({ action: 'performance', key: item.key, error: err.message });
      }
    }
    result.actions.push('performance_settings_applied');

    // ── PASO 5: Activar modo Xiaomi 17 Ultra ─────────
    console.log('[MAX] 5/7 Activando modo Xiaomi 17 Ultra...');
    const ultraScript = scripts.generateUltraModeScript();
    for (const item of ultraScript) {
      try {
        await adb.run(`shell ${item.command}`, deviceId);
      } catch (err) {
        result.errors.push({ action: 'ultra_mode', key: item.key, error: err.message });
      }
    }
    await adb.setAnimationScale(deviceId, 0);
    await adb.setPerformanceMode(deviceId);
    result.actions.push('ultra_mode_activated');

    // ── PASO 6: Limpieza profunda ─────────────────────
    console.log('[MAX] 6/7 Ejecutando limpieza profunda...');
    const cleanScript = scripts.generateDeepCleanScript();
    for (const item of cleanScript) {
      try {
        await adb.run(`shell ${item.command}`, deviceId);
      } catch {}
    }
    await adb.optimizeMemory(deviceId);
    result.actions.push('deep_clean_completed');

    // ── PASO 7: Optimización de batería ───────────────
    console.log('[MAX] 7/7 Optimizando batería...');
    try {
      await adb.shell(deviceId, 'settings put global low_power 0');
      await adb.shell(deviceId, 'dumpsys deviceidle enable');
      await adb.shell(deviceId, 'cmd appops set RUN_IN_BACKGROUND ignore default');
      result.actions.push('battery_optimized');
    } catch {}

    // ── Snapshot post-optimización ────────────────────
    const postSnapshot = await captureSnapshot(deviceId);
    await logManager.logDeviceSnapshot(deviceId, postSnapshot);

    // ── Refrescar UI ─────────────────────────────────
    await adb.refreshUI(deviceId);
    result.actions.push('ui_refreshed');

  } catch (err) {
    result.success = false;
    result.errors.push({ action: 'general', error: err.message });
  }

  result.durationMs = Date.now() - startTime;
  await logManager.logOptimizationResult(deviceId, result);

  console.log(`[MAX] Optimización completada en ${result.durationMs}ms`);
  console.log(`[MAX] Bloatware: ${result.bloatwareRemoved} | Servicios: ${result.servicesDisabled} | Errores: ${result.errors.length}`);

  return result;
}

/**
 * Captura un snapshot completo del dispositivo
 */
async function captureSnapshot(deviceId) {
  const snapshot = {
    apps: [],
    battery: {},
    temperature: null,
    processes: [],
    usageStats: [],
    errors: [],
  };

  try {
    snapshot.apps = await adb.listPackages(deviceId);
  } catch (e) { snapshot.errors.push(`apps: ${e.message}`); }

  try {
    snapshot.battery = await adb.getBatteryInfo(deviceId);
  } catch (e) { snapshot.errors.push(`battery: ${e.message}`); }

  try {
    snapshot.temperature = await adb.getTemperature(deviceId);
  } catch (e) { snapshot.errors.push(`temp: ${e.message}`); }

  try {
    snapshot.processes = (await adb.getRunningProcesses(deviceId)).slice(0, 50);
  } catch (e) { snapshot.errors.push(`processes: ${e.message}`); }

  try {
    snapshot.usageStats = (await adb.getUsageStats(deviceId)).slice(0, 20);
  } catch (e) { snapshot.errors.push(`usage: ${e.message}`); }

  return snapshot;
}

module.exports = { maxOptimization, captureSnapshot };
