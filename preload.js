const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('optimizer', {
  // ── Device ──
  detectDevice: () => ipcRenderer.invoke('detect-device'),
  runOptimization: (opts) => ipcRenderer.invoke('run-optimization', opts),
  getDeviceLogs: (opts) => ipcRenderer.invoke('get-device-logs', opts),
  getRealTimeMetrics: (opts) => ipcRenderer.invoke('get-real-time-metrics', opts),
  getDeviceProfile: (opts) => ipcRenderer.invoke('get-device-profile', opts),
  getSmartInsights: (opts) => ipcRenderer.invoke('get-smart-insights', opts),
  updateProfileSnapshot: (opts) => ipcRenderer.invoke('update-profile-snapshot', opts),

  // ── WiFi ──
  wifiConnect: (opts) => ipcRenderer.invoke('wifi-connect', opts),
  wifiVerify: (opts) => ipcRenderer.invoke('wifi-verify', opts),
  wifiDisconnect: (opts) => ipcRenderer.invoke('wifi-disconnect', opts),

  // ── Backup ──
  createBackup: (opts) => ipcRenderer.invoke('create-backup', opts),
  listBackups: (opts) => ipcRenderer.invoke('list-backups', opts),
  rollback: (opts) => ipcRenderer.invoke('rollback', opts),

  // ── Auto Mode ──
  autoModeToggle: (opts) => ipcRenderer.invoke('auto-mode-toggle', opts),
  autoModeStatus: () => ipcRenderer.invoke('auto-mode-status'),

  // ── Scheduler ──
  schedulerAddJob: (opts) => ipcRenderer.invoke('scheduler-add-job', opts),
  schedulerRemoveJob: (opts) => ipcRenderer.invoke('scheduler-remove-job', opts),
  schedulerToggleJob: (opts) => ipcRenderer.invoke('scheduler-toggle-job', opts),
  schedulerListJobs: () => ipcRenderer.invoke('scheduler-list-jobs'),
  schedulerStart: () => ipcRenderer.invoke('scheduler-start'),
  schedulerStop: () => ipcRenderer.invoke('scheduler-stop'),

  // ── Notifications ──
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  getNotificationHistory: (opts) => ipcRenderer.invoke('get-notification-history', opts),

  // ── Errors ──
  getErrorStats: () => ipcRenderer.invoke('get-error-stats'),
  getRecentErrors: (opts) => ipcRenderer.invoke('get-recent-errors', opts),

  // ── Benchmark ──
  runBenchmark: (opts) => ipcRenderer.invoke('run-benchmark', opts),
  compareBenchmark: (opts) => ipcRenderer.invoke('compare-benchmark', opts),

  // ── Anomaly Detection ──
  detectAnomalies: (opts) => ipcRenderer.invoke('detect-anomalies', opts),

  // ── Failure Prediction (Ciclo 5) ──
  predictFailures: (opts) => ipcRenderer.invoke('predict-failures', opts),
  predictNonLinear: (opts) => ipcRenderer.invoke('predict-non-linear', opts),

  // ── Proactive Optimizer (Ciclo 5) ──
  analyzeProactive: (opts) => ipcRenderer.invoke('analyze-proactive', opts),

  // ── Turbo Mode (Ciclo 5) ──
  runTurbo: (opts) => ipcRenderer.invoke('run-turbo', opts),
  turboActivate: (opts) => ipcRenderer.invoke('turbo-activate', opts),
  turboDeactivate: (opts) => ipcRenderer.invoke('turbo-deactivate', opts),
  turboStatus: (opts) => ipcRenderer.invoke('turbo-status', opts),

  // ── Guardian Mode (Ciclo 6) ──
  guardianStatus: (opts) => ipcRenderer.invoke('guardian-status', opts),
  guardianStart: (opts) => ipcRenderer.invoke('guardian-start', opts),
  guardianStop: (opts) => ipcRenderer.invoke('guardian-stop', opts),

  // ── Report Export (Ciclo 5) ──
  exportReport: (opts) => ipcRenderer.invoke('export-report', opts),
  listReports: () => ipcRenderer.invoke('list-reports'),

  // ── PDF Export (Ciclo 6) ──
  exportPDF: (opts) => ipcRenderer.invoke('export-pdf', opts),

  // ── Advanced Export (Ciclo 7) ──
  advancedExport: (opts) => ipcRenderer.invoke('advanced-export', opts),

  // ── System Info (Ciclo 7) ──
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // ── Telemetry (Ciclo 7) ──
  getTelemetry: (opts) => ipcRenderer.invoke('get-telemetry', opts),

  // ── Hybrid AI Metrics (Ciclo 7) ──
  getHybridAIMetrics: () => ipcRenderer.invoke('get-hybrid-ai-metrics'),

  // ── Plugins (Ciclo 7) ──
  listPlugins: () => ipcRenderer.invoke('list-plugins'),

  // ── Advanced Plugin System ──
  listAdvancedPlugins: () => ipcRenderer.invoke('list-advanced-plugins'),
  toggleAdvancedPlugin: (opts) => ipcRenderer.invoke('toggle-advanced-plugin', opts),
  runPluginHook: (opts) => ipcRenderer.invoke('run-plugin-hook', opts),
  runPluginScript: (opts) => ipcRenderer.invoke('run-plugin-script', opts),
  reloadPlugins: () => ipcRenderer.invoke('reload-plugins'),
  getPluginAPI: () => ipcRenderer.invoke('get-plugin-api'),

  // ── Settings ──
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', { key, value }),
  getSetting: (key) => ipcRenderer.invoke('get-setting', { key }),

  // ── Advanced Diagnostics ──
  runAdvancedDiagnostics: (opts) => ipcRenderer.invoke('run-advanced-diagnostics', opts),

  // ── Extensions ──
  listExtensions: () => ipcRenderer.invoke('list-extensions'),
  toggleExtension: (opts) => ipcRenderer.invoke('toggle-extension', opts),
  runExtensionScript: (opts) => ipcRenderer.invoke('run-extension-script', opts),

  // ── Events ──
  onAutoModeStatus: (callback) => {
    ipcRenderer.on('auto-mode-status', (_e, data) => callback(data));
  },
});
