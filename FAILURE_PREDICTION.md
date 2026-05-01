# Failure Prediction

## Descripción

El módulo `failurePredictor.js` implementa un motor de predicción de fallos que analiza tendencias históricas del dispositivo para anticipar problemas antes de que ocurran.

## Arquitectura

```
failurePredictor.js
├── predict()                    → Predicción completa
├── _predictBattery()            → Predicción de batería crítica
├── _predictThermal()            → Predicción de sobrecalentamiento
├── _predictStorage()            → Predicción de almacenamiento lleno
├── _predictProcessGrowth()      → Predicción de explosión de procesos
├── _predictMemory()             → Predicción de agotamiento de memoria
├── _predictBatteryDegradation() → Predicción de degradación de capacidad
├── _linearRegression()          → Regresión lineal (mínimos cuadrados)
├── _calculateConfidence()       → Confianza basada en cantidad de datos
└── getHealthForecast()          → Resumen rápido de salud proyectada
```

## Tipos de Fallo Predecibles

| ID | Descripción | Severidad | Umbral |
|---|---|---|---|
| `battery_critical` | Batería alcanzará nivel crítico | critical | 15% |
| `thermal_shutdown` | Riesgo de apagado por temperatura | critical | 48°C |
| `storage_full` | Almacenamiento casi lleno | warning | 95% |
| `process_explosion` | Crecimiento descontrolado de procesos | warning | 200 |
| `memory_exhaustion` | Memoria disponible agotándose | critical | 5% |
| `battery_degradation` | Degradación acelerada de capacidad | warning | - |

## Método Principal

```javascript
const { FailurePredictor } = require('./ml/failurePredictor');

const predictor = new FailurePredictor(deviceId);
const result = await predictor.predict();

// Resultado:
{
  timestamp: '2026-05-02T...',
  deviceId: 'abc123',
  predictions: [
    {
      id: 'battery_critical',
      label: 'Batería en estado crítico',
      icon: '🔋',
      urgency: 'high',
      trend: { slope: -2.3, r2: 0.85, direction: 'decreasing' },
      projection: {
        currentValue: 45,
        projectedValue: 22,
        sessionsUntilFailure: 10,
        estimatedDays: 14,
      },
      recommendation: 'Considerar optimización de batería...',
    }
  ],
  totalPredictions: 1,
  criticalPredictions: 0,
  confidence: 0.65,
  dataPoints: 13,
  horizon: '7 días',
}
```

## Algoritmo

1. **Recopilación de datos**: Extrae métricas históricas de los snapshots del dispositivo
2. **Regresión lineal**: Aplica mínimos cuadrados para detectar tendencias
3. **Proyección**: Calcula cuándo se alcanzará el umbral crítico
4. **Confianza**: Basada en cantidad de puntos de datos y recencia
5. **Clasificación**: Ordena por urgencia (critical → high → medium → low)

## Confianza

- **0.0 - 0.3**: Pocos datos (<5 sesiones), predicciones tentativas
- **0.3 - 0.6**: Datos moderados (5-10 sesiones), predicciones razonables
- **0.6 - 0.8**: Buenos datos (10-15 sesiones), predicciones fiables
- **0.8 - 1.0**: Excelentes datos (15+ sesiones), alta confianza

## Limitaciones

- Asume tendencias lineales (no captura cambios bruscos de comportamiento)
- Requiere mínimo 3 sesiones para generar predicciones
- El horizonte de predicción es de 7 días
- No predice fallos por causas externas (caída, agua, etc.)
