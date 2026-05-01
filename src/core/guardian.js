/**
 * Guardian Mode - Protección continua del dispositivo
 * Loop de monitoreo cada 30s: predicciones + anomalías + temperatura + procesos
 * Si detecta riesgo: notifica, optimiza, registra
 */

const logManager = require('../logs/logManager');
const { FailurePredictor } = require('../ml/failurePredictor');
const { NonLinearPredictor } = require('../ml/nonLinearPredictor');
const { AnomalyDetector } = require('../ml/anomalyDetector');
const { sendNotification } = require('../ui/notifications');
const { ProactiveOptimizer } = require('./proactiveOptimizer');
const turboMode = require('./turboMode');
const errorHandler = require('./errorHandler');

const GUARDIAN_INTERVAL = 30000; // 30 segundos
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos entre alertas del mismo tipo
const CRITICAL_ESCALATION_THRESHOLD = 3; // 3 alertas críticas → activar turbo

class Guardian {
  constructor() {
    this.active = false;
    this.devices = new Map(); // deviceId → { timer, alertHistory, stats }
    this.onStatusChange = null;
    this.globalStats = {
      totalChecks: 0,
      totalAlerts: 0,
      totalOptimizations: 0,
      startedAt: null,
    };
  }

  /**
   * Activa el Modo Guardian para un dispositivo
   */
  start(deviceId) {
    if (this.devices.has(deviceId)) return;

    const state = {
      timer: null,
      alertHistory: new Map(), // type → lastAlertTime
      criticalCount: 0,
      lastCheck: null,
      stats: { checks: 0, alerts: 0, optimizations: 0 },
    };

    this.devices.set(deviceId, state);
    this.active = true;
    this.globalStats.startedAt = this.globalStats.startedAt || new Date().toISOString();

    console.log(`[GUARDIAN] 🛡️ Activado para ${deviceId}`);
    this._notifyUI('started', `Guardian activo para ${deviceId}`);
    this._check(deviceId);

    return { success: true, message: `Guardian activo para ${deviceId}` };
  }

  /**
   * Desactiva el Modo Guardian para un dispositivo
   */
  stop(deviceId) {
    const state = this.devices.get(deviceId);
    if (!state) return { success: false, error: 'Guardian no activo para este dispositivo' };

    if (state.timer) clearTimeout(state.timer);
    this.devices.delete(deviceId);

    if (this.devices.size === 0) {
      this.active = false;
      this.globalStats.startedAt = null;
    }

    console.log(`[GUARDIAN] 🛡️ Desactivado para ${deviceId}`);
    this._notifyUI('stopped', `Guardian desactivado para ${deviceId}`);

    return { success: true, message: `Guardian desactivado para ${deviceId}` };
  }

  /**
   * Desactiva Guardian para todos los dispositivos
   */
  stopAll() {
    for (const [deviceId, state] of this.devices) {
      if (state.timer) clearTimeout(state.timer);
    }
    this.devices.clear();
    this.active = false;
    this.globalStats.startedAt = null;
    console.log('[GUARDIAN] 🛡️ Desactivado para todos los dispositivos');
    this._notifyUI('stopped_all', 'Guardian desactivado globalmente');
  }

  /**
   * Verifica si Guardian está activo para un dispositivo
   */
  isActive(deviceId) {
    return this.devices.has(deviceId);
  }

  /**
   * Obtiene estado del Guardian
   */
  getStatus(deviceId) {
    if (deviceId) {
      const state = this.devices.get(deviceId);
      if (!state) return { active: false };
      return {
        active: true,
        checks: state.stats.checks,
        alerts: state.stats.alerts,
        optimizations: state.stats.optimizations,
        criticalCount: state.criticalCount,
        lastCheck: state.lastCheck,
      };
    }

    // Estado global
    return {
      active: this.active,
      deviceCount: this.devices.size,
      devices: Array.from(this.devices.keys()),
      globalStats: this.globalStats,
    };
  }

  // ════════════════════════════════════════════════════
  //  Loop de verificación
  // ════════════════════════════════════════════════════

