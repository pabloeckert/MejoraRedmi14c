# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Redmi Forge — CLAUDE.md para Claude Code

> **Repo base:** https://github.com/pabloeckert/MejoraRedmi14c  
> **Actualizado:** 08 de junio de 2026

---

## Estado actual del proyecto

| Carpeta / archivo | Estado | Descripción |
|-------------------|--------|-------------|
| `src/cli/` | ✅ **Producción** | Toolkit Bash v6.0 — producto terminado para uso personal |
| `forge/core/` | ✅ Funcional | Módulos Python de soporte: adb_bridge, ota_watcher, app_scanner, debloat_engine |
| `forge/services/ota_check.py` | ✅ Producción | OTA watcher autónomo — corre via Task Scheduler sin UI |
| `setup.ps1` | ✅ Producción | Setup one-command para PC nueva |
| `forge/ui/` | ⏸ Pausada | UI Python/PySide6 — funcional con bugs conocidos (ver abajo). Retomar cuando haya usuario final concreto. |
| `main.py` | ⏸ Pausado | Entry point de la UI — funcional pero con UX incompleta en fases largas (DEXOPT) |
| `src/web/` | ⏸ Pausada | Web App WebUSB — sin mantenimiento activo |
| **Dispositivo Pablo** | NB5XWCLZSGB6J74D | 75 apps eliminadas, animaciones 0.3x, 90Hz, DEXOPT completo. Baseline: 1141MB RAM libre, 29°C reposo. Build: OS3.0.20.0.WGTMIXM (abr 2026) — la más reciente para MXM. |
| **Dispositivo Sindy** | VOSWQCOVJVQWT8LR | Monitoreado por OTA watcher (`ota_check.py`). Estado: desconocido — no optimizado con CLI. |
| `app/` | ⛔ Obsoleto | Stub Electron — ignorar |

**Producto terminado para uso personal:** `src/cli/run.sh` + `forge/services/ota_check.py` (Task Scheduler).  
**UI pausada hasta tener usuario final concreto.**

No avancés al siguiente sprint sin confirmación explícita.

---

## Comandos de desarrollo

```bash
# ─── Setup en PC nueva (una sola vez) ───────────────────────────────────
# En PowerShell:
Set-ExecutionPolicy -Scope CurrentUser Bypass -Force
.\setup.ps1   # instala deps + ADB check + registra Task Scheduler

# ─── Redmi Forge (UI Python) — PAUSADA ──────────────────────────────────
pip install -r requirements.txt   # instalar PySide6 (una sola vez)
python main.py                    # arrancar la app (UI con bugs conocidos)

# ─── Seed de datos de desarrollo (sin dispositivo real) ─────────────────
python -m forge.dev.seed          # puebla la DB con un dispositivo ficticio

# ─── Auditoría manual de apps (con dispositivo conectado) ───────────────
python -m forge.core.app_scanner --scan <SERIAL>   # escanea y muestra tabla de apps

# ─── CLI Bash (núcleo — no modificar) ───────────────────────────────────
cd src/cli && ./run.sh            # auto-detección de dispositivo
cd src/cli && ./run.sh --full     # optimización completa (Poco Mode)
cd src/cli && ./run.sh --maintenance
cd src/cli && ./run.sh --monitor
cd src/cli && ./run.sh --emergency
cd src/cli && ./run.sh --scan     # solo escanea, no modifica nada
cd src/cli && ./restore.sh <carpeta_snapshot>  # restauración manual desde backup

# ─── Diagnóstico y verificación ─────────────────────────────────────────
bash src/cli/diagnostico.sh
bash src/cli/tools/mega-verificar.sh
bash src/cli/tools/benchmark.sh
bash src/cli/tools/measure-boot.sh        # mide tiempos de boot
bash src/cli/tools/test-verificacion.sh   # pruebas de verificación del sistema
bash src/cli/tools/ruta-optima.sh         # calcula ruta óptima de optimización
bash src/cli/tools/log-apply.sh           # aplica un log de cambios previo

# ─── Web App alternativa ─────────────────────────────────────────────────
cd src/web && python3 -m http.server 8000   # → http://localhost:8000 (WebUSB)
```

**Requisitos Redmi Forge:** Python 3.11+, PySide6 ≥ 6.7.0, anthropic ≥ 0.28.0, plyer ≥ 2.1.0 (Windows toast para OTA), ADB en PATH o en `vendor/adb/adb.exe`. **Siempre instalar via `pip install -r requirements.txt`** — `pyproject.toml` no declara `anthropic` como dependencia y omitirla rompe el AuditScreen.  
**Requisitos CLI:** bash 4+ (WSL o Git Bash en Windows), ADB, sqlite3, dispositivo con USB debugging.  
**Shell en Windows:** la app detecta automáticamente Git Bash → WSL en ese orden (Git Bash tiene preferencia; WSL con systemd roto causa fallos). Ver `forge/core/adb_bridge.py:find_shell()`.

