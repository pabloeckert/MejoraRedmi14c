/**
 * Hybrid AI - Motor de IA híbrida local + nube
 * Combina predicciones locales con endpoint remoto configurable
 * Selección automática según confianza, fallback local si falla la nube
 */

const { FailurePredictor } = require('./failurePredictor');
const { NonLinearPredictor } = require('./nonLinearPredictor');
const { AnomalyDetector } = require('./anomalyDetector');
const { AdaptiveOptimizer } = require('./adaptiveOptimizer');
const logManager = require('../logs/logManager');
const errorHandler = require('../core/errorHandler');

// Configuración por defecto del endpoint remoto
const DEFAULT_CONFIG = {
  endpoint: null,              // URL del endpoint remoto (configurable)
  apiKey: null,                // API key para el endpoint
  timeout: 10000,              // Timeout de requests (ms)
  confidenceThreshold: 0.65,   // Umbral para preferir predicción remota
  fallbackToLocal: true,       // Siempre fallback a local si falla la nube
  cacheRemoteMs: 300000,       // Cache de respuestas remotas (5 min)
  enabled: false,              // Habilitado por defecto (requiere configuración)
};

class HybridAI {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();       // deviceId → { data, timestamp }
    this.metrics = {
      localCalls: 0,
      remoteCalls: 0,
      remoteFailures: 0,
      cacheHits: 0,
      merges: 0,
    };
  }

  /**
   * Actualiza configuración del endpoint remoto
   */
  configure(config) {
    Object.assign(this.config, config);
    this.cache.clear();
    return this.config;
  }

  /**
   * Obtiene configuración actual (sin exponer apiKey)
   */
  getConfig() {
    const { apiKey, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      hasApiKey: !!apiKey,
    };
  }

  /**
   * Predicción híbrida: local + remoto, selección por confianza
   */
  async predict(deviceId) {
    const startTime = Date.now();
    const result = {
      timestamp: new Date().toISOString(),
      deviceId,
      source: 'local',         // 'local' | 'remote' | 'hybrid'
      local: null,
      remote: null,
      merged: null,
      confidence: 0,
      latencyMs: 0,
      errors: [],
    };

    // ── 1. Predicciones locales (siempre) ──
    try {
      result.local = await this._getLocalPredictions(deviceId);
      this.metrics.localCalls++;
    } catch (err) {
      result.errors.push({ source: 'local', message: err.message });
      errorHandler.handle(err, 'hybridAI.local');
    }

    // ── 2. Predicciones remotas (si configurado) ──
    if (this.config.enabled && this.config.endpoint) {
      try {
        // Verificar cache primero
        const cached = this._getFromCache(deviceId);
        if (cached) {
          result.remote = cached;
          this.metrics.cacheHits++;
        } else {
          result.remote = await this._getRemotePredictions(deviceId);
          this._setCache(deviceId, result.remote);
          this.metrics.remoteCalls++;
        }
      } catch (err) {
        result.remote = null;
        result.errors.push({ source: 'remote', message: err.message });
        this.metrics.remoteFailures++;
        console.warn('[HYBRID_AI] Error en predicción remota:', err.message);
      }
    }

    // ── 3. Fusión inteligente ──
    if (result.local && result.remote) {
      result.merged = this._mergePredictions(result.local, result.remote);
      result.source = 'hybrid';
      result.confidence = result.merged.confidence;
      this.metrics.merges++;
    } else if (result.remote && !result.local) {
      result.merged = result.remote;
      result.source = 'remote';
      result.confidence = result.remote.confidence || 0.5;
    } else {
      result.merged = result.local;
      result.source = 'local';
      result.confidence = result.local?.confidence || 0;
    }

    result.latencyMs = Date.now() - startTime;
    return result;
  }

  /**
   * Predicción para un tipo específico de fallo
   */
  async predictType(deviceId, failureType) {
    const fullPrediction = await this.predict(deviceId);
    const predictions = fullPrediction.merged?.predictions || [];
    return predictions.find(p => p.id === failureType) || null;
  }

  /**
   * Obtiene métricas de uso del motor híbrido
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalCalls: this.metrics.localCalls + this.metrics.remoteCalls,
      remoteSuccessRate: this.metrics.remoteCalls > 0
        ? Math.round(((this.metrics.remoteCalls - this.metrics.remoteFailures) / this.metrics.remoteCalls) * 100)
        : 0,
      cacheHitRate: (this.metrics.localCalls + this.metrics.remoteCalls) > 0
        ? Math.round((this.metrics.cacheHits / (this.metrics.localCalls + this.metrics.remoteCalls)) * 100)
        : 0,
    };
  }

  // ════════════════════════════════════════════════════
  //  Predicciones locales
  // ════════════════════════════════════════════════════

  async _getLocalPredictions(deviceId) {
    const predictor = new FailurePredictor(deviceId);
    const prediction = await predictor.predict();

    const detector = new AnomalyDetector(deviceId);
    let anomalies = { anomalies: [] };
    try { anomalies = await detector.detect(); } catch {}

    const optimizer = new AdaptiveOptimizer(deviceId);
    await optimizer.load();

    return {
      predictions: prediction.predictions || [],
      nonLinearPredictions: prediction.nonLinearPredictions || { predictions: [] },
      anomalies: anomalies.anomalies || [],
      confidence: prediction.confidence || 0,
      dataPoints: prediction.dataPoints || 0,
    };
  }

  // ════════════════════════════════════════════════════
  //  Predicciones remotas
  // ════════════════════════════════════════════════════

  async _getRemotePredictions(deviceId) {
    const logs = await logManager.getLogs(deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot').slice(-20);

    // Preparar payload para el endpoint remoto
    const payload = {
      deviceId,
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp,
        battery: s.battery?.level ? parseInt(s.battery.level) : null,
        temperature: s.temperature,
        processCount: s.processes?.length || 0,
        memoryAvailable: s.memory?.availablePercent || null,
        storageUsed: s.storage?.usedPercent || null,
      })),
      timestamp: new Date().toISOString(),
    };

    // Request al endpoint remoto
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Endpoint respondió ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        predictions: data.predictions || [],
        confidence: data.confidence || 0.5,
        model: data.model || 'remote',
        latencyMs: data.latencyMs || 0,
      };

    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Timeout del endpoint remoto');
      }
      throw err;
    }
  }

  // ════════════════════════════════════════════════════
  //  Fusión inteligente
  // ════════════════════════════════════════════════════

  _mergePredictions(local, remote) {
    const merged = {
      predictions: [],
      confidence: 0,
      source: 'merged',
    };

    // Mapa de predicciones remotas por tipo
    const remoteMap = new Map();
    for (const pred of (remote.predictions || [])) {
      remoteMap.set(pred.id, pred);
    }

    // Combinar: priorizar la fuente con mayor confianza por predicción
    const localConfidence = local.confidence || 0;
    const remoteConfidence = remote.confidence || 0;

    // Agregar predicciones locales
    for (const pred of (local.predictions || [])) {
      const remotePred = remoteMap.get(pred.id);

      if (remotePred && remoteConfidence > localConfidence) {
        // Remoto tiene mayor confianza: usar remoto, enriquecer con datos locales
        merged.predictions.push({
          ...remotePred,
          _source: 'remote',
          _localUrgency: pred.urgency,
          _remoteConfidence: remoteConfidence,
          _localConfidence: localConfidence,
        });
        remoteMap.delete(pred.id);
      } else {
        // Local tiene mayor confianza o no hay remoto
        merged.predictions.push({
          ...pred,
          _source: remotePred ? 'local_preferred' : 'local_only',
          _remoteConfidence: remotePred ? remoteConfidence : null,
          _localConfidence: localConfidence,
        });
        if (remotePred) remoteMap.delete(pred.id);
      }
    }

    // Agregar predicciones remotas que no existían localmente
    for (const [, pred] of remoteMap) {
      merged.predictions.push({
        ...pred,
        _source: 'remote_only',
        _remoteConfidence: remoteConfidence,
      });
    }

    // Confianza fusionada: promedio ponderado
    merged.confidence = Math.round(
      ((localConfidence * 0.6) + (remoteConfidence * 0.4)) * 100
    ) / 100;

    // Incluir datos no lineales del local (el remoto no los tiene)
    merged.nonLinearPredictions = local.nonLinearPredictions;
    merged.anomalies = local.anomalies;
    merged.dataPoints = local.dataPoints;

    return merged;
  }

  // ════════════════════════════════════════════════════
  //  Cache
  // ════════════════════════════════════════════════════

  _getFromCache(deviceId) {
    const entry = this.cache.get(deviceId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.config.cacheRemoteMs) {
      this.cache.delete(deviceId);
      return null;
    }
    return entry.data;
  }

  _setCache(deviceId, data) {
    this.cache.set(deviceId, {
      data,
      timestamp: Date.now(),
    });
  }
}

module.exports = { HybridAI };
