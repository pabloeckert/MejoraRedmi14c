# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Redmi Forge — CLAUDE.md para Claude Code

> **Repo base:** https://github.com/pabloeckert/MejoraRedmi14c  
> **Actualizado:** 31 de agosto de 2026 (optimización real del teléfono de Sindy, modo whitelist)

---

## 🎯 Objetivo del proyecto

Pablo viene de un **POCO X3 Pro** y quiere que el Redmi 14C se sienta lo más parecido posible a esa experiencia: un Android rápido, predecible, sin capas de más encima. HyperOS es la capa — el objetivo de este repo es **acercarse a un Android limpio sin arriesgar el brickeo del equipo**.

Orden de preferencia, de más a menos deseable:

1. **Android limpio real (AOSP/GSI/custom ROM)** — descartado por ahora. Requiere bootloader desbloqueado, y aunque el proceso oficial de Xiaomi para desbloquear existe para equipos globales (pedido + espera vía su comunidad, no es un unlock instantáneo — ver "Bootloader unlock" más abajo, matizado 30/08/2026), el costo es alto y permanente: se pierden OTAs, Find My Device, desbloqueo por huella/rostro y Google Pay, y en HyperOS 3 encima hay que re-solicitar el unlock request. Para un teléfono de uso diario que Pablo necesita andando, ese trade-off no vale la pena — **no se busca salvo pedido explícito**.
2. **HyperOS "vaciado" al máximo sin root ni unlock** — el camino real de este repo. Bloatware fuera, telemetría cortada, capas visuales de MIUI apagadas donde se puede, launcher propio en vez de `com.miui.home`. Esto es lo que hace `./run.sh` hoy.
3. **Lo que quede de HyperOS después de (2)** — es el piso, no el objetivo. Cosas 100% atadas al firmware de Xiaomi (gestor térmico `com.xiaomi.joyose`, drivers de cámara/módem) se quedan sí o sí.

**Hallazgo grande de esta sesión (30/08/2026):** el punto 2 tenía mucho más margen del que el repo creía. Ver "Sesión 30/08/2026 — limpieza, auditoría de bugs y re-verificación en vivo" más abajo — varios tweaks que la documentación daba por "bloqueados sin root" (GPU forzada, Vulkan/MSAA, resolución gaming, incluso el propio namespace `global` de Settings) en realidad **sí funcionan** contra el dispositivo real de Pablo hoy. La causa más probable: el toggle de Ajustes de desarrollador **"Depuración USB (Config. de seguridad)"** — un permiso extra que HyperOS/MIUI exige para que `adb shell` tenga `WRITE_SECURE_SETTINGS`. Si en algún momento estos tweaks vuelven a fallar, lo primero a chequear es que ese toggle siga activado.

---

## ⏭️ PENDIENTE

- **Feedback de uso real del launcher:** Lawnchair está activo como HOME desde el 30/08 (ver detalle en la sección de investigación). Falta que pasen unos días de uso normal para confirmar si eliminó los crashes/pantallas negras del bug de System Launcher de HyperOS 3.
- **BUG nuevo (31/08/2026) — el "modo silencioso" de `--sindy` no sobrevive al reboot:** `device_quiet_mode_enable/disable()` corta WiFi/datos + activa DND antes de optimizar y los restaura correctamente *antes* de reiniciar (confirmado en log), pero *después* del `adb reboot` el teléfono vuelve a aparecer con WiFi/datos apagados y DND activo — como si el reinicio pisara la restauración. Se corrigió a mano en la corrida del 31/08 (`svc wifi/data enable` + `set-dnd off` post-boot). Sin diagnosticar la causa raíz todavía (¿HyperOS no persiste `svc wifi/data enable` igual que el toggle manual? ¿algo tipo "modo avión temporal" ligado al reinicio?). Revisar en la próxima sesión que toque `device_profile.sh` — el fix probable es verificar el estado de red *después* del reboot también, no solo antes.
- **Reinicio pendiente (no urgente):** `./run.sh --full` (30/08/2026, ver abajo) disparó `adb reboot`, pero el teléfono no llegó a reiniciarse (uptime siguió en 11 días después de la corrida) — el comando no tuvo efecto por alguna razón no diagnosticada, sin bloquear nada porque todos los tweaks ya quedaron confirmados activos sin necesitar el reinicio. Nota 31/08: en la corrida de Sindy el mismo `adb reboot` sí tuvo efecto (el teléfono reinició normalmente), así que no parece ser un problema sistemático del comando — puede haber sido puntual del equipo de Pablo esa vez. Si vuelve a fallar, investigar.
- **Nota operativa (31/08/2026):** tras un `adb reboot` disparado por este CLI, HyperOS puede pedir reconfirmar el permiso de depuración USB con un tap físico en el teléfono (aparece como `unauthorized` en `adb devices`, no hay forma de resolverlo por software). Si se repite seguido, probar tildar "Recordar de esta computadora" al aceptar el diálogo.
- **Nota operativa (31/08/2026):** con la pantalla apagada, HyperOS puede suspender el puente ADB por USB aunque el cable siga conectado y cargando — `adb devices` muestra `offline` indefinidamente. Confirmado con `Get-PnpDevice` en Windows que el USB está OK a nivel físico/driver; el bloqueo es 100% del lado del teléfono. Se resuelve tocando la pantalla (no hace falta desbloquear del todo). No hay forma de destrabarlo por software desde la PC.
- **BUG nuevo (31/08/2026) — `bloatware_run_whitelist()` no reconcilia en la dirección inversa:** solo desactiva paquetes que NO están en la whitelist; si un paquete SÍ está en la whitelist pero ya aparece desactivado en el dispositivo (por el motivo que sea — no siempre queda registrado), el script nunca lo reactiva. En el dispositivo de Sindy aparecieron 8 apps protegidas por whitelist (incluida TikTok) desactivadas sin ningún registro en `devices.db` de que el CLI lo hubiera hecho — se corrigieron a mano (`pm enable --user 0`). Mejora sugerida: que `bloatware_run_whitelist()` también reactive lo que está en la whitelist pero aparece disabled, no solo desactive el complemento.

