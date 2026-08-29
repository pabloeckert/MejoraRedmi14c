# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Redmi Forge — CLAUDE.md para Claude Code

> **Repo base:** https://github.com/pabloeckert/MejoraRedmi14c  
> **Actualizado:** 29 de agosto de 2026

---

## Estado actual del proyecto

Repo depurado el 29/08/2026: se eliminó toda interfaz (UI PySide6, web app WebUSB, stub Electron, plan de migración a Tauri) y todo lo que solo la servía. Lo que queda es exclusivamente para trabajar la limpieza y el mantenimiento del teléfono **desde la terminal**.

| Carpeta / archivo | Estado | Descripción |
|-------------------|--------|-------------|
| `src/cli/` | ✅ **Producción** | Toolkit Bash v6.0 — el producto principal, todo por línea de comandos |
| `forge/core/adb_bridge.py` | ✅ Funcional | Wrapper ADB puro (find_adb, list_devices, scan_device) — sin dependencias de UI |
| `forge/core/app_scanner.py` | ✅ Funcional | Auditoría/limpieza de apps desde terminal: `python -m forge.core.app_scanner --scan <SERIAL>` |
| `forge/core/apps_catalog.py`, `packages_db.py` | ✅ Funcional | Catálogos de soporte para `app_scanner.py` |
| `forge/core/ota_watcher.py` | ✅ Funcional | Lógica pura de chequeo/reaplicación de tweaks OTA (sin Qt) — usada por `ota_check.py` |
| `forge/services/ota_check.py` | ✅ Producción | OTA watcher autónomo — corre via Task Scheduler, sin UI |
| `forge/services/maintenance_check.py` | ⚠️ Funcional, sin scheduler | Monitor headless de storage/temp/backup local WhatsApp — mismo patrón que `ota_check.py` pero **no** registrado aún en `setup.ps1`; correr manual: `python -m forge.services.maintenance_check` |
| `setup.ps1` / `setup.bat` | ✅ Producción | Setup one-command para PC nueva — instala deps headless, ADB, Task Scheduler |
| **Dispositivo Pablo** | NB5XWCLZSGB6J74D | 75 apps eliminadas, animaciones 0.3x, 90Hz, DEXOPT completo. Baseline: 1141MB RAM libre, 29°C reposo. Build: OS3.0.20.0.WGTMIXM (abr 2026) — la más reciente para MXM. |
| **Dispositivo Sindy** | VOSWQCOVJVQWT8LR | Monitoreado por OTA watcher (`ota_check.py`). Estado: desconocido — no optimizado con CLI. |

**Eliminado en la purga del 29/08/2026** (ver commit correspondiente para detalle): `forge/ui/` (UI PySide6), `main.py`, `src/web/` (web app WebUSB), `app/` (stub Electron), `forge/db/` + `forge/dev/` (persistencia y seed solo usados por la UI), `forge/core/debloat_engine.py` (puente perfil-UI → Bash), `forge/core/device_watcher.py` (poller Qt), `forge/core/game_mode.py` (feature de rendimiento, fuera de alcance de limpieza/mantenimiento — ver hallazgo "Game Mode" abajo), `forge/core/log_parser.py` (parsing para la UI), `.github/workflows/deploy.yml` (publicaba la web app), `SCRIPTS_INVENTORY.md` (planificaba una migración a Tauri, obsoleto).

No hay interfaz de ningún tipo en este repo. Todo el trabajo es por prompt/terminal: CLI Bash + módulos Python invocados con `python -m`.

---

## Comandos de desarrollo

