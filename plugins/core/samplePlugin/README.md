# Sample Plugin

Plugin de ejemplo para Phone Optimizer.

## Qué hace

- Muestra info básica del dispositivo (modelo, batería, almacenamiento)
- Demuestra el uso de hooks (`afterOptimization`, `onDeviceConnect`, `onDeviceDisconnect`)
- Incluye panel de UI integrado

## Estructura

```
samplePlugin/
├── manifest.json    ← Metadatos, permisos, hooks
├── index.js         ← Lógica principal
├── ui.jsx           ← Panel de UI (opcional)
└── README.md        ← Este archivo
```

## Cómo funciona

### Hooks

El plugin registra 3 hooks que se ejecutan automáticamente:

| Hook | Cuándo se ejecuta |
|---|---|
| `afterOptimization` | Después de cada optimización |
| `onDeviceConnect` | Al conectar un dispositivo USB |
| `onDeviceDisconnect` | Al desconectar un dispositivo |

### Función `analyze(deviceId)`

Ejecutable desde la UI o la API. Retorna:
- Modelo, marca y versión de Android
- Nivel de batería
- Espacio en disco

## Cómo crear tu propio plugin

1. Creá una carpeta en `plugins/core/`, `plugins/external/`, `plugins/ui/` o `plugins/automation/`
2. Creá `manifest.json` con los metadatos
3. Creá `index.js` con la lógica (exportá un objeto con `onLoad`, hooks, funciones)
4. Opcionalmente creá `ui.jsx` para el panel de UI
5. El plugin se carga automáticamente al iniciar la app

## Permisos

| Permiso | Descripción |
|---|---|
| `adb.shell` | Ejecutar comandos ADB |
| `logs.read` | Leer logs del sistema |
| `ml.predict` | Usar modelos ML |