✅ **Resuelto (30/08/2026, sesión de la tarde):** GPU forzada/Vulkan/MSAA, resolución gaming, memoria y red — el `./run.sh --full` corrido contra el dispositivo real de Pablo los aplicó todos. Verificado con `mega-verificar.sh`: **16/16 (100%)**. Tardó 3h39min por 106 apps de terceros a recompilar (ver duración actualizada en el README) — mucho más que el estimado documentado de 15-30 min, que asumía muchas menos apps instaladas.

✅ **Resuelto (31/08/2026):** codename de Sindy confirmado en su propio dispositivo (`pond`, con `getprop`, ya no es inferencia). Sección bloqueada de `profile_sindy.sh` (juegos/redes sociales/3 apps sin identificar) resuelta con Pablo — ver "Sesión 31/08/2026" más abajo. `./run.sh --sindy` corrido contra el dispositivo real de Sindy: **15/16 (93%)** verificado con `mega-verificar.sh` post-reinicio.

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
| `forge/services/ota_check.py` | ✅ Producción | OTA watcher autónomo — corre via Task Scheduler, sin UI. Logging a archivo (`ota_check.log`) + manejo de errores por dispositivo (30/08/2026). Codename `pond` confirmado en ambos dispositivos (Pablo y Sindy). |
| `forge/services/maintenance_check.py` | ✅ Producción | Storage/temp/backup WhatsApp + limpieza de caché liviana (24h) + `--maintenance` completo oportunista (7 días) + snapshot de uso — registrado en `setup.ps1` (Task Scheduler, cada 60 min) |
| `setup.ps1` / `setup.bat` | ✅ Producción | Setup one-command para PC nueva — instala deps headless, ADB, Task Scheduler (OTA cada 15 días + mantenimiento cada 60 min) |
| `src/cli/modes/sindy_optimize.sh` + `data/profile_sindy.sh` | ✅ Producción — corrido y verificado (31/08/2026) | Modo whitelist (`./run.sh --sindy`) para el teléfono de Sindy — inversa del modo Pablo: protege lo que está en la whitelist, desactiva TODO el resto de apps de terceros. Ya no tiene bloqueo pendiente — Pablo confirmó juegos/redes sociales/apps sin identificar el 31/08/2026 (ver tabla de dispositivos y `optimo_sindy.md`). |
| **Dispositivo Pablo** | NB5XWCLZSGB6J74D | `./run.sh --full` corrido 30/08/2026 (3h39min, 106 apps de terceros recompiladas): **48 apps desactivadas** (de 447), animaciones 0.3x, GPU forzada + Vulkan + MSAA activos, resolución gaming 612x1360@260dpi activa, memoria (swappiness 20, Dalvik 512m, max cached 96) y red (DNS/TCP/WiFi scan) aplicados, 90Hz. Verificado con `mega-verificar.sh`: **16/16 (100%)**. RAM 1.1GB libre (31%), 27°C, batería 100%. Build: **OS3.0.306.0.WGTMIXM**. Security patch 2026-07-01. Codename **pond** (confirmado). |
| **Dispositivo Sindy** | VOSWQCOVJVQWT8LR | `./run.sh --sindy` + revisión obsesiva corridos 31/08/2026: **11 apps desactivadas** por perfil whitelist (9 juegos + NaturalReader + Eist, sobre 65 protegidas) + 4 de hardware/sistema fuera de control (NFC y eSIM bloqueados por SKU, 2 componentes irrelevantes) = 15 total. Se encontraron y corrigieron **8 apps protegidas por whitelist que estaban mal-desactivadas** (incluida TikTok) sin registro de por qué — ver "BUG nuevo" arriba. Animaciones 0.3x, GPU forzada + Vulkan + MSAA, resolución gaming 612x1360@260dpi, memoria y red aplicados, 90Hz (120Hz investigado, bloqueado por firmware — ver más abajo), `max_phantom_processes` sin límite, 7 apps clave sacadas del bucket RESTRICTED de Android y agregadas a whitelist de Doze. Verificado con `mega-verificar.sh` post-reinicio: **15/16 (93%)**. RAM 1.3GB libre (36%), 29°C, batería 100%. Build: **OS3.0.306.0.WGTMIXM**. Codename **pond** (confirmado). Detalle completo con comparativa antes/después en `optimo_sindy.md`. |

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

