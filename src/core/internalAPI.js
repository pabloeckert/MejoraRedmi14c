/**
 * Internal API - API interna para automatización
 * Expone funciones clave del sistema para uso programático
 * Integrable con preload.js vía IPC
 */

const optimizerEngine = require('./optimizerEngine');
const turboMode = require('./turboMode');
const guardian = require('./guardian');
const autoMode = require('./autoMode');
const telemetry = require('./telemetry');
const advancedExporter = require('./advancedExporter');
const reportExporter = require('./reportExporter');
const pdfExporter = require('./pdfExporter');
const logManager = require('../logs/logManager');
const { FailurePredictor } = require('../ml/failurePredictor');
const { HybridAI } = require('../ml/hybridAI');
const { PluginSandbox } = require('../extensions/pluginSandbox');
const errorHandler = require('./errorHandler');

class InternalAPI {
  constructor() {
    this.hybridAI = new HybridAI();
    this.pluginSandbox = new PluginSandbox();
    this.version = '1.0.0';
    this.startTime = Date.now();
  }

  /**
   * Información del sistema
   */
  getSystemInfo() {
    return {
      version: this.version,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      uptimeHuman: this._formatUptime(Date.now() - this.startTime),
      modules: {
        hybridAI: this.hybridAI.getConfig(),
        guardian: guardian.getStatus() || { active: guardian.active },
        autoMode: { active: autoMode.isActive() },
        telemetry: telemetry.getGlobalStats(),
        plugins: this.pluginSandbox.list().length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ════════════════════════════════════════════════════
  //  Optimización
  // ════════════════════════════════════════════════════

  /**
   * Ejecuta optimización completa
   */
  async runOptimization(deviceId, options = {}) {
    const timerKey = telemetry.startTimer(deviceId, 'api.runOptimization');
    try {
      const result = await optimizerEngine.runOptimization(deviceId, options.firstConnection);
      telemetry.endTimer(deviceId, 'api.runOptimization', 'optimization');
      telemetry.trackAutoAction(deviceId, { type: 'optimization', triggeredBy: 'api' }, result);
      return { success: true, ...result };
    } catch (err) {
      telemetry.trackError(deviceId, err, { context: 'api.runOptimization' });
      return { success: false, error: err.message };
    }
  }

  /**
   * Ejecuta Modo Turbo
   */
  async runTurbo(deviceId, options = {}) {
    const timerKey = telemetry.startTimer(deviceId, 'api.runTurbo');
    try {
      const result = await turboMode.activate(deviceId, options);
      telemetry.endTimer(deviceId, 'api.runTurbo', 'turbo');
      telemetry.trackAutoAction(deviceId, { type: 'turbo', triggeredBy: 'api' }, result);
      return { success: true, ...result };
    } catch (err) {
      telemetry.trackError(deviceId, err, { context: 'api.runTurbo' });
      return { success: false, error: err.message };
    }
  }

  // ════════════════════════════════════════════════════
  //  Predicciones
  // ════════════════════════════════════════════════════

  /**
   * Obtiene predicciones (local o híbrido)
   */
  async getPredictions(deviceId, options = {}) {
    const timerKey = telemetry.startTimer(deviceId, 'api.getPredictions');
    try {
      let result;

      if (options.hybrid && this.hybridAI.config.enabled) {
        result = await this.hybridAI.predict(deviceId);
        telemetry.trackPrediction(deviceId, { source: 'hybrid', ...result.merged });
      } else {
        const predictor = new FailurePredictor(deviceId);
        result = await predictor.predict();
        for (const pred of (result.predictions || [])) {
          telemetry.trackPrediction(deviceId, { source: 'local', ...pred });
        }
      }

      telemetry.endTimer(deviceId, 'api.getPredictions', 'prediction');
      return { success: true, ...result };
    } catch (err) {
      telemetry.trackError(deviceId, err, { context: 'api.getPredictions' });
      return { success: false, error: err.message };
    }
  }

  // ════════════════════════════════════════════════════
  //  Telemetría
  // ════════════════════════════════════════════════════

  /**
   * Obtiene telemetría de un dispositivo
   */
  getTelemetry(deviceId, filters = {}) {
    return {
      events: telemetry.getEvents(deviceId, filters),
      stats: telemetry.getStats(deviceId),
    };
  }

  /**
   * Obtiene estadísticas globales de telemetría
   */
  getTelemetryStats() {
    return telemetry.getGlobalStats();
  }

  // ════════════════════════════════════════════════════
  //  Exportación
  // ════════════════════════════════════════════════════

  /**
   * Exporta bundle completo
   */
  async exportBundle(deviceId, format = 'bundle') {
    const timerKey = telemetry.startTimer(deviceId, 'api.exportBundle');
    try {
      let result;

      switch (format) {
        case 'csv':
          result = await advancedExporter.exportCSV(deviceId);
          break;
        case 'xml':
          result = await advancedExporter.exportXML(deviceId);
          break;
        case 'pdf':
          result = await pdfExporter.export(deviceId);
          break;
        case 'json':
          result = await reportExporter.export(deviceId, { format: 'json' });
          break;
        case 'html':
          result = await reportExporter.export(deviceId, { format: 'html' });
          break;
        case 'bundle':
        default:
          result = await advancedExporter.exportBundle(deviceId);
          break;
      }

      telemetry.endTimer(deviceId, 'api.exportBundle', 'export');
      telemetry.trackEvent(deviceId, 'export', format, { files: result.files?.length });
      return { success: true, ...result };
    } catch (err) {
      telemetry.trackError(deviceId, err, { context: 'api.exportBundle' });
      return { success: false, error: err.message };
    }
  }

  // ════════════════════════════════════════════════════
  //  Guardian
  // ════════════════════════════════════════════════════

  startGuardian(deviceId) {
    const result = guardian.start(deviceId);
    telemetry.trackEvent(deviceId, 'guardian', 'start');
    return result;
  }

  stopGuardian(deviceId) {
    const result = guardian.stop(deviceId);
    telemetry.trackEvent(deviceId, 'guardian', 'stop');
    return result;
  }

  getGuardianStatus(deviceId) {
    return guardian.getStatus(deviceId);
  }

  // ════════════════════════════════════════════════════
  //  Auto Mode
  // ════════════════════════════════════════════════════

  startAutoMode() {
    autoMode.start();
    return { success: true, active: true };
  }

  stopAutoMode() {
    autoMode.stop();
    return { success: true, active: false };
  }

  getAutoModeStatus() {
    return { active: autoMode.isActive() };
  }

  // ════════════════════════════════════════════════════
  //  Hybrid AI
  // ════════════════════════════════════════════════════

  configureHybridAI(config) {
    return this.hybridAI.configure(config);
  }

  getHybridAIConfig() {
    return this.hybridAI.getConfig();
  }

  getHybridAIMetrics() {
    return this.hybridAI.getMetrics();
  }

  // ════════════════════════════════════════════════════
  //  Plugins
  // ════════════════════════════════════════════════════

  listPlugins() {
    return this.pluginSandbox.list();
  }

  async executePlugin(pluginId, scriptName, context) {
    return await this.pluginSandbox.executeScript(pluginId, scriptName, context);
  }

  togglePlugin(pluginId, enabled) {
    return this.pluginSandbox.toggle(pluginId, enabled);
  }

  getPluginExecutionLog(limit) {
    return this.pluginSandbox.getExecutionLog(limit);
  }

  // ════════════════════════════════════════════════════
  //  Logs
  // ════════════════════════════════════════════════════

  async getLogs(deviceId, filters = {}) {
    const logs = await logManager.getLogs(deviceId);
    if (filters.type) return logs.filter(l => l.type === filters.type);
    if (filters.limit) return logs.slice(-filters.limit);
    return logs;
  }

  async getErrorStats() {
    return errorHandler.getStats?.() || {};
  }

  // ════════════════════════════════════════════════════
  //  Utilidades
  // ════════════════════════════════════════════════════

  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = new InternalAPI();