  async _check(deviceId) {
    const state = this.devices.get(deviceId);
    if (!state || !this.active) return;

    try {
      state.lastCheck = new Date().toISOString();
      state.stats.checks++;
      this.globalStats.totalChecks++;

      // ── 1. Obtener datos del dispositivo ──
      const logs = await logManager.getLogs(deviceId);
      const snapshots = logs.filter(l => l.type === 'snapshot');
      if (snapshots.length === 0) {
        this._scheduleNext(deviceId);
        return;
      }

      const lastSnapshot = snapshots[snapshots.length - 1];

      // ── 2. Verificar temperatura actual ──
      const tempAlerts = this._checkTemperature(lastSnapshot, state);

      // ── 3. Verificar procesos actuales ──
      const procAlerts = this._checkProcesses(lastSnapshot, state);

      // ── 4. Verificar batería actual ──
      const batteryAlerts = this._checkBattery(lastSnapshot, state);

      // ── 5. Verificar almacenamiento ──
      const storageAlerts = this._checkStorage(lastSnapshot, state);

      // ── 6. Ejecutar predicciones de fallo ──
      const predictor = new FailurePredictor(deviceId);
      let failurePredictions = { predictions: [] };
      try {
        failurePredictions = await predictor.predict();
      } catch {}

      // ── 7. Ejecutar predicciones no lineales ──
      const nlPredictor = new NonLinearPredictor();
      let nlPredictions = { predictions: [] };
      try {
        nlPredictions = await nlPredictor.predict(snapshots);
      } catch {}

      // ── 8. Detectar anomalías ──
      const detector = new AnomalyDetector(deviceId);
      let anomalies = { anomalies: [] };
      try {
        anomalies = await detector.detect();
      } catch {}

      // ── 9. Consolidar alertas ──
      const allAlerts = [
        ...tempAlerts,
        ...procAlerts,
        ...batteryAlerts,
        ...storageAlerts,
      ];

      // Agregar alertas de predicciones críticas
      for (const pred of failurePredictions.predictions) {
        if (pred.urgency === 'critical' || pred.urgency === 'high') {
          allAlerts.push({
            type: `prediction_${pred.id}`,
            severity: pred.urgency,
            message: `Predicción: ${pred.label} — ${pred.recommendation}`,
            icon: pred.icon,
            source: 'prediction',
          });
        }
      }

      // Agregar alertas de predicciones no lineales críticas
      for (const pred of (nlPredictions.predictions || [])) {
        if (pred.projection?.willReachCritical && (pred.urgency === 'critical' || pred.urgency === 'high')) {
          allAlerts.push({
            type: `nl_prediction_${pred.metric}`,
            severity: pred.urgency,
            message: `Modelo polinómico: ${pred.label} alcanzará ${pred.projection.criticalThreshold}${pred.unit} en ~${pred.projection.stepsUntilCritical} pasos`,
            icon: '📐',
            source: 'nonlinear_prediction',
          });
        }
      }

      // Agregar anomalías críticas
      for (const anom of anomalies.anomalies || []) {
        if (anom.severity === 'critical') {
          allAlerts.push({
            type: `anomaly_${anom.type}`,
            severity: 'critical',
            message: anom.message,
            icon: '🔴',
            source: 'anomaly',
          });
        }
      }

      // ── 10. Procesar alertas ──
      for (const alert of allAlerts) {
        await this._processAlert(deviceId, alert, state);
      }

      // ── 11. Escalación: si muchas alertas críticas → activar turbo ──
      if (state.criticalCount >= CRITICAL_ESCALATION_THRESHOLD) {
        await this._escalateToTurbo(deviceId, state);
      }

      // ── 12. Registrar en logs ──
      await logManager.logOptimization(deviceId, {
        type: 'guardian_check',
        timestamp: new Date().toISOString(),
        alerts: allAlerts.length,
        criticalAlerts: allAlerts.filter(a => a.severity === 'critical').length,
        predictions: failurePredictions.predictions.length,
        nlPredictions: (nlPredictions.predictions || []).length,
        anomalies: (anomalies.anomalies || []).length,
      });

      this._notifyUI('check', `Guardian check: ${allAlerts.length} alertas (${allAlerts.filter(a => a.severity === 'critical').length} críticas)`);

    } catch (err) {
      errorHandler.handle(err, 'guardian.check');
    }

    this._scheduleNext(deviceId);
  }

  _scheduleNext(deviceId) {
    const state = this.devices.get(deviceId);
    if (state && this.active) {
      state.timer = setTimeout(() => this._check(deviceId), GUARDIAN_INTERVAL);
    }
  }

  // ════════════════════════════════════════════════════
  //  Verificaciones específicas
  // ════════════════════════════════════════════════════

  _checkTemperature(snapshot, state) {
    const alerts = [];
    if (snapshot.temperature == null) return alerts;

    const temp = snapshot.temperature;
    if (temp > 45) {
      alerts.push({
        type: 'temp_critical',
        severity: 'critical',
        message: `Temperatura crítica: ${temp.toFixed(1)}°C — Riesgo de apagado`,
        icon: '🌡️',
        source: 'realtime',
      });
    } else if (temp > 42) {
      alerts.push({
        type: 'temp_high',
        severity: 'high',
        message: `Temperatura alta: ${temp.toFixed(1)}°C — Reducir carga`,
        icon: '🌡️',
        source: 'realtime',
      });
    }
    return alerts;
  }

