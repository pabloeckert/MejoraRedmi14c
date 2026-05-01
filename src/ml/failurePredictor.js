/**
 * Failure Predictor - Motor de predicción de fallos
 * Analiza tendencias históricas para predecir fallos antes de que ocurran
 * Usa regresión lineal simple + umbrales adaptativos
 */

const logManager = require('../logs/logManager');
const { AdaptiveOptimizer } = require('./adaptiveOptimizer');
const { NonLinearPredictor } = require('./nonLinearPredictor');

// Horizonte de predicción (milisegundos)
const PREDICTION_HORIZON_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Tipos de fallo predecibles
const FAILURE_TYPES = {
  BATTERY_CRITICAL: {
    id: 'battery_critical',
    label: 'Batería en estado crítico',
    icon: '🔋',
    severity: 'critical',
    threshold: 15,
    description: 'La batería alcanzará un nivel crítico si la tendencia continúa',
  },
  THERMAL_SHUTDOWN: {
    id: 'thermal_shutdown',
    label: 'Riesgo de apagado por temperatura',
    icon: '🌡️',
    severity: 'critical',
    threshold: 48,
    description: 'Temperatura proyectada podría causar apagado de emergencia',
  },
  STORAGE_FULL: {
    id: 'storage_full',
    label: 'Almacenamiento casi lleno',
    icon: '💾',
    severity: 'warning',
    threshold: 95,
    description: 'El almacenamiento se llenará pronto si la tendencia continúa',
  },
  PROCESS_EXPLOSION: {
    id: 'process_explosion',
    label: 'Explosión de procesos',
    icon: '⚙️',
    severity: 'warning',
    threshold: 200,
    description: 'Cantidad de procesos creciendo sin control',
  },
  MEMORY_EXHAUSTION: {
    id: 'memory_exhaustion',
    label: 'Agotamiento de memoria',
    icon: '🧠',
    severity: 'critical',
    threshold: 5,
    description: 'Memoria disponible disminuyendo peligrosamente',
  },
  BATTERY_DEGRADATION: {
    id: 'battery_degradation',
    label: 'Degradación acelerada de batería',
    icon: '📉',
    severity: 'warning',
    threshold: null,
    description: 'La capacidad de la batería se degrada más rápido de lo normal',
  },
};

