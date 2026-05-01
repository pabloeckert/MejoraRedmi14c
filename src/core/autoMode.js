/**
 * Auto Mode - Detección y optimización automática
 * Sin intervención del usuario: detectar → optimizar → registrar → notificar
 */

const { detectDevice } = require('../devices/deviceManager');
const { runOptimization } = require('./optimizerEngine');
const backupManager = require('./backupManager');
const { DeviceProfile } = require('../devices/deviceProfile');
const logManager = require('../logs/logManager');
const { sendNotification } = require('../ui/notifications');
const errorHandler = require('./errorHandler');

const POLL_INTERVAL = 10000; // 10 segundos

class AutoMode {
  constructor() {
    this.active = false;
    this.pollTimer = null;
    this.knownDevices = new Set();
    this.lastOptimization = new Map(); // deviceId → timestamp
    this.cooldownMs = 3600000; // 1 hora entre optimizaciones automáticas
    this.onStatusChange = null; // callback para UI
  }

  /**
   * Activa el modo automático
   */
  start() {
    if (this.active) return;
    this.active = true;
    console.log('[AUTO] Modo automático activado');
    this._notifyUI('active', 'Modo automático activado');
    this._poll();
  }

  /**
   * Desactiva el modo automático
   */
  stop() {
    this.active = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[AUTO] Modo automático desactivado');
    this._notifyUI('inactive', 'Modo automático desactivado');
  }

  /**
   * Verifica si está activo
   */
  isActive() {
    return this.active;
  }

  /**
   * Configura el cooldown entre optimizaciones
   */
  setCooldown(ms) {
    this.cooldownMs = ms;
  }

  /**
   * Bucle principal de detección
   */
  async _poll() {
    if (!this.active) return;

    try {
      await this._detectAndOptimize();
    } catch (err) {
      errorHandler.handle(err, 'autoMode.poll');
    }

    // Siguiente poll
    if (this.active) {
      this.pollTimer = setTimeout(() => this._poll(), POLL_INTERVAL);
    }
  }

  /**
   * Detecta dispositivos y optimiza si es necesario
   */
  async _detectAndOptimize() {
    let device;
    try {
      device = await detectDevice();
    } catch {
      // No hay dispositivo — normal en polling
      return;
    }

    if (!device || device.error) return;

    const deviceId = device.deviceId;

    // Verificar cooldown
    const lastOpt = this.lastOptimization.get(deviceId);
    if (lastOpt && (Date.now() - lastOpt) < this.cooldownMs) {
      return; // Aún en cooldown
    }

    // Si es dispositivo nuevo o necesita optimización
    const isNew = !this.knownDevices.has(deviceId);
    this.knownDevices.add(deviceId);

    if (device.firstConnection || isNew) {
      console.log(`[AUTO] Dispositivo detectado: ${deviceId} (primera: ${device.firstConnection})`);
      this._notifyUI('detected', `Dispositivo detectado: ${device.deviceInfo?.model || deviceId}`);

      await this._autoOptimize(device);
    }
  }

  /**
   * Ejecuta optimización automática completa
   */
  async _autoOptimize(device) {
    const deviceId = device.deviceId;

    try {
      // 1. Backup
      this._notifyUI('backing_up', 'Creando backup...');
      await backupManager.createBackup(deviceId);

      // 2. Optimizar
      this._notifyUI('optimizing', 'Optimizando...');
      const result = await runOptimization(deviceId, device.firstConnection);

      // 3. Registrar
      const profile = new DeviceProfile(deviceId);
      await profile.load();
      await profile.recordOptimization(result);
      const lastSnapshot = await logManager.getLastSnapshot(deviceId);
      if (lastSnapshot) await profile.updateWithSnapshot(lastSnapshot);

      // 4. Actualizar cooldown
      this.lastOptimization.set(deviceId, Date.now());

      // 5. Notificar
      if (result.success) {
        sendNotification({
          title: '✅ Optimización completada',
          body: `${device.deviceInfo?.model || deviceId}: ${result.actions?.length || 0} acciones ejecutadas`,
          type: 'success',
        });
        this._notifyUI('done', `Optimización completada: ${result.actions?.length || 0} acciones`);
      } else {
        sendNotification({
          title: '⚠️ Optimización con errores',
          body: `${device.deviceInfo?.model || deviceId}: ${result.errors?.length || 0} errores`,
          type: 'warning',
        });
        this._notifyUI('warning', `Optimización con ${result.errors?.length || 0} errores`);
      }

      // 6. Limpiar backups antiguos
      await backupManager.cleanOldBackups(deviceId, 5);

      return result;

    } catch (err) {
      errorHandler.handle(err, 'autoMode.optimize');

      // Intentar rollback
      try {
        this._notifyUI('rolling_back', 'Error — ejecutando rollback...');
        await backupManager.rollback(deviceId);
        sendNotification({
          title: '🔄 Rollback ejecutado',
          body: `Error en optimización de ${device.deviceInfo?.model || deviceId}. Se restauró el estado anterior.`,
          type: 'error',
        });
      } catch (rollbackErr) {
        errorHandler.handle(rollbackErr, 'autoMode.rollback');
      }
    }
  }

  /**
   * Callback para actualizar UI
   */
  _notifyUI(status, message) {
    if (this.onStatusChange) {
      this.onStatusChange({ status, message, timestamp: new Date().toISOString() });
    }
  }
}

module.exports = new AutoMode();
