/**
 * Device Profile - Perfil inteligente por dispositivo
 * Mantiene historial, patrones, scores y predicciones
 */

const fs = require('fs-extra');
const path = require('path');
const { AdaptiveOptimizer } = require('../ml/adaptiveOptimizer');

const DEVICES_DIR = path.join(__dirname, '..', '..', 'devices');

class DeviceProfile {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.profilePath = path.join(DEVICES_DIR, `${deviceId}_profile.json`);
    this.ml = new AdaptiveOptimizer(deviceId);
    this.data = null;
  }

  /**
   * Carga o inicializa el perfil
   */
  async load() {
    await fs.ensureDir(DEVICES_DIR);
    if (await fs.pathExists(this.profilePath)) {
      this.data = await fs.readJson(this.profilePath);
    } else {
      this.data = this._createDefaultProfile();
    }
    await this.ml.load();
    return this.data;
  }

  /**
   * Guarda el perfil
   */
  async save() {
    await fs.ensureDir(DEVICES_DIR);
    this.data.lastUpdated = new Date().toISOString();
    await fs.writeJson(this.profilePath, this.data, { spaces: 2 });
  }

  /**
   * Actualiza el perfil con datos de una nueva conexión
   */
  async updateWithSnapshot(snapshot) {
    if (!this.data) await this.load();

    // Actualizar estadísticas de batería
    if (snapshot.battery?.level) {
      const level = parseInt(snapshot.battery.level);
      this.data.batteryHistory.push({
        level,
        timestamp: new Date().toISOString(),
      });
      // Mantener últimos 100 registros
      if (this.data.batteryHistory.length > 100) {
        this.data.batteryHistory = this.data.batteryHistory.slice(-100);
      }
      this.data.avgBatteryDrain = this._calcAvgDrain(this.data.batteryHistory);
    }

    // Actualizar temperatura
    if (snapshot.temperature != null) {
      this.data.temperatureHistory.push({
        value: snapshot.temperature,
        timestamp: new Date().toISOString(),
      });
      if (this.data.temperatureHistory.length > 100) {
        this.data.temperatureHistory = this.data.temperatureHistory.slice(-100);
      }
      this.data.avgTemperature = this._calcAvg(
        this.data.temperatureHistory.map(t => t.value)
      );
    }

    // Actualizar procesos recurrentes
    if (snapshot.processes?.length) {
      this.data.totalProcessSnapshots++;
      for (const proc of snapshot.processes) {
        if (!proc.name) continue;
        if (!this.data.recurringProcesses[proc.name]) {
          this.data.recurringProcesses[proc.name] = { count: 0, lastSeen: null };
        }
        this.data.recurringProcesses[proc.name].count++;
        this.data.recurringProcesses[proc.name].lastSeen = new Date().toISOString();
      }
    }

    // Actualizar apps más usadas
    if (snapshot.usageStats?.length) {
      for (const app of snapshot.usageStats) {
        if (!this.data.topApps[app.package]) {
          this.data.topApps[app.package] = { totalTimeMs: 0, sessions: 0 };
        }
        this.data.topApps[app.package].totalTimeMs += app.totalTimeMs;
        this.data.topApps[app.package].sessions++;
      }
    }

    // Actualizar ML
    await this.ml.learn({
      batteryDrain: snapshot.battery?.level ? parseInt(snapshot.battery.level) : undefined,
      temperature: snapshot.temperature,
      processCount: snapshot.processes?.length,
      topApps: snapshot.usageStats?.slice(0, 5).map(a => a.package),
    });

    // Recalcular score de salud
    this.data.healthScore = this._calculateHealthScore();

    await this.save();
    return this.data;
  }

  /**
   * Registra una optimización en el historial
   */
  async recordOptimization(result) {
    if (!this.data) await this.load();

    this.data.optimizationHistory.push({
      timestamp: new Date().toISOString(),
      mode: result.mode,
      success: result.success,
      bloatwareRemoved: result.bloatwareRemoved || 0,
      durationMs: result.durationMs || 0,
      actionsCount: result.actions?.length || 0,
    });

    // Mantener últimos 50
    if (this.data.optimizationHistory.length > 50) {
      this.data.optimizationHistory = this.data.optimizationHistory.slice(-50);
    }

    this.data.totalOptimizations++;
    if (result.success) this.data.successfulOptimizations++;
    this.data.lastOptimization = new Date().toISOString();

    // Actualizar score después de optimización
    this.data.healthScore = this._calculateHealthScore();

    await this.save();
  }

  /**
   * Obtiene predicciones del ML
   */
  getPredictions(currentState) {
    return this.ml.predict(currentState);
  }

  /**
   * Obtiene insights inteligentes
   */
  getInsights() {
    if (!this.data) return [];

    const insights = [];

    // Apps problemáticas (alto consumo, muchas sesiones)
    const problemApps = Object.entries(this.data.topApps)
      .filter(([_, v]) => v.totalTimeMs > 3600000) // > 1 hora
      .sort((a, b) => b[1].totalTimeMs - a[1].totalTimeMs)
      .slice(0, 5);

    if (problemApps.length > 0) {
      insights.push({
        type: 'warning',
        category: 'apps',
        title: 'Apps de alto consumo',
        description: `${problemApps.length} apps consumen más de 1 hora de uso`,
        items: problemApps.map(([pkg, v]) => ({
          name: pkg,
          detail: `${(v.totalTimeMs / 3600000).toFixed(1)}h en ${v.sessions} sesiones`,
        })),
      });
    }

    // Procesos problemáticos recurrentes
    const problemProcs = Object.entries(this.data.recurringProcesses)
      .filter(([_, v]) => v.count > this.data.totalProcessSnapshots * 0.8)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    if (problemProcs.length > 0) {
      insights.push({
        type: 'info',
        category: 'processes',
        title: 'Procesos persistentes',
        description: `${problemProcs.length} procesos aparecen en más del 80% de las conexiones`,
        items: problemProcs.map(([name, v]) => ({
          name,
          detail: `Presente en ${v.count} de ${this.data.totalProcessSnapshots} snapshots`,
        })),
      });
    }

    // Temperatura alta
    if (this.data.avgTemperature > 35) {
      insights.push({
        type: 'warning',
        category: 'thermal',
        title: 'Temperatura elevada',
        description: `Promedio de ${this.data.avgTemperature.toFixed(1)}°C — considerar reducir carga`,
        items: [],
      });
    }

    // Batería
    if (this.data.avgBatteryDrain > 8) {
      insights.push({
        type: 'warning',
        category: 'battery',
        title: 'Drenaje de batería alto',
        description: `Pérdida promedio de ${this.data.avgBatteryDrain.toFixed(1)}% por conexión`,
        items: [],
      });
    }

    // Score de salud
    if (this.data.healthScore < 50) {
      insights.push({
        type: 'critical',
        category: 'health',
        title: 'Salud del dispositivo baja',
        description: `Score: ${this.data.healthScore}/100 — Se recomienda optimización completa`,
        items: [],
      });
    }

    return insights;
  }

  /**
   * Calcula score de salud (0-100)
   */
  _calculateHealthScore() {
    let score = 100;

    // Penalizar por temperatura alta
    if (this.data.avgTemperature > 40) score -= 25;
    else if (this.data.avgTemperature > 35) score -= 15;
    else if (this.data.avgTemperature > 30) score -= 5;

    // Penalizar por drenaje de batería
    if (this.data.avgBatteryDrain > 15) score -= 25;
    else if (this.data.avgBatteryDrain > 10) score -= 15;
    else if (this.data.avgBatteryDrain > 5) score -= 5;

    // Penalizar por muchos procesos recurrentes
    const procCount = Object.keys(this.data.recurringProcesses).length;
    if (procCount > 200) score -= 15;
    else if (procCount > 150) score -= 10;

    // Bonificar por optimizaciones exitosas
    if (this.data.totalOptimizations > 0) {
      const successRate = this.data.successfulOptimizations / this.data.totalOptimizations;
      if (successRate > 0.9) score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  _calcAvgDrain(history) {
    if (history.length < 2) return 0;
    let totalDrain = 0;
    for (let i = 1; i < history.length; i++) {
      const diff = history[i - 1].level - history[i].level;
      if (diff > 0) totalDrain += diff;
    }
    return totalDrain / (history.length - 1);
  }

  _calcAvg(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _createDefaultProfile() {
    return {
      deviceId: this.deviceId,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      batteryHistory: [],
      temperatureHistory: [],
      avgBatteryDrain: 0,
      avgTemperature: 25,
      recurringProcesses: {},
      totalProcessSnapshots: 0,
      topApps: {},
      optimizationHistory: [],
      totalOptimizations: 0,
      successfulOptimizations: 0,
      lastOptimization: null,
      healthScore: 100,
      version: 2,
    };
  }
}

module.exports = { DeviceProfile };