```bash
# ─── Setup en PC nueva (una sola vez) ───────────────────────────────────
# En PowerShell:
Set-ExecutionPolicy -Scope CurrentUser Bypass -Force
.\setup.ps1   # instala deps headless + ADB check + registra Task Scheduler

# ─── CLI Bash (núcleo — no modificar) ───────────────────────────────────
cd src/cli && ./run.sh            # auto-detección de dispositivo
cd src/cli && ./run.sh --full     # optimización completa (Poco Mode)
cd src/cli && ./run.sh --profile  # optimización con perfil personalizado (data/profile_runtime.sh)
cd src/cli && ./run.sh --maintenance
cd src/cli && ./run.sh --monitor
cd src/cli && ./run.sh --emergency
cd src/cli && ./run.sh --scan     # solo escanea, no modifica nada
cd src/cli && ./restore.sh <carpeta_snapshot>  # restauración manual desde backup

# ─── Auditoría manual de apps (con dispositivo conectado) ───────────────
python -m forge.core.app_scanner --scan <SERIAL>   # escanea y muestra tabla de apps

# ─── Monitores headless (mismo patrón, para Task Scheduler) ─────────────
python forge/services/ota_check.py           # chequeo OTA — ya registrado en setup.ps1
python -m forge.services.maintenance_check   # storage/temp/backup WhatsApp — correr manual, sin scheduler aún

# ─── Diagnóstico y verificación ─────────────────────────────────────────
bash src/cli/diagnostico.sh
bash src/cli/tools/mega-verificar.sh
bash src/cli/tools/benchmark.sh
bash src/cli/tools/measure-boot.sh        # mide tiempos de boot
bash src/cli/tools/test-verificacion.sh   # pruebas de verificación del sistema
bash src/cli/tools/ruta-optima.sh         # calcula ruta óptima de optimización
bash src/cli/tools/log-apply.sh           # aplica un log de cambios previo
bash src/cli/tools/optimize-boot.sh --dry-run   # SIEMPRE con --dry-run primero (ver nota BUG 1 resuelto)
```

**Requisitos módulos Python:** Python 3.11+, `anthropic ≥ 0.28.0` (clasificación de apps desconocidas en `app_scanner.py`, opcional — requiere `ANTHROPIC_API_KEY`), `plyer ≥ 2.1.0` (notificación Windows en `ota_check.py`), ADB en PATH o en `vendor/adb/adb.exe`. Instalar via `pip install -r requirements.txt`. **No hay PySide6 en el repo** — se sacó junto con la UI.  
**Requisitos CLI:** bash 4+ (WSL o Git Bash en Windows), ADB, sqlite3, dispositivo con USB debugging.  
**Shell en Windows:** `forge/core/adb_bridge.py:find_shell()` detecta Git Bash → WSL en ese orden (Git Bash tiene preferencia; WSL con systemd roto causa fallos).

---

## Bugs críticos — resueltos

- **BUG 1 (resuelto 29/08/2026)** `src/cli/tools/optimize-boot.sh` tenía `com.xiaomi.joyose` hardcodeado en `BOOT_APPS` y lo desactivaba con `pm disable-user` directo, sin pasar por `safe_disable_pkg()`/`is_critical_pkg()`. Se sacó `joyose` del array y se agregó un guardrail explícito en el loop (`is_critical_pkg` de `config.sh`, con fallback hardcodeado si `config.sh` no está sourceado) que salta cualquier paquete crítico antes de tocarlo. Corré siempre con `--dry-run` primero de todos modos.

## Limitaciones Android 16 — parche BP2A.250605.031.A3 (confirmadas 01/06/2026)

Android 16 con el parche de seguridad de junio 2025 bloqueó múltiples mecanismos que antes funcionaban vía ADB sin root. El CLI en `safe_disable_pkg()` ya tiene el fallback correcto:

| Comando | Estado | Alternativa válida |
|---------|--------|--------------------|
| `settings put global <key>` | ❌ Bloqueado (requiere WRITE_SECURE_SETTINGS) | `settings put system <key>` para animaciones/display |
| `pm disable-user --user 0 <system_pkg>` | ❌ Bloqueado para apps del sistema | `pm uninstall -k --user 0` (ver abajo) |
| `pm uninstall -k --user 0 <system_pkg>` | ⚠️ Parcial — funciona solo para overlays/apps sin dependencias del kernel | `cmd appops set <pkg> RUN_ANY_IN_BACKGROUND deny` |
| `pm hide --user 0 <pkg>` | ❌ Bloqueado (requiere MANAGE_USERS) | — |
| `cmd appops set <pkg> INTERNET deny` | ❌ INTERNET no es un appop válido | `cmd netpolicy set uid-policy <uid> reject` (requiere investigar) |
| `cmd appops set <pkg> RUN_ANY_IN_BACKGROUND deny` | ✅ Funciona para TODO tipo de package | **Usar siempre como fallback** |

