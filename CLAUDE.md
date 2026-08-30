# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Redmi Forge — CLAUDE.md para Claude Code

> **Repo base:** https://github.com/pabloeckert/MejoraRedmi14c  
> **Actualizado:** 30 de agosto de 2026

---

## ⏭️ PENDIENTE — feedback de uso real (checklist técnico ya completado)

Todo lo scripteable/verificable del 29-30/08/2026 (purga, merge, investigación de rendimiento) está hecho y confirmado con el dispositivo real de Pablo conectado:

- ✅ Codename confirmado: **`pond`** (no `lake`) — corregido en `ota_check.py`/`ota_watcher.py`.
- ✅ `./run.sh --scan`: 4 apps ya desactivadas, 3 pendientes, animaciones 0.3x y 90Hz aplicados, temp 29°C.
- ✅ Vulkan/MSAA/GPU forzada: confirmado **inerte** (bloqueado sin root) — sacado de la lista de tweaks activos.
- ✅ Lawnchair instalado (package real: **`app.lawnchair.play`**, la build de Play Store — no `app.lawnchair`, esa es la de F-Droid) y activado como HOME con `tools/set-launcher.sh app.lawnchair.play`. `com.miui.home` sigue instalado e intocado, reversible con `--reset`.

**Lo único que falta no se puede scriptear:** unos días de uso normal para que Pablo confirme si el cambio de launcher realmente eliminó los crashes/pantallas negras (el bug de HyperOS 3 apuntaba al System Launcher — ver "Investigación 29/08/2026"). Hasta que no haya ese feedback, el tema sigue abierto aunque el cambio técnico ya esté aplicado.

**Pendiente aparte, sin relación con lo anterior:** confirmar el codename real del dispositivo de Sindy (VOSWQCOVJVQWT8LR) la próxima vez que se conecte — hoy está inferido como `pond` por ser el mismo modelo, no confirmado en su propio teléfono.

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
| `forge/core/usage_stats.py` | ✅ Funcional | Snapshot de uso real vía `dumpsys usagestats` — alimenta `maintenance_check.py` con evidencia para decidir el perfil de debloat de Sindy |
| `forge/db/database.py` | ✅ Funcional (restaurada 30/08/2026) | SQLite en `%LOCALAPPDATA%/RedmiForge/redmiforge.db` — se había borrado en la purga por creerla solo-UI; `maintenance_check.py` la necesita para `record_metric()`. Conexión ahora vía context manager (cierra siempre, commit/rollback automático). |
| `forge/services/ota_check.py` | ✅ Producción | OTA watcher autónomo — corre via Task Scheduler, sin UI. Logging a archivo (`ota_check.log`) + manejo de errores por dispositivo (30/08/2026). Codename `pond` confirmado para Pablo; el de Sindy es inferido, no confirmado en su dispositivo. |
| `forge/services/maintenance_check.py` | ✅ Producción | Storage/temp/backup WhatsApp + limpieza de caché liviana (24h) + `--maintenance` completo oportunista (7 días) + snapshot de uso — registrado en `setup.ps1` (Task Scheduler, cada 60 min) |
| `setup.ps1` / `setup.bat` | ✅ Producción | Setup one-command para PC nueva — instala deps headless, ADB, Task Scheduler (OTA cada 15 días + mantenimiento cada 60 min) |
| `src/cli/modes/sindy_optimize.sh` + `data/profile_sindy.sh` | ⚠️ Funcional, con bloqueo pendiente | Modo whitelist (`./run.sh --sindy`) para el teléfono de Sindy — inversa del modo Pablo: protege lo que está en la whitelist, desactiva TODO el resto de apps de terceros. La whitelist tiene una sección explícita de apps (juegos, redes sociales, 3 apps sin identificar) **bloqueada hasta confirmación de Pablo** — no tocar sin esa confirmación. |
| **Dispositivo Pablo** | NB5XWCLZSGB6J74D | 75 apps eliminadas, animaciones 0.3x, 90Hz, DEXOPT completo. Baseline: 1141MB RAM libre, 29°C reposo. Build: OS3.0.20.0.WGTMIXM (abr 2026) — la más reciente para MXM. Codename **pond** (confirmado 30/08/2026). |
| **Dispositivo Sindy** | VOSWQCOVJVQWT8LR | Monitoreado por OTA watcher (`ota_check.py`) + `maintenance_check.py`. Perfil whitelist armado (`profile_sindy.sh`) pero con bloqueo pendiente de confirmación — no se corrió `--sindy` todavía. Codename `pond` inferido (mismo modelo que Pablo), sin confirmar en su dispositivo real. |

