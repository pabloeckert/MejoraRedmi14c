const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('optimizer', {
  detectDevice: () => ipcRenderer.invoke('detect-device'),
  runOptimization: (opts) => ipcRenderer.invoke('run-optimization', opts),
  getDeviceLogs: (opts) => ipcRenderer.invoke('get-device-logs', opts),
  getRealTimeMetrics: (opts) => ipcRenderer.invoke('get-real-time-metrics', opts),
  getDeviceProfile: (opts) => ipcRenderer.invoke('get-device-profile', opts),
  getSmartInsights: (opts) => ipcRenderer.invoke('get-smart-insights', opts),
  updateProfileSnapshot: (opts) => ipcRenderer.invoke('update-profile-snapshot', opts),
});
