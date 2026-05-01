# 🔧 Phone Optimizer

**Optimizador Inteligente para Android** — Diseñado para los teléfonos de Pablo y Sindy.

## Qué hace

- 🔍 **Detecta** automáticamente dispositivos Android conectados por USB
- 🔥 **Primera conexión**: Optimización máxima absoluta (bloatware, rendimiento, modo Ultra)
- 🧠 **Reconexiones**: Optimización inteligente basada en uso real
- 📊 **Aprende** de cada conexión y mejora con el tiempo
- 📱 **Modo Xiaomi 17 Ultra**: Rendimiento extremo en cada conexión
- 🔮 **Predicción de fallos**: Anticipa problemas antes de que ocurran (lineal + no lineal)
- 🛡️ **Optimización proactiva**: Actúa antes de que el problema aparezca
- 🚀 **Modo Turbo**: Optimización extrema bajo demanda
- 📋 **Reportes técnicos**: Exportación JSON + HTML + PDF con métricas completas
- 🧠 **ML avanzado**: Regresión polinómica grado 2-3 con R² ajustado
- 🛡️ **Modo Guardian**: Protección continua cada 30s con escalación automática

## Requisitos

- Node.js 18+
- ADB instalado y en PATH
- Teléfono Android con depuración USB activada

## Instalación

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
```

## Uso

```bash
# Desarrollo
npm run dev:electron

# Build producción
npm run build
npm start
```

## Documentación

| Documento | Descripción |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del sistema |
| [OPTIMIZER_FLOW.md](./OPTIMIZER_FLOW.md) | Flujo de optimización |
| [ADB_SCRIPTS.md](./ADB_SCRIPTS.md) | Scripts ADB utilizados |
| [FAILURE_PREDICTION.md](./FAILURE_PREDICTION.md) | Motor de predicción de fallos |
| [PROACTIVE_OPTIMIZATION.md](./PROACTIVE_OPTIMIZATION.md) | Optimización proactiva |
| [TURBO_MODE.md](./TURBO_MODE.md) | Modo Turbo de rendimiento extremo |
| [REPORTS.md](./REPORTS.md) | Sistema de exportación de reportes |
| [DASHBOARD.md](./DASHBOARD.md) | Dashboard en tiempo real |
| [TRENDS.md](./TRENDS.md) | Análisis de tendencias |
| [ANOMALY_DETECTION.md](./ANOMALY_DETECTION.md) | Detección de anomalías |
| [BENCHMARK.md](./BENCHMARK.md) | Benchmark de rendimiento |
| [SCHEDULER.md](./SCHEDULER.md) | Scheduler inteligente |
| [ROADMAP.md](./ROADMAP.md) | Roadmap del proyecto |
| [NON_LINEAR_PREDICTION.md](./NON_LINEAR_PREDICTION.md) | ML no lineal (regresión polinómica) |
| [PDF_EXPORT.md](./PDF_EXPORT.md) | Exportación PDF profesional |
| [PREDICTION_DASHBOARD.md](./PREDICTION_DASHBOARD.md) | Dashboard de predicciones ML |
| [GUARDIAN_MODE.md](./GUARDIAN_MODE.md) | Modo Guardian (protección continua) |

## Características por Ciclo

### Ciclo 1-4 (Base)
- Optimización máxima e inteligente
- Dashboard en tiempo real y gráficos de tendencias
- Perfiles por dispositivo y motor ML adaptativo
- Conexión ADB por WiFi, backups y rollback automático
- Modo automático, scheduler, notificaciones
- Panel de settings, Ultra Aesthetic Mode
- Diagnóstico avanzado, benchmark, detección de anomalías
- Sistema de extensiones

### Ciclo 5 (IA Avanzada)
- **Predicción de fallos** — Regresión lineal sobre históricos para anticipar batería crítica, sobrecalentamiento, almacenamiento lleno, explosión de procesos y agotamiento de memoria
- **Optimización proactiva** — Ejecuta acciones preventivas antes de que los problemas aparezcan (cooldown de 30 min, auto-ejecución en críticos)
- **Modo Turbo** — 8 fases de optimización extrema: limpieza profunda, bloatware, rendimiento, procesos, batería, servicios, red, finalización
- **Exportación de reportes** — JSON (datos completos) y HTML (visual dark theme) con métricas, anomalías, predicciones y recomendaciones
- **Integración ML en UI** — Predicciones de fallo y acciones proactivas visibles en SmartInsights con badges de urgencia

### Ciclo 6 (Premium)
- **ML no lineal** — Regresión polinómica grado 2 y 3 con selección automática por R² ajustado, MSE, y comparación con modelo lineal
- **Exportación PDF** — Reporte PDF profesional con portada, tabla de contenido, tema dark, KPIs, anomalías, predicciones lineales + no lineales
- **Dashboard de predicciones** — Pestaña dedicada con comparación visual de modelos lineal vs polinómico, confianza ML, coeficientes, y proyecciones
- **Notificaciones de fallos predichos** — Alertas automáticas cuando ML predice: temperatura >45°C, batería <15%, procesos >120, almacenamiento <5%
- **Integración profunda Auto Mode** — Auto Mode lee predicciones ML, ejecuta optimización proactiva automáticamente, y activa Modo Turbo si hay predicciones críticas no lineales
- **Modo Guardian** — Protección continua cada 30s: monitorea predicciones + anomalías + métricas en tiempo real, optimiza automáticamente ante alertas críticas, escala a Modo Turbo tras 3 alertas críticas acumuladas

## Roadmap

Ver [ROADMAP.md](./ROADMAP.md)