**Codename OTA — resuelto para Pablo, pendiente para Sindy:** se verificó con el dispositivo de Pablo conectado (`pond`, confirmado con `getprop`, no adivinado). El de Sindy quedó en `pond` también por ser el mismo modelo, pero sin confirmar en su propio dispositivo — ver "PENDIENTE" al principio del archivo.

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
cd src/cli && ./run.sh --sindy    # perfil whitelist para el teléfono de Sindy — corrido y verificado 31/08/2026
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
**No hay suite de tests, linter ni CI configurados en el repo** (sin `pytest`, sin `ruff`/`black`, sin `.github/workflows`). La verificación de cambios es contra el dispositivo real, vía los scripts de `tools/` (`--dry-run` primero cuando el script lo soporta) y `./run.sh --scan` para confirmar estado sin modificar nada.

---

## Bugs críticos — resueltos

- **BUG 1 (resuelto 29/08/2026, fix mejorado 30/08/2026)** `src/cli/tools/optimize-boot.sh` tenía `com.xiaomi.joyose` hardcodeado en `BOOT_APPS` y lo desactivaba con `pm disable-user` directo, sin pasar por `safe_disable_pkg()`/`is_critical_pkg()`. Causa raíz real (encontrada 30/08/2026): el `source` de `config.sh` apuntaba a la carpeta equivocada y fallaba en silencio — `is_critical_pkg` nunca estaba disponible ahí. Fix actual: path de `source` corregido a `../core/config.sh` (+ `adb_utils.sh` + `engines/thermal.sh`), `joyose` sacado del array, guardrail `is_critical_pkg` en el loop, y se le agregó backup + gate térmico igual que al resto de los modos. Corré siempre con `--dry-run` primero de todos modos.

### Sesión 30/08/2026 (tarde) — limpieza, auditoría de bugs y re-verificación en vivo

Pablo pidió una limpieza general del repo (sin interfaces, sin referencias a terceros), una revisión de bugs de punta a punta, y una actualización con información/mejoras vigentes — con el dispositivo real conectado durante toda la sesión. Se encontró bastante más de lo esperado:

**Limpieza:**
- Se borró `GEMINI.md` (doc desactualizado de otra sesión con otra IA — describía la web app WebUSB que ya no existe; no correspondía tenerlo en un repo que es solo Claude + Pablo).
- Se borraron archivos gitignorados que habían quedado sueltos en la raíz (`sindy_pkgs.txt`, un dump crudo de paquetes con nombre de path de Windows mal formado), `tools/` en la raíz (huérfano de antes de la reestructuración a `src/cli/tools/`, sin ninguna referencia en el código), un benchmark viejo suelto en `src/cli/tools/`, y las carpetas vacías que había dejado la purga del 29/08 (`app/`, `forge/ui/`, `forge/dev/`, `src/web/`, incluyendo `.pyc` sueltos de la UI PySide6 eliminada). `.gitignore` también se depuró de reglas muertas (Node/Electron/GitHub Pages/instalador — nada de eso existe en este repo).

**BUG 2 — `scan.sh` reportaba "bloqueado en Android 16 (requiere root)" sin haberlo probado nunca.** `modes/scan.sh` mostraba ese mensaje para GPU forzada, blur y resolución solo comparando el valor *actual* contra el target — si no coincidía, asumía que era por permisos, sin intentar escribirlo. Se probó en vivo contra el dispositivo real (`settings put global force_gpu_rendering 1`, `window_animation_scale`, `wm size 612x1360`): **las tres funcionan perfectamente sin root.** El "hallazgo" de Vulkan/GPU inerte de más abajo en este mismo archivo (30/08/2026, misma sesión) se basó en leer este mensaje engañoso, no en una escritura real fallida — quedó corregido en el momento (ver sección de GPU actualizada más abajo). Fix: `scan.sh` ahora muestra "pendiente, correr --full/--profile" en vez de afirmar que está bloqueado.

**BUG 3 — `performance.sh` reportaba "Fixed performance mode activado" aunque HyperOS 3 no soporta esa función.** El comando `cmd power set-fixed-performance-mode-enabled` no devuelve texto de error en esta ROM, así que el chequeo de excepción nunca detectaba la falla. Fix: ahora verifica contra `dumpsys power` (que no expone `mFixedPerformanceModeEnabled` en HyperOS 3) antes de loguear éxito.

