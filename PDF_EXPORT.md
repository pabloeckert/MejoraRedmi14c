# PDF Export

## Descripción

Exportador de reportes PDF profesionales con tema dark, portada, tabla de contenido, y todas las métricas del dispositivo incluyendo predicciones no lineales.

## Arquitectura

```
pdfExporter.js
├── export(deviceId)          → Exportar PDF completo
├── _gatherFullData()         → Recopilación de todos los datos
├── _generatePDFHTML()        → Generación HTML optimizado para PDF
└── Utilidades: _avg, _calculateHealth, _calculateRiskLevel
```

## Contenido del PDF

### Portada
- Logo y título del reporte
- Información del dispositivo (modelo, marca, Android, MIUI)
- Propietario y fecha de generación

### Tabla de Contenidos
1. Resumen Ejecutivo
2. Métricas del Sistema
3. Benchmark de Rendimiento
4. Anomalías Detectadas
5. Predicciones Lineales
6. Predicciones No Lineales (ML Avanzado)
7. Top Apps por Uso
8. Historial de Optimizaciones
9. Resumen de Sesiones

### Secciones Detalladas

#### Resumen Ejecutivo (KPIs)
- Salud del dispositivo (0-100)
- Batería actual
- Temperatura actual
- Nivel de riesgo
- Anomalías detectadas
- Optimizaciones realizadas
- Procesos activos
- Total de sesiones

#### Predicciones No Lineales
- Modelo utilizado (grado 2 o 3)
- Coeficientes del polinomio
- R² y R² ajustado
- MSE (Error cuadrático medio)
- Comparación con modelo lineal
- Proyección a 10 pasos
- Umbral crítico y pasos hasta alcanzarlo

## Características del PDF

- **Tema dark**: Fondo oscuro con texto claro
- **Optimizado para impresión**: `@page` CSS, `page-break`, `-webkit-print-color-adjust`
- **Badges de severidad**: Crítico (rojo), Warning (naranja), Info (azul), Success (verde)
- **Tablas estilizadas**: Headers con fondo oscuro, filas con hover
- **Barras de progreso**: Para score de salud
- **Grid de KPIs**: 4 columnas con métricas clave
- **Secciones no rompibles**: `no-break` class para evitar cortes feos

## Uso

```javascript
const pdfExporter = require('./core/pdfExporter');

// Exportar PDF
const result = await pdfExporter.export(deviceId);
// { timestamp, file: { name, path, format: 'pdf-html', size } }
```

## Formato

El PDF se genera como HTML con estilos de impresión. El usuario puede:
1. Abrir el HTML en un navegador
2. Usar Ctrl+P → "Guardar como PDF"
3. El resultado es un PDF profesional con tema dark

## Integración

- Botón "📋 PDF" en SettingsPanel
- Usa datos de: logManager, failurePredictor, nonLinearPredictor, anomalyDetector
- Incluye predicciones lineales y no lineales en el mismo reporte
