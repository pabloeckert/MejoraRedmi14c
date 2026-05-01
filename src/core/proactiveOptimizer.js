/**
 * Proactive Optimizer - Optimización proactiva
 * Ejecuta optimizaciones antes de que los problemas aparezcan
 * Basado en predicciones del FailurePredictor y análisis de tendencias
 */

const adb = require('../adb/adbClient');
const logManager = require('../logs/logManager');
const { FailurePredictor } = require('../ml/failurePredictor');
const { AdaptiveOptimizer } = require('../ml/adaptiveOptimizer');

class ProactiveOptimizer {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.failurePredictor = new FailurePredictor(deviceId);
    this.adaptiveOptimizer = new AdaptiveOptimizer(deviceId);
    this.lastProactiveRun = null;
    this.cooldownMs = 30 * 60 * 1000; // 30 minutos entre ejecuciones proactivas
  }

  /**
   * Ejecuta análisis proactivo completo
   * Retorna las acciones proactivas recomendadas o ejecutadas
   */
  async analyze() {
    // Verificar cooldown
    if (this.lastProactiveRun && (Date.now() - this.lastProactiveRun) < this.cooldownMs) {
      return {
        executed: false,
        reason: 'Cooldown activo',
        nextAvailable: new Date(this.lastProactiveRun + this.cooldownMs).toISOString(),
      };
    }

    const result = {
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      predictions: [],
      proactiveActions: [],
      executed: false,
      summary: '',
    };

    // ── Paso 1: Obtener predicciones de fallo ──
    const predictions = await this.failurePredictor.predict();
    result.predictions = predictions.predictions;

    // ── Paso 2: Analizar tendencias actuales ──
    const currentTrends = await this._analyzeCurrentTrends();

    // ── Paso 3: Generar acciones proactivas ──
    const actions = this._generateProactiveActions(predictions.predictions, currentTrends);
    result.proactiveActions = actions;

    // ── Paso 4: Determinar si se debe ejecutar automáticamente ──
    const shouldAutoExecute = this._shouldAutoExecute(actions);

    if (shouldAutoExecute) {
      result.executed = true;
      result.executionResults = await this._executeProactiveActions(actions);
      this.lastProactiveRun = Date.now();
    }

    // ── Resumen ──
    const criticalCount = actions.filter(a => a.urgency === 'critical').length;
    const preventableCount = actions.filter(a => a.preventable).length;

    result.summary = actions.length === 0
      ? '✅ Sin necesidad de acciones proactivas'
      : `${actions.length} acciones proactivas identificadas (${criticalCount} críticas, ${preventableCount} prevenibles)`;

    return result;
  }

  /**
   * Ejecuta solo las acciones proactivas de un tipo específico
   */
  async executeSpecific(actionType) {
    const analysis = await this.analyze();
    const targetAction = analysis.proactiveActions.find(a => a.type === actionType);

    if (!targetAction) {
      return { success: false, error: `Acción '${actionType}' no encontrada o no necesaria` };
    }

    return await this._executeSingleAction(targetAction);
  }

  /**
   * Analiza tendencias actuales del dispositivo
   */
  async _analyzeCurrentTrends() {
    const trends = {
      batteryDraining: false,
      temperatureRising: false,
      processesGrowing: false,
      memoryDeclining: false,
      storageFilling: false,
    };

    try {
      const logs = await logManager.getLogs(this.deviceId);
      const snapshots = logs.filter(l => l.type === 'snapshot').slice(-10);

      if (snapshots.length < 2) return trends;

      // Tendencia de batería
      const batteryLevels = snapshots
        .filter(s => s.battery?.level)
        .map(s => parseInt(s.battery.level));
      if (batteryLevels.length >= 3) {
        const recent = batteryLevels.slice(-3);
        trends.batteryDraining = recent[0] > recent[recent.length - 1] &&
          (recent[0] - recent[recent.length - 1]) > 5;
      }

      // Tendencia de temperatura
      const temps = snapshots
        .filter(s => s.temperature != null)
        .map(s => s.temperature);
      if (temps.length >= 3) {
        const recent = temps.slice(-3);
        trends.temperatureRising = recent[recent.length - 1] > recent[0] &&
          (recent[recent.length - 1] - recent[0]) > 2;
      }

      // Tendencia de procesos
      const procCounts = snapshots
        .filter(s => s.processes?.length)
        .map(s => s.processes.length);
      if (procCounts.length >= 3) {
        const recent = procCounts.slice(-3);
        trends.processesGrowing = recent[recent.length - 1] > recent[0] * 1.2;
      }

    } catch (err) {
      console.warn('[PROACTIVE] Error analizando tendencias:', err.message);
    }

    return trends;
  }

  /**
   * Genera lista de acciones proactivas basadas en predicciones y tendencias
   */
  _generateProactiveActions(predictions, trends) {
    const actions = [];

    // ── Basadas en predicciones de fallo ──
    for (const pred of predictions) {
      switch (pred.id) {
        case 'battery_critical':
          actions.push({
            type: 'battery_protection',
            label: 'Protección de batería',
            icon: '🔋',
            urgency: pred.urgency,
            preventable: true,
            description: 'Activar optimizaciones de batería antes del nivel crítico',
            commands: [
              'pm trim-caches 128M',
              'settings put global low_power 1',
            ],
            impact: 'Extiende vida de batería ~15-30%',
          });
          break;

        case 'thermal_shutdown':
          actions.push({
            type: 'thermal_prevention',
            label: 'Prevención térmica',
            icon: '🌡️',
            urgency: pred.urgency,
            preventable: true,
            description: 'Reducir carga térmica antes de alcanzar temperatura crítica',
            commands: [
              'settings put global animation_scale 0',
            ],
            heavyApps: ['com.facebook.katana', 'com.instagram.android', 'com.zhiliaoapp.musically'],
            impact: 'Reduce temperatura ~3-5°C',
          });
          break;

        case 'storage_full':
          actions.push({
            type: 'storage_cleanup',
            label: 'Limpieza de almacenamiento',
            icon: '💾',
            urgency: pred.urgency,
            preventable: true,
            description: 'Liberar espacio antes de que se agote',
            commands: [
              'pm trim-caches 512M',
              'rm -rf /data/local/tmp/*',
            ],
            impact: 'Libera 200MB-1GB de espacio',
          });
          break;

        case 'process_explosion':
          actions.push({
            type: 'process_prevention',
            label: 'Control de procesos',
            icon: '⚙️',
            urgency: pred.urgency,
            preventable: true,
            description: 'Limitar crecimiento de procesos antes de degradación',
            commands: [],
            killBackground: true,
            impact: 'Mantiene procesos bajo control',
          });
          break;

        case 'memory_exhaustion':
          actions.push({
            type: 'memory_prevention',
            label: 'Prevención de agotamiento de memoria',
            icon: '🧠',
            urgency: pred.urgency,
            preventable: true,
            description: 'Liberar memoria antes de degradación severa',
            commands: [
              'echo 3 > /proc/sys/vm/drop_caches',
            ],
            impact: 'Recupera 10-30% de memoria',
          });
          break;

        case 'battery_degradation':
          actions.push({
            type: 'battery_recalibration',
            label: 'Recalibración de batería',
            icon: '📉',
            urgency: pred.urgency,
            preventable: false,
            description: 'Nota informativa sobre degradación de batería',
            commands: [],
            impact: 'Informativo — requiere intervención del usuario',
          });
          break;
      }
    }

    // ── Basadas en tendencias (sin predicción de fallo aún) ──
    if (trends.batteryDraining && !actions.find(a => a.type === 'battery_protection')) {
      actions.push({
        type: 'battery_optimization',
        label: 'Optimización de batería (tendencia)',
        icon: '🔋',
        urgency: 'medium',
        preventable: true,
        description: 'Tendencia negativa de batería detectada',
        commands: ['pm trim-caches 128M'],
        impact: 'Mitiga drenaje excesivo',
      });
    }

    if (trends.temperatureRising && !actions.find(a => a.type === 'thermal_prevention')) {
      actions.push({
        type: 'thermal_optimization',
        label: 'Enfriamiento proactivo',
        icon: '🌡️',
        urgency: 'medium',
        preventable: true,
        description: 'Temperatura en tendencia ascendente',
        commands: ['settings put global animation_scale 0.5'],
        impact: 'Reduce carga térmica progresiva',
      });
    }

    if (trends.processesGrowing && !actions.find(a => a.type === 'process_prevention')) {
      actions.push({
        type: 'process_optimization',
        label: 'Control proactivo de procesos',
        icon: '⚙️',
        urgency: 'medium',
        preventable: true,
        description: 'Cantidad de procesos en crecimiento',
        commands: [],
        killBackground: true,
        impact: 'Previene acumulación de procesos',
      });
    }

    return actions;
  }

  /**
   * Determina si las acciones deben ejecutarse automáticamente
   */
  _shouldAutoExecute(actions) {
    // Auto-ejecutar solo si hay acciones críticas prevenibles
    return actions.some(a => a.urgency === 'critical' && a.preventable);
  }

  /**
   * Ejecuta todas las acciones proactivas
   */
  async _executeProactiveActions(actions) {
    const results = [];

    for (const action of actions) {
      if (!action.preventable) {
        results.push({ type: action.type, status: 'skipped', reason: 'No prevenible automáticamente' });
        continue;
      }

      const result = await this._executeSingleAction(action);
      results.push(result);
    }

    return results;
  }

  /**
   * Ejecuta una acción proactiva individual
   */
  async _executeSingleAction(action) {
    const result = { type: action.type, status: 'pending', actions: [] };

    try {
      // Ejecutar comandos shell
      for (const cmd of (action.commands || [])) {
        try {
          await adb.shell(this.deviceId, cmd);
          result.actions.push(`✅ ${cmd}`);
        } catch (err) {
          result.actions.push(`❌ ${cmd}: ${err.message}`);
        }
      }

      // Matar apps pesadas si está configurado
      if (action.heavyApps) {
        for (const app of action.heavyApps) {
          try {
            await adb.forceStop(this.deviceId, app);
            result.actions.push(`✅ Detenida: ${app.split('.').pop()}`);
          } catch (err) {
            result.actions.push(`⚠️ ${app.split('.').pop()}: ${err.message}`);
          }
        }
      }

      // Matar procesos en background si está configurado
      if (action.killBackground) {
        try {
          const processes = await adb.getRunningProcesses(this.deviceId);
          const killable = processes.filter(p =>
            !p.name.includes('system') &&
            !p.name.includes('launcher') &&
            !p.name.includes('phone')
          );
          for (const proc of killable.slice(0, 15)) {
            try { await adb.shell(this.deviceId, `kill ${proc.pid}`); } catch {}
          }
          result.actions.push(`✅ ${Math.min(killable.length, 15)} procesos terminados`);
        } catch (err) {
          result.actions.push(`⚠️ Error limpiando procesos: ${err.message}`);
        }
      }

      result.status = 'completed';
    } catch (err) {
      result.status = 'error';
      result.error = err.message;
    }

    return result;
  }
}

module.exports = { ProactiveOptimizer };