**Consecuencia práctica:** Para paquetes del sistema de Xiaomi (`com.miui.*`, `com.android.*`), el único mecanismo efectivo sin root es `RUN_ANY_IN_BACKGROUND deny`. Impide que inicien servicios en background; si el usuario nunca abre la app, no corre. Es efectivo para telemetría (`com.miui.analytics`) y publicidad (`com.miui.msa.global`).

---

## Hallazgos definitivos — vectores descartados

> Benchmarks reales contra el dispositivo NB5XWCLZSGB6J74D (25/05/2026). No re-investigar sin nuevo hardware o cambio de OS.

### Gestión de RAM sin root — DESCARTADO

`am compact system`, `am kill` sobre procesos background y `cmd activity idle-maintenance` no producen mejora medible. El delta real fue < 40 MB en MemAvailable y no sostenido.

**Causa raíz:** El LMK + ZRAM (4 GB configurado, 32% uso, swappiness=20) de HyperOS/Android 16 gestiona la presión de memoria mejor que cualquier intervención externa. Los procesos ya están comprimidos en ZRAM cuando `am kill` los alcanza; liberar sus páginas físicas no impacta MemAvailable de forma apreciable. **No implementar gestión de RAM.**

### Game Mode sobre apps de mensajería — DESCARTADO (módulo eliminado)

`enable('com.whatsapp')` activa `fixed_performance` **global** (no per-app) porque WhatsApp no declara tipo juego. Impacto sobre PSS de WhatsApp: < 1%. Sin diferencia en frames (WA no renderiza activamente en background). Además, Game Mode es una feature de rendimiento para juegos, no de limpieza/mantenimiento — fuera del alcance actual del repo. `forge/core/game_mode.py` se eliminó en la purga del 29/08/2026. **No reimplementar** salvo pedido explícito y acotado a juegos reales.

### Compilación AOT speed-profile — TECHO ALCANZADO

`cmd package compile -m speed-profile -f com.whatsapp` ejecutado exitosamente. Cold start medido con `am start -W` (LaunchState: COLD): **1,161 ms hasta primer frame**. El baseline subjetivo de ~4s corresponde al tiempo hasta UI completamente interactiva (carga de DB, decriptado de mensajes, sync) — esa fase ocurre post-Activity y no es optimizable sin root ni modificación de la app. No existe otro mecanismo de compilación AOT disponible sin root. **No implementar módulo de recompilación** — ART ya aplica speed-profile automáticamente tras el primer uso en HyperOS.

### Benchmark de I/O de almacenamiento — REFERENCIA

Medición con dd sobre archivo de 1.5 GB (excede MemAvailable para forzar flush real):

| Operación | Velocidad medida | Referencia eMMC 5.1 |
|-----------|-----------------|---------------------|
| Escritura secuencial | **260 MB/s** | 125–200 MB/s |
| Lectura secuencial | **224 MB/s** | 250–300 MB/s |

Escritura por encima del spec (page cache + write-back contribuyen). Lectura ligeramente por debajo del techo teórico — normal para carga mixta con el sistema corriendo. **El almacenamiento no es un cuello de botella real en este dispositivo.** Android 16 + SELinux bloquea acceso directo a bloques de dispositivo sin root (`/proc/diskstats`, `/dev/block/*` dan Permission denied), por lo que estos son los únicos números obtenibles sin root.

---

## Reglas de trabajo (no negociables)

```
NUNCA tocar com.xiaomi.joyose — brick térmico garantizado
NUNCA cloud/analytics/telemetría externa — todo local
NUNCA reescribir scripts Bash que ya funcionan — invocarlos, o corregir el bug puntual
NUNCA eval() en comandos ADB — siempre parametrizado
NUNCA agregar interfaz (UI, web, deploy) — todo el trabajo es por prompt/terminal
SIEMPRE backup automático antes de cada optimización
SIEMPRE abortar si temperatura > 42°C
SIEMPRE comandos reversibles con revert_cmd registrado
SIEMPRE que se toque una lista de packages a desactivar, pasar por safe_disable_pkg()/is_critical_pkg()
```

Ante duda entre "hacer más" y "hacer menos y bien": menos y bien.

---

## Contexto técnico del dispositivo

