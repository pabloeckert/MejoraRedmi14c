# Changelog

Todas las versiones notables de Phone Optimizer.

## [1.0.0] — 2026-05-02

### 🚀 Primera versión estable

Release inicial del Optimizador Inteligente para Android. App de escritorio Electron que optimiza dispositivos Android físicos mediante ADB.

### Features principales

- **Optimización automática** — Detección de dispositivo, limpieza de bloatware, optimización de rendimiento
- **Modo Turbo** — Optimización extrema en 8 fases (cache, bloatware, GPU, procesos, batería, servicios, red, finalización)
- **Modo Guardian** — Protección continua cada 30s con monitoreo de predicciones, anomalías y temperatura
- **Modo Automático** — Detección y optimización sin intervención del usuario
- **Predicciones ML** — Regresión lineal y polinómica (grados 2-3) para batería, temperatura, almacenamiento, procesos y memoria
- **Detección de anomalías** — Estadísticas z-score para spikes de batería, temperatura y procesos
- **IA Híbrida** — Motor local + endpoint remoto configurable con fusión por confianza
- **Dashboard de predicciones** — Comparación visual de modelos lineal vs polinómico con R² ajustado
- **Benchmark de rendimiento** — 7 tests (CPU, RAM, IO, latencia, servicios, limpieza, térmica) con score 0-100
- **Exportación de reportes** — JSON, HTML, PDF, CSV, XML y bundle ZIP
- **Sistema de extensiones** — Plugins con sandbox VM seguro y permisos granulares
- **WiFi ADB** — Conexión inalámbrica al dispositivo
- **Backups y rollback** — Backup automático pre-optimización con rollback en errores
- **Scheduler** — Optimización programada por intervalo, batería o temperatura
- **Telemetría** — Registro de eventos, timings, predicciones y acciones automáticas
- **Modo Experto** — Logs crudos, telemetría, estado interno, IA híbrida, plugins, rendimiento
- **Ultra Aesthetic Mode** — Glassmorphism, blur dinámico, microinteracciones
- **Auto-update** — Actualización automática via GitHub Releases

### Módulos incluidos

| Módulo | Descripción |
|---|---|
| `src/adb/` | Comunicación ADB (USB, WiFi, scripts, métricas en tiempo real) |
| `src/core/` | Lógica de negocio (optimizer, turbo, guardian, auto, scheduler, backup, reportes, telemetría, benchmark) |
| `src/devices/` | Gestión de dispositivos y perfiles |
| `src/extensions/` | Sistema de extensiones y plugin sandbox |
| `src/logs/` | Sistema de logs por dispositivo |
| `src/ml/` | Motor ML (adaptive, failure predictor, non-linear, anomaly, hybrid AI) |
| `src/ui/` | Interfaz React con 13 componentes y tema Ultra Aesthetic |

### Estabilidad

- ✅ Build probado en Linux x64 (AppImage)
- ⚠️ Build Windows requiere Wine en host de build
- ⚠️ Build macOS requiere macOS con Xcode CLI tools
- ✅ Auto-update configurado via GitHub Releases
- ✅ Sin tests automatizados (recomendado para futuro)
