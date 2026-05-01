# BACKUP_ROLLBACK.md — Sistema de Backup y Rollback

## Visión General

Crea backups completos del estado del dispositivo antes de cada optimización y permite rollback si algo falla.

## Módulo: `/src/core/backupManager.js`

## Contenido del Backup

| Sección | Fuente ADB | Archivo |
|---------|-----------|---------|
| Apps instaladas | `pm list packages` | `apps.json` |
| Servicios activos | `dumpsys activity services` | `services.txt` |
| Settings global | `settings list global` | `settings.json` |
| Settings secure | `settings list secure` | `settings.json` |
| Settings system | `settings list system` | `settings.json` |
| Estado batería | `dumpsys battery` | `battery.txt` |
| Procesos | `ps -A` | `processes.json` |
| Propiedades | `getprop` | `props.txt` |
| Manifiesto | (generado) | `manifest.json` |

## Estructura de Directorios

```
/backups/
├── {deviceId}/
│   ├── 2026-05-02T05-44-00-000Z/
│   │   ├── manifest.json
│   │   ├── apps.json
│   │   ├── services.txt
│   │   ├── settings.json
│   │   ├── battery.txt
│   │   ├── processes.json
│   │   └── props.txt
│   └── 2026-05-01T10-30-00-000Z/
│       └── ...
```

## API

### `createBackup(deviceId)`
Crea backup completo. Retorna el manifiesto.

### `rollback(deviceId, backupData?)`
Restaura settings de performance y animación del backup.

**Nota**: `pm uninstall --user 0` no se puede revertir completamente sin factory reset. El rollback restaura:
- `window_animation_scale`
- `transition_animation_scale`
- `animator_duration_scale`
- `force_gpu_rendering`
- `background_limit`
- `screen_off_timeout`

### `listBackups(deviceId)`
Lista backups ordenados por fecha (más reciente primero).

### `loadBackup(deviceId, timestamp)`
Carga un backup específico por timestamp.

### `cleanOldBackups(deviceId, keepLast = 5)`
Elimina backups antiguos, manteniendo los últimos N.

## Integración con Optimizer Engine

```
runOptimization(deviceId, firstConnection)
  ├── 1. createBackup(deviceId)
  ├── 2. maxOptimization() o smartOptimization()
  ├── 3. Si muchos errores → rollback()
  └── 4. cleanOldBackups()
```

## Rollback Automático

El rollback se ejecuta automáticamente si:
- La optimización tiene más de 3 errores
- La optimización lanza una excepción crítica

## UI

- Sección "💾 Backups" en Settings
- Botón "Crear backup" manual
- Lista de backups con botón "↩️ Rollback"
- Sección en DeviceOverview con botón rápido
