# Advanced Export

## Descripción

Exportaciones avanzadas que complementan al reportExporter existente. Agrega CSV para análisis en hojas de cálculo, XML para integración con sistemas externos, y bundles ZIP con todos los formatos.

## Arquitectura

```
advancedExporter.js
├── exportCSV(deviceId)       → Exportar CSV (snapshots + optimizaciones + predicciones)
├── exportXML(deviceId)       → Exportar XML completo
├── exportBundle(deviceId)    → Exportar bundle (JSON + CSV + XML + TXT)
├── listExports()             → Listar exportaciones existentes
├── _gatherData()             → Recopilar datos del dispositivo
├── _snapshotsToCSV()         → Snapshots → CSV
├── _optimizationsToCSV()     → Optimizaciones → CSV
├── _predictionsToCSV()       → Predicciones → CSV
├── _toXML()                  → Datos → XML
└── _toSummary()              → Datos → resumen texto plano
```

## Formatos

### CSV

Genera archivos separados por categoría:

**snapshots.csv**
```csv
timestamp,batteryLevel,temperature,processCount,memoryAvailable,storageUsed
2026-05-02T06:00:00Z,65,34.2,45,42.5,67.3
```

**optimizations.csv**
```csv
timestamp,type,mode,success,durationMs,actionsCount
2026-05-02T06:15:00Z,optimization,smart,true,2300,8
```

**predictions.csv**
```csv
id,label,urgency,severity,currentValue,projectedValue,estimatedDays,recommendation
battery_critical,Batería en estado crítico,medium,warning,65,30,14,Considerar optimización...
```

### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PhoneOptimizerReport deviceId="abc123" exportedAt="2026-05-02T...">
  <Snapshots count="10">
    <Snapshot timestamp="..." batteryLevel="65" temperature="34.2" processCount="45" />
  </Snapshots>
  <Optimizations count="5">
    <Optimization timestamp="..." mode="smart" success="true" />
  </Optimizations>
  <Predictions count="2">
    <Prediction id="battery_critical" urgency="medium" />
  </Predictions>
</PhoneOptimizerReport>
```

### Bundle

Crea un directorio con:
- `report.json` — Datos completos en JSON
- `snapshots.csv` — Snapshots en CSV
- `optimizations.csv` — Optimizaciones en CSV
- `report.xml` — Datos completos en XML
- `summary.txt` — Resumen en texto plano

## Integración en UI

Sección "Exportaciones Avanzadas" en SettingsPanel con 3 botones:
- **📊 CSV** — Exporta archivos CSV separados
- **📄 XML** — Exporta XML completo
- **📦 Bundle** — Exporta bundle con todos los formatos

## Directorio de Salida

Las exportaciones se guardan en `/exports/`:
- CSV: `snapshots_{deviceId}_{timestamp}.csv`
- XML: `report_{deviceId}_{timestamp}.xml`
- Bundle: `bundle_{deviceId}_{timestamp}/`