- **Modelo:** Redmi 14C (2409BRN2CL) — serial NB5XWCLZSGB6J74D — codename **pond** (global)
- **SoC:** Helio G81 Ultra (MediaTek **MT6769J**) — 6× Cortex-A55 @ 1.7 GHz (cpu0–5) + 2× Cortex-A75 @ 2.0 GHz (cpu6–7)
- **OS:** HyperOS V816 / Android 16
- **Tweaks validados en v6.0 (NO tocar sin testear):**
  - `swappiness=20`, LMK agresivo, Dalvik + HWUI heap XL
  - Animaciones `0.3x` (persiste — guardado en Settings DB)
  - Vulkan + MSAA forzado
  - ~~Resolución `612x1360 @ 260dpi`~~ — **MUERTO en Android 16**: `wm size` requiere `WRITE_SECURE_SETTINGS`, revocado sin root. No intentar.
  - **Animaciones**: usar `settings put system` (NO `global`) — el namespace `global` requiere `WRITE_SECURE_SETTINGS` en Android 16 (parche BP2A.250605.031.A3+). El CLI ya hace esto correctamente vía `adb_setting_put_system`.
- **Governor:** `sugov_ext` (propietario MediaTek, default HyperOS). Disponibles: `sugov_ext | conservative | powersave | performance | schedutil`. Sin root: no legible ni modificable directamente.
- **ZRAM:** `zram0` configurado en 4 GB (SwapTotal=4194300 kB). Algoritmo no legible sin root. No modificar.
- **Lista de bloatware:** en `src/cli/data/bloatware_db.sh` → array `PROFILE_POCO_MODE` (fuente canónica única, sin espejo Python — `debloat_engine.py` se eliminó en la purga).
- **Perfil personalizado:** `src/cli/data/profile_runtime.sh` → array `PROFILE_RUNTIME`, apps extra a desactivar además de `PROFILE_POCO_MODE`. Antes lo generaba el wizard de la UI; ahora es estático y editable a mano. Usado por `./run.sh --profile`.

---

## Stack técnico

```
MejoraRedmi14C
├── Scripts Bash (NÚCLEO — nunca reescribir, solo invocar o corregir bugs puntuales):
│   └── src/cli/run.sh              — orquestador principal
│       ├── core/config.sh          — constantes + safe_disable_pkg()/is_critical_pkg() + funciones ADB
│       ├── core/database.sh, adb_utils.sh, display.sh, device_profile.sh
│       ├── data/bloatware_db.sh    — PROFILE_POCO_MODE (lista canónica global)
│       ├── data/profile_runtime.sh — PROFILE_RUNTIME (perfil personalizado, editable a mano)
│       ├── data/devices.db         — SQLite: historial de runs por dispositivo
│       ├── engines/                — bloatware.sh, performance.sh, memory.sh, camera_fix.sh, network.sh, thermal.sh
│       └── modes/                  — full_optimize.sh, maintenance.sh, monitor.sh, emergency.sh, profile_optimize.sh, scan.sh
│
├── forge/core/ — módulos Python de soporte, sin dependencias de UI
│   ├── adb_bridge.py     — find_adb(), find_shell(), list_devices(), get_device_info(),
│   │                        scan_device() (lee RAM/pkgs/tweaks sin modificar nada)
│   ├── apps_catalog.py   — DEBLOAT_CATALOG, SAFETYNET_PROTECTED, BUSINESS_CRITICAL
│   ├── packages_db.py    — PACKAGES_DB: catálogo local ~400 packages conocidos
│   │                        (AOSP, HyperOS, Google, MediaTek), lookup()
│   ├── app_scanner.py    — scan_packages(), disable_package(), classify_batch_with_haiku()
│   │                        (Claude Haiku vía API, opcional) — CLI: python -m forge.core.app_scanner --scan <SERIAL>
│   └── ota_watcher.py    — OTAState, should_check(), check_for_update(), scan_tweaks(), reapply_tweaks()
│                            (lógica pura, sin Qt — la usa ota_check.py)
│
└── forge/services/ — headless, sin Qt, para Task Scheduler/cron
    ├── ota_check.py           — chequeo OTA cada 14-15 días, registrado en setup.ps1
    └── maintenance_check.py   — storage/temp/backup WhatsApp por dispositivo, correr manual por ahora
```

