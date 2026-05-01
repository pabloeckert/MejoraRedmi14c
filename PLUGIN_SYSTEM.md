# Plugin System

## Descripción

Sistema de plugins externos con sandbox seguro. Permite cargar scripts ADB, paneles UI y módulos ML de terceros aislados en una VM.

## Arquitectura

```
pluginSandbox.js
├── loadPlugin(pluginDir)          → Cargar plugin desde directorio
├── loadAll()                      → Cargar todos los plugins
├── executeScript(pluginId, name)  → Ejecutar en sandbox seguro
├── executeAdbScript(pluginId)     → Ejecutar script ADB
├── getPluginUI(pluginId)          → Obtener código UI
├── toggle(pluginId, enabled)      → Habilitar/deshabilitar
├── list()                         → Listar plugins
├── getExecutionLog()              → Historial de ejecuciones
└── unload(pluginId)               → Eliminar plugin
```

## Estructura de un Plugin

```
extensions/plugins/
  mi-plugin/
    manifest.json    ← Metadatos y permisos
    index.js         ← Lógica principal
    panel.jsx        ← UI opcional
```

## Manifest

```json
{
  "id": "mi-plugin",
  "name": "Mi Plugin",
  "version": "1.0.0",
  "description": "Descripción del plugin",
  "author": "Autor",
  "type": "adb",         // "script" | "ui" | "ml" | "adb"
  "main": "index.js",
  "ui": "panel.jsx",
  "permissions": ["adb.shell", "adb.props"],
  "settings": { "key": "value" }
}
```

## Tipos de Plugin

| Tipo | Descripción | Permisos |
|---|---|---|
| `script` | Script genérico | Personalizados |
| `adb` | Scripts ADB | `adb.shell`, `adb.props` |
| `ui` | Panel de UI | `ui.render` |
| `ml` | Módulo ML | `ml.predict`, `ml.train` |

## Sandbox de Seguridad

- **Timeout**: 5s máximo de ejecución
- **Memoria**: 50MB máximo
- **Console**: 100 líneas máximo
- **Módulos permitidos**: `path`, `util`, `events`
- **Globals bloqueados**: `process`, `require`, `module`, `__dirname`
- **Sin acceso a**: `Buffer`, `setTimeout`, `setInterval`

## Ejemplo: Battery Monitor Pro

```javascript
// index.js
const plugin = {
  async analyze(deviceId, adb) {
    const batteryInfo = await adb.shell('dumpsys battery');
    // ... análisis
    return { analysis: {...}, recommendations: [...] };
  },
};
module.exports = plugin;
```

## Permisos

| Permiso | Descripción |
|---|---|
| `adb.shell` | Ejecutar comandos shell vía ADB |
| `adb.props` | Leer propiedades del dispositivo |
| `ui.render` | Renderizar panel en la UI |
| `ml.predict` | Ejecutar predicciones ML |

## Consideraciones de Seguridad

- Cada plugin se ejecuta en un contexto VM aislado
- Sin acceso al filesystem del host
- Sin acceso a red (a menos que se autorice explícitamente)
- Permisos explícitos en el manifest
- Registro de todas las ejecuciones
