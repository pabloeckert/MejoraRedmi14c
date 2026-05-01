# Turbo Mode

## Descripción

El módulo `turboMode.js` implementa un modo de optimización extrema bajo demanda que ejecuta **todas** las optimizaciones posibles para máximo rendimiento del dispositivo.

⚠️ **Modo agresivo**: Desactiva animaciones, limita servicios, limpia todo. Diseñado para sesiones de máximo rendimiento, no para uso continuo.

## Arquitectura

```
turboMode.js
├── activate()              → Activar Modo Turbo
├── deactivate()            → Desactivar y restaurar
├── isActive()              → Verificar estado
├── getStatus()             → Obtener detalles
├── _phaseDeepClean()       → Fase 1: Limpieza profunda
├── _phaseBloatwareRemoval()→ Fase 2: Eliminación de bloatware
├── _phasePerformanceBoost()→ Fase 3: Boost de rendimiento
├── _phaseProcessControl()  → Fase 4: Control de procesos
├── _phaseBatteryOptimization()→ Fase 5: Optimización de batería
├── _phaseServiceReduction()→ Fase 6: Reducción de servicios
├── _phaseNetworkOptimization()→ Fase 7: Optimización de red
└── _phaseFinalize()        → Fase 8: Finalización
```

## Fases de Ejecución

### Fase 1: 🧹 Limpieza Profunda
- `pm trim-caches 512M` — Cache de apps
- `rm -rf /data/local/tmp/*` — Archivos temporales
- `rm -rf /data/dalvik-cache/*` — Dalvik cache
- `echo 3 > /proc/sys/vm/drop_caches` — Kernel caches
- `logcat -b all -c` — Logs del sistema

### Fase 2: 🗑️ Eliminación de Bloatware
- Elimina todas las apps de bloatware MIUI conocidas
- Usa `pm uninstall -k --user 0` (reversible)

### Fase 3: ⚡ Boost de Rendimiento
- Animaciones: `window_animation_scale = 0`
- Transiciones: `transition_animation_scale = 0`
- Duración: `animator_duration_scale = 0`
- GPU rendering forzado
- Debug desactivado

### Fase 4: ⚙️ Control de Procesos
- Modo seguro: mata hasta 30 procesos (excluye system/launcher/phone)
- Modo agresivo: mata todos los procesos no esenciales

### Fase 5: 🔋 Optimización de Batería
- Auto-sync desactivado
- WiFi scan reducido
- Haptic feedback desactivado
- Brillo reducido a 40%

### Fase 6: 🔧 Reducción de Servicios
- Servicios MIUI no esenciales desactivados
- Servicios de ubicación desactivados

### Fase 7: 🌐 Optimización de Red
- Datos en background restringidos
- DNS optimizado (Cloudflare + Google)

### Fase 8: ✅ Finalización
- UI refrescada

## Uso

```javascript
const turboMode = require('./core/turboMode');

// Activar
const result = await turboMode.activate(deviceId, { aggressive: false });

// Resultado:
{
  mode: 'turbo',
  deviceId: 'abc123',
  success: true,
  phases: [
    { name: 'deep_clean', label: '🧹 Limpieza Profunda', actions: 5, status: 'done' },
    { name: 'bloatware', label: '🗑️ Bloatware', actions: 12, status: 'done' },
    ...
  ],
  totalActions: 35,
  performanceGain: 78,
  durationMs: 12500,
}

// Verificar estado
turboMode.isActive(deviceId);  // true
turboMode.getStatus(deviceId); // { active: true, minutesActive: 5, ... }

// Desactivar
await turboMode.deactivate(deviceId);
// Restaura animaciones y limpia estado
```

## Ganancia de Rendimiento Estimada

| Fase | Peso | Contribución |
|---|---|---|
| Limpieza Profunda | 15% | Limpieza de caches y archivos temporales |
| Bloatware | 20% | Eliminación de apps innecesarias |
| Performance | 25% | Animaciones OFF, GPU rendering |
| Procesos | 15% | Control de procesos en background |
| Batería | 5% | Reducción de consumo |
| Servicios | 10% | Servicios MIUI desactivados |
| Red | 10% | Optimización de conectividad |

**Máximo teórico**: 100% (todas las fases completadas exitosamente)

## Backup y Rollback

- Crea backup automáticamente antes de activar
- Si más de 2 fases fallan, ejecuta rollback automático
- El backup permite revertir cambios con `backupManager.rollback()`

## Consideraciones

- **No usar en producción continua** — es para sesiones puntuales
- Las animaciones se desactivan (puede afectar experiencia de usuario)
- Servicios MIUI se desactivan (puede afectar funcionalidades MIUI)
- El modo turbo se puede desactivar en cualquier momento
- La desactivación restaura animaciones pero no servicios MIUI
