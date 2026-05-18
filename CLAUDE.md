# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Toolkit de optimización Android para **Redmi 14C / HyperOS** vía ADB. Tiene dos interfaces:
- **Scripts shell** (recomendado): ejecutar desde Linux/macOS/WSL con ADB instalado.
- **Web App** (`src/web/index.html` + `app.js` + `adb.js`): control desde el navegador vía WebUSB, sin instalar nada.

## Estructura del proyecto

```
PhoneOptimizer Pro/
├── src/
│   ├── cli/              # Backend bash (CLI)
│   │   ├── core/         # Módulos base
│   │   │   ├── config.sh
│   │   │   ├── database.sh
│   │   │   ├── adb_utils.sh
│   │   │   ├── display.sh
│   │   │   └── device_profile.sh
│   │   ├── data/         # Bases de datos
│   │   │   └── bloatware_db.sh
│   │   ├── engines/      # Motores de optimización
│   │   │   ├── bloatware.sh
│   │   │   ├── performance.sh
│   │   │   ├── memory.sh
│   │   │   ├── camera_fix.sh
│   │   │   ├── network.sh
│   │   │   └── thermal.sh
│   │   ├── modes/        # Modos de operación
│   │   │   ├── full_optimize.sh
│   │   │   ├── maintenance.sh
│   │   │   ├── monitor.sh
│   │   │   └── emergency.sh
│   │   ├── run.sh        # Punto de entrada principal
│   │   ├── benchmark.sh
│   │   ├── diagnostico.sh
│   │   ├── optimize-boot.sh
│   │   ├── measure-boot.sh
│   │   ├── mega-verificar.sh
│   │   ├── test-verificacion.sh
│   │   ├── restore.sh
│   │   └── log-apply.sh
│   └── web/              # Frontend web
│       ├── index.html
│       ├── app.js
│       ├── adb.js
│       ├── styles.css
│       └── favicon.svg
├── tools/
│   ├── data/             # Datos persistentes
│   ├── logs/             # Logs de ejecución
│   ├── backups/          # Backups automáticos
│   ├── rescue-points/    # Puntos de restauración
│   └── lanzador.bat      # Launcher Windows
├── scripts/              # Scripts utilitarios
├── .github/              # Configuración GitHub
├── README.md
├── QUICKSTART.md
├── TUTORIAL.md
└── ...
```

## Cómo ejecutar

```bash
# Dar permisos (solo la primera vez)
chmod +x src/cli/*.sh

# Menú interactivo (auto-detecta modo)
./src/cli/run.sh

# Optimización completa automática
./src/cli/run.sh --full

# Simulación sin aplicar cambios
./src/cli/run.sh --dry-run

# Web App (abrir en Chrome/Edge/Opera)
cd src/web
python3 -m http.server 8000
# → http://localhost:8000
```

## Verificación y diagnóstico

```bash
./src/cli/mega-verificar.sh   # Valida si los tweaks se aplicaron correctamente
./src/cli/benchmark.sh        # Mide CPU, RAM y red (usar antes y después de optimizar)
./src/cli/test-verificacion.sh
./src/cli/diagnostico.sh
```

## Arquitectura

### Módulo base (sourced por todos los scripts)
- **`src/cli/core/config.sh`** — Fuente de la verdad: versión, valores canónicos (swappiness, LMK, animaciones, HWUI, red, thermal), listas de apps pesadas y apps críticas del sistema. Incluye también las funciones de logging y wrappers ADB seguros. **Todos los scripts hacen `source config.sh` al inicio.**

### Scripts principales
| Script | Rol |
|---|---|
| `src/cli/run.sh` | Punto de entrada único. Detecta automáticamente el modo a ejecutar o muestra menú interactivo. |
| `src/cli/modes/full_optimize.sh` | Optimización completa (Poco Mode) |
| `src/cli/modes/maintenance.sh` | Mantenimiento semanal (regresiones OTA + cache) |
| `src/cli/modes/monitor.sh` | Monitoreo en tiempo real |
| `src/cli/modes/emergency.sh` | Restaurar todo a fábrica |

### Engines (motores de optimización)
| Engine | Función |
|---|---|
| `bloatware.sh` | Desactivación segura de apps innecesarias |
| `performance.sh` | Tweaks de CPU, GPU y rendimiento |
| `memory.sh` | Optimización de RAM y swap |
| `camera_fix.sh` | Mejoras específicas para cámara |
| `network.sh` | Optimizaciones de red |
| `thermal.sh` | Gestión térmica (sin tocar joyose) |

### Seguridad y recuperación
- `tools/rescue-points/` — Genera puntos de rescate antes de cambios masivos.
- `src/cli/run.sh --emergency` — Revierte todo (botón de pánico).
- `tools/backups/` — Backup automático completo antes de cada optimización.

### Logs
Todos los scripts llaman `init_log "nombre-script"` que crea `./tools/logs/<nombre>_<timestamp>.log`. Se rotan automáticamente (máximo 10 por script). Los logs se escriben sin secuencias ANSI.

## Reglas de desarrollo

- **`config.sh` es la única fuente de valores numéricos**. No hardcodear swappiness, LMK, escalas de animación ni valores de HWUI en otros scripts.
- Todo script comienza con `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` y luego `source "$SCRIPT_DIR/core/config.sh"`.
- Usar `set +e` (no `set -e`) porque algunos paquetes ADB pueden no existir en todos los dispositivos.
- Usar las funciones de logging (`log_ok`, `log_warn`, `log_fail`, `log_info`, `log_step`) en vez de `echo` directo.
- Usar `safe_put` / `safe_put_system` / `safe_compile` en vez de comandos ADB directos cuando existan.
- Nunca desactivar thermal management por defecto; solo si el usuario pasa `--no-thermal`.
- Nunca modificar `CRITICAL_SYSTEM_APPS` definido en `config.sh`.
- La Web App (`adb.js`) implementa ADB sobre WebUSB nativo sin dependencias externas.
