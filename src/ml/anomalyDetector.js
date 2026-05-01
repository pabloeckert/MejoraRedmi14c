/**
 * Anomaly Detector - Motor de detección de anomalías
 * Detecta comportamientos anómalos usando estadísticas
 */

const logManager = require('../logs/logManager');

class AnomalyDetector {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.thresholds = {
      batteryDrainSpike: 15,      // >15% en una sesión = anómalo
      tempSpike: 42,              // >42°C = anómalo
      processSpike: 150,          // >150 procesos = anómalo
      tempStdDevMultiplier: 2,   // 2x desviación estándar
      batteryStdDevMultiplier: 2,
      processStdDevMultiplier: 2.5,
    };
  }

  /**
   * Ejecuta detección completa de anomalías
   */
  async detect(currentSnapshot = null) {
    const anomalies = [];
    const logs = await logManager.getLogs(this.deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot');

    // ── Anomalías de batería ──
    const batteryAnomalies = this._detectBatteryAnomalies(snapshots, currentSnapshot);
    anomalies.push(...batteryAnomalies);

    // ── Anomalías de temperatura ──
    const tempAnomalies = this._detectTemperatureAnomalies(snapshots, currentSnapshot);
    anomalies.push(...tempAnomalies);

    // ── Anomalías de procesos ──
    const processAnomalies = this._detectProcessAnomalies(snapshots, currentSnapshot);
    anomalies.push(...processAnomalies);

    // ── Apps con consumo excesivo ──
    const appAnomalies = this._detectAppAnomalies(snapshots);
    anomalies.push(...appAnomalies);

    // ── Comportamientos anómalos generales ──
    const behaviorAnomalies = this._detectBehaviorAnomalies(snapshots);
    anomalies.push(...behaviorAnomalies);

    return {
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      totalAnomalies: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'critical').length,
      warning: anomalies.filter(a => a.severity === 'warning').length,
      anomalies,
    };
  }

  /**
   * Anomalías de batería
   */
  _detectBatteryAnomalies(snapshots, current) {
    const anomalies = [];
    const levels = snapshots
      .filter(s => s.battery?.level)
      .map(s => parseInt(s.battery.level));

    if (levels.length < 3) return anomalies;

    // Spike: caída repentina
    for (let i = 1; i < levels.length; i++) {
      const drop = levels[i - 1] - levels[i];
      if (drop > this.thresholds.batteryDrainSpike) {
        anomalies.push({
          type: 'battery_spike',
          severity: drop > 25 ? 'critical' : 'warning',
          message: `Caída repentina de batería: ${drop}% entre sesiones`,
          value: drop,
          threshold: this.thresholds.batteryDrainSpike,
        });
      }
    }

    // Desviación estándar
    const stats = this._calcStats(levels);
    if (current?.battery?.level) {
      const currentLevel = parseInt(current.battery.level);
      const zScore = Math.abs((currentLevel - stats.mean) / (stats.stdDev || 1));
      if (zScore > this.thresholds.batteryStdDevMultiplier) {
        anomalies.push({
          type: 'battery_outlier',
          severity: 'warning',
          message: `Nivel de batería inusual: ${currentLevel}% (promedio: ${stats.mean.toFixed(0)}%)`,
          value: currentLevel,
          zScore,
        });
      }
    }

    return anomalies;
  }

  /**
   * Anomalías de temperatura
   */
  _detectTemperatureAnomalies(snapshots, current) {
    const anomalies = [];
    const temps = snapshots
      .filter(s => s.temperature != null)
      .map(s => s.temperature);

    if (temps.length < 3) return anomalies;

    // Spike térmico
    const currentTemp = current?.temperature ?? temps[temps.length - 1];
    if (currentTemp > this.thresholds.tempSpike) {
      anomalies.push({
        type: 'thermal_spike',
        severity: currentTemp > 45 ? 'critical' : 'warning',
        message: `Temperatura elevada: ${currentTemp.toFixed(1)}°C`,
        value: currentTemp,
        threshold: this.thresholds.tempSpike,
      });
    }

    // Outlier estadístico
    const stats = this._calcStats(temps);
    if (currentTemp != null) {
      const zScore = Math.abs((currentTemp - stats.mean) / (stats.stdDev || 1));
      if (zScore > this.thresholds.tempStdDevMultiplier) {
        anomalies.push({
          type: 'thermal_outlier',
          severity: 'warning',
          message: `Temperatura inusual: ${currentTemp.toFixed(1)}°C (promedio: ${stats.mean.toFixed(1)}°C)`,
          value: currentTemp,
          zScore,
        });
      }
    }

    return anomalies;
  }

  /**
   * Anomalías de procesos
   */
  _detectProcessAnomalies(snapshots, current) {
    const anomalies = [];
    const counts = snapshots
      .filter(s => s.processes?.length)
      .map(s => s.processes.length);

    if (counts.length < 3) return anomalies;

    const currentCount = current?.processes?.length ?? counts[counts.length - 1];
    const stats = this._calcStats(counts);

    // Spike de procesos
    if (currentCount > this.thresholds.processSpike) {
      anomalies.push({
        type: 'process_spike',
        severity: currentCount > 200 ? 'critical' : 'warning',
        message: `Muchos procesos activos: ${currentCount}`,
        value: currentCount,
        threshold: this.thresholds.processSpike,
      });
    }

    // Outlier
    const zScore = Math.abs((currentCount - stats.mean) / (stats.stdDev || 1));
    if (zScore > this.thresholds.processStdDevMultiplier) {
      anomalies.push({
        type: 'process_outlier',
        severity: 'warning',
        message: `Cantidad de procesos inusual: ${currentCount} (promedio: ${stats.mean.toFixed(0)})`,
        value: currentCount,
        zScore,
      });
    }

    return anomalies;
  }

  /**
   * Apps con consumo excesivo
   */
  _detectAppAnomalies(snapshots) {
    const anomalies = [];
    const appUsage = {};

    for (const s of snapshots) {
      if (!s.usageStats) continue;
      for (const app of s.usageStats) {
        if (!appUsage[app.package]) appUsage[app.package] = [];
        appUsage[app.package].push(app.totalTimeMs);
      }
    }

    for (const [pkg, times] of Object.entries(appUsage)) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      // App con uso excesivo (>2 horas promedio)
      if (avg > 7200000) {
        anomalies.push({
          type: 'app_excessive_usage',
          severity: avg > 14400000 ? 'critical' : 'warning',
          message: `App con uso excesivo: ${pkg.split('.').pop()}`,
          value: avg,
          package: pkg,
          detail: `${(avg / 3600000).toFixed(1)}h promedio`,
        });
      }

      // Spike de uso reciente
      if (times.length >= 2) {
        const last = times[times.length - 1];
        const prev = times[times.length - 2];
        if (last > prev * 3 && last > 3600000) {
          anomalies.push({
            type: 'app_usage_spike',
            severity: 'warning',
            message: `Spike de uso en ${pkg.split('.').pop()}: ${(last / 3600000).toFixed(1)}h`,
            value: last,
            package: pkg,
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Comportamientos anómalos generales
   */
  _detectBehaviorAnomalies(snapshots) {
    const anomalies = [];

    // Degradación de batería rápida entre conexiones consecutivas
    if (snapshots.length >= 2) {
      const last = snapshots[snapshots.length - 1];
      const prev = snapshots[snapshots.length - 2];

      if (last.battery?.level && prev.battery?.level) {
        const drop = parseInt(prev.battery.level) - parseInt(last.battery.level);
        if (drop > 20) {
          anomalies.push({
            type: 'rapid_degradation',
            severity: 'critical',
            message: `Degradación rápida de batería: ${drop}% entre conexiones`,
            value: drop,
          });
        }
      }
    }

    // Servicios MIUI que se reactivaron
    // (se detecta comparando snapshots de servicios)

    return anomalies;
  }

  _calcStats(values) {
    if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return {
      mean,
      stdDev: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}

module.exports = { AnomalyDetector };