**BUG 4 — `bloatware_restore_all()` no revertía el fallback de `PROFILE_RUNTIME` (perfil de Pablo).** El Intento 3 de `safe_disable_pkg()` (appops `RUN_ANY_IN_BACKGROUND deny`) se revertía solo para `PROFILE_POCO_MODE` y `PROFILE_XIAOMI_TELEMETRY` — pero `./run.sh --profile` (el modo que usa el perfil personalizado de Pablo) también puede disparar ese mismo fallback, y `PROFILE_RUNTIME` ni siquiera se cargaba en el arranque de `run.sh` (solo dentro de `profile_optimize.sh`/`scan.sh`). Resultado: si `--emergency` corría después de un `--profile`, esos paquetes quedaban bloqueados en background para siempre. Fix: `bloatware_restore_all()` ahora sourcea `profile_runtime.sh` si hace falta e incluye `PROFILE_RUNTIME` en el revert.

**BUG 5 — `app_scanner.py` (`disable_package()`) sin guardrail de apps críticas del sistema.** A diferencia del CLI Bash (`is_critical_pkg()` contra `CRITICAL_SYSTEM_APPS`), el camino de desactivación en Python solo bloqueaba joyose + SafetyNet + apps críticas de negocio — `com.android.systemui`, `com.miui.home`, `com.android.phone`, etc. no tenían protección explícita, solo quedaban afuera del flujo interactivo por estar ya catalogados en `PACKAGES_DB` con `action="keep"` (protección por omisión, no por regla). Fix: se agregó `CRITICAL_SYSTEM_APPS` a `apps_catalog.py` (espejo de la lista de `config.sh`) y se usa como guardrail explícito en `disable_package()`, igual que en Bash.

**BUG 6 — `adb_bridge.py` leía la versión de HyperOS de una propiedad vieja.** `get_device_info()` usaba `ro.miui.ui.version.name` (devuelve "V816", un código interno de la era MIUI) en vez de `ro.mi.os.version.name` (devuelve "OS3.0", lo que el CLI Bash y el resto del proyecto ya usan). No estaba conectado a ningún flujo activo todavía, pero hubiera reportado mal la versión apenas se usara. Corregido para que coincida con el resto del proyecto.

**BUG 7 — `ota_check.py` tenía un baseline de build desactualizado y sin mecanismo de auto-corrección.** El seed hardcodeado para Pablo (`OS3.0.20.0.WGTMIXM`) quedó viejo — el dispositivo real ya está en `OS3.0.306.0.WGTMIXM` (hubo un OTA entremedio que nadie registró). Con ese seed, el próximo chequeo programado iba a disparar una notificación falsa de "nueva versión disponible" para un build que ya estaba instalado. Peor: nada en el código avanzaba `known_build` después de detectar un update, así que una vez marcado `ota_detected=True` quedaba así para siempre y re-notificaba cada 14 días indefinidamente, incluso después de que Pablo aplicara el OTA a mano. Fix: baseline actualizado al build real, y `main()` ahora reconcilia contra `ro.mi.os.version.incremental` cada vez que el dispositivo está conectado — si la build instalada cambió, actualiza el estado y limpia las flags, sin esperar al próximo ciclo de 14 días.

**BUG 8 — mismo patrón que el BUG 1, sin propagar a los scripts hermanos.** `src/cli/tools/benchmark.sh` y `mega-verificar.sh` tenían el mismo `source "$SCRIPT_DIR/config.sh"` con el path viejo (el archivo real está en `../core/config.sh`) — el mismo bug que ya se había encontrado y arreglado una vez en `optimize-boot.sh`, pero nunca se replicó acá. En `mega-verificar.sh` esto era grave: como el source fallaba en silencio, `$ANIM_POCO_MODE`, `$SWAPPINESS_PERFORMANCE`, `$MAX_CACHED_PROCESSES`, `$DALVIK_HEAP`, `$DNS_VALIDITY` y `$TCP_RWND` quedaban vacíos, y `grep -q ""` contra cualquier valor real siempre matchea — **todos los checks de animaciones/memoria/red reportaban ✅ PASS sin importar el estado real del dispositivo.** `set-launcher.sh` tenía el mismo path roto pero sin consecuencia (no usa nada de `config.sh`). Se corrigieron los tres paths.
  - De paso, `mega-verificar.sh` chequeaba las animaciones contra el namespace `global` (siempre en 0.0 en este HyperOS, no es lo que lee el sistema) en vez de `system` (donde el CLI realmente las aplica) — verificado en vivo que HyperOS 3 no parece leer las claves de animación desde `Settings.Global` en este dispositivo. Corregido para chequear `system`.
  - También tenía un check muerto de `thermal_limit_enabled` — una clave que ningún engine del CLI aplica nunca (probablemente de un prototipo previo). Se eliminó el check en vez de dejarlo fallando siempre.
  - Y tanto `benchmark.sh` como `mega-verificar.sh` extraían batería/temperatura con `grep "level:"`/`grep "voltage:"` sin anclar el patrón — `dumpsys battery` también tiene líneas `Capacity level:` y `Max charging voltage:` que matchean el mismo grep suelto y devuelven dos valores en vez de uno (se veía literalmente como "74\n3%" en la salida). `device_profile.sh` ya tenía este fix (`head -1`) para el camino principal del CLI, pero no se había propagado a las herramientas de diagnóstico. Corregido con grep anclado a inicio de línea.
  - Confirmado en vivo tras los fixes: `mega-verificar.sh` corrido contra el dispositivo real de Pablo ahora muestra animaciones ✅, RAM/batería/temperatura con valores reales (antes en blanco por falta de `bc`, reemplazado por `awk` como ya hacía `benchmark.sh`), y un score honesto de 9/15 (60%) en vez de un falso ~100%.

