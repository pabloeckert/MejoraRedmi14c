# PhoneOptimizer Pro v6.0 — Redmi 14C / HyperOS 3

Toolkit de limpieza y mantenimiento para **Redmi 14C (HyperOS 3 / Android 16 / Helio G81 Ultra)**. Todo se maneja desde la terminal — no hay interfaz gráfica ni web.

## Requisitos

- ADB instalado (`android-tools-adb` / `android-platform-tools`)
- SQLite3 instalado (`sqlite3`)
- bash 4+ (en macOS: `brew install bash`)
- Cable USB datos + Depuración USB activada en el teléfono
- Python 3.11+ solo para los monitores headless (`forge/services/`) y la auditoría de apps (`forge/core/app_scanner.py`) — opcional, el CLI Bash funciona sin Python

## Uso — Una sola línea

```bash
cd src/cli && chmod +x run.sh && ./run.sh
```

El script detecta automáticamente:
- **Primera vez** → Optimización completa (Poco Mode)
- **Cada 7 días** → Mantenimiento semanal (regresiones OTA + cache)
- **Siempre** → Muestra menú si no corresponde ninguna de las anteriores

## Modos disponibles

| Flag | Modo | Duración aprox. |
|---|---|---|
| `./run.sh` | Auto-detección | variable |
| `./run.sh --full` / `-f` | Optimización completa | 15-30 min |
| `./run.sh --profile` / `-p` | Optimización con perfil personalizado (`data/profile_runtime.sh`) | 15-30 min |
| `./run.sh --maintenance` / `-s` | Mantenimiento semanal | < 5 min |
| `./run.sh --monitor` / `-m` | Monitoreo en tiempo real | continuo |
| `./run.sh --emergency` / `-e` | Restaurar todo a fábrica | 2-3 min |
| `./run.sh --scan` | Solo escanea, no modifica nada | rápido |

## Qué hace el Poco Mode

- **Bloatware desactivado**: telemetría, ads, apps Xiaomi/Google/Facebook no usadas — vía `pm disable-user`, con fallback a `pm uninstall -k --user 0` para apps de sistema en Android 16 (ver limitaciones abajo)
- **GPU forzada** con Vulkan + MSAA
- **Animaciones 0.3x** (persisten, vía `settings put system` — `global` está bloqueado en Android 16 sin root)
- **Swappiness 20**, LMK agresivo, HWUI cache XL

## Auditoría y limpieza de apps desde terminal

```bash
python -m forge.core.app_scanner --scan <SERIAL>
```

Escanea los paquetes instalados, los categoriza contra un catálogo local (`forge/core/apps_catalog.py`, `packages_db.py`) y respeta los mismos guardrails que el CLI: nunca toca `com.xiaomi.joyose`, protege las apps de SafetyNet/banca (`SAFETYNET_PROTECTED`) y las críticas de negocio (`BUSINESS_CRITICAL`). Con `ANTHROPIC_API_KEY` en el entorno, clasifica automáticamente apps desconocidas vía Claude Haiku; sin la clave, el escaneo funciona igual pero sin descripciones para esas apps.

## Monitores headless (Task Scheduler / cron)

```bash
python forge/services/ota_check.py           # chequeo de nueva build HyperOS cada 14-15 días
python -m forge.services.maintenance_check    # storage / temperatura / backup local WhatsApp
```

Ninguno de los dos requiere UI ni ventana — pensados para correr en segundo plano (`setup.ps1` ya registra `ota_check.py` en el Programador de tareas de Windows; `maintenance_check.py` corre manual por ahora).

## Soporte para 2 dispositivos

Si conectás los dos Redmi 14C a la vez, el script muestra un menú de selección. Cada dispositivo tiene su propio historial en `src/cli/data/devices.db`.

## Ciclo de 7 días

El script detecta automáticamente si han pasado 7+ días desde el último run y lanza el mantenimiento semanal, que corrige regresiones OTA (apps que HyperOS reactiva tras actualizar) y limpia cache.

## Seguridad

- `com.xiaomi.joyose` **NUNCA se toca** — es el gestor térmico del Helio G81 Ultra. Desactivarlo causa sobrecalentamiento. Está protegido en `CRITICAL_SYSTEM_APPS` (`core/config.sh`) y todo el código de desactivación pasa por `safe_disable_pkg()`, que lo chequea antes de tocar cualquier paquete.
- Temperatura bloqueante: si el teléfono supera 42°C, el script aborta (`thermal_gate_check`).
- Backup automático completo antes de cada optimización (`src/cli/backups/`).
- Restauración completa: `./run.sh --emergency`

## Herramientas adicionales (`src/cli/tools/`)

| Script | Función |
|---|---|
| `benchmark.sh` | Mide CPU, RAM y red — comparar antes/después |
| `diagnostico.sh` | Lee métricas del sistema |
| `optimize-boot.sh` | Optimiza receivers de arranque (usar con `--dry-run` primero) |
| `measure-boot.sh` | Mide tiempo real de encendido |
| `mega-verificar.sh` | Verifica si los tweaks se aplicaron |
| `set-launcher.sh <pkg>` | Reemplaza el launcher de HyperOS por otro instalado (ej. Lawnchair), 100% reversible con `--reset` |
| `ruta-optima.sh` | Calcula ruta óptima de optimización |
| `log-apply.sh` | Aplica un log de cambios previo |
| `test-verificacion.sh` | Pruebas de verificación del sistema |

---

Para entender la arquitectura del código, leé [CLAUDE.md](CLAUDE.md).
