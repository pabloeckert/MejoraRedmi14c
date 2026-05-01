/**
 * Device Manager - Detección y gestión de dispositivos
 * Identifica si es Pablo o Sindy, primera conexión, etc.
 */

const fs = require('fs-extra');
const path = require('path');
const adb = require('../adb/adbClient');

const DEVICES_DIR = path.join(__dirname, '..', '..', 'devices');
const PROFILES_FILE = path.join(DEVICES_DIR, 'profiles.json');

// Perfiles conocidos (serial → owner)
const KNOWN_DEVICES = {
  // Se llenan dinámicamente al conectar por primera vez
};

/**
 * Detecta el dispositivo conectado vía ADB
 * @returns {Object} { deviceId, owner, firstConnection, profilePath, deviceInfo }
 */
async function detectDevice() {
  const devices = await adb.listDevices();

  if (devices.length === 0) {
    throw new Error('No se detectó ningún dispositivo Android conectado.\n\n' +
      'Verifica que:\n' +
      '1. El teléfono esté conectado por USB\n' +
      '2. La depuración USB esté activada\n' +
      '3. Hayas aceptado la autorización en el teléfono');
  }

  const device = devices[0]; // Tomamos el primer dispositivo
  const deviceId = device.serial;

  // Obtener info detallada
  const deviceInfo = await adb.getDeviceInfo(deviceId);

  // Cargar o crear perfil
  const profiles = await _loadProfiles();
  const existingProfile = profiles[deviceId];

  const firstConnection = !existingProfile;

  const profile = existingProfile || {
    deviceId,
    owner: null, // Se asigna manualmente o por patrón
    deviceInfo,
    firstConnected: new Date().toISOString(),
    connections: 0,
    lastConnection: null,
    optimizations: [],
  };

  profile.connections += 1;
  profile.lastConnection = new Date().toISOString();
  profile.deviceInfo = deviceInfo; // Actualizar info

  profiles[deviceId] = profile;
  await _saveProfiles(profiles);

  const profilePath = path.join(DEVICES_DIR, `${deviceId}.json`);
  await fs.writeJson(profilePath, profile, { spaces: 2 });

  return {
    deviceId,
    owner: profile.owner || 'Desconocido',
    firstConnection,
    profilePath,
    deviceInfo,
    profile,
  };
}

/**
 * Asigna un dueño al dispositivo
 */
async function assignOwner(deviceId, owner) {
  const profiles = await _loadProfiles();
  if (profiles[deviceId]) {
    profiles[deviceId].owner = owner;
    await _saveProfiles(profiles);
  }
}

/**
 * Lista todos los dispositivos conocidos
 */
async function listKnownDevices() {
  const profiles = await _loadProfiles();
  return Object.values(profiles);
}

async function _loadProfiles() {
  try {
    await fs.ensureDir(DEVICES_DIR);
    if (await fs.pathExists(PROFILES_FILE)) {
      return await fs.readJson(PROFILES_FILE);
    }
  } catch {}
  return {};
}

async function _saveProfiles(profiles) {
  await fs.ensureDir(DEVICES_DIR);
  await fs.writeJson(PROFILES_FILE, profiles, { spaces: 2 });
}

module.exports = { detectDevice, assignOwner, listKnownDevices };
