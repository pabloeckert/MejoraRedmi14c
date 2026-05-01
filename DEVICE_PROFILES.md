# DEVICE_PROFILES.md — Perfiles Inteligentes por Dispositivo

## Visión General

Cada dispositivo Android tiene un perfil inteligente que acumula datos históricos, detecta patrones y alimenta el motor ML para optimización adaptativa.

## Arquitectura

```
DeviceProfile
├── Datos básicos (deviceId, created, version)
├── Historial de batería (últimos 100 puntos)
├── Historial de temperatura (últimos 100 puntos)
├── Procesos recurrentes (nombre → count + lastSeen)
├── Apps más usadas (package → totalTimeMs + sessions)
├── Historial de optimizaciones (últimas 50)
├── Score de salud (0-100, calculado)
└── Integración con AdaptiveOptimizer (ML)
```

## Ubicación

```
/devices/{deviceId}_profile.json
```

## Campos del Perfil

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `deviceId` | string | Serial del dispositivo |
| `batteryHistory` | array | Últimos 100 puntos de batería |
| `temperatureHistory` | array | Últimos 100 puntos de temperatura |
| `avgBatteryDrain` | number | Drenaje promedio por conexión (%) |
| `avgTemperature` | number | Temperatura promedio (°C) |
| `recurringProcesses` | object | Procesos que aparecen frecuentemente |
| `totalProcessSnapshots` | number | Total de snapshots de procesos |
| `topApps` | object | Apps más usadas con tiempo total |
| `optimizationHistory` | array | Últimas 50 optimizaciones |
| `totalOptimizations` | number | Conteo total |
| `successfulOptimizations` | number | Optimizaciones exitosas |
| `lastOptimization` | string | ISO timestamp |
| `healthScore` | number | Score 0-100 |

## Score de Salud (0-100)

El score se calcula automáticamente:

| Factor | Penalización |
|--------|-------------|
| Temp > 40°C | -25 |
| Temp > 35°C | -15 |
| Temp > 30°C | -5 |
| Drenaje > 15% | -25 |
| Drenaje > 10% | -15 |
| Drenaje > 5% | -5 |
| Procesos > 200 | -15 |
| Procesos > 150 | -10 |
| Tasa éxito > 90% | +5 |

## Integración ML

El perfil se conecta con `AdaptiveOptimizer` para:

1. **Aprendizaje**: Cada snapshot actualiza el modelo EMA
2. **Predicción**: El modelo predice necesidades de optimización
3. **Insights**: El perfil genera insights basados en patrones detectados

### Modelo EMA (Exponential Moving Average)

```
nuevo_valor = valor_anterior * (1 - α) + observación * α
α = 0.3 (factor de aprendizaje)
```

Variables rastreadas:
- `batteryDrainEMA`: drenaje promedio de batería
- `temperatureEMA`: temperatura promedio
- `processCountEMA`: cantidad promedio de procesos
- `appFrequency`: frecuencia de uso por app

## Smart Insights

El perfil genera automáticamente insights de tipo:

- **info**: Apps más usadas, procesos recurrentes
- **warning**: Temperatura elevada, drenaje de batería
- **critical**: Score bajo, necesidad de optimización completa

## Ciclo de Vida

```
1. Primera conexión → Perfil creado con defaults
2. Snapshot capturado → Perfil actualizado
3. Optimización ejecutada → Historial registrado
4. ML actualizado → Predicciones mejoradas
5. Score recalculado → Insights generados
6. Siguiente conexión → El ciclo se repite con datos acumulados
```
