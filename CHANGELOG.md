# Changelog — PhoneOptimizer Pro

Todas las actualizaciones y cambios notables de este proyecto se documentan en este archivo.

## [v6.0] - 2026-05
### Arquitectura completamente renovada

**Nueva estructura modular:**
- `run.sh` — punto de entrada único con auto-detección de modo
- `core/config.sh` — configuración maestra v6.0 (HyperOS 3 / Android 16)
- `core/database.sh` — historial SQLite por dispositivo (optimization_runs, app_state, metrics_history)
- `core/display.sh` — dashboard terminal en tiempo real con tput (3 paneles + log scrolleable)
- `core/device_profile.sh` — detección y validación de dispositivo por serial
- `core/adb_utils.sh` — funciones ADB robustas con retry automático + snapshot completo
- `data/bloatware_db.sh` — base de datos expandida para HyperOS 3 / Android 16 (80+ paquetes)
- `engines/bloatware.sh` — motor de desactivación con detección de regresiones OTA
- `engines/performance.sh` — Poco Mode: animaciones, GPU Vulkan, resolución, dexopt
- `engines/memory.sh` — optimización de RAM con Memory Extension HyperOS 3
- `engines/camera_fix.sh` — fix completo cámara + WhatsApp con pre-calentamiento
- `engines/network.sh` — DNS, TCP, WiFi optimizados
- `engines/thermal.sh` — gestión térmica inteligente (com.xiaomi.joyose protegido)
- `modes/full_optimize.sh` — pipeline completo 9 fases
- `modes/maintenance.sh` — mantenimiento semanal < 5 min
- `modes/monitor.sh` — monitoreo en tiempo real con métricas guardadas en DB
- `modes/emergency.sh` — restauración total a fábrica

**Nuevas funcionalidades:**
- Soporte para 2 dispositivos simultáneos con reconocimiento por serial
- Auto-selección de modo: primera vez → full, 7 días → maintenance, sino → menú
- Detección y corrección automática de regresiones OTA (bloatware que vuelve tras actualizar)
- Score de optimización 0-100 con comparación antes/después
- Memory Extension HyperOS 3 (RAM 4GB → 8GB virtual)
- Resolución gaming 612x1360 @ 260dpi (+15% FPS)

**Correcciones de seguridad:**
- `com.xiaomi.joyose` protegido en CRITICAL_SYSTEM_APPS — no se desactiva nunca
- Temperatura bloqueante aumentada a 42°C (antes 40°C)
- media_scanner_enabled siempre se reactiva al final de camera_fix

**Scripts legados mantenidos** (siguen funcionando):
`benchmark.sh`, `diagnostico.sh`, `optimize-boot.sh`, `measure-boot.sh`, `mega-verificar.sh`

## [v5.0] - 2026-05
### Agregado
- **Seguridad primero**: El thermal management ya NO se desactiva por defecto para evitar sobrecalentamientos. Se requiere el flag `--no-thermal`.
- **Nuevo script `run-optimize.sh`**: Ejecución autónoma "Todo en Uno" con log detallado y reinicio automático.
- **Nuevo script `turbo-apps.sh`**: Evolución del fix de cámara/WhatsApp, ahora con pre-calentamiento, compilación de share sheet y teclado.
- **Nuevo script `optimize-boot.sh`**: Desactiva receivers innecesarios al inicio y optimiza servicios concurrentes.
- **Nuevo script `measure-boot.sh`**: Permite medir el tiempo de encendido real.

### Cambiado
- Verificaciones previas y advertencias antes de correr optimizaciones (compatibilidad de marca y lectura de temperatura <40°C).
- Actualizada la App Web (`index.html` y `app.js`) a la lógica de la v5.0.

## [v4.0] - 2026-04
### Agregado
- **`mega-optimizer.sh`**: Creado el Optimizador Masivo de 12 pasos.
- **Sistema de Rescue Points**: `rescue.sh` implementado para guardar configuraciones del sistema, paquetes instalados y ajustes gráficos antes de hacer cambios.
- **Modo Emergencia**: `emergencia.sh` agregado como botón de pánico para restaurar configuraciones y revivir apps.
- **Verificador**: `mega-verificar.sh` permite validar si el dispositivo aplicó todas las configuraciones exitosamente.

## [v3.0] - 2026-03
### Agregado
- **Menú Interactivo (`optimizer.sh`)**: Interfaz CLI completa y amigable para guiar al usuario por las optimizaciones.
- **Benchmark Completo (`benchmark.sh`)**: Mide rendimiento de CPU (10k iteraciones), RAM, red y estado de batería. Permite comparar un "Antes" y "Después".
- **`diagnostico.sh`** y **`mantenimiento.sh`**: Scripts dedicados a la lectura de métricas y a la limpieza mensual segura.
- Lanzamiento de la **App Web** experimental basada en la API de WebUSB.

## [v2.0] - 2026-02
### Agregado
- Modularidad del proyecto con scripts específicos (`tweaks-smooth.sh`, `tweaks-red.sh`, `tweaks-memoria.sh`).
- Perfiles de uso separados: `perfil-bateria.sh`, `perfil-rendimiento.sh`, `perfil-equilibrado.sh`, `perfil-gaming.sh`.
- Primer fix enfocado a apps con `fix-cam-whatsapp.sh`.

## [v1.0] - 2026-01
### Agregado
- Lanzamiento inicial del repositorio.
- Scripts básicos de limpieza con `bloatware-db.sh`.
- Soporte inicial para Redmi 14C.
