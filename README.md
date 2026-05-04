# 🔧 Phone Optimizer

[![Build](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/build.yml/badge.svg)](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/pabloeckert/MejoraRedmi14c?label=Release)](https://github.com/pabloeckert/MejoraRedmi14c/releases/latest)

**Optimizador inteligente para Android** — App de escritorio Electron que optimiza dispositivos Android vía ADB.

## Descargar

| Plataforma | Archivo | Tamaño |
|---|---|---|
| **Windows** | [PhoneOptimizer-Setup-1.4.0.exe](https://github.com/pabloeckert/MejoraRedmi14c/releases/download/v1.4.0/PhoneOptimizer-Setup-1.4.0.exe) | ~79 MB |
| **macOS** | [PhoneOptimizer-1.4.0.dmg](https://github.com/pabloeckert/MejoraRedmi14c/releases/download/v1.4.0/PhoneOptimizer-1.4.0.dmg) | ~103 MB |
| **Linux** | [PhoneOptimizer-1.4.0.AppImage](https://github.com/pabloeckert/MejoraRedmi14c/releases/download/v1.4.0/PhoneOptimizer-1.4.0.AppImage) | ~108 MB |

> **ADB incluido** — No necesitás instalar ADB por separado. La app lo empaqueta y lo usa automáticamente.

## Uso

1. Descargá el instalador para tu plataforma
2. Activá **depuración USB** en tu teléfono Android:
   - `Ajustes → Sobre del teléfono` → tocar "Número de compilación" 7 veces
   - `Ajustes → Opciones de desarrollador` → activar "Depuración USB"
3. Conectá el teléfono por USB
4. Aceptá la autorización en el teléfono cuando aparezca
5. Abrí Phone Optimizer y presioná "Detectar dispositivo"

## Funcionalidades

- **Optimización automática** — Limpieza de bloatware, cache, procesos en segundo plano
- **Modo Turbo** — Optimización extrema en 8 fases
- **Predicciones ML** — Regresión lineal y polinómica para batería, temperatura, almacenamiento
- **Modo Guardian** — Protección continua cada 30 segundos
- **Reportes** — Exportación en JSON, HTML, PDF, CSV, XML
- **WiFi ADB** — Conexión inalámbrica después del primer USB
- **Benchmark** — Tests de rendimiento del dispositivo
- **Detección de anomalías** — Identifica comportamientos anómalos

## Requisitos

- Android 7.0+
- Cable USB con datos (no solo carga)
- Depuración USB activada

## Desarrollo

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
npm run dev:electron   # Hot-reload
```

### Build

```bash
npm run build          # Todas las plataformas
npm run build:win      # Windows
npm run build:linux    # Linux
npm run build:mac      # macOS
```

### Release

Los releases se generan automáticamente con GitHub Actions al hacer push de un tag:

```bash
git tag v1.4.0
git push origin v1.4.0
```

## Arquitectura

```
main.js                    ← Electron main process
preload.js                 ← Bridge main↔renderer
vendor/adb/                ← ADB empaquetado (Windows + Linux)
src/
  adb/                     ← Comunicación ADB (USB, WiFi, scripts)
  core/                    ← Lógica de negocio
    optimizerEngine          ← Orquestador principal
    turboMode                ← Modo Turbo (8 fases)
    guardian                 ← Modo Guardian (loop 30s)
    autoMode                 ← Detección automática
    notifications            ← Sistema de notificaciones
    scheduler                ← Tareas programadas
    backupManager            ← Backups y rollback
    reportExporter           ← JSON + HTML
    pdfExporter              ← PDF
    advancedExporter         ← CSV + XML + bundles
    pluginRegistry           ← Sistema de plugins
    telemetry                ← Eventos y métricas
    benchmark                ← Tests de rendimiento
  devices/                 ← Gestión de dispositivos y perfiles
  extensions/              ← Sandbox de extensiones
  ml/                      ← Motor ML
    failurePredictor         ← Predicción de fallos
    nonLinearPredictor       ← Regresión polinómica
    anomalyDetector          ← Detección de anomalías
    hybridAI                 ← IA local + nube
  ui/                      ← Interfaz React
    components/              ← 13 componentes de UI
    charts/                  ← Gráficos
    theme/                   ← Ultra Aesthetic Mode
```

## Changelog

### v1.4.0
- Limpieza de código: eliminado handler duplicado `turbo-activate` (consolidado en `run-turbo`)
- Fix: require innecesario de `deviceManager` en `turboMode.js`
- Fix: typo en JSDoc de `scripts.js` ("limieza" → "limpieza")
- Actualización de dependencias

### v1.3.0
- ADB empaquetado dentro de la app (Windows + Linux)
- No requiere instalación separada de ADB

### v1.2.1
- Fix: `notifications.js` movido a `src/core/` (era excluido por electron-builder)

### v1.2.0
- Limpieza completa del repo (73 MB → 550 KB)
- CI/CD con GitHub Actions (build automático en push, release en tag)

## Licencia

MIT — Pablo & Sindy.
