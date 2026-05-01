# EXTENSIONS.md — Sistema de Extensiones

## Visión General

El sistema de extensiones permite agregar funcionalidad personalizada a Phone Optimizer: scripts ADB adicionales, paneles de UI, análisis especializados.

## Módulo: `/src/extensions/extensionManager.js`

## Estructura de una Extensión

```
/extensions/
├── mi-extension/
│   ├── manifest.json    ← Metadatos
│   └── index.js         ← Lógica (opcional)
```

### manifest.json

```json
{
  "id": "mi-extension",
  "name": "Mi Extensión",
  "version": "1.0.0",
  "description": "Descripción",
  "author": "Autor",
  "main": "index.js",
  "adbScripts": {
    "scriptName": {
      "name": "Nombre del script",
      "description": "Qué hace"
    }
  },
  "uiPanel": {
    "title": "Título del panel",
    "component": "ComponentName"
  }
}
```

### index.js

```javascript
const adb = require('../../src/adb/adbClient');

module.exports = {
  adbScripts: {
    scriptName: {
      name: 'Nombre',
      description: 'Descripción',
      async execute(deviceId, ...args) {
        // Lógica ADB
        return { result: 'ok' };
      },
    },
  },
};
```

## API

### `register(extension)`
Registra una extensión en memoria.

### `unregister(extensionId)`
Elimina una extensión y sus recursos.

### `toggle(extensionId, enabled)`
Habilita/deshabilita una extensión.

### `list()`
Lista todas las extensiones registradas.

### `getAdbScripts()`
Retorna scripts ADB de extensiones habilitadas.

### `getUiPanels()`
Retorna paneles UI de extensiones habilitadas.

### `loadFromDisk()`
Carga extensiones desde `/extensions/` leyendo `manifest.json`.

### `runScript(extensionId, scriptName, deviceId, ...args)`
Ejecuta un script de extensión.

## Extensión de Ejemplo: Battery Doctor

Ubicación: `/src/extensions/examples/battery-doctor/`

### Scripts incluidos

1. **deepBatteryAnalysis** — Analiza wake locks, alarmas y apps que drenan batería
2. **batterySaver** — Aplica ajustes agresivos de ahorro de batería

### Cómo usar

1. La extensión se carga automáticamente desde disco
2. Aparece en la pestaña "🧩 Extensiones"
3. Se puede habilitar/deshabilitar con toggle

## Crear una Extensión

1. Crear carpeta en `/extensions/`
2. Crear `manifest.json` con metadatos
3. Crear `index.js` con scripts ADB (opcional)
4. Reiniciar la app o usar "🔄 Actualizar" en Extensiones

## Consideraciones

- Las extensiones se cargan al inicio
- Los scripts ADB se ejecutan con los mismos permisos que la app
- Los paneles UI deben ser componentes React válidos
- Las extensiones deshabilitadas no se ejecutan ni muestran