class FailurePredictor {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.adaptiveOptimizer = new AdaptiveOptimizer(deviceId);
    this.nonLinearPredictor = new NonLinearPredictor();
  }

  /**
   * Ejecuta predicción completa de fallos (lineal + no lineal)
   * @returns {Object} Predicciones con timeline y probabilidades
   */
  async predict() {
    const logs = await logManager.getLogs(this.deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot');

    if (snapshots.length < 3) {
      return {
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        predictions: [],
        nonLinearPredictions: { available: false, predictions: [] },
        confidence: 0,
        message: 'Insuficientes datos para predicciones (mínimo 3 sesiones)',
      };
    }

    await this.adaptiveOptimizer.load();

    const predictions = [];

    // ── Predicción de batería ──
    const batteryPrediction = this._predictBattery(snapshots);
    if (batteryPrediction) predictions.push(batteryPrediction);

    // ── Predicción de temperatura ──
    const thermalPrediction = this._predictThermal(snapshots);
    if (thermalPrediction) predictions.push(thermalPrediction);

    // ── Predicción de almacenamiento ──
    const storagePrediction = this._predictStorage(snapshots);
    if (storagePrediction) predictions.push(storagePrediction);

    // ── Predicción de procesos ──
    const processPrediction = this._predictProcessGrowth(snapshots);
    if (processPrediction) predictions.push(processPrediction);

    // ── Predicción de memoria ──
    const memoryPrediction = this._predictMemory(snapshots);
    if (memoryPrediction) predictions.push(memoryPrediction);

    // ── Predicción de degradación de batería ──
    const degradationPrediction = this._predictBatteryDegradation(snapshots);
    if (degradationPrediction) predictions.push(degradationPrediction);

    // ── Predicciones no lineales (Ciclo 6) ──
    let nonLinearPredictions = { available: false, predictions: [] };
    try {
      nonLinearPredictions = await this.nonLinearPredictor.predict(snapshots);
    } catch (err) {
      console.warn('[FAILURE] Error en predicciones no lineales:', err.message);
    }

    // ── Calcular confianza global ──
    const confidence = this._calculateConfidence(snapshots);

    // ── Ordenar por urgencia ──
    predictions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4);
    });

    return {
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      predictions,
      nonLinearPredictions,
      totalPredictions: predictions.length + (nonLinearPredictions.predictions?.length || 0),
      criticalPredictions: predictions.filter(p => p.urgency === 'critical').length +
        (nonLinearPredictions.predictions?.filter(p => p.urgency === 'critical').length || 0),
      confidence,
      dataPoints: snapshots.length,
      horizon: '7 días',
    };
  }

  /**
   * Predicción de nivel de batería
   */
  _predictBattery(snapshots) {
    const levels = snapshots
      .filter(s => s.battery?.level)
      .map((s, i) => ({ x: i, y: parseInt(s.battery.level) }));

    if (levels.length < 3) return null;

    const regression = this._linearRegression(levels);
    const sessionsUntilCritical = Math.ceil(
      (regression.slope < 0)
        ? (levels[levels.length - 1].y - FAILURE_TYPES.BATTERY_CRITICAL.threshold) / Math.abs(regression.slope)
        : Infinity
    );

    // Solo reportar si hay tendencia negativa significativa
    if (regression.slope >= -0.5) return null;

    const daysUntilCritical = this._sessionsToDays(sessionsUntilCritical, snapshots);
    const projectedLevel = Math.max(0, levels[levels.length - 1].y + regression.slope * 10);

    return {
      ...FAILURE_TYPES.BATTERY_CRITICAL,
      urgency: sessionsUntilCritical <= 3 ? 'critical' : sessionsUntilCritical <= 7 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'decreasing',
      },
      projection: {
        currentValue: levels[levels.length - 1].y,
        projectedValue: Math.round(projectedLevel),
        sessionsUntilFailure: sessionsUntilCritical,
        estimatedDays: daysUntilCritical,
      },
      recommendation: sessionsUntilCritical <= 3
        ? 'Conectar a cargador inmediatamente y reducir uso de apps pesadas'
        : 'Considerar optimización de batería y reducir brillo/servicios en background',
    };
  }

  /**
   * Predicción de temperatura
   */
  _predictThermal(snapshots) {
    const temps = snapshots
      .filter(s => s.temperature != null)
      .map((s, i) => ({ x: i, y: s.temperature }));

    if (temps.length < 3) return null;

    const regression = this._linearRegression(temps);
    const currentTemp = temps[temps.length - 1].y;

    // Solo reportar si hay tendencia al alza
    if (regression.slope <= 0.2) return null;

    const sessionsUntilThreshold = Math.ceil(
      (FAILURE_TYPES.THERMAL_SHUTDOWN.threshold - currentTemp) / regression.slope
    );
    const daysUntil = this._sessionsToDays(sessionsUntilThreshold, snapshots);

    return {
      ...FAILURE_TYPES.THERMAL_SHUTDOWN,
      urgency: currentTemp > 42 ? 'critical' : sessionsUntilThreshold <= 5 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'increasing',
      },
      projection: {
        currentValue: currentTemp,
        projectedValue: Math.round((currentTemp + regression.slope * 10) * 10) / 10,
        sessionsUntilFailure: sessionsUntilThreshold,
        estimatedDays: daysUntil,
      },
      recommendation: currentTemp > 42
        ? 'Cerrar apps pesadas inmediatamente. El dispositivo está sobrecalentándose.'
        : 'Reducir carga de CPU, evitar gaming prolongado, verificar ventilación.',
    };
  }

  /**
   * Predicción de almacenamiento
   */
  _predictStorage(snapshots) {
    const storageData = snapshots
      .filter(s => s.storage?.usedPercent != null)
      .map((s, i) => ({ x: i, y: s.storage.usedPercent }));

    if (storageData.length < 3) return null;

    const regression = this._linearRegression(storageData);
    const currentUsage = storageData[storageData.length - 1].y;

    if (regression.slope <= 0.1) return null;

    const sessionsUntilFull = Math.ceil(
      (FAILURE_TYPES.STORAGE_FULL.threshold - currentUsage) / regression.slope
    );
    const daysUntil = this._sessionsToDays(sessionsUntilFull, snapshots);

    return {
      ...FAILURE_TYPES.STORAGE_FULL,
      urgency: currentUsage > 90 ? 'critical' : sessionsUntilFull <= 10 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'increasing',
      },
      projection: {
        currentValue: currentUsage,
        projectedValue: Math.min(100, Math.round(currentUsage + regression.slope * 10)),
        sessionsUntilFailure: sessionsUntilFull,
        estimatedDays: daysUntil,
      },
      recommendation: 'Limpiar cache de apps, eliminar archivos innecesarios, desinstalar apps no usadas.',
    };
  }

  /**
   * Predicción de crecimiento de procesos
   */
  _predictProcessGrowth(snapshots) {
    const counts = snapshots
      .filter(s => s.processes?.length)
      .map((s, i) => ({ x: i, y: s.processes.length }));

    if (counts.length < 3) return null;

    const regression = this._linearRegression(counts);
    const currentCount = counts[counts.length - 1].y;

    if (regression.slope <= 1) return null;

    const sessionsUntilExplosion = Math.ceil(
      (FAILURE_TYPES.PROCESS_EXPLOSION.threshold - currentCount) / regression.slope
    );

    return {
      ...FAILURE_TYPES.PROCESS_EXPLOSION,
      urgency: currentCount > 150 ? 'critical' : sessionsUntilExplosion <= 5 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'increasing',
      },
      projection: {
        currentValue: currentCount,
        projectedValue: Math.round(currentCount + regression.slope * 10),
        sessionsUntilFailure: sessionsUntilExplosion,
        estimatedDays: this._sessionsToDays(sessionsUntilExplosion, snapshots),
      },
      recommendation: 'Identificar apps con fugas de procesos, forzar cierre de apps en background.',
    };
  }

  /**
   * Predicción de memoria disponible
   */
  _predictMemory(snapshots) {
    const memData = snapshots
      .filter(s => s.memory?.availablePercent != null)
      .map((s, i) => ({ x: i, y: s.memory.availablePercent }));

    if (memData.length < 3) return null;

    const regression = this._linearRegression(memData);
    const currentMem = memData[memData.length - 1].y;

    // Solo si la memoria está disminuyendo
    if (regression.slope >= -0.3) return null;

    const sessionsUntilCritical = Math.ceil(
      (currentMem - FAILURE_TYPES.MEMORY_EXHAUSTION.threshold) / Math.abs(regression.slope)
    );

    return {
      ...FAILURE_TYPES.MEMORY_EXHAUSTION,
      urgency: currentMem < 10 ? 'critical' : sessionsUntilCritical <= 5 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'decreasing',
      },
      projection: {
        currentValue: currentMem,
        projectedValue: Math.max(0, Math.round(currentMem + regression.slope * 10)),
        sessionsUntilFailure: sessionsUntilCritical,
        estimatedDays: this._sessionsToDays(sessionsUntilCritical, snapshots),
      },
      recommendation: 'Cerrar apps en background, reducir widgets activos, reiniciar dispositivo periódicamente.',
    };
  }

  /**
   * Predicción de degradación de batería (capacidad vs historial)
   */
  _predictBatteryDegradation(snapshots) {
    // Comparar niveles máximos alcanzados entre sesiones
    const maxLevels = [];
    let sessionMax = 0;

    for (const s of snapshots) {
      if (s.battery?.level) {
        const level = parseInt(s.battery.level);
        if (level > sessionMax) sessionMax = level;
        // Nuevo grupo de sesiones (nivel alto = recién cargado)
        if (level > 80) {
          maxLevels.push({ x: maxLevels.length, y: level });
        }
      }
    }

    if (maxLevels.length < 3) return null;

    const regression = this._linearRegression(maxLevels);

    // Degradación significativa: pierde más de 1% de capacidad máxima por grupo de sesiones
    if (regression.slope >= -1) return null;

    return {
      ...FAILURE_TYPES.BATTERY_DEGRADATION,
      urgency: regression.slope < -3 ? 'critical' : regression.slope < -2 ? 'high' : 'medium',
      trend: {
        slope: regression.slope,
        r2: regression.r2,
        direction: 'degrading',
      },
      projection: {
        currentValue: maxLevels[maxLevels.length - 1].y,
        projectedValue: Math.max(50, Math.round(maxLevels[maxLevels.length - 1].y + regression.slope * 5)),
        unit: '% capacidad máxima',
      },
      recommendation: 'Evitar ciclos completos de carga (0-100%). Mantener entre 20-80%. Considerar recalibración de batería.',
    };
  }

  /**
   * Regresión lineal simple (mínimos cuadrados)
   */
  _linearRegression(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² (coeficiente de determinación)
    const meanY = sumY / n;
    let ssRes = 0, ssTot = 0;
    for (const p of points) {
      const predicted = slope * p.x + intercept;
      ssRes += (p.y - predicted) ** 2;
      ssTot += (p.y - meanY) ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, r2 };
  }

  /**
   * Convierte cantidad de sesiones a días estimados
   * Asume ~1 conexión cada 2 días en promedio
   */
  _sessionsToDays(sessions, snapshots) {
    if (snapshots.length < 2) return sessions * 2;

    // Calcular frecuencia real de conexiones
    const timestamps = snapshots.map(s => new Date(s.timestamp).getTime());
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgIntervalDays = avgIntervalMs / (24 * 60 * 60 * 1000);

    return Math.round(sessions * avgIntervalDays);
  }

  /**
   * Calcula confianza basada en cantidad y calidad de datos
   */
  _calculateConfidence(snapshots) {
    const dataPoints = snapshots.length;
    // Más datos = más confianza, saturando en 20
    const quantityScore = Math.min(dataPoints / 20, 1);

    // Verificar consistencia temporal
    const timestamps = snapshots.map(s => new Date(s.timestamp).getTime());
    const hasRecentData = (Date.now() - timestamps[timestamps.length - 1]) < 7 * 24 * 60 * 60 * 1000;
    const recencyScore = hasRecentData ? 1 : 0.5;

    return Math.round(quantityScore * recencyScore * 100) / 100;
  }

  /**
   * Obtiene un resumen rápido de salud proyectada
   */
  async getHealthForecast() {
    const prediction = await this.predict();
    const risks = prediction.predictions.filter(p => p.urgency === 'critical' || p.urgency === 'high');

    let overallRisk = 'low';
    if (risks.some(r => r.urgency === 'critical')) overallRisk = 'critical';
    else if (risks.length >= 2) overallRisk = 'high';
    else if (risks.length === 1) overallRisk = 'medium';

    return {
      overallRisk,
      riskCount: risks.length,
      totalChecked: Object.keys(FAILURE_TYPES).length,
      nextIssue: risks[0] || null,
      confidence: prediction.confidence,
      summary: risks.length === 0
        ? 'Sin riesgos detectados en el horizonte de 7 días'
        : `${risks.length} riesgo${risks.length > 1 ? 's' : ''} detectado${risks.length > 1 ? 's' : ''}: ${risks.map(r => r.label).join(', ')}`,
    };
  }
}

module.exports = { FailurePredictor, FAILURE_TYPES };
