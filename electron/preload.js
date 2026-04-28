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

  // Events
  onScriptOutput: (callback) => {
    ipcRenderer.on('script-output', (event, data) => callback(data));
  },
});
