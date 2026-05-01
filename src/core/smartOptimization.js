/**
 * Smart Optimization Engine - Conexiones posteriores
 * Optimización inteligente basada en análisis de uso real
 * Aprende y mejora con cada conexión
 */

const adb = require('../adb/adbClient');
const scripts = require('../adb/scripts');
const logManager = require('../logs/logManager');
const { captureSnapshot } = require('./maxOptimization');

/**
 * Ejecuta optimización inteligente (segunda conexión en adelante)
 * @param {string} deviceId - Serial del dispositivo
 * @returns {Object} Resultado de la optimización
 */
async function smartOptimization(deviceId) {
  const startTime = Date.now();
  const result = {
    mode: 'smart',
    actions: [],
    adjustments: [],
    bloatwareRemoved: 0,
    errors: [],
    success: true,
  };

  console.log(`[SMART] Iniciando optimización inteligente para ${deviceId}`);

  try {
    // ── PASO 1: Capturar snapshot actual ──────────────
    console.log('[SMART] 1/6 Capturando snapshot actual...');
    const currentSnapshot = await captureSnapshot(deviceId);

    // ── PASO 2: Obtener logs históricos ───────────────
    console.log('[SMART] 2/6 Analizando historial...');
    const lastSnapshot = await logManager.getLastSnapshot(deviceId);
    const trends = await logManager.analyzeTrends(deviceId);
    const optHistory = await logManager.getOptimizationHistory(deviceId);

    // ── PASO 3: Detectar patrones y problemas ─────────
    console.log('[SMART] 3/6 Detectando patrones de uso...');
    const analysis = analyzeUsagePatterns(currentSnapshot, lastSnapshot, trends);

    // ── PASO 4: Generar plan de optimización dinámico ─
    console.log('[SMART] 4/6 Generando plan de optimización personalizado...');
    const plan = generateOptimizationPlan(analysis, optHistory);

    // ── PASO 5: Ejecutar plan ─────────────────────────
    console.log('[SMART] 5/6 Ejecutando optimización...');
    const execResult = await executePlan(deviceId, plan);
    result.actions = execResult.actions;
    result.adjustments = execResult.adjustments;
    result.bloatwareRemoved = execResult.bloatwareRemoved;

    // ── PASO 6: Post-snapshot y logging ───────────────
    console.log('[SMART] 6/6 Guardando resultados...');
    const postSnapshot = await captureSnapshot(deviceId);
    await logManager.logDeviceSnapshot(deviceId, postSnapshot);
    await logManager.logOptimizationSnapshot(deviceId, {
      pre: summarizeSnapshot(currentSnapshot),
      post: summarizeSnapshot(postSnapshot),
      plan,
      analysis,
    });

    // Refrescar UI
    await adb.refreshUI(deviceId);

  } catch (err) {
    result.success = false;
    result.errors.push({ action: 'general', error: err.message });
  }

  result.durationMs = Date.now() - startTime;
  await logManager.logOptimizationResult(deviceId, result);

  console.log(`[SMART] Optimización completada en ${result.durationMs}ms`);
  return result;
}

/**
 * Analiza patrones de uso comparando snapshots
 */
function analyzeUsagePatterns(current, previous, trends) {
  const analysis = {
    batteryHealth: 'good',
    temperatureStatus: 'normal',
    memoryPressure: 'low',
    topResourceConsumers: [],
    bloatwareDetected: [],
    recommendations: [],
  };

  // Análisis de batería
  if (current.battery?.level) {
    const level = parseInt(current.battery.level);
    if (level < 20) {
      analysis.batteryHealth = 'critical';
      analysis.recommendations.push('Activar modo ahorro de batería');
    } else if (level < 40) {
      analysis.batteryHealth = 'low';
      analysis.recommendations.push('Reducir brillo y servicios en background');
    }
  }

  // Análisis de temperatura
  if (current.temperature) {
    if (current.temperature > 40) {
      analysis.temperatureStatus = 'hot';
      analysis.recommendations.push('Cerrar apps pesadas, reducir carga de CPU');
    } else if (current.temperature > 35) {
      analysis.temperatureStatus = 'warm';
    }
  }

  // Análisis de procesos
  if (current.processes?.length > 100) {
    analysis.memoryPressure = 'high';
    analysis.recommendations.push('Reducir procesos en background');
  }

  // Detectar apps de alto consumo
  if (current.usageStats) {
    analysis.topResourceConsumers = current.usageStats
      .slice(0, 5)
      .map(a => a.package);
  }

  // Detectar bloatware que reapareció
  const KNOWN_BLOAT = new Set(scripts.XIAOMI_BLOATWARE);
  if (current.apps) {
    analysis.bloatwareDetected = current.apps.filter(app => KNOWN_BLOAT.has(app));
    if (analysis.bloatwareDetected.length > 0) {
      analysis.recommendations.push(
        `Eliminar ${analysis.bloatwareDetected.length} apps de bloatware detectadas`
      );
    }
  }

  // Comparar con snapshot anterior
  if (previous) {
    if (previous.temperature && current.temperature) {
      const tempDiff = current.temperature - previous.temperature;
      if (tempDiff > 5) {
        analysis.recommendations.push('Temperatura en aumento - considerar reducir carga');
      }
    }
  }

  // Analizar tendencias
  if (trends?.batteryDrainRate?.length > 0) {
    const avgDrain = trends.batteryDrainRate.reduce((a, b) => a + b, 0) / trends.batteryDrainRate.length;
    if (avgDrain > 10) {
      analysis.recommendations.push(`Drenaje de batería alto (${avgDrain.toFixed(1)}%/conexión)`);
    }
  }

  return analysis;
}