**Eliminado en la purga del 29/08/2026** (ver commit correspondiente para detalle): `forge/ui/` (UI PySide6), `main.py`, `src/web/` (web app WebUSB), `app/` (stub Electron), `forge/dev/` (seed solo usado por la UI), `forge/core/debloat_engine.py` (puente perfil-UI → Bash), `forge/core/device_watcher.py` (poller Qt), `forge/core/game_mode.py` (feature de rendimiento, fuera de alcance de limpieza/mantenimiento — ver hallazgo "Game Mode" abajo), `forge/core/log_parser.py` (parsing para la UI), `.github/workflows/deploy.yml` (publicaba la web app), `SCRIPTS_INVENTORY.md` (planificaba una migración a Tauri, obsoleto). `forge/db/` se borró en la purga y se restauró en el merge del 30/08/2026 (ver abajo) — sí hacía falta, para `maintenance_check.py`.

No hay interfaz de ningún tipo en este repo. Todo el trabajo es por prompt/terminal: CLI Bash + módulos Python invocados con `python -m`.

---

## Merge 30/08/2026 — trabajo local no commiteado

Una sesión anterior de Claude Code Desktop, corriendo local en la PC de Pablo, había hecho un trabajo grande (modo Sindy completo + varios bugs corregidos) que nunca se commiteó — quedó solo en el disco de esa PC hasta que se rescató como snapshot (`git checkout -b wip-sindy-local-snapshot && git add -A && git commit` + push) y se mergeó acá.

**Se descartó del merge:** el `CLAUDE.md` de esa sesión no era una edición del de este repo — era un documento genérico de 28 líneas sobre "criterio de modelo y esfuerzo" para Mejora Continua (sin relación con el Redmi 14C), que pisó por accidente todo el contenido de este archivo. Se recuperó la versión de la purga y se le agregó la documentación de lo nuevo acá.

**Se incorporó (todo real, coherente con el estilo de seguridad del proyecto):**
- `optimize-boot.sh`: arregla la causa raíz de que `config.sh` nunca se cargaba ahí (el path apuntaba a la carpeta equivocada — `$SCRIPT_DIR/config.sh` en vez de `$SCRIPT_DIR/../core/config.sh`), agrega backup + gate térmico, corrige otro bug de namespace de animaciones (`global`→`system`). Reemplaza mi fix anterior del BUG 1 — este es más completo.
- `config.sh` (`safe_disable_pkg`): agrega el 3er intento ya documentado pero nunca codeado — `cmd appops set <pkg> RUN_ANY_IN_BACKGROUND deny` como fallback final.
- `bloatware.sh`: agrega `bloatware_run_whitelist()` (motor del modo Sindy) y corrige `bloatware_restore_all()` para revertir ese nuevo intento 3 (si no, esos paquetes quedan bloqueados en background para siempre tras un `--emergency`).
- `device_profile.sh`: agrega `device_quiet_mode_enable/disable()` — corta WiFi/datos + activa No Molestar durante la optimización de Sindy, restaura el estado exacto previo al terminar.
- `adb_utils.sh` (`adb_take_snapshot`): verifica que el snapshot no haya quedado vacío por desconexión a mitad de camino.
- `database.sh`: corrige el cálculo de `total_ram_freed_mb` (usaba una variable de otro scope; ahora subconsulta el valor real por `run_id`).
- `run.sh`: agrega el flag `--sindy`.

**Codename OTA — resuelto para Pablo, pendiente para Sindy:** se verificó con el dispositivo de Pablo conectado (`pond`, confirmado con `getprop`, no adivinado). El de Sindy quedó en `pond` también por ser el mismo modelo, pero sin confirmar en su propio dispositivo — ver ítem 0 de "PRÓXIMO PASO".

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
cd src/cli && ./run.sh --sindy    # perfil whitelist para el teléfono de Sindy — TIENE bloqueo pendiente, ver data/profile_sindy.sh
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

- **BUG 1 (resuelto 29/08/2026, fix mejorado 30/08/2026)** `src/cli/tools/optimize-boot.sh` tenía `com.xiaomi.joyose` hardcodeado en `BOOT_APPS` y lo desactivaba con `pm disable-user` directo, sin pasar por `safe_disable_pkg()`/`is_critical_pkg()`. Causa raíz real (encontrada 30/08/2026): el `source` de `config.sh` apuntaba a la carpeta equivocada y fallaba en silencio — `is_critical_pkg` nunca estaba disponible ahí. Fix actual: path de `source` corregido a `../core/config.sh` (+ `adb_utils.sh` + `engines/thermal.sh`), `joyose` sacado del array, guardrail `is_critical_pkg` en el loop, y se le agregó backup + gate térmico igual que al resto de los modos. Corré siempre con `--dry-run` primero de todos modos.

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

