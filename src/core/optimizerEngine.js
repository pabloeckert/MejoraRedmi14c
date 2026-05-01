/**
 * Optimizer Engine - Orquestador principal
 * Decide qué motor de optimización usar según el caso
 */

const { maxOptimization } = require('./maxOptimization');
const { smartOptimization } = require('./smartOptimization');

/**
 * Ejecuta la optimización apropiada según el tipo de conexión
 * @param {string} deviceId - Serial del dispositivo
 * @param {boolean} firstConnection - Si es la primera conexión
 * @returns {Object} Resultado de la optimización
 */
async function runOptimization(deviceId, firstConnection) {
  console.log(`[ENGINE] Dispositivo: ${deviceId} | Primera conexión: ${firstConnection}`);

  if (firstConnection) {
    console.log('[ENGINE] → Modo MAX: Optimización máxima absoluta');
    return await maxOptimization(deviceId);
  } else {
    console.log('[ENGINE] → Modo SMART: Optimización inteligente');
    return await smartOptimization(deviceId);
  }
}

module.exports = { runOptimization };
