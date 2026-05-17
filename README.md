# Optimizador Android por ADB — Redmi 14C / HyperOS

Este proyecto es un toolkit avanzado para la optimización de dispositivos **Xiaomi / Redmi / POCO**, enfocado específicamente en el Redmi 14C. Puedes usar los scripts locales de shell (Recomendado) o la App Web a través de WebUSB.

## ⚠️ Seguridad Primero

Este proyecto prioriza la salud de tu dispositivo:
- **Thermal management**: NO se desactiva por defecto. Evitamos sobrecalentamientos peligrosos (solo se fuerza bajo tu propio riesgo usando `--no-thermal`).
- **Validación de modelo**: Identifica tu teléfono antes de realizar cambios.
- **Check de temperatura**: Si el dispositivo supera los 40°C, las rutinas agresivas se cancelan.
- **Dry-run**: Usa `./mega-optimizer.sh --dry-run` para simular cambios sin aplicar ninguno.
- **Rescue Points**: Antes de cada cambio masivo, se genera un punto de restauración automático.

## 🚀 Guía Rápida

Si no sabes por dónde empezar, aquí tienes los caminos más comunes. Para todas las opciones necesitas tener tu PC conectada al teléfono y la Depuración USB encendida.

| Tu necesidad | Qué ejecutar en la terminal |
|---|---|
| **Quiero optimizarlo al MÁXIMO sin pensar** | `./run-optimize.sh` (Hace TODO y reinicia) |
| **Quiero ser guiado paso a paso** | `./optimizer.sh` (Abre el menú interactivo) |
| **Quiero arreglar WhatsApp lento y la cámara**| `./turbo-apps.sh` |
| **Quiero limpiar la basura de Xiaomi (Bloatware)** | `./mega-optimizer.sh` |
| **Mi teléfono falló / Quiero volver a fábrica** | `./emergencia.sh` |

## 📊 Tabla Comparativa de Scripts

| Script | Qué hace | Cuándo usarlo | Riesgo |
|---|---|---|:---:|
| `optimizer.sh` | Menú interactivo amigable. | Siempre que quieras navegar visualmente las opciones. | Bajo |
| `run-optimize.sh` | Optimización autónoma, log, y reinicio. | Cuando quieras aplicar el máximo rendimiento de una vez. | Medio |
| `mega-optimizer.sh` | Aplica 12 optimizaciones brutales. | Para limpiar RAM, basura, e inyectar FPS a juegos y UI. | Medio |
| `turbo-apps.sh` | Compila y carga en memoria WA/Cámara. | Si WhatsApp tarda en abrir o la cámara va a tirones. | Bajo |
| `optimize-boot.sh` | Optimiza receivers de arranque. | Si tu teléfono tarda mucho en encender. | Bajo |
| `benchmark.sh` | Mide CPU, RAM y red del dispositivo. | Antes y después de aplicar tweaks, para notar la diferencia. | Nulo |
| `mantenimiento.sh` | Limpia cache y cierra procesos pesados. | Una vez al mes, para mantener el celular fluido. | Bajo |
| `emergencia.sh` | Revierte todo desde el Rescue Point. | Si un script te provocó fallos, o querés vender el teléfono. | Nulo |

## Uso Básico

1. Clona el repo:
   ```bash
   git clone https://github.com/pabloeckert/MejoraRedmi14c.git
   cd MejoraRedmi14c
   chmod +x *.sh
   ```
2. Ejecuta el menú principal:
   ```bash
   ./optimizer.sh
   ```
   
Para explicaciones más detalladas y cómo configurar ADB, lee nuestro [TUTORIAL.md](TUTORIAL.md) o revisa el [FAQ.md](FAQ.md).

## Web App Alternativa

Si no quieres usar la terminal, abre `index.html` en Chrome, Edge u Opera:

```bash
adb kill-server
python3 -m http.server 8000
# Abrir http://localhost:8000
```
