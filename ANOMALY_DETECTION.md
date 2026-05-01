# ANOMALY_DETECTION.md — Detección de Anomalías

## Visión General

Motor estadístico que detecta comportamientos anómalos comparando datos actuales con históricos.

## Módulo: `/src/ml/anomalyDetector.js`

## Tipos de Anomalías

### Batería
| Tipo | Severidad | Condición |
|------|-----------|-----------|
| `battery_spike` | warning/critical | Caída > 15% entre sesiones |
| `battery_outlier` | warning | Z-score > 2σ del promedio |

### Temperatura
| Tipo | Severidad | Condición |
|------|-----------|-----------|
| `thermal_spike` | warning/critical | > 42°C |
| `thermal_outlier` | warning | Z-score > 2σ del promedio |

### Procesos
| Tipo | Severidad | Condición |
|------|-----------|-----------|
| `process_spike` | warning/critical | > 150 procesos activos |
| `process_outlier` | warning | Z-score > 2.5σ del promedio |

### Apps
| Tipo | Severidad | Condición |
|------|-----------|-----------|
| `app_excessive_usage` | warning/critical | > 2h promedio de uso |
| `app_usage_spike` | warning | 3x el uso anterior y > 1h |

### Comportamiento
| Tipo | Severidad | Condición |
|------|-----------|-----------|
| `rapid_degradation` | critical | > 20% batería entre conexiones |

## Método Estadístico

### Z-Score
```
z = |valor_actual - promedio| / desviación_estándar
```

Si `z > umbral` → anomalía

### Spike Detection
Comparación directa con umbrales fijos configurados en `thresholds`.

## Integración

### Con SmartInsights
Los resultados de anomalías se pasan como prop a `SmartInsights`:
```jsx
<SmartInsights profile={profile} predictions={predictions} anomalyResults={anomalyResults} />
```

### Con App.jsx
Se carga automáticamente al detectar dispositivo:
```javascript
const anomalies = await window.optimizer.detectAnomalies({ deviceId });
```

## Output

```javascript
{
  timestamp: "2026-05-02T...",
  deviceId: "xxx",
  totalAnomalies: 3,
  critical: 1,
  warning: 2,
  anomalies: [
    {
      type: "thermal_spike",
      severity: "warning",
      message: "Temperatura elevada: 43.2°C",
      value: 43.2,
      threshold: 42
    },
    // ...
  ]
}
```
