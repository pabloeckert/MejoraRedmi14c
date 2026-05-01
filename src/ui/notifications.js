/**
 * Notifications - Sistema de notificaciones del PC
 * Usa Electron Notification API
 */

const { Notification } = require('electron');
const fs = require('fs-extra');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const NOTIFICATIONS_LOG = path.join(LOGS_DIR, 'notifications.log');

// Cola de notificaciones (para cuando la app no está enfocada)
const notificationQueue = [];
let isProcessing = false;

/**
 * Envía una notificación al sistema
 */
function sendNotification({ title, body, type = 'info', silent = false }) {
  const entry = {
    timestamp: new Date().toISOString(),
    title,
    body,
    type,
  };

  // Log a archivo
  _logNotification(entry);

  // Intentar notificación del sistema
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title,
        body,
        silent,
        icon: _getIcon(type),
      });

      notif.show();

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        try { notif.close(); } catch {}
      }, 5000);

      return true;
    }
  } catch (err) {
    console.warn('[NOTIF] Error enviando notificación:', err.message);
  }

  // Si no se pudo, agregar a cola para UI
  notificationQueue.push(entry);
  return false;
}

/**
 * Obtiene notificaciones pendientes (para UI)
 */
function getPendingNotifications() {
  const pending = [...notificationQueue];
  notificationQueue.length = 0;
  return pending;
}

/**
 * Obtiene historial de notificaciones
 */
async function getNotificationHistory(limit = 50) {
  try {
    if (await fs.pathExists(NOTIFICATIONS_LOG)) {
      const content = await fs.readFile(NOTIFICATIONS_LOG, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);
    }
  } catch {}
  return [];
}

/**
 * Limpia notificaciones antiguas del log
 */
async function cleanOldNotifications(keepLast = 200) {
  try {
    if (await fs.pathExists(NOTIFICATIONS_LOG)) {
      const content = await fs.readFile(NOTIFICATIONS_LOG, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length > keepLast) {
        const kept = lines.slice(-keepLast);
        await fs.writeFile(NOTIFICATIONS_LOG, kept.join('\n') + '\n');
      }
    }
  } catch {}
}

async function _logNotification(entry) {
  try {
    await fs.ensureDir(LOGS_DIR);
    await fs.appendFile(NOTIFICATIONS_LOG, JSON.stringify(entry) + '\n');
  } catch {}
}

function _getIcon(type) {
  // Electron necesita un path de icono — usamos null por defecto
  return undefined;
}

module.exports = { sendNotification, getPendingNotifications, getNotificationHistory, cleanOldNotifications };
