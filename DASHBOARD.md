# DASHBOARD.md — Dashboard en Tiempo Real

## Visión General

El Dashboard en tiempo real muestra métricas del dispositivo Android actualizadas cada 3 segundos via polling ADB.

## Métricas Mostradas

| Métrica | Fuente ADB | Frecuencia |
|---------|-----------|------------|
| **CPU** | `/proc/stat` (delta calculation) | 3s |
| **RAM** | `/proc/meminfo` | 3s |
| **Temperatura** | `dumpsys battery` | 3s |
| **Batería** | `dumpsys battery` | 3s |
| **Procesos** | `ps -A` | 3s |
| **Servicios MIUI** | `dumpsys activity services` | 3s |
| **Apps recientes** | `dumpsys activity recents` | 3s |

## Componentes

### `RealTimeDashboard.jsx`
- Grid de 4 metric cards con sparklines
- Donut charts para CPU y RAM
- Indicadores de peligro (rojo cuando CPU > 80%, RAM > 85%, temp > 40°C)
- Lista de procesos activos y servicios MIUI/HyperOS

### `realTimeMetrics.js`
- `getRealTimeMetrics(deviceId)`: obtiene todas las métricas en paralelo via `Promise.allSettled`
- Cálculo de CPU por delta de `/proc/stat` (500ms entre muestras)
- Parseo de `/proc/meminfo` para RAM real (incluye buffers/cache)
- Detección de servicios MIUI por keyword matching

## Flujo

```
UI (3s interval) → IPC → main.js → realTimeMetrics.js → ADB shell → parse → UI update
```

## Consideraciones

- El intervalo de 3s balancea responsividad vs carga en el dispositivo
- Cada métrica falla independientemente (`Promise.allSettled`)
- Los sparklines mantienen últimos 30 puntos (~90s de historial)
- Los colores cambian a rojo automáticamente en valores críticos
