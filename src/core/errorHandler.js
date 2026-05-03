/**
 * Error Handler - Manejo centralizado de errores
 * Consolida, clasifica y registra todos los errores
 */

const fs = require('fs-extra');

const path = require('path')
const notifications = require(path.join(__dirname, '..', 'ui', 'notifications.js'))

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const ERROR_LOG = path.join(LOGS_DIR, 'errors.log');

// Contadores para detectar patrones
const errorCounts = new Map(); // context → count
const ERROR_THRESHOLD = 5; // Notificar después de N errores repetidos

/**
 * Maneja un error de forma centralizada
 */
function handle(error, context = 'unknown') {
  const entry = {
    timestamp: new Date().toISOString(),
    context,
    message: error?.message || String(error),
    stack: error?.stack?.split('\n').slice(0, 3).join('\n') || null,
    severity: classifySeverity(error, context),
  };

  // Log a archivo
  _logError(entry);

  // Contar repeticiones
  const count = (errorCounts.get(context) || 0) + 1;
  errorCounts.set(context, count);

  // Notificar si hay muchos errores repetidos
  if (count === ERROR_THRESHOLD) {
    sendNotification({
      title: '⚠️ Errores repetidos detectados',
      body: `${context}: ${count} errores consecutivos`,
      type: 'warning',
    });
  }

  // Log a consola
  const prefix = `[ERROR][${entry.severity.toUpperCase()}][${context}]`;
  console.error(`${prefix} ${entry.message}`);

  return entry;
}

/**
 * Clasifica la severidad del error
 */
function classifySeverity(error, context) {
  const msg = (error?.message || '').toLowerCase();

  // Crítico
  if (msg.includes('device not found') || msg.includes('device offline')) {
    return 'critical';
  }
  if (msg.includes('permission denied') || msg.includes('unauthorized')) {
    return 'critical';
  }

  // Alto
  if (msg.includes('timeout') || msg.includes('connection refused')) {
    return 'high';
  }
  if (context.includes('backup') || context.includes('rollback')) {
    return 'high';
  }

  // Medio
  if (msg.includes('failed') || msg.includes('error')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Resetea contadores de errores (llamar al reconectar)
 */
function resetCounts(context = null) {
  if (context) {
    errorCounts.delete(context);
  } else {
    errorCounts.clear();
  }
}

/**
 * Obtiene estadísticas de errores
 */
function getStats() {
  const stats = {};
  for (const [context, count] of errorCounts) {
    stats[context] = count;
  }
  return {
    byContext: stats,
    total: Array.from(errorCounts.values()).reduce((a, b) => a + b, 0),
  };
}

/**
 * Obtiene los últimos N errores del log
 */
async function getRecentErrors(limit = 20) {
  try {
    if (await fs.pathExists(ERROR_LOG)) {
      const content = await fs.readFile(ERROR_LOG, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
    }
  } catch {}
  return [];
}

async function _logError(entry) {
  try {
    await fs.ensureDir(LOGS_DIR);
    await fs.appendFile(ERROR_LOG, JSON.stringify(entry) + '\n');
  } catch {}
}

module.exports = { handle, classifySeverity, resetCounts, getStats, getRecentErrors };
