/**
 * Screen Control - Mantener pantalla encendida durante conexión
 * Guarda valores originales, aplica keep-awake, restaura al desconectar
 * y reinicia el dispositivo tras optimización exitosa
 */

const fs = require('fs-extra');
const path = require('path');
const adb = require('../adb/adbClient');

const DEVICE_STATE_DIR = path.join(__dirname, '..', '..', 'logs', 'device_state');
const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'screenControl.log');

/**
 * Asegura que el directorio de estado existe
 */
async function _ensureDirs() {
  await fs.ensureDir(DEVICE_STATE_DIR);
  await fs.ensureDir(path.dirname(LOG_FILE));
}

/**
 * Escribe evento en screenControl.log
 */
async function _log(event, deviceId, detail = '') {
  await _ensureDirs();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${event}] device=${deviceId} ${detail}\n`;
  await fs.appendFile(LOG_FILE, line);
}

/**
 * Obtiene y guarda los valores originales del dispositivo
 * @param {string} deviceId - Serial del dispositivo
 * @returns {Object} Valores originales
 */
async function getOriginalSettings(deviceId) {
  await _ensureDirs();

  const stateFile = path.join(DEVICE_STATE_DIR, `${deviceId}.json`);

  // Si ya existe estado guardado, devolverlo
  if (await fs.pathExists(stateFile)) {
    try {
      const existing = await fs.readJson(stateFile);
      if (existing.screen_off_timeout !== undefined) {
        return existing;
      }
    } catch {}
  }

  // Obtener valores actuales via ADB
  let screenTimeout = '60000'; // default fallback
  try {
    const raw = await adb.run('shell settings get system screen_off_timeout', deviceId);
    if (raw && raw !== 'null' && raw !== '') {
      screenTimeout = raw.trim();
    }
  } catch (e) {
    console.warn(`[SCREEN] No se pudo obtener timeout original: ${e.message}`);
  }

  let stayOn = 'false';
  try {
    const raw = await adb.run('shell settings get global stay_on_while_plugged_in', deviceId);
    if (raw) stayOn = raw.trim();
  } catch {}

  let lockDisabled = 'false';
  try {
    const raw = await adb.run('shell locksettings get-disabled', deviceId);
    if (raw) lockDisabled = raw.trim();
  } catch {}

  const original = {
    deviceId,
    screen_off_timeout: screenTimeout,
    stay_on_while_plugged_in: stayOn,
    lock_disabled: lockDisabled,
    saved_at: new Date().toISOString(),
  };

  await fs.writeJson(stateFile, original, { spaces: 2 });
  await _log('saved_originals', deviceId, `timeout=${screenTimeout}`);

  return original;
}

/**
 * Aplica configuración de pantalla siempre encendida
 * @param {string} deviceId - Serial del dispositivo
 * @returns {Object} Resultado de cada operación
 */
async function applyKeepAwake(deviceId) {
  const results = {
    timeout: false,
    stayon: false,
    lockDisabled: false,
    errors: [],
  };

  // 1. Timeout máximo (2147483647 ms ≈ 24.8 días)
  try {
    await adb.run('shell settings put system screen_off_timeout 2147483647', deviceId);
    results.timeout = true;
  } catch (e) {
    results.errors.push(`timeout: ${e.message}`);
  }

  // 2. Mantener encendido al estar conectado (USB/AC)
  try {
    await adb.run('shell svc power stayon true', deviceId);
    results.stayon = true;
  } catch (e) {
    results.errors.push(`stayon: ${e.message}`);
  }

  // 3. Desactivar bloqueo de pantalla
  try {
    await adb.run('shell locksettings set-disabled true', deviceId);
    results.lockDisabled = true;
  } catch (e) {
    results.errors.push(`lock: ${e.message}`);
  }

  const allOk = results.timeout && results.stayon && results.lockDisabled;
  await _log('applied', deviceId, `ok=${allOk} errors=${results.errors.length}`);

  return results;
}

/**
 * Restaura los valores originales del dispositivo
 * @param {string} deviceId - Serial del dispositivo
 * @returns {Object} Resultado de cada operación
 */
async function restoreSettings(deviceId) {
  const results = {
    timeout: false,
    stayon: false,
    lockDisabled: false,
    errors: [],
  };

  const stateFile = path.join(DEVICE_STATE_DIR, `${deviceId}.json`);
  let original = null;

  try {
    if (await fs.pathExists(stateFile)) {
      original = await fs.readJson(stateFile);
    }
  } catch {}

  // 1. Restaurar timeout original (o 60s si no hay guardado)
  const timeoutValue = original?.screen_off_timeout || '60000';
  try {
    await adb.run(`shell settings put system screen_off_timeout ${timeoutValue}`, deviceId);
    results.timeout = true;
  } catch (e) {
    results.errors.push(`timeout: ${e.message}`);
  }

  // 2. Restaurar suspensión normal
  try {
    await adb.run('shell svc power stayon false', deviceId);
    results.stayon = true;
  } catch (e) {
    results.errors.push(`stayon: ${e.message}`);
  }

  // 3. Restaurar bloqueo de pantalla
  try {
    await adb.run('shell locksettings set-disabled false', deviceId);
    results.lockDisabled = true;
  } catch (e) {
    results.errors.push(`lock: ${e.message}`);
  }

  // Limpiar archivo de estado
  try {
    await fs.remove(stateFile);
  } catch {}

  const allOk = results.timeout && results.stayon && results.lockDisabled;
  await _log('restored', deviceId, `ok=${allOk} timeout=${timeoutValue} errors=${results.errors.length}`);

  return results;
}

/**
 * Reinicia el dispositivo
 * @param {string} deviceId - Serial del dispositivo
 * @returns {boolean} true si se envió el comando
 */
async function rebootDevice(deviceId) {
  try {
    await _log('rebooting', deviceId);
    await adb.run('reboot', deviceId);
    await _log('rebooted', deviceId);
    return true;
  } catch (e) {
    await _log('reboot_error', deviceId, e.message);
    return false;
  }
}

module.exports = {
  getOriginalSettings,
  applyKeepAwake,
  restoreSettings,
  rebootDevice,
};
