# PhoneOptimizer Pro v6.0 — Redmi 14C (HyperOS 3)

## Descripción General
Este proyecto es un toolkit avanzado de optimización para dispositivos **Redmi 14C** ejecutando **HyperOS 3 (Android 16 / Helio G81 Ultra)**. Su objetivo es transformar el rendimiento del dispositivo a un "Poco Mode", eliminando bloatware, optimizando la GPU, RAM, red y cámara mediante comandos ADB y ajustes directos en el sistema.

## Tecnologías Principales
- **Bash 4+**: Lenguaje principal para la lógica del CLI.
- **ADB (Android Debug Bridge)**: Comunicación directa con el dispositivo.
- **SQLite3**: Base de datos local (`src/cli/data/devices.db`) para el historial de optimizaciones por dispositivo.
- **WebUSB ADB**: Utilizado en la aplicación web (`src/web/`) para interactuar con el teléfono desde el navegador.

## Arquitectura del Proyecto

### 1. CLI (`src/cli/`)
- **`run.sh`**: Punto de entrada único. Gestiona la auto-detección de dispositivos y modos.
- **`core/`**: Librerías fundamentales (base de datos, configuración maestra, comunicación ADB, perfiles de dispositivos).
- **`engines/`**: Módulos especializados en optimizaciones específicas:
    - `bloatware.sh`: Gestión de aplicaciones no deseadas.
    - `performance.sh`: Tweaks de GPU (Vulkan/MSAA) y sistema.
    - `memory.sh`: Optimización de RAM, swap y LMK.
    - `camera_fix.sh`: Compilación en modo speed y pre-carga.
    - `network.sh`: Mejoras en DNS y TCP.
    - `thermal.sh`: Monitor de temperatura (seguridad).
- **`modes/`**: Orquestadores de motores según el objetivo (Full Optimize, Maintenance, Monitor, Emergency).
- **`tools/`**: Scripts de utilidad para diagnóstico, benchmarks y verificación.

### 2. Web App (`src/web/`)
Interfaz alternativa basada en web que replica las funciones del CLI de manera visual utilizando WebUSB.

## Comandos de Uso

### CLI (Terminal)
- **Auto-detección**: `./run.sh`
- **Optimización Completa**: `./run.sh --full` o `./run.sh -f`
- **Mantenimiento Semanal**: `./run.sh --maintenance` o `./run.sh -s`
- **Modo Emergencia (Restore)**: `./run.sh --emergency` o `./run.sh -e`
- **Monitoreo**: `./run.sh --monitor` o `./run.sh -m`

### Verificación
- **Mega Verificador**: `bash src/cli/tools/mega-verificar.sh`

### Web App
1. Iniciar servidor local: `python3 -m http.server 8000` (desde `src/web/`)
2. Abrir `http://localhost:8000` en Chrome/Edge.

## Convenciones de Desarrollo
- **Seguridad Primero**: No tocar `com.xiaomi.joyose` (gestor térmico). Abortar si la temperatura supera los 42°C.
- **Modularidad**: Cada nueva optimización debe vivir en su propio motor en `src/cli/engines/`.
- **Persistencia**: Toda acción debe registrarse en la base de datos SQLite para permitir el ciclo de mantenimiento de 7 días.
- **Compatibilidad**: Diseñado específicamente para el modelo `2409BRN2CL` (Redmi 14C Latin America).
- **Backups**: El script debe realizar un backup automático antes de cada optimización en `src/cli/backups/`.

## Estructura de Datos
- **`devices.db`**: Tabla de dispositivos con serial, apodo, última fecha de optimización y métricas de rendimiento pre/post.
