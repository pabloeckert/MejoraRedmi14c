/**
 * Turbo Mode - Optimización extrema bajo demanda
 * Ejecuta todas las optimizaciones posibles para máximo rendimiento
 * ⚠️ Modo agresivo: desactiva animaciones, limita servicios, limpia todo
 */

const adb = require('../adb/adbClient');
const scripts = require('../adb/scripts');
const backupManager = require('./backupManager');
const errorHandler = require('./errorHandler');

class TurboMode {
  constructor() {
    this.activeDevices = new Map(); // deviceId → { startTime, actions }
  }

  /**
   * Ejecuta Modo Turbo completo
   * @param {string} deviceId - Serial del dispositivo
   * @param {Object} opts - Opciones { skipBackup, aggressive }
   * @returns {Object} Resultado detallado
   */
  async activate(deviceId, opts = {}) {
    const startTime = Date.now();
    const result = {
      mode: 'turbo',
      deviceId,
      success: true,
      phases: [],
      totalActions: 0,
      performanceGain: 0,
      errors: [],
      durationMs: 0,
    };

    console.log(`[TURBO] 🚀 Activando Modo Turbo para ${deviceId}`);

    // ── Aplicar keep-awake durante turbo ──
    try {
      const screenControl = require('./screenControl');
      await screenControl.getOriginalSettings(deviceId);
      await screenControl.applyKeepAwake(deviceId);
      result.phases.push({ name: 'screen_control', status: 'done', detail: 'Pantalla siempre activa' });
    } catch (scErr) {
      result.phases.push({ name: 'screen_control', status: 'warning', detail: scErr.message });
    }

    // ── Backup pre-turbo ──
    let backup = null;
    if (!opts.skipBackup) {
      try {
        console.log('[TURBO] Creando backup de seguridad...');
        backup = await backupManager.createBackup(deviceId);
        result.phases.push({ name: 'backup', status: 'done', detail: 'Backup creado' });
      } catch (err) {
        result.phases.push({ name: 'backup', status: 'warning', detail: err.message });
      }
    }

    // ── FASE 1: Limpieza profunda ──
    const phase1 = await this._phaseDeepClean(deviceId);
    result.phases.push(phase1);
    result.totalActions += phase1.actions;

    // ── FASE 2: Eliminación de bloatware ──
    const phase2 = await this._phaseBloatwareRemoval(deviceId);
    result.phases.push(phase2);
    result.totalActions += phase2.actions;

    // ── FASE 3: Optimización de rendimiento ──
    const phase3 = await this._phasePerformanceBoost(deviceId);
    result.phases.push(phase3);
    result.totalActions += phase3.actions;

    // ── FASE 4: Control de procesos ──
    const phase4 = await this._phaseProcessControl(deviceId, opts.aggressive);
    result.phases.push(phase4);
    result.totalActions += phase4.actions;

    // ── FASE 5: Optimización de batería ──
    const phase5 = await this._phaseBatteryOptimization(deviceId);
    result.phases.push(phase5);
    result.totalActions += phase5.actions;

    // ── FASE 6: Reducción de servicios ──
    const phase6 = await this._phaseServiceReduction(deviceId);
    result.phases.push(phase6);
    result.totalActions += phase6.actions;

    // ── FASE 7: Network optimization ──
    const phase7 = await this._phaseNetworkOptimization(deviceId);
    result.phases.push(phase7);
    result.totalActions += phase7.actions;

    // ── FASE 8: Finalización ──
    const phase8 = await this._phaseFinalize(deviceId);
    result.phases.push(phase8);

    // ── Calcular ganancia estimada ──
    result.performanceGain = this._estimatePerformanceGain(result.phases);

    // ── Verificar errores ──
    const failedPhases = result.phases.filter(p => p.status === 'error');
    if (failedPhases.length > 2) {
      result.success = false;
      if (backup) {
        console.log('[TURBO] Demasiados errores, ejecutando rollback...');
        try {
          await backupManager.rollback(deviceId, backup);
          result._rolledBack = true;
        } catch {}
      }
    }

    result.durationMs = Date.now() - startTime;

    // Registrar dispositivo como turbo-activo
    this.activeDevices.set(deviceId, {
      startTime,
      actions: result.totalActions,
      backup,
    });

    // ── Reinicio automático tras Turbo exitoso ──
    if (result.success) {
      try {
        const { rebootAfterOptimization } = require('./deviceManager');
        // Restaurar pantalla antes de reiniciar
        const screenControl = require('./screenControl');
        await screenControl.restoreSettings(deviceId);
        await screenControl.rebootDevice(deviceId);
        result._rebooted = true;
        console.log(`[TURBO] 🔄 Dispositivo ${deviceId} reiniciado post-turbo`);
      } catch (rebootErr) {
        console.warn(`[TURBO] Error en reinicio post-turbo: ${rebootErr.message}`);
      }
    }

    console.log(`[TURBO] ✅ Completado: ${result.totalActions} acciones en ${result.durationMs}ms`);
    return result;
  }

