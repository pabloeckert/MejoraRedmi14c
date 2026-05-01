# 🔧 Phone Optimizer

**Optimizador Inteligente para Android** — Diseñado para los teléfonos de Pablo y Sindy.

## Qué hace

- 🔍 **Detecta** automáticamente dispositivos Android conectados por USB
- 🔥 **Primera conexión**: Optimización máxima absoluta (bloatware, rendimiento, modo Ultra)
- 🧠 **Reconexiones**: Optimización inteligente basada en uso real
- 📊 **Aprende** de cada conexión y mejora con el tiempo
- 📱 **Modo Xiaomi 17 Ultra**: Rendimiento extremo en cada conexión
- 🔮 **Predicción de fallos**: Anticipa problemas antes de que ocurran
- 🛡️ **Optimización proactiva**: Actúa antes de que el problema aparezca
- 🚀 **Modo Turbo**: Optimización extrema bajo demanda
- 📋 **Reportes técnicos**: Exportación JSON + HTML con métricas completas

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

## Roadmap

Ver [ROADMAP.md](./ROADMAP.md)
