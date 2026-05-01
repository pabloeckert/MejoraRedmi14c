/**
 * Telemetry - Sistema de telemetría avanzada
 * Registra eventos, tiempos de ejecución, errores, predicciones y acciones automáticas
 * Guarda en /telemetry/{deviceId}.json
 */

const fs = require('fs-extra');
const path = require('path');

const TELEMETRY_DIR = path.join(__dirname, '..', '..', 'telemetry');
const MAX_EVENTS_PER_DEVICE = 2000;
const FLUSH_INTERVAL = 30000; // Flush a disco cada 30s

class Telemetry {
  constructor() {
    this.buffers = new Map();    // deviceId → event[]
    this.timers = new Map();     // deviceId → timerId
    this.flushTimer = null;
    this.globalStats = {
      totalEvents: 0,
      totalDevices: 0,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Inicializa telemetría para un dispositivo
   */
  async init(deviceId) {
    if (!this.buffers.has(deviceId)) {
      this.buffers.set(deviceId, []);
      this.globalStats.totalDevices++;
    }

    // Cargar eventos existentes del disco
    const existing = await this._loadFromDisk(deviceId);
    if (existing.length > 0) {
      this.buffers.set(deviceId, existing);
    }

    // Iniciar flush periódico
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this._flushAll(), FLUSH_INTERVAL);
    }
  }

  /**
   * Registra un evento
   */
  track(deviceId, event) {
    const entry = {
      timestamp: new Date().toISOString(),
      deviceId,
      ...event,
    };

    if (!this.buffers.has(deviceId)) {
      this.buffers.set(deviceId, []);
    }

    const buffer = this.buffers.get(deviceId);
    buffer.push(entry);

    // Limitar tamaño
    if (buffer.length > MAX_EVENTS_PER_DEVICE) {
      buffer.splice(0, buffer.length - MAX_EVENTS_PER_DEVICE);
    }

    this.globalStats.totalEvents++;
    return entry;
  }

  /**
   * Registra un evento de tipo específico
   */
  trackEvent(deviceId, category, action, data = {}) {
    return this.track(deviceId, {
      type: 'event',
      category,
      action,
      data,
    });
  }

  /**
   * Registra tiempo de ejecución
   */
  trackTiming(deviceId, category, operation, durationMs, metadata = {}) {
    return this.track(deviceId, {
      type: 'timing',
      category,
      operation,
      durationMs,
      ...metadata,
    });
  }

  /**
   * Registra un error
   */
  trackError(deviceId, error, context = {}) {
    return this.track(deviceId, {
      type: 'error',
      message: error.message || String(error),
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      severity: context.severity || 'error',
      context,
    });
  }

  /**
   * Registra una predicción ML
   */
  trackPrediction(deviceId, prediction) {
    return this.track(deviceId, {
      type: 'prediction',
      source: prediction.source || 'local',
      failureType: prediction.id,
      urgency: prediction.urgency,
      confidence: prediction.confidence,
      projectedDays: prediction.projection?.estimatedDays,
    });
  }

  /**
   * Registra una acción automática
   */
  trackAutoAction(deviceId, action, result) {
    return this.track(deviceId, {
      type: 'auto_action',
      action: action.type || action,
      triggeredBy: action.triggeredBy || 'unknown',
      success: result.success !== false,
      actionsCount: result.totalActions || result.actions?.length || 0,
      durationMs: result.durationMs || 0,
    });
  }

  /**
   * Inicia un timer para medir duración
   */
  startTimer(deviceId, label) {
    const key = `${deviceId}:${label}`;
    this.timers.set(key, Date.now());
    return key;
  }

  /**
   * Detiene un timer y registra el resultado
   */
  endTimer(deviceId, label, category = 'operation') {
    const key = `${deviceId}:${label}`;
    const startTime = this.timers.get(key);
    if (!startTime) return null;

    const durationMs = Date.now() - startTime;
    this.timers.delete(key);

    return this.trackTiming(deviceId, category, label, durationMs);
  }