**Ya codeado (30/08/2026):** `safe_disable_pkg()` en `config.sh` tiene este fallback como Intento 3 — antes estaba documentado acá pero no implementado. `bloatware_restore_all()` lo revierte explícitamente (`RUN_ANY_IN_BACKGROUND allow`) porque estos paquetes no aparecen en `pm list packages -d`, así que el loop de restauración normal no los alcanzaría.

---

## Investigación 29/08/2026 — máximo rendimiento sin bootloader

Objetivo del usuario: la experiencia de un launcher puro (referencia: Motorola RAZR, Poco X3 Pro) — rápido, sin crashes, sin cuelgues, sin pantallas negras, con fondo de escritorio propio. Como mínimo aceptable, no como techo.

### Sacar HyperOS por completo — DESCARTADO, con más certeza que antes

No es solo riesgo de brick: **Xiaomi bloqueó directamente el desbloqueo de bootloader para el Redmi 14C** como SKU (confirmado en el hilo de XDA del modelo). Sin bootloader desbloqueado no hay LineageOS, GSI de Project Treble ni ninguna ROM alternativa. Los métodos alternativos (MTK client / bypass por BROM en el MT6769J) tienen reportes de brick real en la comunidad. No hay puerta de entrada — no re-investigar salvo que Xiaomi cambie la política de unlock para este modelo.

### Shizuku — evaluado y descartado para este toolkit

Da permisos a nivel `adb shell` (incluye `WRITE_SECURE_SETTINGS`) a apps del propio teléfono sin PC y sin root. Pero corre con el mismo UID `shell` que ya usa el CLI por USB — **no destraba nada que `adb shell` no pueda hacer ya** (en particular, `pm disable-user` en apps de sistema sigue bloqueado, no es un límite de "falta de puente" sino de HyperOS mismo). Tampoco arranca solo al reiniciar en dispositivos sin root — hay que abrir la app y tocar "Start" cada vez. No aporta sobre lo que ya hace `run.sh` conectado por USB. No integrar.

### Bug confirmado de HyperOS 3 — System Launcher como causa de crashes/pantallas negras

Xiaomi reconoció públicamente un bug del System Launcher (`com.miui.home`) en HyperOS 3 que causa force-closes, parpadeo de pantalla y entrada a Safe Mode, por conflicto con el widget de clima nativo. Builds confirmados: OS3.0.3.0–OS3.0.5.0 (variantes WNNEUXM/WNEEUXM/WOSEUXM/WNCEUXM). El build de Pablo es OS3.0.20.0.WGTMIXM — variante distinta, no confirmado que sea el mismo bug exacto, pero misma familia de falla (el launcher nativo de Xiaomi como punto de quiebre).

**Mitigación — `src/cli/tools/set-launcher.sh` (nuevo, aplicado 30/08/2026):** `com.miui.home` queda protegido como crítico (no se desactiva), pero se puede dejar de usar como default vía `cmd package set-home-activity` — solo cambia qué app responde al rol HOME, no toca instalación ni permisos, 100% reversible, sin riesgo de brick (el selector de apps predeterminadas de Ajustes siempre funciona como último recurso).

```bash
bash src/cli/tools/set-launcher.sh app.lawnchair.play   # launcher elegido: Lawnchair, build de Play Store
                                                          # (OJO: "app.lawnchair" sin ".play" es la build de F-Droid — no es la instalada acá)
bash src/cli/tools/set-launcher.sh --status              # ver HOME activo
bash src/cli/tools/set-launcher.sh --reset               # volver a com.miui.home
```

**Estado real (30/08/2026):** Lawnchair activo como HOME, confirmado con `--status`. Pendiente: feedback de Pablo tras unos días de uso — ver "PENDIENTE" al principio del archivo.

### Vulkan + MSAA forzado — CONFIRMADO INERTE (30/08/2026)

`engines/performance.sh` (bloque GPU, líneas ~27-41) ya maneja bien el caso bloqueado — detecta "exception/denied" en la salida de `settings put global force_gpu_rendering 1` y loguea warning en vez de falso "ok". Se confirmó con el dispositivo real (`./run.sh --scan`): "GPU forzada → bloqueado en Android 16 (requiere root)". Nunca se aplicó en este build pese a que el CLAUDE.md lo listaba como "tweak validado" — corregido. No es una fuente de inestabilidad real (no corre), así que no explica los crashes/pantallas negras por sí solo — el sospechoso principal sigue siendo el bug del System Launcher (ver arriba).

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