### Auditoría de apps desde terminal

1. `python -m forge.core.app_scanner --scan <SERIAL>` — escanea via `pm list packages`
2. Apps conocidas se categorizan contra `PACKAGES_DB` y `DEBLOAT_CATALOG`
3. Apps desconocidas se envían en batches a `classify_batch_with_haiku()` — Claude Haiku via `anthropic` SDK (requiere `ANTHROPIC_API_KEY`; sin ella el escaneo funciona igual pero sin descripción)
4. `disable_package()` aplica los guardrails antes de ejecutar: joyose, SafetyNet (`SAFETYNET_PROTECTED`), críticas de negocio (`BUSINESS_CRITICAL`)

### OTA watch

`forge/core/ota_watcher.py` es lógica pura (sin Qt): `OTAState` persiste en `%LOCALAPPDATA%/RedmiForge/ota_state.json` (o el path que le pasen), `should_check()`/`check_for_update()` consultan el RSS de GitHub y el scraping de xmfirmwareupdater.com en cascada, `scan_tweaks()`/`reapply_tweaks()` verifican y reaplican tweaks reseteados por un OTA. `forge/services/ota_check.py` la invoca directo, sin threads ni UI — corre una vez por ejecución del Task Scheduler.

---

## Defense-in-depth (capas en orden)

1. **Guardrails inviolables:** joyose intocable (`CRITICAL_SYSTEM_APPS` + `is_critical_pkg()`, chequeado en `optimize-boot.sh` desde la corrección del BUG 1), temp>42°C aborta, eval prohibido
2. **Backup global automático** antes de cada optimización (retención: últimos 10 + 1/mes), FASE 1 de `full_optimize.sh`/`profile_optimize.sh`
3. **Tweaks granulares reversibles** — `pm disable-user --user 0` es reversible con `pm enable`
4. **Preview sin modificar** — `./run.sh --scan` / `modes/scan.sh` muestra el estado real antes de tocar nada
5. **Modo emergencia:** `./run.sh --emergency` revierte a defaults en < 2 min

---

## Roadmap — estado final

| Sprint | Foco | Estado |
|--------|------|--------|
| **S1 — Foundation** | UI Python/PySide6 + cockpit + detección ADB | ✅ Completo (UI eliminada en S7) |
| **S2 — Telemetría** | Gauges en vivo + SQLite timeseries | ✅ Funcional (eliminado en S7) |
| **S3 — Perfiles + Bash bridge** | Wizard perfil + Poco Mode + bridge profile_runtime.sh | ✅ Completo (bridge eliminado en S7; `profile_runtime.sh` quedó estático) |
| **S4 — OTA watch** | Motor OTA + Task Scheduler + notificación nativa Windows | ✅ Completo — sigue en producción, ahora sin dependencia de Qt |
| **S5 — Benchmark** | Benchmarks reales de RAM, I/O, Game Mode, AOT — todos descartados con evidencia | ✅ Cerrado (ver hallazgos arriba) |
| **S6 — Release** | Decisión: UI pausada. Entregables: setup.ps1 + OTA como servicio | ✅ Cerrado |
| **S7 — Purga de interfaces (29/08/2026)** | Se decidió no retomar la UI y eliminar toda interfaz del repo: UI PySide6, web app, stub Electron, plan de migración a Tauri. Se corrigió el BUG 1 (joyose en `optimize-boot.sh`) de paso. | ✅ Cerrado |

---

## Investigación — cuándo y cómo

**Antes de implementar cualquier módulo que toque el dispositivo**, buscá primero:

- XDA Developers: hilos Redmi 14C + HyperOS 3 + G81 Ultra (2025-2026)
- GitHub: `xiaomi debloat`, `hyperos tweaks`, `mediatek g81 governor`, UAD-ng
- Reddit: r/Xiaomi, r/MIUI — búsquedas "Redmi 14C optimization"
- Docs AOSP para entender qué hacen los settings que tocamos

---

*CLAUDE.md v3.0 — 29/08/2026 — MejoraRedmi14C (purga completa de interfaces; solo queda CLI Bash + módulos Python headless/terminal; BUG 1 resuelto)*