  /**
   * Obtiene eventos de un dispositivo
   */
  getEvents(deviceId, filters = {}) {
    const events = this.buffers.get(deviceId) || [];
    let filtered = events;

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters.since) {
      const since = new Date(filters.since).getTime();
      filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= since);
    }
    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Obtiene estadísticas de un dispositivo
   */
  getStats(deviceId) {
    const events = this.buffers.get(deviceId) || [];
    const stats = {
      totalEvents: events.length,
      byType: {},
      byCategory: {},
      errors: { total: 0, recent: [] },
      timings: { total: 0, avgMs: 0, maxMs: 0 },
      predictions: { total: 0, byUrgency: {} },
      autoActions: { total: 0, successful: 0 },
    };

    let totalTimingMs = 0;

    for (const event of events) {
      // Por tipo
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

      // Por categoría
      if (event.category) {
        stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
      }

      // Errores
      if (event.type === 'error') {
        stats.errors.total++;
        if (stats.errors.recent.length < 10) {
          stats.errors.recent.push({
            message: event.message,
            severity: event.severity,
            timestamp: event.timestamp,
          });
        }
      }

      // Timings
      if (event.type === 'timing') {
        stats.timings.total++;
        totalTimingMs += event.durationMs || 0;
        stats.timings.maxMs = Math.max(stats.timings.maxMs, event.durationMs || 0);
      }

      // Predicciones
      if (event.type === 'prediction') {
        stats.predictions.total++;
        const urgency = event.urgency || 'unknown';
        stats.predictions.byUrgency[urgency] = (stats.predictions.byUrgency[urgency] || 0) + 1;
      }

      // Acciones automáticas
      if (event.type === 'auto_action') {
        stats.autoActions.total++;
        if (event.success) stats.autoActions.successful++;
      }
    }

    stats.timings.avgMs = stats.timings.total > 0
      ? Math.round(totalTimingMs / stats.timings.total)
      : 0;

    return stats;
  }

  /**
   * Obtiene estadísticas globales
   */
  getGlobalStats() {
    return {
      ...this.globalStats,
      bufferSize: Array.from(this.buffers.values()).reduce((sum, b) => sum + b.length, 0),
      activeDevices: this.buffers.size,
    };
  }

  /**
   * Exporta telemetría de un dispositivo
   */
  async export(deviceId, format = 'json') {
    const events = this.buffers.get(deviceId) || [];
    const stats = this.getStats(deviceId);

    const data = {
      exportedAt: new Date().toISOString(),
      deviceId,
      stats,
      events,
    };

    if (format === 'csv') {
      return this._toCSV(events);
    }

    return data;
  }

  /**
   * Limpia telemetría de un dispositivo
   */
  async clear(deviceId) {
    this.buffers.set(deviceId, []);
    const filePath = path.join(TELEMETRY_DIR, `${deviceId}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  /**
   * Flush de todos los buffers a disco
   */
  async _flushAll() {
    for (const [deviceId, buffer] of this.buffers) {
      if (buffer.length > 0) {
        await this._saveToDisk(deviceId, buffer);
      }
    }
  }

  async _saveToDisk(deviceId, events) {
    try {
      await fs.ensureDir(TELEMETRY_DIR);
      const filePath = path.join(TELEMETRY_DIR, `${deviceId}.json`);
      await fs.writeJson(filePath, events, { spaces: 2 });
    } catch (err) {
      console.warn(`[TELEMETRY] Error guardando ${deviceId}:`, err.message);
    }
  }

  async _loadFromDisk(deviceId) {
    try {
      const filePath = path.join(TELEMETRY_DIR, `${deviceId}.json`);
      if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
      }
    } catch {}
    return [];
  }

  _toCSV(events) {
    if (events.length === 0) return 'timestamp,type,category,action,data\n';

    const headers = ['timestamp', 'type', 'category', 'action', 'data'];
    const rows = events.map(e => [
      e.timestamp,
      e.type || '',
      e.category || '',
      e.action || '',
      JSON.stringify(e.data || {}),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Destruye la instancia (limpia timers)
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this._flushAll();
  }
}

module.exports = new Telemetry();