---

## Bugs críticos conocidos

- **BUG 1** `src/cli/tools/optimize-boot.sh:115` — lista directa que desactiva `com.xiaomi.joyose`. El guardrail en `safe_disable_pkg()` de `core/config.sh` lo previene solo si se usa esa función; la lista hardcodeada en ese archivo es peligrosa.

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

**Causa raíz:** El LMK + ZRAM (4 GB configurado, 32% uso, swappiness=20) de HyperOS/Android 16 gestiona la presión de memoria mejor que cualquier intervención externa. Los procesos ya están comprimidos en ZRAM cuando `am kill` los alcanza; liberar sus páginas físicas no impacta MemAvailable de forma apreciable. **No implementar módulo de gestión de RAM en Redmi Forge.**

### Game Mode sobre apps de mensajería — DESCARTADO

`enable('com.whatsapp')` activa `fixed_performance` **global** (no per-app) porque WhatsApp no declara tipo juego. Impacto sobre PSS de WhatsApp: < 1%. Sin diferencia en frames (WA no renderiza activamente en background). **No implementar UI de Game Mode para apps no-juego.**

### Compilación AOT speed-profile — TECHO ALCANZADO

`cmd package compile -m speed-profile -f com.whatsapp` ejecutado exitosamente. Cold start medido con `am start -W` (LaunchState: COLD): **1,161 ms hasta primer frame**. El baseline subjetivo de ~4s corresponde al tiempo hasta UI completamente interactiva (carga de DB, decriptado de mensajes, sync) — esa fase ocurre post-Activity y no es optimizable sin root ni modificación de la app. No existe otro mecanismo de compilación AOT disponible sin root. **No implementar módulo de recompilación en Redmi Forge** — ART ya aplica speed-profile automáticamente tras el primer uso en HyperOS.

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
NUNCA avanzar de sprint sin OK de Pablo
NUNCA cloud/analytics/telemetría externa — todo local
NUNCA reescribir scripts Bash que ya funcionan — invocarlos desde Python
NUNCA eval() en comandos ADB — siempre parametrizado
SIEMPRE backup automático antes de cada optimización
SIEMPRE abortar si temperatura > 42°C
SIEMPRE comandos reversibles con revert_cmd registrado
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
- **Governor:** `sugov_ext` (propietario MediaTek, default HyperOS). Disponibles: `sugov_ext | conservative | powersave | performance | schedutil`. Sin root: no legible ni modificable directamente. Usar `cmd game mode performance <pkg>` para elevar governor por app.
- **ZRAM:** `zram0` configurado en 4 GB (SwapTotal=4194300 kB). Algoritmo no legible sin root. No modificar.
- **Lista de bloatware:** en `src/cli/data/bloatware_db.sh` → array `PROFILE_POCO_MODE` (canónico para el CLI). El espejo Python está en `forge/core/debloat_engine.py:_POCO_MODE`. Si modificás uno, modificás el otro.

---

## Stack técnico