**BUG 9 (encontrado al correr `--full` de verdad, 30/08/2026 tarde) — `apps_compiled` no contaba el dexopt real.** `full_optimize.sh`/`sindy_optimize.sh` llamaban a `performance_apply_poco_mode()` sin capturar su valor de retorno (el conteo de apps de sistema + terceros compiladas) — solo sumaban el de `camera_fix_apply()`. Resultado: la corrida real de hoy compiló 9 apps de sistema + 106 de terceros = 115, pero el banner final mostró "Apps compil: 5" (solo el de cámara/WhatsApp). El trabajo se hacía bien, solo el número mostrado al final estaba mal. Fix: se captura y suma también el retorno de `performance_apply_poco_mode()`, igual que ya se hacía con `camera_fix_apply()`.

**Hallazgo de fondo, no un bug de código:** todo lo anterior converge en la misma causa raíz — el repo asumía que `settings put global <key>` estaba bloqueado sin `WRITE_SECURE_SETTINGS` en Android 16/HyperOS 3, y varias piezas (código y documentación) se construyeron sobre esa asunción sin volver a probarla contra hardware real. Probado en vivo hoy: **`settings put global` funciona perfectamente** para `force_gpu_rendering`, `window_animation_scale`, `disable_window_blurs`, `dns_resolver_*`, `dalvik_vm_heapsize`, `lmk_minfree_levels`, y `wm size` también funciona. La explicación más probable, corroborada por guías externas de debloat de HyperOS 3 (ver sección de research más abajo): el toggle de Ajustes de desarrollador **"Depuración USB (Config. de seguridad)"** — distinto del simple "Depuración USB" — es lo que le da a `adb shell` el permiso `WRITE_SECURE_SETTINGS`. Es razonable que estuviera desactivado cuando se hizo la investigación original del 01/06/2026 y se haya activado después en algún momento (p. ej. al perseguir otro problema). **Acción recomendada:** verificar que ese toggle esté activo, y si en el futuro estos tweaks vuelven a fallar, revisarlo antes de asumir que Android volvió a bloquearlos.

## Limitaciones Android 16 — parche BP2A.250605.031.A3 (confirmadas 01/06/2026, re-verificadas 30/08/2026)

Android 16 con el parche de seguridad de junio 2025 bloquea algunos mecanismos que antes funcionaban vía ADB sin root — pero no todos los que este archivo daba por bloqueados. El CLI en `safe_disable_pkg()` ya tiene el fallback correcto:

| Comando | Estado | Alternativa válida |
|---------|--------|--------------------|
| `settings put global <key>` | ✅ Funciona (re-verificado 30/08/2026 en vivo: GPU, animaciones, blur, DNS, LMK, Dalvik heap, `wm size` — todo escribe y persiste sin root). El shell de ADB en HyperOS 3 tiene `WRITE_SECURE_SETTINGS` — casi seguro gracias al toggle "Depuración USB (Config. de seguridad)" en Ajustes de desarrollador. El hallazgo previo de "bloqueado" salió de leer el mensaje engañoso de `scan.sh` (BUG 2, ver sesión 30/08/2026), no de una escritura real fallida. | — (ya no hace falta alternativa; queda `system` como namespace real para animaciones, ver nota abajo) |
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

### Sacar HyperOS por completo — DESCARTADO, matizado 30/08/2026

Sigue descartado, pero por trade-off, no por imposibilidad técnica absoluta. Research de hoy (fuentes externas, no específicas al Redmi 14C — ver abajo) matiza la afirmación anterior de "SKU bloqueado": el desbloqueo de bootloader en equipos Xiaomi globales (no China mainland) sigue existiendo como proceso oficial — pedís permiso vía la cuenta Mi/comunidad Xiaomi, esperás la aprobación (históricamente días, a veces más), y recién ahí el Mi Unlock Tool desbloquea. No es un SKU-block instantáneo y permanente como se había concluido antes; es el mismo proceso lento y con fricción deliberada que Xiaomi aplica a la mayoría de sus modelos globales. No se re-verificó el hilo específico de XDA del Redmi 14C que motivó la conclusión original, así que tratá esto como "vale la pena re-chequear", no como una reversión confirmada.

