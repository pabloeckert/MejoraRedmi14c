/**
 * Optimizer Engine - Orquestador principal
 * Decide qué motor de optimización usar según el caso
 * Integrado con backup/rollback automático
 */

const { maxOptimization } = require('./maxOptimization');
const { smartOptimization } = require('./smartOptimization');
const backupManager = require('./backupManager');
const errorHandler = require('./errorHandler');

/**
 * Ejecuta la optimización apropiada según el tipo de conexión
 * @param {string} deviceId - Serial del dispositivo
 * @param {boolean} firstConnection - Si es la primera conexión
 * @param {Object} opts - Opciones adicionales { skipBackup, skipRollback }
 * @returns {Object} Resultado de la optimización
 */
async function runOptimization(deviceId, firstConnection, opts = {}) {
  console.log(`[ENGINE] Dispositivo: ${deviceId} | Primera conexión: ${firstConnection}`);

  // ── Backup pre-optimización ──
  let backup = null;
  if (!opts.skipBackup) {
    try {
      console.log('[ENGINE] Creando backup pre-optimización...');
      backup = await backupManager.createBackup(deviceId);
    } catch (err) {
      errorHandler.handle(err, 'engine.backup');
      console.warn('[ENGINE] Backup falló, continuando sin backup...');
    }
  }

  try {
    let result;

    if (firstConnection) {
      console.log('[ENGINE] → Modo MAX: Optimización máxima absoluta');
      result = await maxOptimization(deviceId);
    } else {
      console.log('[ENGINE] → Modo SMART: Optimización inteligente');
      result = await smartOptimization(deviceId);
    }

    // Verificar resultado
    if (!result.success && result.errors?.length > 3) {
      console.log('[ENGINE] Muchos errores detectados, considerando rollback...');
      if (!opts.skipRollback && backup) {
        console.log('[ENGINE] Ejecutando rollback automático...');
        const rollbackResult = await backupManager.rollback(deviceId, backup);
        result._rollback = rollbackResult;
        result._rolledBack = true;
      }
    }

    return result;

  } catch (err) {
    errorHandler.handle(err, 'engine.run');

    // Rollback en caso de error crítico
    if (!opts.skipRollback && backup) {
      try {
        console.log('[ENGINE] Error crítico — ejecutando rollback...');
        const rollbackResult = await backupManager.rollback(deviceId, backup);
        throw Object.assign(err, { _rollback: rollbackResult, _rolledBack: true });
      } catch (rollbackErr) {
        if (rollbackErr._rolledBack) throw rollbackErr;
        errorHandler.handle(rollbackErr, 'engine.rollback');
      }
    }

    throw err;
  }
}

module.exports = { runOptimization };
