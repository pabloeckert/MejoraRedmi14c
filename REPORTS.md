# Report Exporter

## Descripción

El módulo `reportExporter.js` genera reportes técnicos completos del dispositivo en formatos JSON (datos crudos) y HTML (visual).

## Arquitectura

```
reportExporter.js
├── export()          → Exportar reporte completo
├── quickReport()     → Reporte rápido (solo métricas clave)
├── listReports()     → Listar reportes generados
├── _gatherReportData() → Recopilación de todos los datos
├── _generateHTML()   → Generación de HTML visual
└── Utilidades: _average, _calculateHealthScore, _calculateRiskLevel
```

## Formatos

### JSON
Estructura completa con todos los datos del dispositivo:
- Información del dispositivo
- Métricas actuales e históricas
- Score de salud calculado
- Historial de optimizaciones
- Top apps por uso
- Anomalías detectadas
- Predicciones de fallo
- Resumen de sesiones

### HTML
Reporte visual con:
- Dashboard de métricas (salud, batería, temperatura, riesgo)
- Tablas de anomalías y predicciones
- Historial de optimizaciones
- Top apps
- Diseño dark theme profesional

## Uso

```javascript
const reportExporter = require('./core/reportExporter');

// Exportar en ambos formatos
const result = await reportExporter.export(deviceId, { format: 'both' });
// {
//   timestamp: '2026-05-02T...',
//   files: [
//     { format: 'json', path: '/path/to/report.json', size: 4523 },
//     { format: 'html', path: '/path/to/report.html', size: 12890 },
//   ]
// }

// Solo JSON
await reportExporter.export(deviceId, { format: 'json' });

// Solo HTML
await reportExporter.export(deviceId, { format: 'html' });

// Reporte rápido
const quick = await reportExporter.quickReport(deviceId);
// {
//   device: 'Redmi 14C',
//   owner: 'Pablo',
//   healthScore: 78,
//   battery: { current: 65 },
//   temperature: { current: 34.2 },
//   anomalyCount: 2,
//   predictionCount: 1,
//   riskLevel: 'medium',
// }

// Listar reportes existentes
const reports = await reportExporter.listReports();
```

## Contenido del Reporte JSON

```json
{
  "generatedAt": "2026-05-02T...",
  "generator": "Phone Optimizer Report Exporter v1.0",
  "device": {
    "id": "abc123",
    "model": "Redmi 14C",
    "brand": "Xiaomi",
    "android": "14",
    "miui": "HyperOS 2.0",
    "owner": "Pablo"
  },
  "metrics": {
    "battery": { "current": 65, "history": [...] },
    "temperature": { "current": 34.2, "average": 32.1, "max": 38.5, "history": [...] },
    "processCount": { "current": 78, "average": 65, "history": [...] },
    "storage": { ... },
    "memory": { ... }
  },
  "health": { "score": 78, "label": "Bueno" },
  "optimizationHistory": [...],
  "totalOptimizations": 5,
  "topApps": [...],
  "anomalies": { "total": 2, "critical": 0, "warning": 2, "items": [...] },
  "predictions": { "total": 1, "confidence": 0.65, "riskLevel": "medium", "items": [...] },
  "sessionSummary": { "totalSessions": 12, "firstSeen": "...", "lastSeen": "...", "timespanDays": 30 }
}
```

## Ubicación de Reportes

Los reportes se guardan en: `<project>/reports/`

Nomenclatura: `report_<deviceId>_<timestamp>.<format>`

Ejemplo: `report_abc123_2026-05-02T06-41-00.json`

## Integración con UI

El botón "Exportar Reporte" en SettingsPanel permite:
- Exportar solo JSON
- Exportar solo HTML
- Exportar ambos formatos
- Ver reportes generados anteriormente

## Datos Recopilados

| Categoría | Fuente | Datos |
|---|---|---|
| Dispositivo | Snapshot | Modelo, marca, Android, MIUI |
| Batería | Snapshots | Nivel actual, historial |
| Temperatura | Snapshots | Actual, promedio, máximo |
| Procesos | Snapshots | Conteo actual, promedio, historial |
| Almacenamiento | Snapshot | Uso actual |
| Memoria | Snapshot | Disponible |
| Optimizaciones | Logs | Historial completo |
| Apps | UsageStats | Top apps por tiempo de uso |
| Anomalías | AnomalyDetector | Detección en tiempo real |
| Predicciones | FailurePredictor | Predicciones de fallo |