- **Modelo:** Redmi 14C (2409BRN2CL) — serial NB5XWCLZSGB6J74D — codename **pond** (confirmado 30/08/2026 con `adb shell getprop ro.product.device`)
- **SoC:** Helio G81 Ultra (MediaTek **MT6769J**) — 6× Cortex-A55 @ 1.7 GHz (cpu0–5) + 2× Cortex-A75 @ 2.0 GHz (cpu6–7)
- **OS:** HyperOS V816 / Android 16
- **Tweaks validados en v6.0 (NO tocar sin testear):**
  - `swappiness=20`, LMK agresivo, Dalvik + HWUI heap XL
  - Animaciones `0.3x` (persiste — guardado en Settings DB)
  - ~~Vulkan + MSAA forzado~~ — **CONFIRMADO INERTE 30/08/2026**: `./run.sh --scan` en el dispositivo real muestra "GPU forzada → bloqueado en Android 16 (requiere root)". Nunca se aplicó en este build — no es una fuente de inestabilidad real porque no corre. Sacado de la lista de tweaks activos.
  - ~~Resolución `612x1360 @ 260dpi`~~ — **MUERTO en Android 16**: `wm size` requiere `WRITE_SECURE_SETTINGS`, revocado sin root. No intentar.
  - **Animaciones**: usar `settings put system` (NO `global`) — el namespace `global` requiere `WRITE_SECURE_SETTINGS` en Android 16 (parche BP2A.250605.031.A3+). El CLI ya hace esto correctamente vía `adb_setting_put_system`.
- **Governor:** `sugov_ext` (propietario MediaTek, default HyperOS). Disponibles: `sugov_ext | conservative | powersave | performance | schedutil`. Sin root: no legible ni modificable directamente.
- **ZRAM:** `zram0` configurado en 4 GB (SwapTotal=4194300 kB). Algoritmo no legible sin root. No modificar.
- **Lista de bloatware:** en `src/cli/data/bloatware_db.sh` → array `PROFILE_POCO_MODE` (fuente canónica única, sin espejo Python — `debloat_engine.py` se eliminó en la purga).
- **Perfil personalizado (Pablo):** `src/cli/data/profile_runtime.sh` → array `PROFILE_RUNTIME`, apps extra a desactivar además de `PROFILE_POCO_MODE`. Antes lo generaba el wizard de la UI; ahora es estático y editable a mano. Usado por `./run.sh --profile`. Es blacklist: "esto además se elimina".
- **Perfil personalizado (Sindy):** `src/cli/data/profile_sindy.sh` → array `PROFILE_SINDY_WHITELIST`. Al revés del de Pablo — es whitelist: "esto se protege, TODO el resto de apps de terceros se desactiva". Tiene una sección de apps (juegos, redes sociales, 3 sin identificar) explícitamente bloqueada hasta que Pablo confirme. Usado por `./run.sh --sindy` vía `bloatware_run_whitelist()`.

---

## Stack técnico

```
MejoraRedmi14C
├── Scripts Bash (NÚCLEO — nunca reescribir, solo invocar o corregir bugs puntuales):
│   └── src/cli/run.sh              — orquestador principal
│       ├── core/config.sh          — constantes + safe_disable_pkg()/is_critical_pkg() + funciones ADB
│       ├── core/database.sh, adb_utils.sh, display.sh, device_profile.sh
│       ├── data/bloatware_db.sh    — PROFILE_POCO_MODE (lista canónica global, blacklist)
│       ├── data/profile_runtime.sh — PROFILE_RUNTIME (perfil Pablo, blacklist adicional, editable a mano)
│       ├── data/profile_sindy.sh   — PROFILE_SINDY_WHITELIST (perfil Sindy, whitelist — con bloqueo pendiente)
│       ├── data/devices.db         — SQLite: historial de runs por dispositivo
│       ├── engines/                — bloatware.sh (incl. bloatware_run_whitelist()), performance.sh, memory.sh,
│       │                             camera_fix.sh, network.sh, thermal.sh
│       └── modes/                  — full_optimize.sh, maintenance.sh, monitor.sh, emergency.sh,
│                                     profile_optimize.sh, sindy_optimize.sh, scan.sh
│
├── forge/core/ — módulos Python de soporte, sin dependencias de UI
│   ├── adb_bridge.py     — find_adb(), find_shell(), list_devices(), get_device_info(),
│   │                        scan_device() (lee RAM/pkgs/tweaks sin modificar nada)
│   ├── apps_catalog.py   — DEBLOAT_CATALOG, SAFETYNET_PROTECTED, BUSINESS_CRITICAL
│   ├── packages_db.py    — PACKAGES_DB: catálogo local ~400 packages conocidos
│   │                        (AOSP, HyperOS, Google, MediaTek), lookup()
│   ├── app_scanner.py    — scan_packages(), disable_package(), classify_batch_with_haiku()
│   │                        (Claude Haiku vía API, opcional) — CLI: python -m forge.core.app_scanner --scan <SERIAL>
│   ├── usage_stats.py    — collect_usage_snapshot() vía dumpsys usagestats, sin root
│   └── ota_watcher.py    — OTAState, should_check(), check_for_update(), scan_tweaks(), reapply_tweaks()
│                            (lógica pura, sin Qt — la usa ota_check.py)
│
├── forge/db/ — persistencia SQLite en %LOCALAPPDATA%/RedmiForge/redmiforge.db
│   └── database.py       — init_db(), upsert_device(), start_run()/finish_run(),
│                            record_metric()/get_latest_metric()/list_metrics() (usage_stats de Sindy)
│
└── forge/services/ — headless, sin Qt, para Task Scheduler/cron
    ├── ota_check.py           — chequeo OTA cada 14-15 días + logging a archivo, registrado en setup.ps1
    └── maintenance_check.py   — storage/temp/backup WhatsApp + limpieza liviana + --maintenance oportunista
                                 + snapshot de uso, registrado en setup.ps1 (cada 60 min)
```

