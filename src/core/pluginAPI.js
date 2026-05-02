/**
 * Plugin API - API pública para plugins
 * Expone capacidades del sistema de forma controlada y segura
 */

const adb = require('../adb/adbClient');
const scripts = require('../adb/scripts');
const logManager = require('../logs/logManager');
const { detectDevice, assignOwner, listKnownDevices } = require('../devices/deviceManager');
const { DeviceProfile } = require('../devices/deviceProfile');
const reportExporter = require('./reportExporter');
const pdfExporter = require('./pdfExporter');
const advancedExporter = require('./advancedExporter');
const optimizerEngine = require('./optimizerEngine');
const turboMode = require('./turboMode');
const autoMode = require('./autoMode');
const guardian = require('./guardian');
const telemetry = require('./telemetry');
const errorHandler = require('./errorHandler');

class PluginAPI {
  constructor() {
    this._version = '1.0.0';
  }

  /**
   * Información de la API
   */
  getVersion() {
    return this._version;
  }

  // ═══════════════════════════════════════
  //  ADB - Acceso al dispositivo
  // ═══════════════════════════════════════

  /**
   * Ejecuta un comando shell en el dispositivo
   * @param {string} deviceId
   * @param {string} command
   * @returns {Promise<string>}
   */
  async adbShell(deviceId, command) {
    return adb.shell(deviceId, command);
  }

  /**
   * Obtiene propiedades del dispositivo
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async adbGetProps(deviceId) {
    return adb.getProps(deviceId);
  }

  /**
   * Lista dispositivos conectados
   * @returns {Promise<Array>}
   */
  async adbListDevices() {
    return adb.listDevices();
  }

  /**
   * Obtiene info detallada del dispositivo
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async adbGetDeviceInfo(deviceId) {
    return adb.getDeviceInfo(deviceId);
  }

  /**
   * Obtiene scripts ADB disponibles
   * @returns {Object}
   */
  getAdbScripts() {
    return scripts;
  }

  // ═══════════════════════════════════════
  //  ML - Machine Learning
  // ═══════════════════════════════════════

  /**
   * Ejecuta predicción de fallos
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async mlPredictFailures(deviceId) {
    const { FailurePredictor } = require('../ml/failurePredictor');
    const predictor = new FailurePredictor(deviceId);
    return predictor.predict();
  }

  /**
   * Ejecuta detección de anomalías
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async mlDetectAnomalies(deviceId) {
    const { AnomalyDetector } = require('../ml/anomalyDetector');
    const detector = new AnomalyDetector(deviceId);
    return detector.detect();
  }

  /**
   * Ejecuta predicción no lineal
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async mlPredictNonLinear(deviceId) {
    const { NonLinearPredictor } = require('../ml/nonLinearPredictor');
    const predictor = new NonLinearPredictor(deviceId);
    return predictor.predict();
  }

  // ═══════════════════════════════════════
  //  Logs
  // ═══════════════════════════════════════

  /**
   * Registra un evento en el log
   * @param {string} deviceId
   * @param {Object} entry
   */
  async logEvent(deviceId, entry) {
    return logManager.logOptimization(deviceId, entry);
  }

  /**
   * Obtiene el último snapshot del dispositivo
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async getLastSnapshot(deviceId) {
    return logManager.getLastSnapshot(deviceId);
  }

  // ═══════════════════════════════════════
  //  Device Manager
  // ═══════════════════════════════════════

  /**
   * Detecta el dispositivo conectado
   * @returns {Promise<Object>}
   */
  async detectDevice() {
    return detectDevice();
  }

  /**
   * Lista dispositivos conocidos
   * @returns {Promise<Array>}
   */
  async listKnownDevices() {
    return listKnownDevices();
  }

  /**
   * Obtiene perfil del dispositivo
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async getDeviceProfile(deviceId) {
    const profile = new DeviceProfile(deviceId);
    await profile.load();
    return profile.getData();
  }

  // ═══════════════════════════════════════
  //  Exportadores
  // ═══════════════════════════════════════

  /**
   * Exporta reporte en formato específico
   * @param {string} format - json, html, csv, xml
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async exportReport(format, deviceId) {
    return reportExporter.exportReport(format, deviceId);
  }

  /**
   * Exporta PDF
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async exportPDF(deviceId) {
    return pdfExporter.exportPDF(deviceId);
  }

  /**
   * Exportación avanzada (bundle)
   * @param {string} type
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async advancedExport(type, deviceId) {
    return advancedExporter.export(type, deviceId);
  }

  // ═══════════════════════════════════════
  //  Optimización
  // ═══════════════════════════════════════

  /**
   * Ejecuta optimización
   * @param {string} deviceId
   * @param {Object} opts
   * @returns {Promise<Object>}
   */
  async runOptimization(deviceId, opts = {}) {
    return optimizerEngine.runOptimization(deviceId, opts);
  }

  /**
   * Ejecuta modo turbo
   * @param {string} deviceId
   * @param {Object} opts
   * @returns {Promise<Object>}
   */
  async runTurbo(deviceId, opts = {}) {
    return turboMode.activate(deviceId, opts);
  }

  // ═══════════════════════════════════════
  //  Modos
  // ═══════════════════════════════════════

  /**
   * Estado del modo automático
   * @returns {Object}
   */
  getAutoModeStatus() {
    return { active: autoMode.isActive() };
  }

  /**
   * Estado del guardian
   * @param {string} deviceId
   * @returns {Object}
   */
  getGuardianStatus(deviceId) {
    return guardian.getStatus(deviceId);
  }

  /**
   * Estado de telemetría
   * @returns {Object}
   */
  getTelemetry() {
    return telemetry.getStats();
  }

  // ═══════════════════════════════════════
  //  Utilidades para plugins
  // ═══════════════════════════════════════

  /**
   * Formatea bytes a string legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PluginAPI();
