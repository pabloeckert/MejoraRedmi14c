const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('optimizer', {
  detectDevice: () => ipcRenderer.invoke('detect-device'),
  runOptimization: (opts) => ipcRenderer.invoke('run-optimization', opts),
  getDeviceLogs: (opts) => ipcRenderer.invoke('get-device-logs', opts),
});
