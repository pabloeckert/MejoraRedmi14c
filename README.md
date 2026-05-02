# 🔧 Phone Optimizer

**Optimizador Inteligente para Android** — Diseñado para los teléfonos de Pablo y Sindy.

App de escritorio (Electron) que optimiza dos dispositivos Android físicos mediante ADB. Sin usuarios, sin cuentas — solo dispositivos reales.

---

## Requisitos

| Requisito | Versión | Notas |
|---|---|---|
| **Node.js** | 18+ | LTS recomendado |
| **ADB** | Cualquier | Debe estar en `PATH` (`adb version`) |
| **Teléfono Android** | 7.0+ | Depuración USB activada |
| **Sistema** | Win/Mac/Linux | macOS: Xcode CLI tools |

### Activar depuración USB

1. `Ajustes → Sobre del teléfono` → tocar "Número de compilación" 7 veces
2. `Ajustes → Opciones de desarrollador` → activar "Depuración USB"
3. Conectar por USB y aceptar la autorización en el teléfono

---

## Instalación

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
```

---

## Ejecución

### Desarrollo (con hot-reload)

```bash
npm run dev:electron
```

Esto levanta Vite (frontend) + Electron (backend) simultáneamente.

### Producción

```bash
npm run build      # Compilar frontend + generar instaladores
npm start          # Ejecutar Electron (desarrollo)
```

### Generar Instaladores

```bash
# Build completo (todas las plataformas disponibles)
npm run build

# Build por plataforma
npm run build:win      # → PhoneOptimizer-Setup-1.0.0.exe (NSIS)
npm run build:linux    # → PhoneOptimizer-1.0.0.AppImage
npm run build:mac      # → PhoneOptimizer-1.0.0.dmg
```

Los instaladores se generan en `dist-release/`:

| Plataforma | Archivo | Tamaño aprox. |
|---|---|---|
| **Windows** | `PhoneOptimizer-Setup-1.0.0.exe` | ~80 MB |
| **Linux** | `PhoneOptimizer-1.0.0.AppImage` | ~100 MB |
| **macOS** | `PhoneOptimizer-1.0.0.dmg` | ~90 MB |

#### Requisitos para builds multi-plataforma

- **Windows (.exe)**: Requiere [Wine](https://www.winehq.org/) en Linux/macOS
- **macOS (.dmg)**: Requiere macOS con Xcode CLI tools
- **Linux (.AppImage)**: Funciona en cualquier Linux con `rpm`/`dpkg`

#### Instalación

- **Windows**: Ejecutar el `.exe` → seguir el asistente NSIS
- **Linux**: `chmod +x PhoneOptimizer-1.0.0.AppImage && ./PhoneOptimizer-1.0.0.AppImage`
- **macOS**: Abrir el `.dmg` → arrastrar a Applications

### Solo frontend (para desarrollo UI)

```bash
npm run dev      # http://localhost:5173
```

---

## Flujos Clave

### 1. Optimización Normal

```
Conectar teléfono USB → "Detectar dispositivo" → "⚡ Optimizar ahora"
```

- **Primera conexión**: Optimización máxima absoluta (bloatware, rendimiento, modo Ultra)
- **Reconexiones**: Optimización inteligente basada en uso real
- Crea backup automático antes de optimizar
- Registra todo en el perfil del dispositivo

### 2. Modo Turbo

```
Panel Experto → runTurbo() o vía API interna
```

Optimización extrema bajo demanda en 8 fases:
1. Limpieza profunda de caches
2. Eliminación de bloatware
3. Boost de rendimiento (animaciones, GPU)
4. Control de procesos
5. Optimización de batería
6. Reducción de servicios MIUI
7. Optimización de red
8. Finalización

### 3. Predicciones y Dashboard

```
Pestaña "🔮 Predicciones" → Ver predicciones lineales + no lineales
```

- **Lineal**: Regresión sobre históricos para batería, temperatura, almacenamiento, procesos, memoria
- **No lineal**: Regresión polinómica grado 2-3 con R² ajustado
- **Dashboard**: Comparación visual de modelos, confianza ML, coeficientes, proyecciones
- **SmartInsights**: Resumen integrado con badges de urgencia

### 4. Reportes

```
Pestaña "⚙️ Config" → Sección "Exportar Reporte"
```

| Formato | Descripción |
|---|---|
| **JSON** | Datos completos estructurados |
| **HTML** | Visual dark theme con tablas |
| **PDF** | Reporte profesional con portada y TOC |
| **CSV** | Snapshots, optimizaciones, predicciones |
| **XML** | Integración con sistemas externos |
| **Bundle** | ZIP con JSON + CSV + XML + TXT |

### 5. Modo Guardian

```
Pestaña "⚙️ Config" → Sección "Modo Guardian" → Toggle
```

Protección continua cada 30 segundos:
- Monitorea predicciones ML, anomalías, temperatura, procesos
- Notifica automáticamente ante riesgos
- Optimiza proactivamente ante alertas críticas
- Escala a Modo Turbo tras 3 alertas críticas acumuladas

### 6. Modo Automático

```
Pestaña "⚙️ Config" → Sección "Modo Automático" → Toggle
```

Detección automática de dispositivos:
- Detecta conexión USB
- Ejecuta optimización sin intervención
- Integra predicciones ML post-optimización
- Activa Turbo automáticamente si hay predicciones críticas

---

## Arquitectura

```
main.js              ← Electron main process (IPC handlers)
preload.js           ← Bridge seguro main↔renderer
src/
  adb/               ← Comunicación ADB (USB, WiFi, scripts)
  core/              ← Lógica de negocio
    optimizerEngine    ← Orquestador principal
    turboMode          ← Modo Turbo (8 fases)
    guardian           ← Modo Guardian (loop 30s)
    autoMode           ← Detección automática
    proactiveOptimizer ← Optimización preventiva
    scheduler          ← Tareas programadas
    backupManager      ← Backups y rollback
    reportExporter     ← JSON + HTML
    pdfExporter        ← PDF profesional
    advancedExporter   ← CSV + XML + bundles
    internalAPI        ← API unificada
    telemetry          ← Eventos y métricas
    benchmark          ← Tests de rendimiento
    errorHandler       ← Gestión de errores
  devices/           ← Gestión de dispositivos y perfiles
  extensions/        ← Sistema de extensiones y plugins
    pluginSandbox      ← Sandbox VM seguro
  logs/              ← Sistema de logs
  ml/                ← Motor ML
    adaptiveOptimizer  ← ML adaptativo
    failurePredictor   ← Predicción de fallos
    nonLinearPredictor ← Regresión polinómica
    anomalyDetector    ← Detección de anomalías
    hybridAI           ← IA local + nube
  ui/                ← Interfaz React
    components/        ← 13 componentes de UI
    theme/             ← Ultra Aesthetic Mode
