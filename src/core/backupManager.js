/**
 * Backup Manager - Sistema de backup y rollback
 * Crea backups completos antes de optimizar y permite rollback
 */

const fs = require('fs-extra');
const path = require('path');
const adb = require('../adb/adbClient');

const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups');

class BackupManager {
  constructor() {
    this.currentBackup = null;
  }

  /**
   * Crea un backup completo del dispositivo
   */
  async createBackup(deviceId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(BACKUPS_DIR, deviceId, timestamp);
    await fs.ensureDir(backupDir);

    const backup = {
      deviceId,
      timestamp: new Date().toISOString(),
      apps: [],
      services: [],
      settings: {},
      battery: {},
      processes: [],
      errors: [],
    };

    // ── Backup de apps instaladas ──
    try {
      backup.apps = await adb.listPackages(deviceId);
      await fs.writeJson(path.join(backupDir, 'apps.json'), backup.apps, { spaces: 2 });
    } catch (e) {
      backup.errors.push({ section: 'apps', error: e.message });
    }

    // ── Backup de servicios activos ──
    try {
      const output = await adb.run('shell dumpsys activity services', deviceId);
      backup.services = this._parseServices(output);
      await fs.writeFile(path.join(backupDir, 'services.txt'), output);
    } catch (e) {
      backup.errors.push({ section: 'services', error: e.message });
    }

    // ── Backup de configuraciones del sistema ──
    try {
      const settings = {};
      const globalOutput = await adb.run('shell settings list global', deviceId);
      settings.global = this._parseSettings(globalOutput);

      const secureOutput = await adb.run('shell settings list secure', deviceId);
      settings.secure = this._parseSettings(secureOutput);

      const systemOutput = await adb.run('shell settings list system', deviceId);
      settings.system = this._parseSettings(systemOutput);

      backup.settings = settings;
      await fs.writeJson(path.join(backupDir, 'settings.json'), settings, { spaces: 2 });
    } catch (e) {
      backup.errors.push({ section: 'settings', error: e.message });
    }

    // ── Backup de batería ──
    try {
      const batteryOutput = await adb.run('shell dumpsys battery', deviceId);
      backup.battery = this._parseBattery(batteryOutput);
      await fs.writeFile(path.join(backupDir, 'battery.txt'), batteryOutput);
    } catch (e) {
      backup.errors.push({ section: 'battery', error: e.message });
    }

    // ── Backup de procesos ──
    try {
      backup.processes = await adb.getRunningProcesses(deviceId);
      await fs.writeJson(path.join(backupDir, 'processes.json'), backup.processes, { spaces: 2 });
    } catch (e) {
      backup.errors.push({ section: 'processes', error: e.message });
    }

    // ── Backup de propiedades ──
    try {
      const propsOutput = await adb.run('shell getprop', deviceId);
      await fs.writeFile(path.join(backupDir, 'props.txt'), propsOutput);
    } catch (e) {
      backup.errors.push({ section: 'props', error: e.message });
    }

    // Guardar manifiesto del backup
    await fs.writeJson(path.join(backupDir, 'manifest.json'), backup, { spaces: 2 });

    this.currentBackup = backup;
    console.log(`[BACKUP] Backup creado: ${backupDir} (${backup.apps.length} apps, ${backup.errors.length} errores)`);

    return backup;
  }

  /**
   * Ejecuta rollback al último backup
   */
  async rollback(deviceId, backupData = null) {
    const backup = backupData || this.currentBackup;
    if (!backup) {
      throw new Error('No hay backup disponible para rollback');
    }

    const results = {
      restored: [],
      errors: [],
    };

    // ── Restaurar settings ──
    if (backup.settings?.global) {
      for (const [key, value] of Object.entries(backup.settings.global)) {
        try {
          // Solo restaurar settings de performance y animation que optimizamos
          const restoreKeys = [
            'window_animation_scale',
            'transition_animation_scale',
            'animator_duration_scale',
            'force_gpu_rendering',
            'background_limit',
            'screen_off_timeout',
          ];
          if (restoreKeys.includes(key)) {
            await adb.run(`shell settings put global ${key} ${value}`, deviceId);
            results.restored.push(`global.${key}`);
          }
        } catch (e) {
          results.errors.push(`settings global.${key}: ${e.message}`);
        }
      }
    }

    // ── Restaurar apps deshabilitadas ──
    // Nota: no reinstalamos apps eliminadas, solo rehabilitamos las deshabilitadas
    // porque pm uninstall --user 0 requiere factory reset para revertir completamente

    console.log(`[ROLLBACK] Completado: ${results.restored.length} restaurados, ${results.errors.length} errores`);
    return results;
  }

  /**
   * Lista backups disponibles para un dispositivo
   */
  async listBackups(deviceId) {
    const deviceDir = path.join(BACKUPS_DIR, deviceId);
    if (!await fs.pathExists(deviceDir)) return [];

    const entries = await fs.readdir(deviceDir);
    const backups = [];

    for (const entry of entries) {
      const manifestPath = path.join(deviceDir, entry, 'manifest.json');
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        backups.push({
          timestamp: manifest.timestamp,
          appsCount: manifest.apps?.length || 0,
          errorsCount: manifest.errors?.length || 0,
          dir: entry,
        });
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Carga un backup específico
   */
  async loadBackup(deviceId, timestamp) {
    const dirName = timestamp.replace(/[:.]/g, '-');
    const manifestPath = path.join(BACKUPS_DIR, deviceId, dirName, 'manifest.json');
    if (await fs.pathExists(manifestPath)) {
      return await fs.readJson(manifestPath);
    }
    throw new Error(`Backup no encontrado: ${timestamp}`);
  }

  /**
   * Limpia backups antiguos (mantiene los últimos N)
   */
  async cleanOldBackups(deviceId, keepLast = 5) {
    const backups = await this.listBackups(deviceId);
    if (backups.length <= keepLast) return 0;

    const toDelete = backups.slice(keepLast);
    let deleted = 0;

    for (const backup of toDelete) {
      try {
        const dir = path.join(BACKUPS_DIR, deviceId, backup.dir);
        await fs.remove(dir);
        deleted++;
      } catch {}
    }

    return deleted;
  }

  _parseServices(output) {
    const services = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/ServiceRecord\{.*\s+(\S+\/\S+)\}/);
      if (match) services.push(match[1]);
    }
    return services;
  }

  _parseSettings(output) {
    const settings = {};
    output.split('\n').forEach(line => {
      const match = line.match(/^(.+?)=(.+)$/);
      if (match) settings[match[1]] = match[2];
    });
    return settings;
  }

  _parseBattery(output) {
    const info = {};
    output.split('\n').forEach(line => {
      const match = line.match(/^\s*(.+?):\s*(.+)$/);
      if (match) info[match[1].trim()] = match[2].trim();
    });
    return info;
  }
}

module.exports = new BackupManager();