```
Redmi Forge
├── Entry point:  main.py  →  init_db() + MainWindow().show()
│
├── UI: Python 3.11 + PySide6 (Qt 6)
│   ├── forge/ui/app.py           — MainWindow: sidebar + QStackedWidget + DeviceWatcher
│   ├── forge/ui/theme.py         — tokens COLORS + STYLESHEET (QSS global)
│   └── forge/ui/screens/
│       ├── home.py               — cockpit, estado del dispositivo, botón Optimizar
│       ├── profile.py            — wizard de perfil de usuario (4 pasos)
│       ├── plan.py               — preview del plan de debloat antes de ejecutar
│       ├── execution.py          — streaming de output de run.sh en tiempo real
│       ├── history.py            — historial de runs por dispositivo
│       ├── settings.py           — configuración general
│       └── audit.py              — auditoría de apps instaladas + limpieza definitiva
│
├── Core
│   ├── forge/core/adb_bridge.py    — find_adb(), find_shell(), list_devices(),
│   │                                  get_device_info(), scan_device() (lee RAM/pkgs/tweaks sin modificar),
│   │                                  run_cli_script() (generator que yields líneas del CLI Bash)
│   ├── forge/core/device_watcher.py — QThread: poll ADB cada 2s, emite signals
│   ├── forge/core/game_mode.py     — enable()/disable()/status() para Game Mode; 3 mecanismos en cascada:
│   │                                  game_api_performance → game_api_custom → fixed_performance global.
│   │                                  CLI directo: python -m forge.core.game_mode <serial> enable|disable|status [pkg]
│   ├── forge/core/debloat_engine.py — build_debloat_list(), dry_run_report(),
│   │                                  write_runtime_profile() → escribe profile_runtime.sh
│   ├── forge/core/apps_catalog.py  — DEBLOAT_CATALOG, HEAVY_APPS_SET, WIZARD_APPS,
│   │                                  SAFETYNET_PROTECTED, BUSINESS_CRITICAL, WORK_INDICATOR_APPS
│   ├── forge/core/app_scanner.py   — scan_packages(), disable_package(),
│   │                                  classify_batch_with_haiku() (Claude Haiku vía API)
│   ├── forge/core/packages_db.py   — PACKAGES_DB: catálogo local ~400 packages conocidos
│   │                                  (AOSP, HyperOS, Google, MediaTek), lookup()
│   └── forge/core/log_parser.py    — parsing del output de run.sh para la UI
│
├── Persistencia: SQLite en %LOCALAPPDATA%/RedmiForge/redmiforge.db
│   └── forge/db/database.py        — init_db(), upsert_device(), start_run(), finish_run(), list_runs()
│
├── Dev tools
│   └── forge/dev/seed.py           — poblar DB con datos ficticios para desarrollo sin dispositivo
│
└── Scripts Bash (NÚCLEO — nunca modificar, solo invocar):
    └── src/cli/run.sh              — orquestador principal
        ├── core/config.sh          — constantes + safe_disable_pkg() + funciones ADB
        ├── core/database.sh, adb_utils.sh, display.sh, device_profile.sh
        ├── data/bloatware_db.sh    — arrays de bloatware (PROFILE_POCO_MODE, etc.)
        ├── data/profile_runtime.sh — GENERADO por debloat_engine.write_runtime_profile() — no editar
        ├── engines/                — bloatware.sh, performance.sh, memory.sh, camera_fix.sh, network.sh, thermal.sh
        └── modes/                  — full_optimize.sh, maintenance.sh, monitor.sh, emergency.sh, profile_optimize.sh
```

### Flujo de auditoría de apps (AuditScreen)

1. `ScanWorker(QThread)` llama a `app_scanner.scan_packages(serial)` — escanea via `pm list packages`
2. Apps conocidas se categorizan contra `PACKAGES_DB` y `DEBLOAT_CATALOG`
3. Apps desconocidas se envían en batches de 20 a `classify_batch_with_haiku()` — Claude Haiku via `anthropic` SDK
4. El usuario puede marcar cada app: Keep / Remove / Ask
5. `ExecuteWorker(QThread)` llama `app_scanner.disable_package()` por cada app marcada para remover
6. `disable_package()` aplica los guardrails: joyose, SafetyNet, BUSINESS_CRITICAL antes de ejecutar

**ANTHROPIC_API_KEY** debe estar disponible en el entorno para que Haiku funcione. Sin clave, el escaneo funciona igual pero las apps desconocidas quedan sin descripción.

### Puente Python → Bash (clave para entender el flujo)

Cuando el usuario ejecuta "Optimizar" con un perfil guardado:

1. `debloat_engine.build_debloat_list(serial)` calcula qué packages remover según el perfil
2. `debloat_engine.write_runtime_profile()` escribe `src/cli/data/profile_runtime.sh` con el array `PROFILE_RUNTIME`
3. `adb_bridge.run_cli_script("--full", serial)` detecta si `has_profile(serial)`: si SÍ, escribe el runtime profile y pasa `--profile` al script; si NO hay perfil, pasa `--full` sin modificar
4. `run.sh` sourcea `modes/profile_optimize.sh`, que sourcea `profile_runtime.sh` y llama a `bloatware_run`
5. El output se streaming vía generator al `ExecutionScreen`

**OTA state persistence:** Los archivos de estado se guardan por dispositivo en `%LOCALAPPDATA%/RedmiForge/`: `ota_state_pablo.json` y `ota_state_sindy.json`. El módulo `ota_watcher.py` también expone `OTAWorker` y `TweakScanWorker` (QThread) para la UI; `ota_check.py` es la versión headless (sin Qt) para Task Scheduler.

---

## Paleta (tokens — no cambiar, definidos en `forge/ui/theme.py`)

```python
"bg":          "#FFFFFF"   # fondo principal
"blue":        "#0066FF"   # acción primaria
"red":         "#E63946"   # emergencia / danger
"yellow":      "#FFD60A"   # warning
"success":     "#22C55E"   # dispositivo conectado, OK
"text":        "#0A0A0A"   # texto principal
"text_muted":  "#666666"   # texto secundario
"border":      "#E8E8E8"   # bordes
"surface":     "#F8F9FA"   # fondos secundarios
"sidebar":     "#F5F5F5"   # fondo del sidebar
```

Fondo blanco, modo claro. Sin gradientes, sin glassmorphism, sin sombras dramáticas.

