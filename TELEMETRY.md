# Telemetry

## Descripción

Sistema de telemetría avanzada que registra eventos, tiempos de ejecución, errores, predicciones y acciones automáticas. Persiste en disco por dispositivo.

## Arquitectura

```
telemetry.js
├── init(deviceId)                 → Inicializar telemetría para dispositivo
├── track(deviceId, event)         → Registrar evento genérico
├── trackEvent(deviceId, cat, act) → Registrar evento categorizado
├── trackTiming(deviceId, cat, op, ms) → Registrar tiempo de ejecución
├── trackError(deviceId, error)    → Registrar error
├── trackPrediction(deviceId, pred) → Registrar predicción ML
├── trackAutoAction(deviceId, act) → Registrar acción automática
├── startTimer(deviceId, label)    → Iniciar medición
├── endTimer(deviceId, label)      → Detener y registrar
├── getEvents(deviceId, filters)   → Obtener eventos filtrados
├── getStats(deviceId)             → Estadísticas del dispositivo
├── getGlobalStats()               → Estadísticas globales
├── export(deviceId, format)       → Exportar (JSON o CSV)
├── clear(deviceId)                → Limpiar telemetría
└── _flushAll()                    → Flush a disco (cada 30s)
```

## Tipos de Evento

| Tipo | Descripción | Campos |
|---|---|---|
| `event` | Evento genérico | category, action, data |
| `timing` | Tiempo de ejecución | category, operation, durationMs |
| `error` | Error | message, stack, severity, context |
| `prediction` | Predicción ML | source, failureType, urgency, confidence |
| `auto_action` | Acción automática | action, triggeredBy, success, durationMs |

## Categorías

- `optimization` — Optimizaciones ejecutadas
- `turbo` — Modo Turbo
- `guardian` — Modo Guardian
- `prediction` — Predicciones ML
- `export` — Exportaciones
- `plugin` — Ejecuciones de plugins
- `api` — Llamadas a la API interna

## Persistencia

- **Buffer en memoria**: Eventos se acumulan en buffer por dispositivo
- **Flush periódico**: Cada 30 segundos a `/telemetry/{deviceId}.json`
- **Límite**: 2000 eventos por dispositivo (FIFO)

## Estadísticas

```javascript
{
  totalEvents: 150,
  byType: { event: 80, timing: 30, error: 5, prediction: 20, auto_action: 15 },
  byCategory: { optimization: 10, guardian: 50, prediction: 20 },
  errors: { total: 5, recent: [...] },
  timings: { total: 30, avgMs: 450, maxMs: 3200 },
  predictions: { total: 20, byUrgency: { critical: 2, high: 5, medium: 13 } },
  autoActions: { total: 15, successful: 14 },
}
```

## Integración

Telemetría se integra automáticamente con:
- **Guardian**: Registra checks, alertas y optimizaciones
- **Auto Mode**: Registra detecciones y optimizaciones automáticas
- **Turbo Mode**: Registra activaciones y resultados
- **API Interna**: Registra todas las llamadas
- **Hybrid AI**: Registra llamadas locales/remotas y fusiones
