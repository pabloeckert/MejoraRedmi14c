# Changelog — MejoraRedmi14c

Todas las actualizaciones y cambios notables de este proyecto se documentan en este archivo.

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
