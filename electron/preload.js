const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ADB
  checkADB: () => ipcRenderer.invoke('adb-check'),
  listDevices: () => ipcRenderer.invoke('adb-devices'),
  execCommand: (cmd) => ipcRenderer.invoke('adb-exec', cmd),
  getDeviceInfo: () => ipcRenderer.invoke('device-info'),

  // File operations
  saveScript: (content, name) => ipcRenderer.invoke('save-script', content, name),
  runScript: (path) => ipcRenderer.invoke('run-script', path),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('update-check'),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, data) => callback(data));
  },

  // Events
  onScriptOutput: (callback) => {
    ipcRenderer.on('script-output', (event, data) => callback(data));
  },
});
