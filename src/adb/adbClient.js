/**
 * ADB Client - Abstracción completa del protocolo ADB
 * Ejecuta comandos ADB via shell y parsea resultados
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ADBClient {
  constructor() {
    this.connectedDevices = new Map();
  }

  /**
   * Ejecuta un comando ADB y retorna stdout
   */
  async run(command, deviceId = null) {
    const deviceFlag = deviceId ? `-s ${deviceId}` : '';
    const fullCmd = `adb ${deviceFlag} ${command}`;
    try {
      const { stdout, stderr } = await execAsync(fullCmd, { timeout: 30000 });
      if (stderr && !stderr.includes('Warning')) {
        console.warn(`[ADB stderr] ${stderr}`);
      }
      return stdout.trim();
    } catch (err) {
      throw new Error(`ADB command failed: ${fullCmd}\n${err.message}`);
    }
  }

  /**
   * Lista dispositivos conectados
   */
  async listDevices() {
    const output = await this.run('devices -l');
    const lines = output.split('\n').filter(l => l.includes('device') && !l.startsWith('List'));
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        serial: parts[0],
        state: parts[1],
        props: this._parseProps(parts.slice(2)),
      };
    });
  }

  /**
   * Obtiene propiedades del dispositivo
   */
  async getProps(deviceId) {
    const output = await this.run('shell getprop', deviceId);
    const props = {};
    output.split('\n').forEach(line => {
      const match = line.match(/\[(.+?)\]:\s*\[(.+?)\]/);
      if (match) props[match[1]] = match[2];
    });
    return props;
  }

  /**
   * Obtiene info detallada del dispositivo
   */
  async getDeviceInfo(deviceId) {
    const props = await this.getProps(deviceId);
    return {
      serial: deviceId,
      brand: props['ro.product.brand'] || 'Unknown',
      model: props['ro.product.model'] || 'Unknown',
      device: props['ro.product.device'] || 'Unknown',
      android: props['ro.build.version.release'] || 'Unknown',
      sdk: props['ro.build.version.sdk'] || 'Unknown',
      miui: props['ro.miui.ui.version.name'] || null,
      hardware: props['ro.hardware'] || 'Unknown',
      board: props['ro.product.board'] || 'Unknown',
    };
  }

  /**
   * Instala una app por package name (sideload via pm install)
   */
  async installApk(deviceId, apkPath) {
    return this.run(`install -r "${apkPath}"`, deviceId);
  }

  /**
   * Desinstala una app (con opción de mantener datos)
   */
  async uninstall(deviceId, packageName, keepData = false) {
    const flag = keepData ? '-k' : '';
    return this.run(`uninstall ${flag} ${packageName}`, deviceId);
  }

  /**
   * Lista paquetes instalados
   */
  async listPackages(deviceId, filter = '') {
    const output = await this.run(`shell pm list packages ${filter}`, deviceId);
    return output.split('\n')
      .filter(l => l.startsWith('package:'))
      .map(l => l.replace('package:', '').trim());
  }

  /**
   * Ejecuta un shell command en el dispositivo
   */
  async shell(deviceId, command) {
    return this.run(`shell "${command}"`, deviceId);
  }

  /**
   * Fuerza detener una app
   */
  async forceStop(deviceId, packageName) {
    return this.run(`shell am force-stop ${packageName}`, deviceId);
  }

  /**
   * Deshabilita una app del sistema
   */
  async disableApp(deviceId, packageName) {
    return this.run(`shell pm disable-user --user 0 ${packageName}`, deviceId);
  }

  /**
   * Habilita una app previamente deshabilitada
   */
  async enableApp(deviceId, packageName) {
    return this.run(`shell pm enable ${packageName}`, deviceId);
  }

  /**
   * Limpia cache de una app
   */
  async clearCache(deviceId, packageName) {
    return this.run(`shell pm clear --cache-only ${packageName}`, deviceId);
  }

  /**
   * Obtiene uso de batería
   */
  async getBatteryInfo(deviceId) {
    const output = await this.run('shell dumpsys battery', deviceId);
    const info = {};
    output.split('\n').forEach(line => {
      const match = line.match(/^\s*(.+?):\s*(.+)$/);
      if (match) info[match[1].trim()] = match[2].trim();
    });
    return info;
  }

  /**
   * Obtiene temperatura del dispositivo
   */
  async getTemperature(deviceId) {
    try {
      const output = await this.run('shell dumpsys battery', deviceId);
      const match = output.match(/temperature:\s*(\d+)/);
      if (match) return parseInt(match[1]) / 10; // decigrados → grados
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene lista de procesos activos
   */
  async getRunningProcesses(deviceId) {
    const output = await this.run('shell ps -A -o PID,NAME,ARGS', deviceId);
    return output.split('\n').slice(1).map(line => {
      const parts = line.trim().split(/\s+/);
      return { pid: parts[0], name: parts[1], args: parts.slice(2).join(' ') };
    }).filter(p => p.name);
  }

  /**
   * Obtiene apps más usadas (via usage stats)
   */
  async getUsageStats(deviceId, days = 7) {
    try {
      const output = await this.run(
        `shell dumpsys usagestats --since ${Date.now() - days * 86400000}`,
        deviceId
      );
      // Parse simplificado
      const apps = [];
      const lines = output.split('\n');
      let currentPkg = null;
      for (const line of lines) {
        const pkgMatch = line.match(/package=(\S+)/);
        if (pkgMatch) currentPkg = pkgMatch[1];
        const timeMatch = line.match(/totalTime=(\d+)/);
        if (timeMatch && currentPkg) {
          apps.push({ package: currentPkg, totalTimeMs: parseInt(timeMatch[1]) });
        }
      }
      return apps.sort((a, b) => b.totalTimeMs - a.totalTimeMs);
    } catch {
      return [];
    }
  }

  /**
   * Ajusta escala de animación
   */
  async setAnimationScale(deviceId, scale = 0) {
    await this.run(`shell settings put global window_animation_scale ${scale}`, deviceId);
    await this.run(`shell settings put global transition_animation_scale ${scale}`, deviceId);
    await this.run(`shell settings put global animator_duration_scale ${scale}`, deviceId);
  }

  /**
   * Activa modo rendimiento máximo
   */
  async setPerformanceMode(deviceId) {
    // GPU rendering forzado
    await this.run('shell setprop debug.hwui.renderer skiagl', deviceId);
    // Forzar GPU para 2D
    await this.run('shell settings put global force_gpu_rendering 1', deviceId);
    // Deshabilitar verificación de overlays
    await this.run('shell settings put global verifier_verify_adb_installs 0', deviceId);
  }

  /**
   * Optimiza memoria RAM
   */
  async optimizeMemory(deviceId) {
    // Limpiar cache del sistema
    await this.run('shell sync', deviceId);
    await this.run('shell echo 3 > /proc/sys/vm/drop_caches', deviceId).catch(() => {});
    // Ajustar swappiness
    await this.run('shell "echo 60 > /proc/sys/vm/swappiness"', deviceId).catch(() => {});
  }

  /**
   * Desactiva servicios innecesarios
   */
  async disableBackgroundServices(deviceId, services) {
    const results = [];
    for (const svc of services) {
      try {
        await this.run(`shell settings put global ${svc} 0`, deviceId);
        results.push({ service: svc, status: 'disabled' });
      } catch (err) {
        results.push({ service: svc, status: 'error', error: err.message });
      }
    }
    return results;
  }

  /**
   * Redraw / refrescar interfaz
   */
  async refreshUI(deviceId) {
    await this.run('shell am broadcast -a android.intent.action.CONFIGURATION_CHANGED', deviceId);
  }

  _parseProps(parts) {
    const props = {};
    parts.forEach(p => {
      if (p.includes(':')) {
        const [key, val] = p.split(':');
        props[key] = val;
      }
    });
    return props;
  }
}

module.exports = new ADBClient();