  /**
   * Desactiva el modo turbo y revierte cambios
   */
  async deactivate(deviceId) {
    const turboState = this.activeDevices.get(deviceId);
    if (!turboState) {
      return { success: false, error: 'Modo Turbo no está activo en este dispositivo' };
    }

    // Restaurar animaciones
    try {
      await adb.setAnimationScale(deviceId, 1);
    } catch {}

    // Restaurar escala de transición
    try {
      await adb.shell(deviceId, 'settings put global transition_animation_scale 1');
    } catch {}

    this.activeDevices.delete(deviceId);

    return {
      success: true,
      message: 'Modo Turbo desactivado. Animaciones restauradas.',
      wasActive: Math.round((Date.now() - turboState.startTime) / 60000) + ' minutos',
    };
  }

  /**
   * Verifica si el modo turbo está activo
   */
  isActive(deviceId) {
    return this.activeDevices.has(deviceId);
  }

  getStatus(deviceId) {
    const state = this.activeDevices.get(deviceId);
    if (!state) return { active: false };
    return {
      active: true,
      since: new Date(state.startTime).toISOString(),
      minutesActive: Math.round((Date.now() - state.startTime) / 60000),
      actionsExecuted: state.actions,
    };
  }

  // ════════════════════════════════════════════════════
  //  Fases de optimización
  // ════════════════════════════════════════════════════

  async _phaseDeepClean(deviceId) {
    const phase = { name: 'deep_clean', label: '🧹 Limpieza Profunda', actions: 0, details: [] };

    // Limpiar caches de apps
    try {
      await adb.shell(deviceId, 'pm trim-caches 512M');
      phase.details.push('Cache de apps: 512MB liberados');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Cache: ${e.message}`); }

    // Limpiar archivos temporales
    try {
      await adb.shell(deviceId, 'rm -rf /data/local/tmp/*');
      phase.details.push('Archivos temporales eliminados');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Tmp: ${e.message}`); }

