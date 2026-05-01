# Guardian Mode

## Descripción

Modo de protección continua que monitorea el dispositivo cada 30 segundos. Combina predicciones ML, detección de anomalías, y métricas en tiempo real para proteger el dispositivo proactivamente.

## Arquitectura

```
guardian.js
├── start(deviceId)           → Activar Guardian
├── stop(deviceId)            → Desactivar Guardian
├── stopAll()                 → Desactivar globalmente
├── isActive(deviceId)        → Verificar estado
├── getStatus(deviceId)       → Obtener estadísticas
├── _check(deviceId)          → Loop de verificación principal
├── _scheduleNext(deviceId)   → Programar siguiente check
├── Verificaciones:
│   ├── _checkTemperature()   → Temperatura actual
│   ├── _checkProcesses()     → Procesos activos
│   ├── _checkBattery()       → Nivel de batería
│   └── _checkStorage()       → Almacenamiento usado
├── _processAlert()           → Procesar alerta con cooldown
└── _escalateToTurbo()        → Escalación a Modo Turbo
```

## Loop de Verificación (cada 30s)

1. **Obtener datos**: Lee logs y último snapshot
2. **Verificar temperatura**: Alertas si > 42°C (high) o > 45°C (critical)
3. **Verificar procesos**: Alertas si > 120 (high) o > 180 (critical)
4. **Verificar batería**: Alertas si < 15% (high) o < 10% (critical)
5. **Verificar almacenamiento**: Alertas si > 90% (high) o > 95% (critical)
6. **Predicciones lineales**: FailurePredictor.predict()
7. **Predicciones no lineales**: NonLinearPredictor.predict()
8. **Detección de anomalías**: AnomalyDetector.detect()
9. **Consolidar alertas**: Deduplicar por tipo
10. **Procesar alertas**: Con cooldown de 5 minutos por tipo
11. **Escalación**: Si 3+ alertas críticas → activar Modo Turbo
12. **Registrar**: Log de guardian_check

## Tipos de Alertas

| Tipo | Fuente | Severidad | Condición |
|---|---|---|---|
| `temp_critical` | Realtime | critical | Temperatura > 45°C |
| `temp_high` | Realtime | high | Temperatura > 42°C |
| `proc_critical` | Realtime | critical | Procesos > 180 |
| `proc_high` | Realtime | high | Procesos > 120 |
| `battery_critical` | Realtime | critical | Batería < 10% |
| `battery_low` | Realtime | high | Batería < 15% |
| `storage_critical` | Realtime | critical | Almacenamiento > 95% |
| `storage_high` | Realtime | high | Almacenamiento > 90% |
| `prediction_*` | Predictor | critical/high | Predicción lineal crítica |
| `nl_prediction_*` | NL Predictor | critical/high | Predicción no lineal crítica |
| `anomaly_*` | Detector | critical | Anomalía crítica detectada |

## Cooldowns

| Tipo | Duración | Propósito |
|---|---|---|
| Alerta por tipo | 5 minutos | Evitar spam de notificaciones |
| Escalación Turbo | 1 hora | Evitar activaciones repetidas de Turbo |

## Escalación a Modo Turbo

**Trigger**: 3 o más alertas críticas acumuladas

**Acción**:
1. Activa Modo Turbo (sin backup, modo no agresivo)
2. Envía notificación de escalación
3. Resetea contador de alertas críticas
4. Registra en logs

## Integración con UI

### Toggle en SettingsPanel
- Switch on/off para activar/desactivar
- Estadísticas en tiempo real:
  - Verificaciones realizadas
  - Alertas generadas
  - Auto-optimizaciones ejecutadas
  - Alertas críticas acumuladas

### Info del modo
- Monitoreo cada 30s
- Notificaciones automáticas
- Optimización proactiva ante alertas críticas
- Escalación a Modo Turbo tras 3 alertas críticas

## Notificaciones

Cada alerta procesada genera una notificación del sistema:
- Críticas: tipo `error` (sonido, vibración)
- High: tipo `warning`
- Cooldown evita repetición cada 5 minutos

## Estadísticas

```javascript
{
  active: true,
  deviceCount: 1,
  devices: ['abc123'],
  globalStats: {
    totalChecks: 42,
    totalAlerts: 5,
    totalOptimizations: 2,
    startedAt: '2026-05-02T...'
  }
}
```

## Consideraciones

- El loop se detiene automáticamente si el dispositivo se desconecta
- Cada dispositivo tiene su propio estado y cooldowns
- `stopAll()` limpia todos los timers y estados
- Los logs de guardian_check se registran para análisis posterior