---

## Schema SQLite real (`forge/db/database.py`)

```sql
devices(serial PK, model, nickname, android_ver, hyperos_ver, first_seen, last_seen, profile_json)
optimization_runs(id, serial FK, phase, mode_flag, started_at, ended_at, status, exit_code, output)
metrics(id, serial FK, run_id FK, measured_at, kind, value_json)
```

`profile_json` en `devices` almacena el perfil del wizard como JSON plano (name, banking, bank_name, wa_hours, apps[]).

---

## UX — reglas de interacción

- Acción reversible: **Toast con UNDO** (no "¿estás seguro?")
- Acción destructiva: **countdown 3s** con preview del efecto + cancelar
- Si acción < 200ms: **sin loader**
- Si acción > 200ms: **skeleton tipo Linear**
- Cada acción tiene 3 fases: anticipación 0.2s → acción → resolución 0.4s

---

## Defense-in-depth (5 capas en orden)

1. **Guardrails inviolables:** joyose intocable, temp>42°C aborta, eval prohibido
2. **Backup global automático** antes de cada optimización (retención: últimos 10 + 1/mes)
3. **Tweaks granulares reversibles** — `pm disable-user --user 0` es reversible con `pm enable`
4. **Confirmación con preview** en acciones destructivas (3s countdown + diff visual en PlanScreen)
5. **Modo emergencia:** revierte a último backup bueno en < 2 min

---

## Roadmap — estado final

| Sprint | Foco | Estado |
|--------|------|--------|
| **S1 — Foundation** | UI Python/PySide6 + cockpit + detección ADB | ✅ Completo |
| **S2 — Telemetría** | Gauges en vivo + SQLite timeseries | ✅ Funcional |
| **S3 — Perfiles + Bash bridge** | Wizard perfil + Poco Mode + bridge profile_runtime.sh | ✅ Completo |
| **S4 — OTA watch** | Motor OTA + Task Scheduler + notificación nativa Windows | ✅ Completo (`forge/core/ota_watcher.py` + `forge/services/ota_check.py`) |
| **S5 — Benchmark** | Benchmarks reales de RAM, I/O, Game Mode, AOT — todos descartados con evidencia | ✅ Cerrado (ver hallazgos en CLAUDE.md) |
| **S6 — Release** | Decisión: UI pausada. Entregables: setup.ps1 + OTA como servicio | ✅ Cerrado |

**Bugs conocidos en la UI (documentados, no bloqueantes para uso CLI):**
- `execution.py` — sin feedback visual durante DEXOPT (fase larga sin output). La UI no se cuelga pero parece inactiva ~10 min.
- `_CollapsibleLog` — corregido (26/05/2026)
- Workers sin cleanup en desconexión — corregido (26/05/2026)
- exit code del generador siempre 0 — corregido (26/05/2026)

---

## Métricas de éxito (medir en S5)

| Métrica | Target |
|---------|--------|
| Cold start app | < 1.5s |
| Poco Mode end-to-end | < 45s |
| Modo emergencia | < 120s |
| Falsos positivos OTA auto-heal | 0 |
| Overhead telemetría en PC | < 1% CPU, < 50MB RAM |
| Ollama (S6) | latencia p50 < 2s — candidatos: qwen2.5:3b, llama3.2:3b, phi3.5 |

---

## Anti-patterns — rechazá si los ves

```
❌ Loaders en acciones < 200ms
❌ "¿Estás seguro?" en acciones reversibles
❌ Telemetría / analytics a cualquier nube
❌ Iconos Lucide en gauges/termómetro (→ SVG custom)
❌ Múltiples CTAs del mismo nivel en una vista
❌ CDN para fuentes (siempre @fontsource si aplica)
❌ Tocar com.xiaomi.joyose
❌ Reescribir scripts Bash v6.0 que funcionan
❌ Editar profile_runtime.sh a mano (es auto-generado)
❌ Avanzar de sprint sin OK explícito
```

---

## Investigación — cuándo y cómo

**Antes de implementar cualquier módulo que toque el dispositivo**, buscá primero:

- XDA Developers: hilos Redmi 14C + HyperOS 3 + G81 Ultra (2025-2026)
- GitHub: `xiaomi debloat`, `hyperos tweaks`, `mediatek g81 governor`, UAD-ng
- Reddit: r/Xiaomi, r/MIUI — búsquedas "Redmi 14C optimization"
- Docs AOSP para entender qué hacen los settings que tocamos

Registrá cada fuente en `RESEARCH_LOG.md`:
```
| Fecha | Fuente | URL | Hallazgo clave |
```

---

*CLAUDE.md v2.3 — 08/06/2026 — MejoraRedmi14C (todos los sprints cerrados — producto terminado)*