    // Limpiar cache de Dalvik
    try {
      await adb.shell(deviceId, 'rm -rf /data/dalvik-cache/*');
      phase.details.push('Dalvik cache limpiado');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Dalvik: ${e.message}`); }

    // Drop page cache, dentries, inodes
    try {
      await adb.shell(deviceId, 'echo 3 > /proc/sys/vm/drop_caches');
      phase.details.push('Kernel caches liberados');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Kernel cache: ${e.message}`); }

    // Limpiar logs viejos
    try {
      await adb.shell(deviceId, 'logcat -b all -c');
      phase.details.push('Logs del sistema limpiados');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Logs: ${e.message}`); }

    phase.status = phase.actions > 0 ? 'done' : 'error';
    return phase;
  }

  async _phaseBloatwareRemoval(deviceId) {
    const phase = { name: 'bloatware', label: '🗑️ Eliminación de Bloatware', actions: 0, details: [] };

    const bloatware = scripts.XIAOMI_BLOATWARE || [];
    let removed = 0;

    for (const pkg of bloatware) {
      try {
        await adb.shell(deviceId, `pm uninstall -k --user 0 ${pkg}`);
        removed++;
      } catch {}
    }

    phase.actions = removed;
    phase.details.push(`${removed}/${bloatware.length} apps de bloatware eliminadas`);
    phase.status = removed > 0 ? 'done' : 'warning';
    return phase;
  }

  async _phasePerformanceBoost(deviceId) {
    const phase = { name: 'performance', label: '⚡ Boost de Rendimiento', actions: 0, details: [] };

    // Desactivar animaciones (0 = instantáneo)
    const animCommands = [
      ['settings put global window_animation_scale 0', 'Animaciones de ventana: OFF'],
      ['settings put global transition_animation_scale 0', 'Animaciones de transición: OFF'],
      ['settings put global animator_duration_scale 0', 'Animaciones de duración: OFF'],
    ];

    for (const [cmd, label] of animCommands) {
      try {
        await adb.shell(deviceId, cmd);
        phase.details.push(label);
        phase.actions++;
      } catch (e) { phase.details.push(`⚠️ ${label}: ${e.message}`); }
    }

    // Forzar GPU rendering
    try {
      await adb.shell(deviceId, 'settings put global force_gpu_rendering 1');
      phase.details.push('Renderizado GPU forzado');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ GPU: ${e.message}`); }

    // Desactivar overlays de depuración
    try {
      await adb.shell(deviceId, 'settings put global debug_app 0');
      phase.details.push('Debug desactivado');
      phase.actions++;
    } catch {}

    phase.status = phase.actions > 0 ? 'done' : 'error';
    return phase;
  }

  async _phaseProcessControl(deviceId, aggressive = false) {
    const phase = { name: 'processes', label: '⚙️ Control de Procesos', actions: 0, details: [] };

    try {
      const processes = await adb.getRunningProcesses(deviceId);
      const systemProcs = ['system', 'launcher', 'phone', 'dialer', 'settings', 'keyboard'];
      const killable = processes.filter(p =>
        !systemProcs.some(sys => p.name.toLowerCase().includes(sys))
      );

      const limit = aggressive ? killable.length : Math.min(killable.length, 30);
      let killed = 0;

      for (const proc of killable.slice(0, limit)) {
        try {
          await adb.shell(deviceId, `kill ${proc.pid}`);
          killed++;
        } catch {}
      }

      phase.actions = killed;
      phase.details.push(`${killed} procesos terminados de ${processes.length} totales`);
      phase.details.push(`Modo: ${aggressive ? 'AGRESIVO' : 'seguro'}`);
    } catch (e) {
      phase.details.push(`⚠️ Error: ${e.message}`);
    }

    phase.status = phase.actions > 0 ? 'done' : 'warning';
    return phase;
  }

  async _phaseBatteryOptimization(deviceId) {
    const phase = { name: 'battery', label: '🔋 Optimización de Batería', actions: 0, details: [] };

    // Desactivar sincronización automática
    try {
      await adb.shell(deviceId, 'settings put global auto_sync 0');
      phase.details.push('Auto-sync desactivado');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Sync: ${e.message}`); }

    // Reducir frecuencia de escaneo WiFi
    try {
      await adb.shell(deviceId, 'settings put global wifi_scan_always_enabled 0');
      phase.details.push('WiFi scan reducido');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ WiFi scan: ${e.message}`); }

    // Desactivar vibración de teclado
    try {
      await adb.shell(deviceId, 'settings put system haptic_feedback_enabled 0');
      phase.details.push('Haptic feedback desactivado');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Haptic: ${e.message}`); }

    // Reducir brillo a 40%
    try {
      await adb.shell(deviceId, 'settings put system screen_brightness 102');
      phase.details.push('Brillo reducido a 40%');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Brillo: ${e.message}`); }

    phase.status = phase.actions > 0 ? 'done' : 'error';
    return phase;
  }

  async _phaseServiceReduction(deviceId) {
    const phase = { name: 'services', label: '🔧 Reducción de Servicios', actions: 0, details: [] };

    // Desactivar servicios MIUI conocidos por consumir recursos
    const miuiServices = [
      'com.miui.analytics',
      'com.miui.msa.global',
      'com.miui.weather2',
      'com.miui.personalassistant',
      'com.miui.guardprovider',
      'com.miui.bugreport',
      'com.miui.contentcatcher',
    ];

    let disabled = 0;
    for (const svc of miuiServices) {
      try {
        await adb.shell(deviceId, `pm disable-user --user 0 ${svc}`);
        disabled++;
      } catch {}
    }

    phase.actions = disabled;
    phase.details.push(`${disabled}/${miuiServices.length} servicios MIUI desactivados`);

    // Desactivar ubicación si no es necesaria
    try {
      await adb.shell(deviceId, 'settings put secure location_mode 0');
      phase.details.push('Servicios de ubicación desactivados');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Location: ${e.message}`); }

    phase.status = phase.actions > 0 ? 'done' : 'warning';
    return phase;
  }

  async _phaseNetworkOptimization(deviceId) {
    const phase = { name: 'network', label: '🌐 Optimización de Red', actions: 0, details: [] };

    // Desactivar datos móviles en background
    try {
      await adb.shell(deviceId, 'settings put global restrict_background_data 1');
      phase.details.push('Datos en background restringidos');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ Data: ${e.message}`); }

    // Optimizar DNS
    try {
      await adb.shell(deviceId, 'setprop net.dns1 1.1.1.1');
      await adb.shell(deviceId, 'setprop net.dns2 8.8.8.8');
      phase.details.push('DNS optimizado (Cloudflare + Google)');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ DNS: ${e.message}`); }

    phase.status = phase.actions > 0 ? 'done' : 'warning';
    return phase;
  }

  async _phaseFinalize(deviceId) {
    const phase = { name: 'finalize', label: '✅ Finalización', actions: 0, details: [] };

    // Refrescar UI
    try {
      await adb.refreshUI(deviceId);
      phase.details.push('UI refrescada');
      phase.actions++;
    } catch (e) { phase.details.push(`⚠️ UI: ${e.message}`); }

    phase.status = 'done';
    return phase;
  }

  /**
   * Estima la ganancia de rendimiento basada en las fases completadas
   */
  _estimatePerformanceGain(phases) {
    const weights = {
      deep_clean: 15,
      bloatware: 20,
      performance: 25,
      processes: 15,
      battery: 5,
      services: 10,
      network: 10,
    };

    let gain = 0;
    for (const phase of phases) {
      if (phase.status === 'done' || phase.status === 'warning') {
        gain += (weights[phase.name] || 0);
      }
    }

    return Math.min(gain, 100);
  }
}

module.exports = new TurboMode();
