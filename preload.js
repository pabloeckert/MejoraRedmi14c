const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('optimizer', {
  // Device
  detectDevice: () => ipcRenderer.invoke('detect-device'),
  runOptimization: (opts) => ipcRenderer.invoke('run-optimization', opts),
  getDeviceLogs: (opts) => ipcRenderer.invoke('get-device-logs', opts),
  getRealTimeMetrics: (opts) => ipcRenderer.invoke('get-real-time-metrics', opts),
  getDeviceProfile: (opts) => ipcRenderer.invoke('get-device-profile', opts),
  getSmartInsights: (opts) => ipcRenderer.invoke('get-smart-insights', opts),
  updateProfileSnapshot: (opts) => ipcRenderer.invoke('update-profile-snapshot', opts),

  // WiFi
  wifiConnect: (opts) => ipcRenderer.invoke('wifi-connect', opts),
  wifiVerify: (opts) => ipcRenderer.invoke('wifi-verify', opts),
  wifiDisconnect: (opts) => ipcRenderer.invoke('wifi-disconnect', opts),

  // Backup
  createBackup: (opts) => ipcRenderer.invoke('create-backup', opts),
  listBackups: (opts) => ipcRenderer.invoke('list-backups', opts),
  rollback: (opts) => ipcRenderer.invoke('rollback', opts),

  // Auto Mode
  autoModeToggle: (opts) => ipcRenderer.invoke('auto-mode-toggle', opts),
  autoModeStatus: () => ipcRenderer.invoke('auto-mode-status'),

  // Scheduler
  schedulerAddJob: (opts) => ipcRenderer.invoke('scheduler-add-job', opts),
  schedulerRemoveJob: (opts) => ipcRenderer.invoke('scheduler-remove-job', opts),
  schedulerToggleJob: (opts) => ipcRenderer.invoke('scheduler-toggle-job', opts),
  schedulerListJobs: () => ipcRenderer.invoke('scheduler-list-jobs'),
  schedulerStart: () => ipcRenderer.invoke('scheduler-start'),
  schedulerStop: () => ipcRenderer.invoke('scheduler-stop'),

  // Notifications
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  getNotificationHistory: (opts) => ipcRenderer.invoke('get-notification-history', opts),

  // Errors
  getErrorStats: () => ipcRenderer.invoke('get-error-stats'),
  getRecentErrors: (opts) => ipcRenderer.invoke('get-recent-errors', opts),

  // Events
  onAutoModeStatus: (callback) => {
    ipcRenderer.on('auto-mode-status', (_e, data) => callback(data));
  },
});