  _checkProcesses(snapshot, state) {
    const alerts = [];
    if (!snapshot.processes?.length) return alerts;

    const count = snapshot.processes.length;
    if (count > 180) {
      alerts.push({
        type: 'proc_critical',
        severity: 'critical',
        message: `Explosión de procesos: ${count} activos — Sistema degradado`,
        icon: '⚙️',
        source: 'realtime',
      });
    } else if (count > 120) {
      alerts.push({
        type: 'proc_high',
        severity: 'high',
        message: `Muchos procesos: ${count} activos — Posible degradación`,
        icon: '⚙️',
        source: 'realtime',
      });
    }
    return alerts;
  }

  _checkBattery(snapshot, state) {
    const alerts = [];
    if (!snapshot.battery?.level) return alerts;

    const level = parseInt(snapshot.battery.level);
    if (level < 10) {
      alerts.push({
        type: 'battery_critical',
        severity: 'critical',
        message: `Batería crítica: ${level}% — Cargar inmediatamente`,
        icon: '🔋',
        source: 'realtime',
      });
    } else if (level < 15) {
      alerts.push({
        type: 'battery_low',
        severity: 'high',
        message: `Batería baja: ${level}% — Activar ahorro`,
        icon: '🔋',
        source: 'realtime',
      });
    }
    return alerts;
  }

  _checkStorage(snapshot, state) {
    const alerts = [];
    if (!snapshot.storage?.usedPercent) return alerts;

    const used = snapshot.storage.usedPercent;
    if (used > 95) {
      alerts.push({
        type: 'storage_critical',
        severity: 'critical',
        message: `Almacenamiento casi lleno: ${used.toFixed(1)}% — Liberar espacio`,
        icon: '💾',
        source: 'realtime',
      });
    } else if (used > 90) {
      alerts.push({
        type: 'storage_high',
        severity: 'high',
        message: `Almacenamiento alto: ${used.toFixed(1)}% — Considerar limpieza`,
        icon: '💾',
        source: 'realtime',
      });
    }
    return alerts;
  }

  // ════════════════════════════════════════════════════
  //  Procesamiento de alertas
  // ════════════════════════════════════════════════════

  async _processAlert(deviceId, alert, state) {
    // Verificar cooldown para este tipo de alerta
    const lastAlert = state.alertHistory.get(alert.type);
    if (lastAlert && (Date.now() - lastAlert) < ALERT_COOLDOWN) {
      return; // En cooldown
    }

    state.alertHistory.set(alert.type, Date.now());
    state.stats.alerts++;
    this.globalStats.totalAlerts++;

    if (alert.severity === 'critical') {
      state.criticalCount++;
    }

    // Enviar notificación
    sendNotification({
      title: `${alert.icon || '⚠️'} Guardian Alert`,
      body: alert.message,
      type: alert.severity === 'critical' ? 'error' : 'warning',
    });

    console.log(`[GUARDIAN] Alerta [${alert.severity}]: ${alert.message}`);

    // Si es crítico y prevenible, intentar optimización proactiva
    if (alert.severity === 'critical' && alert.source !== 'anomaly') {
      try {
        const proactive = new ProactiveOptimizer(deviceId);
        const result = await proactive.analyze();

        if (result.executed) {
          state.stats.optimizations++;
          this.globalStats.totalOptimizations++;

          sendNotification({
            title: '🛡️ Guardian: Optimización automática',
            body: `Se ejecutó optimización proactiva: ${result.summary}`,
            type: 'success',
          });
        }
      } catch (err) {
        console.warn('[GUARDIAN] Error en optimización proactiva:', err.message);
      }
    }
  }

  /**
   * Escalación: activar Modo Turbo cuando hay muchas alertas críticas
   */
  async _escalateToTurbo(deviceId, state) {
    // Verificar que no se haya escalado recientemente (1 hora cooldown)
    const lastEscalation = state.alertHistory.get('turbo_escalation');
    if (lastEscalation && (Date.now() - lastEscalation) < 3600000) return;

    state.alertHistory.set('turbo_escalation', Date.now());

    console.log(`[GUARDIAN] 🚨 Escalando a Modo Turbo para ${deviceId} (${state.criticalCount} alertas críticas)`);

    try {
      const result = await turboMode.activate(deviceId, { aggressive: false });

      sendNotification({
        title: '🚨 Guardian: Modo Turbo activado',
        body: `${state.criticalCount} alertas críticas acumuladas. Se activó Modo Turbo para estabilizar el dispositivo.`,
        type: 'error',
      });

      // Resetear contador
      state.criticalCount = 0;

      this._notifyUI('turbo_escalation', `Turbo activado por escalación: ${result.totalActions} acciones`);

    } catch (err) {
      errorHandler.handle(err, 'guardian.turbo_escalation');
    }
  }

  /**
   * Callback para UI
   */
  _notifyUI(status, message) {
    if (this.onStatusChange) {
      this.onStatusChange({ status, message, timestamp: new Date().toISOString() });
    }
  }
}

module.exports = new Guardian();