Aun si el unlock es técnicamente alcanzable, el costo sigue siendo alto y permanente una vez desbloqueado: **se pierden OTAs oficiales, Find My Device, desbloqueo por huella/rostro y Google Pay**, y en HyperOS 3 el re-lock tampoco devuelve todo al estado anterior. Para el teléfono de uso diario de Pablo, con la mayor parte del resultado ya alcanzable sin root (ver hallazgo de la sesión 30/08/2026: `settings put global` funciona, GPU/Vulkan/resolución/animaciones/red están al alcance sin ningún unlock), ese trade-off no se justifica. GSI/Project Treble sobre el MT6769J sigue en el mismo lugar: requiere el mismo bootloader unlock como prerrequisito, así que no cambia el cálculo. Los métodos alternativos (MTK client / bypass BROM) siguen con reportes de brick real en la comunidad — no recomendados.

**Conclusión sin cambios: no se persigue el unlock salvo pedido explícito de Pablo sabiendo el costo.** Lo que sí cambió con la sesión de hoy es que el "Android limpio sin bootloader" tiene mucho más recorrido del que se creía.

### Shizuku — evaluado y descartado para este toolkit

Da permisos a nivel `adb shell` (incluye `WRITE_SECURE_SETTINGS`) a apps del propio teléfono sin PC y sin root. Pero corre con el mismo UID `shell` que ya usa el CLI por USB — **no destraba nada que `adb shell` no pueda hacer ya** (en particular, `pm disable-user` en apps de sistema sigue bloqueado, no es un límite de "falta de puente" sino de HyperOS mismo). Tampoco arranca solo al reiniciar en dispositivos sin root — hay que abrir la app y tocar "Start" cada vez. No aporta sobre lo que ya hace `run.sh` conectado por USB. No integrar.

### Bug confirmado de HyperOS 3 — System Launcher como causa de crashes/pantallas negras

Xiaomi reconoció públicamente un bug del System Launcher (`com.miui.home`) en HyperOS 3 que causa force-closes, parpadeo de pantalla y entrada a Safe Mode, por conflicto con el widget de clima nativo. Builds confirmados: OS3.0.3.0–OS3.0.5.0 (variantes WNNEUXM/WNEEUXM/WOSEUXM/WNCEUXM). El build de Pablo es OS3.0.306.0.WGTMIXM (re-verificado 30/08/2026) — variante distinta, no confirmado que sea el mismo bug exacto, pero misma familia de falla (el launcher nativo de Xiaomi como punto de quiebre).

**Mitigación — `src/cli/tools/set-launcher.sh` (nuevo, aplicado 30/08/2026):** `com.miui.home` queda protegido como crítico (no se desactiva), pero se puede dejar de usar como default vía `cmd package set-home-activity` — solo cambia qué app responde al rol HOME, no toca instalación ni permisos, 100% reversible, sin riesgo de brick (el selector de apps predeterminadas de Ajustes siempre funciona como último recurso).

```bash
bash src/cli/tools/set-launcher.sh app.lawnchair.play   # launcher elegido: Lawnchair, build de Play Store
                                                          # (OJO: "app.lawnchair" sin ".play" es la build de F-Droid — no es la instalada acá)
bash src/cli/tools/set-launcher.sh --status              # ver HOME activo
bash src/cli/tools/set-launcher.sh --reset               # volver a com.miui.home
```

**Estado real (30/08/2026):** Lawnchair activo como HOME, confirmado con `--status`. Pendiente: feedback de Pablo tras unos días de uso — ver "PENDIENTE" al principio del archivo.

### Vulkan + MSAA forzado — REVERTIDO: SÍ FUNCIONA (corregido 30/08/2026, misma sesión)

Este archivo llegó a decir "CONFIRMADO INERTE" más temprano en el mismo día 30/08/2026, basado en leer el mensaje "GPU forzada → bloqueado en Android 16 (requiere root)" de `./run.sh --scan` — que resultó ser un falso negativo del propio `scan.sh` (BUG 2, ver "Sesión 30/08/2026" arriba): el script nunca probaba escribir el valor, solo asumía "bloqueado" si no coincidía con el target. Probado en vivo directo contra el dispositivo (sin pasar por el CLI): `settings put global force_gpu_rendering 1` escribe y persiste sin error, igual que `force_msaa` y `debug.hwui.renderer skiavk`. `engines/performance.sh` (bloque GPU) ya tenía la detección de "exception/denied" correcta desde antes — el bug estaba en `scan.sh`, no ahí. Sigue sin aplicarse en el dispositivo de Pablo porque nadie corrió `--full`/`--profile` desde que se creía bloqueado — queda pendiente que Pablo decida si lo aplica. No es una fuente de inestabilidad real per se; el sospechoso principal de crashes/pantallas negras sigue siendo el bug del System Launcher (ver arriba).

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