### Auditoría de apps desde terminal

1. `python -m forge.core.app_scanner --scan <SERIAL>` — escanea via `pm list packages`
2. Apps conocidas se categorizan contra `PACKAGES_DB` y `DEBLOAT_CATALOG`
3. Apps desconocidas se envían en batches a `classify_batch_with_haiku()` — Claude Haiku via `anthropic` SDK (requiere `ANTHROPIC_API_KEY`; sin ella el escaneo funciona igual pero sin descripción)
4. `disable_package()` aplica los guardrails antes de ejecutar: joyose, SafetyNet (`SAFETYNET_PROTECTED`), críticas de negocio (`BUSINESS_CRITICAL`)

### Modo Sindy — whitelist, con bloqueo pendiente

`./run.sh --sindy` corre `mode_sindy_optimize()` (copia estructural de `full_optimize.sh` — la única diferencia real es la FASE 2). En vez de blacklist (Pablo: "esto se elimina"), usa whitelist (`bloatware_run_whitelist()` en `engines/bloatware.sh`): calcula todos los paquetes de terceros (`pm list packages -3`) que NO están en `PROFILE_SINDY_WHITELIST`, muestra un preview completo, y pide confirmación manual (`[s/N]`) antes de tocar nada — nunca toca paquetes de sistema por construcción.

También activa `device_quiet_mode_enable()` (corta WiFi/datos + No Molestar) durante toda la corrida para que no le entren mensajes de WhatsApp, con `trap ... EXIT` para garantizar que se restaura aunque el script aborte a mitad de camino.

**`data/profile_sindy.sh` tiene una sección explícitamente marcada como bloqueada** (juegos instalados, redes sociales, y 3 apps sin identificar) — no descomentar ni mover esos paquetes a la whitelist sin que Pablo confirme primero qué hacer con cada uno.

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
| **S8 — Merge trabajo local + modo Sindy (30/08/2026)** | Se rescató y mergeó trabajo local no commiteado: modo whitelist para Sindy, `usage_stats.py`, fix mejorado del BUG 1, fallback appops ya codeado, `database.py` restaurada. Codename de Pablo confirmado (`pond`) con el dispositivo conectado. Queda abierto: destrabar la sección bloqueada de `profile_sindy.sh` y confirmar el codename de Sindy en su propio dispositivo. | ⚠️ Casi cerrado — ver "PRÓXIMO PASO" |

---

## Investigación — cuándo y cómo

**Antes de implementar cualquier módulo que toque el dispositivo**, buscá primero:

- XDA Developers: hilos Redmi 14C + HyperOS 3 + G81 Ultra (2025-2026)
- GitHub: `xiaomi debloat`, `hyperos tweaks`, `mediatek g81 governor`, UAD-ng
- Reddit: r/Xiaomi, r/MIUI — búsquedas "Redmi 14C optimization"
- Docs AOSP para entender qué hacen los settings que tocamos

---

*CLAUDE.md v4.1 — 30/08/2026 — MejoraRedmi14C (checklist técnico completado con el dispositivo real: codename `pond` confirmado, Vulkan confirmado inerte, Lawnchair activo como HOME — pendiente solo feedback de uso real y codename de Sindy)*