```

---

## Pestañas de la UI

| Pestaña | Contenido |
|---|---|
| 📋 Resumen | Dashboard principal, estado del dispositivo |
| 📊 Tiempo Real | Métricas en vivo |
| 📈 Tendencias | Gráficos históricos |
| 🧠 Insights | SmartInsights, anomalías, predicciones |
| 🔮 Predicciones | Dashboard ML (lineal + no lineal) |
| 🔬 Diagnóstico | Diagnósticos avanzados |
| 🏋️ Benchmark | Tests de rendimiento |
| 🧩 Extensiones | Plugins y extensiones |
| 🔬 Experto | Logs crudos, telemetría, estado interno, memoria |
| ⚙️ Config | Auto Mode, Guardian, WiFi, backups, reportes, scheduler |

---

## Sistema de Extensiones

Los plugins se colocan en `extensions/plugins/` con esta estructura:

```
extensions/plugins/
  mi-plugin/
    manifest.json    ← Metadatos y permisos
    index.js         ← Lógica principal
    panel.jsx        ← UI (opcional)
```

Ver [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) para detalles completos.

---

## Documentación

| Documento | Contenido |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del sistema |
| [OPTIMIZER_FLOW.md](./OPTIMIZER_FLOW.md) | Flujo de optimización |
| [TURBO_MODE.md](./TURBO_MODE.md) | Modo Turbo |
| [GUARDIAN_MODE.md](./GUARDIAN_MODE.md) | Modo Guardian |
| [FAILURE_PREDICTION.md](./FAILURE_PREDICTION.md) | Predicción de fallos |
| [NON_LINEAR_PREDICTION.md](./NON_LINEAR_PREDICTION.md) | ML polinómico |
| [HYBRID_AI.md](./HYBRID_AI.md) | IA híbrida local + nube |
| [PREDICTION_DASHBOARD.md](./PREDICTION_DASHBOARD.md) | Dashboard de predicciones |
| [PROACTIVE_OPTIMIZATION.md](./PROACTIVE_OPTIMIZATION.md) | Optimización proactiva |
| [REPORTS.md](./REPORTS.md) | Exportación de reportes |
| [PDF_EXPORT.md](./PDF_EXPORT.md) | Exportación PDF |
| [ADVANCED_EXPORT.md](./ADVANCED_EXPORT.md) | CSV, XML, bundles |
| [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) | Sistema de plugins |
| [TELEMETRY.md](./TELEMETRY.md) | Telemetría |
| [EXPERT_MODE.md](./EXPERT_MODE.md) | Modo Experto |
| [INTERNAL_API.md](./INTERNAL_API.md) | API interna |
| [ROADMAP.md](./ROADMAP.md) | Roadmap futuro |

---

## Limitaciones Conocidas

- **ADB requerido**: Sin ADB en PATH, la app no funciona
- **Un dispositivo a la vez**: La detección USB maneja un dispositivo simultáneamente
- **WiFi ADB**: Requiere conexión USB inicial para configurar
- **PDF export**: Genera HTML imprimible como PDF (no genera PDF binario directamente)
- **Hybrid AI**: El endpoint remoto requiere configuración manual (API key + URL)
- **Sin tests automatizados**: No hay suite de tests (recomendado para futuro)
- **Electron 28**: Versión fija del framework

---

## Roadmap Futuro

- [ ] Suite de tests automatizados
- [ ] Soporte multi-dispositivo simultáneo
- [x] Build de distribución (Windows/Mac/Linux installers)
- [ ] Integración nube para ML híbrido
- [ ] Dashboard web remoto
- [ ] Perfiles de optimización personalizados por app
- [ ] Historial de rendimiento con gráficos interactivos
- [ ] Exportación a Google Sheets / Notion

---

## Licencia

Proyecto privado — Pablo & Sindy.
