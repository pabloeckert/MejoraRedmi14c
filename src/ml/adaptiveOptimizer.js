/**
 * ML Module - Motor de aprendizaje para optimización adaptativa
 * Analiza patrones de uso y predice necesidades de optimización
 */

const fs = require('fs-extra');
const path = require('path');

const ML_DIR = path.join(__dirname, '..', '..', 'ml');

/**
 * Modelo simple de predicción basado en histórico
 * No requiere TensorFlow/PyTorch - estadísticas Bayesianas simples
 */
class AdaptiveOptimizer {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.modelPath = path.join(ML_DIR, `${deviceId}_model.json`);
    this.model = null;
  }

  /**
   * Carga o inicializa el modelo
   */
  async load() {
    await fs.ensureDir(ML_DIR);
    if (await fs.pathExists(this.modelPath)) {
      this.model = await fs.readJson(this.modelPath);
    } else {
      this.model = this._createDefaultModel();
    }
    return this.model;
  }

  /**
   * Guarda el modelo entrenado
   */
  async save() {
    await fs.ensureDir(ML_DIR);
    await fs.writeJson(this.modelPath, this.model, { spaces: 2 });
  }

  /**
   * Actualiza el modelo con nueva observación
   */
  async learn(observation) {
    if (!this.model) await this.load();

    // Actualizar medias móviles exponenciales
    const alpha = 0.3; // Factor de aprendizaje

    if (observation.batteryDrain !== undefined) {
      this.model.batteryDrainEMA = this.model.batteryDrainEMA * (1 - alpha) +
        observation.batteryDrain * alpha;
    }

    if (observation.temperature !== undefined) {
      this.model.temperatureEMA = this.model.temperatureEMA * (1 - alpha) +
        observation.temperature * alpha;
    }

    if (observation.processCount !== undefined) {
      this.model.processCountEMA = this.model.processCountEMA * (1 - alpha) +
        observation.processCount * alpha;
    }

    // Actualizar frecuencias de apps
    if (observation.topApps) {
      for (const app of observation.topApps) {
        this.model.appFrequency[app] = (this.model.appFrequency[app] || 0) + 1;
      }
    }

    // Actualizar score de optimización
    if (observation.optimizationSuccess) {
      this.model.successCount = (this.model.successCount || 0) + 1;
    }
    this.model.totalObservations = (this.model.totalObservations || 0) + 1;

    // Actualizar timestamp
    this.model.lastUpdated = new Date().toISOString();

    await this.save();
    return this.model;
  }

  /**
   * Predice qué optimizaciones necesita
   */
  predict(currentState) {
    if (!this.model) return { actions: [], confidence: 0 };

    const predictions = {
      actions: [],
      confidence: 0,
      reasoning: [],
    };

    // Predicción de batería
    if (currentState.batteryLevel !== undefined) {
      const predictedDrain = this.model.batteryDrainEMA;
      if (predictedDrain > 5 && currentState.batteryLevel < 50) {
        predictions.actions.push({
          type: 'battery_optimization',
          urgency: predictedDrain > 10 ? 'high' : 'medium',
        });
        predictions.reasoning.push(
          `Drenaje promedio: ${predictedDrain.toFixed(1)}%/hora`
        );
      }
    }

    // Predicción de temperatura
    if (currentState.temperature !== undefined) {
      if (currentState.temperature > this.model.temperatureEMA + 3) {
        predictions.actions.push({
          type: 'thermal_throttle',
          urgency: 'medium',
        });
        predictions.reasoning.push(
          `Temperatura (${currentState.temperature}°C) por encima del promedio (${this.model.temperatureEMA.toFixed(1)}°C)`
        );
      }
    }

    // Predicción de procesos
    if (currentState.processCount !== undefined) {
      if (currentState.processCount > this.model.processCountEMA * 1.5) {
        predictions.actions.push({
          type: 'process_cleanup',
          urgency: 'medium',
        });
        predictions.reasoning.push(
          `Procesos (${currentState.processCount}) muy por encima del promedio (${this.model.processCountEMA.toFixed(0)})`
        );
      }
    }

    // Calcular confianza basada en cantidad de observaciones
    predictions.confidence = Math.min(
      this.model.totalObservations / 10,
      1.0
    );

    return predictions;
  }

  /**
   * Obtiene las apps más usadas según el modelo
   */
  getTopApps(limit = 10) {
    if (!this.model?.appFrequency) return [];
    return Object.entries(this.model.appFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([app, count]) => ({ app, frequency: count }));
  }

  _createDefaultModel() {
    return {
      deviceId: this.deviceId,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      batteryDrainEMA: 0,
      temperatureEMA: 25,
      processCountEMA: 50,
      appFrequency: {},
      successCount: 0,
      totalObservations: 0,
      version: 1,
    };
  }
}

module.exports = { AdaptiveOptimizer };
