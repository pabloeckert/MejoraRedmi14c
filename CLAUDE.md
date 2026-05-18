# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Toolkit de optimización Android para **Redmi 14C / HyperOS** vía ADB. Tiene dos interfaces:
- **Scripts shell** (recomendado): ejecutar desde Linux/macOS/WSL con ADB instalado.
- **Web App** (`index.html` + `app.js` + `adb.js`): control desde el navegador vía WebUSB, sin instalar nada.

## Cómo ejecutar

```bash
# Dar permisos (solo la primera vez)
chmod +x *.sh

# Menú interactivo
./optimizer.sh

# Optimización completa automática
./run-optimize.sh [--dry-run] [--no-reboot] [--no-thermal] [--no-turbo]

# Simulación sin aplicar cambios
./mega-optimizer.sh --dry-run

# Web App (abrir en Chrome/Edge/Opera)
adb kill-server
python3 -m http.server 8000
# → http://localhost:8000
```

## Verificación y diagnóstico

```bash
./mega-verificar.sh   # Valida si los tweaks se aplicaron correctamente
./benchmark.sh        # Mide CPU, RAM y red (usar antes y después de optimizar)
./test-verificacion.sh
./diagnostico.sh
```

## Arquitectura

### Módulo base (sourced por todos los scripts)
- **`config.sh`** — Fuente de la verdad: versión, valores canónicos (swappiness, LMK, animaciones, HWUI, red, thermal), listas de apps pesadas y apps críticas del sistema. Incluye también las funciones de logging y wrappers ADB seguros (`safe_put`, `safe_put_system`, `safe_delete`, `safe_compile`). **Todos los scripts hacen `source config.sh` al inicio.**
- **`utils.sh`** — Funciones auxiliares adicionales (redunda algunas de config.sh para compatibilidad).

### Scripts principales
| Script | Rol |
|---|---|
| `optimizer.sh` | Menú interactivo CLI. Flujo: conectar → verificar → benchmark → menú de opciones. |
| `run-optimize.sh` | Pipeline completo: benchmark → mega-optimizer → turbo-apps → optimize-boot → verificación → reporte → reinicio. |
| `mega-optimizer.sh` | 12 pasos de optimización masiva (animaciones, GPU, bloatware, RAM, red, thermal). |
| `turbo-apps.sh` | Compilación y pre-calentamiento de WhatsApp, cámara, teclado y share sheet. |
| `optimize-boot.sh` | Desactiva receivers innecesarios al arranque. |
| `bloatware-db.sh` | Base de datos de paquetes a desactivar, con categoría de seguridad (🟢/🟡/🔴). |

### Scripts de perfil
`perfil-rendimiento.sh`, `perfil-equilibrado.sh`, `perfil-gaming.sh`, `perfil-bateria.sh` — Aplican subconjuntos de tweaks de `config.sh` según el modo elegido.

### Scripts de tweaks modulares
`tweaks-smooth.sh`, `tweaks-red.sh`, `tweaks-memoria.sh` — Tweaks atómicos invocados desde el menú o directamente.

### Seguridad y recuperación
- `rescue.sh` — Genera un Rescue Point antes de cambios masivos (guarda configuración actual).
- `emergencia.sh` — Revierte todo desde el Rescue Point (botón de pánico).
- `backup.sh` / `restore.sh` — Backup y restauración de ajustes.

### Logs
Todos los scripts llaman `init_log "nombre-script"` que crea `./logs/<nombre>_<timestamp>.log`. Se rotan automáticamente (máximo 10 por script). Los logs se escriben sin secuencias ANSI.

## Reglas de desarrollo

- **`config.sh` es la única fuente de valores numéricos**. No hardcodear swappiness, LMK, escalas de animación ni valores de HWUI en otros scripts.
- Todo script comienza con `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` y luego `source "$SCRIPT_DIR/config.sh"`.
- Usar `set +e` (no `set -e`) porque algunos paquetes ADB pueden no existir en todos los dispositivos.
- Usar las funciones de logging (`log_ok`, `log_warn`, `log_fail`, `log_info`, `log_step`) en vez de `echo` directo.
- Usar `safe_put` / `safe_put_system` / `safe_compile` en vez de comandos ADB directos cuando existan.
- Nunca desactivar thermal management por defecto; solo si el usuario pasa `--no-thermal`.
- Nunca modificar `CRITICAL_SYSTEM_APPS` definido en `config.sh`.
- La Web App (`adb.js`) implementa ADB sobre WebUSB nativo sin dependencias externas.