- **Modelo:** Redmi 14C (2409BRN2CL) — serial NB5XWCLZSGB6J74D — codename **pond** (confirmado con `adb shell getprop ro.product.device`)
- **SoC:** Helio G81 Ultra (MediaTek **MT6769J**) — 6× Cortex-A55 @ 1.7 GHz (cpu0–5) + 2× Cortex-A75 @ 2.0 GHz (cpu6–7)
- **OS:** HyperOS **OS3.0** (build `OS3.0.306.0.WGTMIXM`, re-verificado 30/08/2026) / Android 16, SDK 36, security patch 2026-07-01, `ro.build.display.id` = `BP2A.250605.031.A3`. Nota: `ro.miui.ui.version.name` devuelve "V816" (código interno heredado de la era MIUI) — no es la versión de HyperOS que ve el usuario en Ajustes; usar siempre `ro.mi.os.version.name`/`ro.mi.os.version.incremental` como fuente real (mismo criterio ya aplicado en `adb_bridge.py`, corregido 30/08/2026 — ver BUG 6).
- **Tweaks validados en v6.0 (NO tocar sin testear):**
  - `swappiness=20`, LMK agresivo, Dalvik + HWUI heap XL
  - Animaciones `0.3x` (persiste — guardado en Settings DB, namespace `system`)
  - **Vulkan + MSAA forzado** — funciona sin root (re-verificado en vivo 30/08/2026, ver "Sesión 30/08/2026" arriba). Pendiente de que Pablo corra `--full`/`--profile` para aplicarlo de verdad en su dispositivo.
  - **Resolución gaming `612x1360 @ 260dpi`** — funciona sin root (`wm size`/`wm density`, re-verificado en vivo 30/08/2026). Antes documentado como "muerto", era el mismo falso negativo del BUG 2. Pendiente de aplicar; evaluar si vale la pena el trade-off de nitidez.
  - **Animaciones**: usar `settings put system` (NO `global`) — verificado que en este HyperOS 3 las claves de animación en `Settings.Global` quedan en `0.0` incluso con `system` en `0.3` (namespaces distintos, el sistema solo lee `system`). El CLI ya hace esto correctamente vía `adb_setting_put_system`.
  - **`settings put global` en general SÍ funciona sin root** en este dispositivo (GPU, blur, DNS, LMK, Dalvik heap, `wm size`) — probablemente gracias al toggle "Depuración USB (Config. de seguridad)" en Ajustes de desarrollador. Si algo empieza a fallar de golpe, revisar ese toggle antes de asumir que Android lo volvió a bloquear.
  - **`max_phantom_processes` sin límite** (`device_config put activity_manager max_phantom_processes 2147483647` + `settings put global settings_enable_monitor_phantom_procs false`) — funciona sin root (confirmado 31/08/2026 en el dispositivo de Sindy). Tweak AOSP genérico (no específico de Xiaomi), evita que Android mate procesos en segundo plano de forma agresiva. No estaba en el CLI todavía — aplicado manualmente, pendiente de incorporar a `engines/memory.sh` si se valida con más uso.
  - **120Hz — investigado y CONFIRMADO BLOQUEADO por firmware (31/08/2026), no aplicar.** El panel es 120Hz de fábrica (`dumpsys display` confirma `supportedRefreshRates [120.00001, 90.0, 60.0]`), pero HyperOS lo capea vía `persist.sys.smartpower.limit.refresh.max.rate=90` — property de solo-root, `setprop` desde shell da `SecurityException`. `settings put system peak_refresh_rate 120` se acepta pero no tiene efecto real (`mActiveSfDisplayMode` se queda en 90). No perder tiempo en esto de nuevo sin root.
  - **Apps en bucket RESTRICTED de Android** (`am get-standby-bucket <pkg>`, valor 40) — HyperOS puede meter ahí apps que el usuario sí quiere que funcionen bien (notificaciones casi cortadas). Se puede subir a WORKING_SET (`am set-standby-bucket <pkg> 10`) y agregar a la whitelist de Doze (`cmd deviceidle whitelist +<pkg>`, equivalente al toggle "Batería sin restricciones") — sin root, reversible. Vale la pena chequear esto para cualquier app que se decida "proteger" en un perfil whitelist, no alcanza con que `pm` la deje instalada/habilitada.
- **Governor:** `sugov_ext` (propietario MediaTek, default HyperOS). Disponibles: `sugov_ext | conservative | powersave | performance | schedutil`. Sin root: no legible ni modificable directamente.
- **ZRAM:** `zram0` configurado en 4 GB (SwapTotal=4194300 kB). Algoritmo no legible sin root. No modificar.
- **Lista de bloatware:** en `src/cli/data/bloatware_db.sh` → array `PROFILE_POCO_MODE` (fuente canónica única, sin espejo Python — `debloat_engine.py` se eliminó en la purga).
- **Perfil personalizado (Pablo):** `src/cli/data/profile_runtime.sh` → array `PROFILE_RUNTIME`, apps extra a desactivar además de `PROFILE_POCO_MODE`. Antes lo generaba el wizard de la UI; ahora es estático y editable a mano. Usado por `./run.sh --profile`. Es blacklist: "esto además se elimina".
- **Perfil personalizado (Sindy):** `src/cli/data/profile_sindy.sh` → array `PROFILE_SINDY_WHITELIST`. Al revés del de Pablo — es whitelist: "esto se protege, TODO el resto de apps de terceros se desactiva". Sin bloqueos pendientes (resuelto 31/08/2026). Usado por `./run.sh --sindy` vía `bloatware_run_whitelist()`.

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
│       ├── data/profile_sindy.sh   — PROFILE_SINDY_WHITELIST (perfil Sindy, whitelist — sin bloqueos pendientes)
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

