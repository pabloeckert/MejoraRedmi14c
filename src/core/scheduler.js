/**
 * Scheduler - Programación de optimizaciones
 * Permite optimizar por tiempo, batería o temperatura
 */

const { runOptimization } = require('./optimizerEngine');
const backupManager = require('./backupManager');
const logManager = require('../logs/logManager');
const { DeviceProfile } = require('../devices/deviceProfile');
const { sendNotification } = require('../ui/notifications');
const errorHandler = require('./errorHandler');
const adb = require('../adb/adbClient');

class Scheduler {
  constructor() {
    this.jobs = new Map(); // jobId → job config
    this.timers = new Map(); // jobId → timer
    this.running = false;
  }

  /**
   * Crea un job programado
   */
  addJob(config) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const job = {
      id: jobId,
      deviceId: config.deviceId,
      type: config.type, // 'interval' | 'battery' | 'temperature'
      enabled: true,
      created: new Date().toISOString(),
      lastRun: null,
      ...config,
    };

    this.jobs.set(jobId, job);

    if (this.running) {
      this._startJob(job);
    }

    return job;
  }

  /**
   * Elimina un job
   */
  removeJob(jobId) {
    this._stopJob(jobId);
    this.jobs.delete(jobId);
  }

  /**
   * Habilita/deshabilita un job
   */
  toggleJob(jobId, enabled) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.enabled = enabled;
    if (enabled && this.running) {
      this._startJob(job);
    } else {
      this._stopJob(jobId);
    }
  }

  /**
   * Inicia el scheduler
   */
  start() {
    this.running = true;
    for (const job of this.jobs.values()) {
      if (job.enabled) this._startJob(job);
    }
    console.log(`[SCHEDULER] Iniciado con ${this.jobs.size} jobs`);
  }

  /**
   * Detiene el scheduler
   */
  stop() {
    this.running = false;
    for (const jobId of this.timers.keys()) {
      this._stopJob(jobId);
    }
    console.log('[SCHEDULER] Detenido');
  }

  /**
   * Lista todos los jobs
   */
  listJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Actualiza un job existente
   */
  updateJob(jobId, patch) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    Object.assign(job, patch);
    if (this.running && job.enabled) {
      this._stopJob(jobId);
      this._startJob(job);
    }
    return job;
  }

  // ─── Private ─────────────────────────────────────────

  _startJob(job) {
    this._stopJob(job.id);

    switch (job.type) {
      case 'interval':
        this._startIntervalJob(job);
        break;
      case 'battery':
        this._startConditionJob(job, 'battery');
        break;
      case 'temperature':
        this._startConditionJob(job, 'temperature');
        break;
    }
  }

  _startIntervalJob(job) {
    const intervalMs = (job.days || 1) * 86400000;
    console.log(`[SCHEDULER] Job ${job.id}: cada ${job.days || 1} días`);

    const timer = setInterval(async () => {
      await this._executeJob(job);
    }, intervalMs);

    this.timers.set(job.id, timer);
  }

  _startConditionJob(job, condition) {
    const checkInterval = 60000; // Cada minuto
    console.log(`[SCHEDULER] Job ${job.id}: cuando ${condition} ${condition === 'battery' ? '<' : '>'} ${job.threshold}`);

    const timer = setInterval(async () => {
      try {
        const shouldRun = await this._checkCondition(job.deviceId, condition, job.threshold, job.comparator);
        if (shouldRun) {
          await this._executeJob(job);
        }
      } catch (err) {
        errorHandler.handle(err, `scheduler.check.${job.id}`);
      }
    }, checkInterval);

    this.timers.set(job.id, timer);
  }

  async _checkCondition(deviceId, condition, threshold, comparator) {
    try {
      if (condition === 'battery') {
        const battery = await adb.getBatteryInfo(deviceId);
        const level = parseInt(battery.level);
        return comparator === 'lt' ? level < threshold : level > threshold;
      }

      if (condition === 'temperature') {
        const temp = await adb.getTemperature(deviceId);
        if (temp == null) return false;
        return comparator === 'gt' ? temp > threshold : temp < threshold;
      }
    } catch {
      // Dispositivo no conectado
      return false;
    }

    return false;
  }

  async _executeJob(job) {
    console.log(`[SCHEDULER] Ejecutando job ${job.id} para ${job.deviceId}`);
    job.lastRun = new Date().toISOString();

    try {
      // Backup
      await backupManager.createBackup(job.deviceId);

      // Optimizar (smart mode por defecto en scheduler)
      const result = await runOptimization(job.deviceId, false);

      // Registrar
      const profile = new DeviceProfile(job.deviceId);
      await profile.load();
      await profile.recordOptimization(result);

      // Notificar
      sendNotification({
        title: '⏰ Optimización programada completada',
        body: `${job.deviceId}: ${result.actions?.length || 0} acciones`,
        type: 'success',
      });

      return result;
    } catch (err) {
      errorHandler.handle(err, `scheduler.execute.${job.id}`);

      try {
        await backupManager.rollback(job.deviceId);
        sendNotification({
          title: '🔄 Rollback en optimización programada',
          body: `Error en job ${job.id}, se restauró el estado anterior`,
          type: 'error',
        });
      } catch {}
    }
  }

  _stopJob(jobId) {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(jobId);
    }
  }
}

module.exports = new Scheduler();
