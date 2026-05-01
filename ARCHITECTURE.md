# ARCHITECTURE.md — Phone Optimizer

## Visión General

Phone Optimizer es una aplicación de escritorio (Electron) que detecta, analiza y optimiza teléfonos Android conectados por USB. Diseñada exclusivamente para los dispositivos de Pablo y Sindy.

```
┌─────────────────────────────────────────────────────────────┐
│                    Phone Optimizer (Electron)                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│     UI       │    Core      │    ADB       │     ML         │
│  (React +    │  (Optimizer  │  (Client +   │  (Adaptive     │
│   Tailwind)  │   Engine)    │   Scripts)   │   Learning)    │
├──────────────┴──────┬───────┴──────────────┴────────────────┤
│              Devices Manager                                │
│         (Detección + Perfiles + Historial)                  │
├─────────────────────┴───────────────────────────────────────┤
│                    Log Manager                               │
│           (Snapshots + Optimizaciones + Tendencias)         │
└─────────────────────────────────────────────────────────────┘
```

## Módulos

### `/src/adb/` — Capa ADB
- **adbClient.js**: Abstracción completa del protocolo ADB. Ejecuta comandos, parsea resultados, maneja timeouts.
- **scripts.js**: Paquetes de scripts predefinidos: bloatware lists, ajustes de rendimiento, modo Ultra.

### `/src/core/` — Motor de Optimización
- **optimizerEngine.js**: Orquestador principal. Decide entre `maxOptimization` o `smartOptimization`.
- **maxOptimization.js**: Primera conexión. 7 pasos: snapshot → bloatware → MIUI → rendimiento → ultra mode → limpieza → batería.
- **smartOptimization.js**: Conexiones posteriores. Analiza patrones, genera plan dinámico, ejecuta ajustes.

### `/src/devices/` — Gestión de Dispositivos
- **deviceManager.js**: Detecta dispositivos, crea perfiles, identifica primera vs reconexión.

### `/src/logs/` — Sistema de Logs
- **logManager.js**: Registra snapshots, optimizaciones, tendencias. Todo persistido en JSON por dispositivo.

### `/src/ml/` — Motor de Aprendizaje
- **adaptiveOptimizer.js**: Modelo estadístico bayesiano. EMA para batería, temperatura, procesos. Predice necesidades.

### `/src/config/` — Configuración
- **default.json**: Configuración por defecto de la app.

### `/src/ui/` — Interfaz de Usuario
- **App.jsx**: Componente raíz. Maneja estados de conexión y optimización.
- **Dashboard.jsx**: Panel principal con stats, historial, estado.
- **DeviceCard.jsx**: Info del dispositivo conectado.
- **OptimizationPanel.jsx**: Detalles de la optimización ejecutada.

## Flujo de Datos

```
USB → ADB → adbClient → deviceManager → optimizerEngine
                                              ↓
                        ┌─────────────────────┼─────────────────────┐
                        ↓                     ↓                     ↓
                  maxOptimization      smartOptimization      ML Learning
                        ↓                     ↓                     ↓
                  logManager ←───────────────┴─────────────────────┘
                        ↓
                    UI Dashboard
```

## Decisiones de Diseño

1. **Electron + React + Vite**: Stack moderno, HMR rápido, build optimizado.
2. **ADB via shell**: No dependemos de librerías ADB de terceros. Shell directo = más control.
3. **ML estadístico**: Sin dependencias pesadas (TensorFlow). EMA + frecuencias = suficiente para este caso.
4. **Logs JSON**: Simple, legible, fácil de analizar. Sin necesidad de base de datos.
5. **Perfiles por dispositivo**: Cada teléfono tiene su propio historial y modelo ML.