### Modo Sindy — whitelist (corrido y verificado 31/08/2026)

`./run.sh --sindy` corre `mode_sindy_optimize()` (copia estructural de `full_optimize.sh` — la única diferencia real es la FASE 2). En vez de blacklist (Pablo: "esto se elimina"), usa whitelist (`bloatware_run_whitelist()` en `engines/bloatware.sh`): calcula todos los paquetes de terceros (`pm list packages -3`) que NO están en `PROFILE_SINDY_WHITELIST`, muestra un preview completo, y pide confirmación manual (`[s/N]`) antes de tocar nada — **solo si hay TTY interactivo** (`[ -t 0 ]`); corrido desde una sesión de Claude Code (sin TTY) salta directo a ejecutar, así que hay que confirmar la whitelist de antemano en la conversación, no asumir que el script va a parar a preguntar. Nunca toca paquetes de sistema por construcción.

También activa `device_quiet_mode_enable()` (corta WiFi/datos + No Molestar) durante toda la corrida para que no le entren mensajes de WhatsApp, con `trap ... EXIT` para garantizar que se restaura aunque el script aborte a mitad de camino — **ojo:** confirmado en vivo (31/08/2026) que la restauración funciona bien *antes* del `adb reboot` de FASE 8, pero **no sobrevive al reinicio en sí** (bug sin diagnosticar, ver "PENDIENTE" al principio del archivo) — verificar manualmente WiFi/datos/DND después de cualquier corrida que termine en reboot.

`data/profile_sindy.sh` ya no tiene sección bloqueada — Pablo confirmó el 31/08/2026 qué hacer con juegos, redes sociales y las apps sin identificar (ver tabla de dispositivos y `optimo_sindy.md` para el detalle completo de qué quedó protegido vs. desactivado).

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
| **S8 — Merge trabajo local + modo Sindy (30/08/2026)** | Se rescató y mergeó trabajo local no commiteado: modo whitelist para Sindy, `usage_stats.py`, fix mejorado del BUG 1, fallback appops ya codeado, `database.py` restaurada. Codename de Pablo confirmado (`pond`) con el dispositivo conectado. | ✅ Cerrado |
| **S9 — Limpieza + auditoría de bugs + realineación de objetivo (30/08/2026)** | Se sacó todo lo que no correspondía (doc de otra IA, archivos sueltos, carpetas vacías de la purga). Se encontraron y corrigieron 8 bugs reales (BUG 2-8, ver "Sesión 30/08/2026" arriba) — el más grande: `settings put global` sí funciona sin root en este dispositivo, y varios "hallazgos" previos de tweaks bloqueados eran falsos negativos de la propia herramienta de diagnóstico. Se fijó el objetivo explícito del proyecto (Android lo más limpio posible, referencia POCO X3 Pro, sin arriesgar brickeo) al principio de este archivo. | ✅ Cerrado — ver "PENDIENTE" al principio del archivo para lo que sigue abierto |

---

## Research externo — 30/08/2026

Búsqueda puntual para esta sesión (no específica al Redmi 14C, contexto general HyperOS 3 vigente a la fecha):

- El desbloqueo de bootloader Xiaomi en equipos globales sigue siendo un proceso oficial con aprobación previa (no un unlock instantáneo), y trae pérdida permanente de OTA/Find Device/biometría/Google Pay — consistente con lo que ya sabíamos, matiza el "SKU bloqueado" de la investigación del 29/08 (ver sección de bootloader arriba).
- Múltiples guías independientes (GitHub, blogs) confirman el mismo hallazgo de esta sesión: ADB sin root puede debloatear HyperOS 3 a fondo y tocar `Settings.Global`, siempre que el toggle "Depuración USB (Config. de seguridad)" esté activo — coincide con el hallazgo de fondo de "Sesión 30/08/2026" arriba.
- Nada nuevo sobre GSI/Project Treble específico para MT6769J — sigue atado al mismo prerrequisito de bootloader desbloqueado, no cambia el cálculo de costo/beneficio.

## Investigación — cuándo y cómo

**Antes de implementar cualquier módulo que toque el dispositivo**, buscá primero:

- XDA Developers: hilos Redmi 14C + HyperOS 3 + G81 Ultra (2025-2026)
- GitHub: `xiaomi debloat`, `hyperos tweaks`, `mediatek g81 governor`, UAD-ng
- Reddit: r/Xiaomi, r/MIUI — búsquedas "Redmi 14C optimization"
- Docs AOSP para entender qué hacen los settings que tocamos

---

*CLAUDE.md v4.2 — 30/08/2026 — MejoraRedmi14C (sesión de limpieza + auditoría de bugs: 8 bugs corregidos, `settings put global` confirmado funcional sin root contra el dispositivo real, objetivo del proyecto explicitado — pendiente feedback de uso real del launcher y codename de Sindy)*