/**
 * Genera un plan de optimización basado en el análisis
 */
function generateOptimizationPlan(analysis, optHistory) {
  const plan = {
    actions: [],
    priority: 'normal',
    reasoning: [],
  };

  // Siempre: limpieza de cache
  plan.actions.push({ type: 'clear_cache', priority: 'high' });
  plan.reasoning.push('Limpieza de cache rutinaria');

  // Bloatware que reapareció
  if (analysis.bloatwareDetected.length > 0) {
    plan.actions.push({
      type: 'remove_bloatware',
      packages: analysis.bloatwareDetected,
      priority: 'high',
    });
    plan.reasoning.push(`${analysis.bloatwareDetected.length} apps de bloatware detectadas`);
  }

  // Presión de memoria
  if (analysis.memoryPressure === 'high') {
    plan.actions.push({ type: 'kill_background', priority: 'high' });
    plan.actions.push({ type: 'optimize_memory', priority: 'high' });
    plan.reasoning.push('Alta presión de memoria');
    plan.priority = 'high';
  }

  // Temperatura alta
  if (analysis.temperatureStatus === 'hot') {
    plan.actions.push({ type: 'reduce_cpu_load', priority: 'high' });
    plan.actions.push({ type: 'kill_heavy_apps', priority: 'high' });
    plan.reasoning.push('Temperatura elevada');
    plan.priority = 'high';
  }

  // Batería baja
  if (analysis.batteryHealth === 'critical') {
    plan.actions.push({ type: 'battery_saver', priority: 'high' });
    plan.reasoning.push('Batería crítica');
    plan.priority = 'high';
  }

  // Mantener ajustes de rendimiento (reforzar)
  plan.actions.push({ type: 'enforce_performance', priority: 'normal' });
  plan.reasoning.push('Reforzar ajustes de rendimiento');

  // Aprendizaje: si la última optimización fue hace mucho, hacer limpieza más profunda
  if (optHistory.length > 0) {
    const lastOpt = new Date(optHistory[optHistory.length - 1].timestamp);
    const daysSinceLastOpt = (Date.now() - lastOpt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastOpt > 3) {
      plan.actions.push({ type: 'deep_clean', priority: 'normal' });
      plan.reasoning.push(`Última optimización hace ${Math.floor(daysSinceLastOpt)} días`);
    }
  }

  return plan;
}

/**
 * Ejecuta el plan de optimización
 */
async function executePlan(deviceId, plan) {
  const execResult = { actions: [], adjustments: [], bloatwareRemoved: 0 };

  for (const action of plan.actions) {
    try {
      switch (action.type) {
        case 'clear_cache':
          await adb.shell(deviceId, 'pm trim-caches 256M');
          execResult.actions.push('cache_cleared');
          break;

        case 'remove_bloatware':
          for (const pkg of action.packages) {
            try {
              await adb.shell(deviceId, `pm uninstall -k --user 0 ${pkg}`);
              execResult.bloatwareRemoved++;
            } catch {}
          }
          execResult.actions.push(`bloatware_removed_${execResult.bloatwareRemoved}`);
          break;

        case 'kill_background':
          const processes = await adb.getRunningProcesses(deviceId);
          const killable = processes.filter(p =>
            !p.name.includes('system') &&
            !p.name.includes('launcher') &&
            !p.name.includes('phone') &&
            !p.name.includes('dialer')
          );
          for (const proc of killable.slice(0, 20)) {
            try { await adb.shell(deviceId, `kill ${proc.pid}`); } catch {}
          }
          execResult.actions.push(`processes_killed_${Math.min(killable.length, 20)}`);
          break;

        case 'optimize_memory':
          await adb.optimizeMemory(deviceId);
          execResult.actions.push('memory_optimized');
          break;

        case 'reduce_cpu_load':
          await adb.setAnimationScale(deviceId, 0);
          execResult.actions.push('cpu_load_reduced');
          break;

        case 'kill_heavy_apps':
          // Matar apps conocidas por ser pesadas
          const heavyApps = [
            'com.facebook.katana',
            'com.instagram.android',
            'com.tiktok',
            'com.zhiliaoapp.musically',
          ];
          for (const app of heavyApps) {
            try { await adb.forceStop(deviceId, app); } catch {}
          }
          execResult.actions.push('heavy_apps_killed');
          break;

        case 'battery_saver':
          await adb.shell(deviceId, 'settings put global low_power 1');
          execResult.actions.push('battery_saver_enabled');
          break;

        case 'enforce_performance':
          await adb.setPerformanceMode(deviceId);
          await adb.setAnimationScale(deviceId, 0);
          execResult.actions.push('performance_enforced');
          break;

        case 'deep_clean':
          const cleanScript = scripts.generateDeepCleanScript();
          for (const item of cleanScript) {
            try { await adb.run(`shell ${item.command}`, deviceId); } catch {}
          }
          execResult.actions.push('deep_clean_completed');
          break;
      }

      execResult.adjustments.push({
        type: action.type,
        priority: action.priority,
        status: 'done',
      });

    } catch (err) {
      execResult.adjustments.push({
        type: action.type,
        priority: action.priority,
        status: 'error',
        error: err.message,
      });
    }
  }

  return execResult;
}

/**
 * Resume un snapshot para logging compacto
 */
function summarizeSnapshot(snapshot) {
  return {
    appCount: snapshot.apps?.length || 0,
    batteryLevel: snapshot.battery?.level || 'unknown',
    temperature: snapshot.temperature,
    processCount: snapshot.processes?.length || 0,
    topApps: (snapshot.usageStats || []).slice(0, 5).map(a => a.package),
  };
}

module.exports = { smartOptimization };
