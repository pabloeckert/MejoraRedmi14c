# Internal API

## Descripción

API interna que expone funciones clave del sistema para uso programático. Integrable con preload.js vía IPC para comunicación con el proceso principal de Electron.

## Arquitectura

```
internalAPI.js
├── getSystemInfo()                → Información del sistema y módulos
├── runOptimization(deviceId, opts)→ Ejecutar optimización
├── runTurbo(deviceId, opts)       → Ejecutar Modo Turbo
├── getPredictions(deviceId, opts) → Obtener predicciones (local o híbrido)
├── getTelemetry(deviceId, filters)→ Obtener telemetría
├── getTelemetryStats()            → Estadísticas globales de telemetría
├── exportBundle(deviceId, format) → Exportar en cualquier formato
├── startGuardian(deviceId)        → Iniciar Guardian
├── stopGuardian(deviceId)         → Detener Guardian
├── getGuardianStatus(deviceId)    → Estado del Guardian
├── startAutoMode()                → Iniciar Auto Mode
├── stopAutoMode()                 → Detener Auto Mode
├── getAutoModeStatus()            → Estado del Auto Mode
├── configureHybridAI(config)      → Configurar IA híbrida
├── getHybridAIConfig()            → Configuración actual
├── getHybridAIMetrics()           → Métricas de uso
├── listPlugins()                  → Listar plugins
├── executePlugin(id, script)      → Ejecutar plugin
├── togglePlugin(id, enabled)      → Habilitar/deshabilitar plugin
├── getPluginExecutionLog()        → Log de ejecuciones de plugins
├── getLogs(deviceId, filters)     → Obtener logs
└── getErrorStats()                → Estadísticas de errores
```

## Categorías de Funciones

### Optimización
- `runOptimization(deviceId, { firstConnection })` → Ejecuta optimización completa
- `runTurbo(deviceId, { aggressive })` → Ejecuta Modo Turbo

### Predicciones
- `getPredictions(deviceId, { hybrid })` → Predicciones locales o híbridas

### Telemetría
- `getTelemetry(deviceId, { type, category, since, limit })` → Eventos filtrados
- `getTelemetryStats()` → Estadísticas globales

### Exportación
- `exportBundle(deviceId, format)` → 'csv' | 'xml' | 'pdf' | 'json' | 'html' | 'bundle'

### Guardian
- `startGuardian(deviceId)` / `stopGuardian(deviceId)` / `getGuardianStatus(deviceId)`

### Auto Mode
- `startAutoMode()` / `stopAutoMode()` / `getAutoModeStatus()`

### IA Híbrida
- `configureHybridAI({ endpoint, apiKey, enabled, ... })`
- `getHybridAIConfig()` / `getHybridAIMetrics()`

### Plugins
- `listPlugins()` / `executePlugin(id, script, context)` / `togglePlugin(id, enabled)`

## Integración con Electron

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');
const internalAPI = require('./src/core/internalAPI');

contextBridge.exposeInMainWorld('optimizer', {
  // Mapear funciones del API interna a IPC
  runOptimization: (args) => ipcRenderer.invoke('api:runOptimization', args),
  runTurbo: (args) => ipcRenderer.invoke('api:runTurbo', args),
  getPredictions: (args) => ipcRenderer.invoke('api:getPredictions', args),
  // ... etc
});
```

### main.js

```javascript
const { ipcMain } = require('electron');
const internalAPI = require('./src/core/internalAPI');

ipcMain.handle('api:runOptimization', (event, { deviceId, firstConnection }) =>
  internalAPI.runOptimization(deviceId, { firstConnection })
);
ipcMain.handle('api:runTurbo', (event, { deviceId, ...opts }) =>
  internalAPI.runTurbo(deviceId, opts)
);
// ... etc
```

## Telemetría Integrada

Todas las funciones del API registran automáticamente:
- Tiempos de ejecución (startTimer/endTimer)
- Errores (trackError)
- Eventos (trackEvent)
- Predicciones (trackPrediction)
- Acciones automáticas (trackAutoAction)

## Respuesta Estándar

Todas las funciones retornan:
```javascript
{
  success: true/false,
  error: "mensaje de error si falló",
  ... datos específicos
}
```
