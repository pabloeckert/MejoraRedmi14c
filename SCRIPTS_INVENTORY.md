# SCRIPTS_INVENTORY.md — Audit v6.0

> Generado: 20/05/2026  
> Auditor: Claude Code  
> Propósito: Inventario completo de scripts Bash para la migración a Tauri v7.

---

## Resumen ejecutivo

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **Core** (siempre cargar) | 5 | ✅ Conservar y portar a Rust |
| **Engines** (lógica de tweaks) | 6 | ✅ Conservar como `scripts/legacy/` — invocar desde Rust |
| **Modes** (orquestadores) | 4 | ✅ Conservar — reemplazar lógica en Rust + UI Tauri |
| **Tools** (utilidades standalone) | 7 | ⚠️ Conservar con advertencias — ver notas |
| **Bugs críticos encontrados** | 2 | ❌ Documentados abajo |

---

## Bugs críticos detectados

### BUG 1 — `optimize-boot.sh` desactiva `com.xiaomi.joyose` 🔴

**Archivo:** `src/cli/tools/optimize-boot.sh`, línea 115  
**Problema:** `com.xiaomi.joyose` figura en `BOOT_APPS` y se desactiva con `pm disable-user`.  
**Impacto:** Sobrecalentamiento garantizado en juegos. Brick térmico potencial.  
**Acción v7:** En la app Tauri, filtrar este paquete en cualquier lista antes de pasarla a `pm disable-user`. El guardrail ya existe en `safe_disable_pkg()` de `config.sh` → no copiar la lista de `optimize-boot.sh` directamente.

### BUG 2 — `run.sh` importa `data/bloatware_db.sh` que no existe 🔴

**Archivo:** `src/cli/run.sh`, línea 35  
**Problema:** `source "$SCRIPT_DIR/data/bloatware_db.sh"` referencia un archivo que no está en el repo.  
**Impacto:** `run.sh` falla con `source: no such file`. Las listas de bloatware probablemente están hardcodeadas en algún engine.  
**Acción v7:** La lista canónica de bloatware vive en `config.sh` (`HEAVY_APPS`). En v7 definirla en Rust como array tipado o cargarla desde un JSON en `profiles/`.

---

## Inventario detallado

---

### CORE — Librerías fundamentales (`src/cli/core/`)

#### `config.sh` ★ SAGRADO
**Rol:** Configuración maestra. Define TODAS las constantes, valores numéricos y funciones ADB de bajo nivel.  
**Exports clave:**
- `HEAVY_APPS[]` — lista canónica de bloatware a desactivar (2026)
- `CRITICAL_SYSTEM_APPS[]` — apps que NUNCA se tocan (incluye `com.xiaomi.joyose`)
- `SYSTEM_APPS_COMPILE[]` — apps del sistema a compilar con dexopt
- Constantes: `THERMAL_MAX_TEMP=42`, `SWAPPINESS_PERFORMANCE=20`, `GAMING_RES_W=612`, `GAMING_RES_H=1360`, `GAMING_DPI=260`, `DALVIK_HEAP="512m"`, `LMK_PERFORMANCE`, `HWUI_TEXTURE=128`
- Funciones: `adb_shell()`, `adb_setting_put()`, `safe_disable_pkg()`, `safe_uninstall_pkg()`, `safe_compile()`, `is_critical_pkg()`, logging (`log_ok`, `log_warn`, `log_fail`, `log_info`, `log_step`, `log_section`)

**Portar a v7:** Los arrays `HEAVY_APPS`, `CRITICAL_SYSTEM_APPS`, `SYSTEM_APPS_COMPILE` → JSON en `src/profiles/bloatware.json`. Los valores numéricos → constantes Rust en `profiles.rs`. Las funciones ADB → `adb_bridge.rs`.

---

#### `adb_utils.sh`
**Rol:** Funciones ADB robustas con retry, snapshots y verificación de estado.  
**Exports clave:**
- `adb_wait_for_device(serial, timeout)` — espera hasta 60s con spinner
- `adb_verify_connection(serial)` → 0=ok, 1=unauthorized, 2=offline
- `adb_exec_with_retry(serial, max, cmd...)` — retry automático 3 veces
- `adb_pkg_exists(serial, pkg)` — verifica si paquete existe
- `adb_pkg_is_disabled(serial, pkg)` — verifica si está desactivado
- `adb_get_prop(serial, prop)` — getprop con retry y limpieza
- `adb_take_snapshot(serial, backup_dir)` — backup completo: paquetes, settings, wm size, battery, device_info

**Portar a v7:** Todo esto se convierte en `adb_bridge.rs`. El snapshot es el `backup.rs`. Muy bien estructurado — portar función por función.

---

#### `database.sh`
**Rol:** Toda la persistencia SQLite del historial.  
**Schema actual (v6.0):**
- `devices(serial PK, model, manufacturer, android_version, hyperos_version, ram_gb, storage_gb, first_seen, last_seen, run_count, total_ram_freed_mb, total_apps_disabled, nickname)`
- `optimization_runs(id, serial, run_date, run_type, score_before, score_after, ram_before_mb, ram_after_mb, apps_disabled, apps_compiled, battery_pct, temp_celsius, duration_seconds, notes)`
- `app_state(id, serial, package_name, app_name, action, action_date, run_id)`
- `metrics_history(id, serial, recorded_at, ram_used_pct, cpu_load_pct, temp_celsius, battery_pct, disabled_apps_count, storage_used_pct)`

**Exports clave:** `db_init()`, `db_register_device()`, `db_start_run()`, `db_end_run()`, `db_log_app_action()`, `db_record_metrics()`, `db_get_last_run()`, `db_get_device_history()`, `db_check_maintenance_due()`, `db_get_stats_summary()`, `db_detect_ota_regressions()`, `db_get_nickname()`

**Diferencia con schema v7:** El CLAUDE.md define un schema más completo (`tweaks_applied`, `ota_events`, `benchmarks`, `backups`). Migrar extendiendo las tablas actuales.

---

#### `device_profile.sh`
**Rol:** Detección, selección y validación del dispositivo ADB.  
**Exports clave:**
- Variables globales: `DEVICE_SERIAL`, `DEVICE_MODEL`, `DEVICE_MFR`, `DEVICE_ANDROID`, `DEVICE_HYPEROS`, `DEVICE_RAM_GB`, `DEVICE_STORAGE_GB`, `DEVICE_BATTERY_PCT`, `DEVICE_TEMP_C`, `DEVICE_SERIAL_MASKED`
- `device_detect_all()` — lista todos los dispositivos conectados
- `device_select(serials[])` — auto si 1, menú si 2+
- `device_read_info(serial)` — lee y exporta todas las variables globales
- `device_validate_compatibility()` — verifica Xiaomi/Redmi, autorización, Android 14+
- `device_keepalive_enable/disable()` — pantalla siempre encendida durante la sesión

**Portar a v7:** Estas variables globales Bash se convierten en el struct `DeviceInfo` en `adb_bridge.rs`, con el selector de dispositivos en el frontend React (`DeviceSelector.tsx`).

---

#### `display.sh`
**Rol:** Dashboard terminal con `tput` — 3 paneles + log scrolleable.  
**Exports clave:**
- `display_init()`, `display_cleanup()` — buffer de pantalla con tput
- `display_draw_frame()` — dibuja el layout completo
- `display_update_metrics(cpu, ram, temp, batt, disk)` — panel izquierdo
- `display_update_progress(step, total, phase, apps_ok, apps_total)` — panel central
- `display_update_history()` — panel derecho desde DB
- `display_add_log(msg, type)` — log scrolleable (últimas 8 líneas)
- `display_show_completion_screen(...)` — resultados finales
- `display_show_device_selector(devs[])` — menú de selección

**Portar a v7:** REEMPLAZADO completamente por el cockpit React/Tauri. El layout del dashboard terminal (3 paneles) es la inspiración directa del `Cockpit.tsx`. No reutilizar el código Bash.

---

### ENGINES — Motores de optimización (`src/cli/engines/`)

#### `bloatware.sh`
**Rol:** Desactivación granular de paquetes por perfil.  
**Exports clave:**
- `bloatware_run(profile_name, run_id)` → count de apps nuevas desactivadas
- `bloatware_detect_regressions()` → lista de paquetes reactivados por OTA
- `bloatware_fix_regressions(run_id)` → re-desactiva los que volvieron
- `bloatware_restore_all()` → reactiva TODOS los paquetes desactivados
- `bloatware_get_count()` → número actual de apps desactivadas
- Depende de: `data/bloatware_db.sh` (⚠️ no existe — ver Bug 2)

**Portar a v7:** La lógica de `detect_regressions` es el núcleo del `ota_watch.rs`. `restore_all` → modo emergencia. Invocar desde Rust con `std::process::Command`.

---

#### `performance.sh`
**Rol:** Tweaks de GPU, animaciones, resolución, dexopt y performance mode.  
**Exports clave:**
- `performance_apply_poco_mode(run_id)` → aplica 13 bloques de tweaks, retorna apps compiladas
- `performance_calculate_score()` → score 0-100 basado en estado actual
- `performance_restore_defaults()` → revierte todo a fábrica

**Tweaks aplicados (Poco Mode):**
1. Animaciones `0.3x` (window + transition + animator)
2. GPU: `force_gpu_rendering=1`, `force_msaa=1`, `debug.hwui.renderer=skiavk`, draw_defer=true, draw_reorder=true
3. Touch: pointer_speed=5, blur desactivado, haptic_intensity=1
4. Refresh rate: peak=90Hz, min=60Hz
5. Performance mode: `cmd power set-fixed-performance-mode-enabled true`
6. Font scale: 0.9
7. Brillo: manual (screen_brightness_mode=0)
8. Efectos visuales HyperOS: reducidos
9. Background: `max_cached_processes=96`, settle_time=60s
10. BT/NFC/WiFi scanning: desactivados
11. Resolución: `612x1360 @ 260dpi`
12. Dexopt sistema: speed-profile para `SYSTEM_APPS_COMPILE`
13. Dexopt terceros: speed-profile para todas las user apps + bg-dexopt-job

**Portar a v7:** Cada bloque → un `Tweak` struct en `profiles.rs` con `apply_cmd` y `revert_cmd`. El score → `performance_calculate_score()` se porta a Rust.

---

#### `memory.sh`
**Rol:** Optimización de RAM, swap, LMK y cache.  
**Exports clave:**
- `memory_apply_optimization(run_id)` → aplica swappiness, LMK, Dalvik, HWUI, Memory Extension HyperOS
- `memory_get_stats()` → exporta `MEMORY_TOTAL_MB`, `MEMORY_AVAIL_MB`, `MEMORY_USED_MB`, `MEMORY_USED_PCT`, swap
- `memory_kill_heavy_apps()` → force-stop de `HEAVY_APPS[]`, retorna count
- `memory_clean_cache()` → trim-caches 2G, thumbnails, temp files, ANR, tombstones, retorna MB liberados
- `memory_restore_defaults()` → elimina todos los settings de memoria

**Tweaks aplicados:**
- `sys_swappiness=20`
- `lmk_minfree_levels=LMK_PERFORMANCE`
- `max_cached_processes=96`
- `dalvik_vm_heapsize=512m`, `heapgrowthlimit=256m`
- `hwui_texture_cache_size=128`, `hwui_layer_cache_size=80`
- `miui_memory_expand_enable=1`, `memory_expand_size=4096` (Memory Extension HyperOS 3)

**Portar a v7:** Memory Extension HyperOS es un tweak específico para verificar en HyperOS 3 — marcar como `NEEDS_RESEARCH` para confirmar que el setting name no cambió en HyperOS 3.

---

#### `camera_fix.sh`
**Rol:** Fix crítico de cámara + WhatsApp (compilación speed + pre-carga).  
**Exports clave:**
- `camera_fix_apply(run_id)` → 11 pasos, retorna total compiladas
- `camera_fix_verify()` → retorna 0=nada, 1=solo cámara, 2=solo WA, 3=ambos

**Pasos aplicados:**
1. Compilar cámara y multimedia (speed mode)
2. Limpiar thumbnails si > 50 archivos
3. Desactivar AI scene detection, watermark, mirror
4. Force-stop cámara para estado limpio
5. Pre-calentar cámara (am start + HOME)
6. Desactivar media scanner temporalmente
7. Detectar y compilar TODOS los WhatsApp instalados (speed)
8. Limpiar cache de WhatsApp
9. Compilar share sheet + contactos + teclado (speed)
10. Pre-cargar WhatsApp en memoria
11. Reactivar media scanner (SIEMPRE)

**Portar a v7:** Este módulo es candidato a ser invocado directamente como script legacy desde Rust. La lógica de detección de múltiples versiones de WhatsApp es importante conservar.

---

#### `network.sh`
**Rol:** Optimizaciones DNS y TCP.  
**Exports clave:**
- `network_apply_optimization(run_id)` → aplica DNS, TCP, WiFi, roaming, scoring, captive portal
- `network_restore_defaults()` → revierte
- `network_get_stats()` → exporta `NETWORK_WIFI_STATE`, `NETWORK_SIGNAL`, `NETWORK_DNS_VALIDITY`

**Tweaks:** `dns_resolver_sample_validity_seconds=600`, `dns_resolver_min_samples=1`, `tcp_default_init_rwnd=12`, `wifi_scan_always_enabled=0`, `wifi_sleep_policy=2`, `data_roaming=0`, `network_scoring_ui_enabled=0`, `captive_portal_mode=0`

---

#### `thermal.sh`
**Rol:** Guard térmico + performance mode.  
**Exports clave:**
- `thermal_check()` → lee temperatura en °C, exporta `DEVICE_TEMP_C`, `DEVICE_TEMP_STATUS`
- `thermal_gate_check()` → retorna 0=OK, 1=BLOQUEADO si > 42°C
- `thermal_apply_performance()` → activa performance mode + 90Hz (sin tocar joyose)
- `thermal_restore()` → desactiva performance mode

**Nota crítica:** El comentario en el archivo explícitamente documenta: "com.xiaomi.joyose NO se toca NUNCA. Confirmado: XDA Forums + GitHub mcxiaoke gist (2025-2026)."

**Portar a v7:** `thermal_gate_check()` → guardrail en `adb_bridge.rs` que se ejecuta antes de cualquier comando. Bloqueante, no bypaseable desde UI.

---

### MODES — Orquestadores (`src/cli/modes/`)

#### `full_optimize.sh`
**Rol:** Optimización completa Poco Mode. 9 fases.  
**Flujo:**
1. `thermal_gate_check()` — aborta si > 42°C
2. Score inicial + RAM inicial
3. Dashboard init (si terminal >= 80 cols)
4. `adb_take_snapshot()` — backup automático
5. `bloatware_run(PROFILE_POCO_MODE)` — bloatware
6. `performance_apply_poco_mode()` + `thermal_apply_performance()` + `network_apply_optimization()`
7. `camera_fix_apply()`
8. `memory_apply_optimization()` + `memory_clean_cache()` + `memory_kill_heavy_apps()`
9. Verificación post + score final + `db_end_run()`
10. Reboot con espera de reconexión (máx 3 min)
11. Pantalla de resultados

**Portar a v7:** Esta secuencia define el `PocoMode` profile en `profiles.rs`. Cada fase es una `TweakGroup` con nombre, descripción y progreso. La UI muestra el progreso de cada fase.

---

#### `maintenance.sh`
**Rol:** Mantenimiento semanal. < 5 min. Sin backup completo.  
**Flujo:**
1. `thermal_gate_check()`
2. `bloatware_fix_regressions()` — detecta y corrige OTA
3. `memory_clean_cache()`
4. `memory_kill_heavy_apps()`
5. `camera_fix_apply()` — re-compila cámara y WA

**Portar a v7:** El ciclo de 7 días + detección de OTA es la base del `ota_watch.rs`. La UI debe notificar cuando corresponde el mantenimiento.

---

#### `monitor.sh`
**Rol:** Monitoreo en tiempo real. Loop de 3s. Guarda en DB cada 15s. Ctrl+C para salir.  
**Métricas:** CPU (load avg), RAM (MemAvailable), temperatura (dumpsys battery), batería, almacenamiento (/data), apps desactivadas, score.  
**Top procesos:** cada 5 iteraciones lista los top 3 por RSS.

**Portar a v7:** El loop de 3s se convierte en el `telemetry` loop Rust de 1s que emite eventos al frontend via Tauri events. Mucho más eficiente que polling Bash.

---

#### `emergency.sh`
**Rol:** Restauración total. 8 pasos. Reversión a estado de fábrica.  
**Pasos:**
1. `bloatware_restore_all()` — reactiva TODOS los paquetes
2. `performance_restore_defaults()` — animaciones, GPU a defaults
3. `wm size reset + wm density reset` — resolución nativa
4. `network_restore_defaults()`
5. `memory_restore_defaults()`
6. `thermal_restore()` — desactiva performance mode
7. Restaurar pantalla, notificaciones, BT/NFC/WiFi, roaming, captive portal, auto_time
8. Reparar permisos SystemUI

**Portar a v7:** El botón rojo en el cockpit invoca el `EmergencyMode` en Rust que ejecuta estas operaciones. Criterio de aceptación: < 120s desde click hasta completado.

---

### TOOLS — Utilidades standalone (`src/cli/tools/` + raíz)

#### `benchmark.sh`
**Rol:** Benchmark completo de 10 secciones. Ejecutar antes y después de optimizar.  
**Secciones:** 1. Info dispositivo, 2. CPU (bench + top), 3. RAM + swap, 4. Almacenamiento, 5. Batería + temperatura, 6. Apps instaladas/desactivadas, 7. Servicios y procesos, 8. Red, 9. Configuración actual, 10. Diagnóstico automático.  
**Output:** Reporte `.txt` + display terminal. Score diagnóstico con 10 checks.  
**Uso:** `./benchmark.sh [antes|despues]`

**Portar a v7:** El módulo `benchmark.rs` extrae estas 10 métricas. La UI muestra antes/después en comparativa lado a lado (Recharts para S5).

---

#### `diagnostico.sh`
**Rol:** Diagnóstico rápido del estado actual. Display terminal sin guardar.  
**Muestra:** Info dispositivo, animaciones, GPU, resolución, batería, temperatura, RAM, CPU, almacenamiento, apps desactivadas, SELinux, WiFi scanning, top apps por batería.

**Portar a v7:** Equivale a la vista principal del cockpit con datos en tiempo real. No hay código reutilizable — toda la lógica de lectura de props ya está en `telemetry.rs`.

---

#### `mega-verificar.sh`
**Rol:** Verificación de tweaks aplicados. Retorna score X/N (%).  
**Verifica:** Animaciones (0.3x), GPU+MSAA+Vulkan, resolución override, memoria (swappiness, max_cached, dalvik heap), red (DNS, TCP, WiFi scan), bloatware count, thermal_limit, refresh rate, RAM actual.

**Portar a v7:** Se convierte en la función `verify_profile()` en `profiles.rs`. El score de 0-100 ya es `performance_calculate_score()` en `performance.sh`.

---

#### `optimize-boot.sh`
**Rol:** Optimización de arranque. Dexopt apps críticas + desactivar boot receivers.  
**⚠️ BUG CRÍTICO:** Incluye `com.xiaomi.joyose` en su lista `BOOT_APPS` → NUNCA importar esta lista directamente.  
**Uso:** `./optimize-boot.sh [--dry-run]`

**Portar a v7:** Las apps en `BOOT_APPS` (menos `com.xiaomi.joyose`) → perfil "Boot Optimizer" en v7. La lista de `CRITICAL_APPS` para dexopt es complementaria a `SYSTEM_APPS_COMPILE` de `config.sh`.

---

#### `measure-boot.sh`
**Rol:** Mide tiempo de arranque. Lee `ro.boottime.init`, `/proc/uptime`, compara con medición anterior.  
**Guarda:** `logs/boot-times.log` con historial acumulativo.

**Portar a v7:** Integrar en `benchmark.rs`. El log histórico → tabla `benchmarks` en SQLite con `kind="boot_time"`.

---

#### `log-apply.sh`
**Rol:** Registra qué perfil se aplicó y cuándo en `apply-history.log`.  
**Uso:** `./log-apply.sh <perfil> [detalles]` | `./log-apply.sh --show`

**Portar a v7:** Reemplazado por la tabla `runs` en SQLite. No necesario en v7.

---

#### `ruta-optima.sh`
**Rol:** Script de versión v5.0 que auto-selecciona perfil (batería/rendimiento/equilibrado) y aplica optimización autónoma.  
**⚠️ OBSOLETO:** Referencias a `perfil-bateria.sh`, `perfil-rendimiento.sh`, `perfil-equilibrado.sh`, `tweaks-smooth.sh` que no existen en v6.0.  
**Status:** No funcional como está. Solo el flujo de selección automática es interesante para v7.

**Portar a v7:** La lógica de auto-selección de perfil (batería < 40% → ahorro, RAM > 75% → rendimiento) → heurística en Rust para sugerencia automática del perfil. El LLM Ollama la complementa.

---

#### `test-verificacion.sh` / `restore.sh`
**`test-verificacion.sh`** — Verificación más detallada que `mega-verificar.sh`. Tiene secciones por dominio (animaciones, GPU, resolución, bloatware con apps específicas, red, memoria, batería, almacenamiento, rescue points, SELinux). Formato PASS/FAIL/WARN con score. 
**`restore.sh`** — Restauración desde carpeta snapshot. Requiere ruta como argumento. Restaura animaciones, GPU, DPI/resolución, paquetes desactivados, settings, thermal. **Depende de un formato de backup legacy** (archivos individuales por tweak) que ya no coincide con el formato actual de `adb_take_snapshot()`.

**Portar a v7:** `test-verificacion.sh` → incorporar al botón "Verificar" en la UI. `restore.sh` → reemplazado por `backup.rs` en v7.

---

## Variables globales sagradas

Estas variables de `config.sh` son la referencia definitiva para v7:

```bash
# Seguridad — nunca cambiar
THERMAL_MAX_TEMP=42       # °C — abortar si se supera
BATTERY_MIN_PCT=20        # % — advertir si es menor
MAINTENANCE_INTERVAL_DAYS=7

# Poco Mode — valores probados
GAMING_RES_W=612          # override resolución
GAMING_RES_H=1360
GAMING_DPI=260
SWAPPINESS_PERFORMANCE=20
LMK_PERFORMANCE="2048,4096,8192,12288,20480,40960"
DALVIK_HEAP="512m"
DALVIK_GROWTH="256m"
HWUI_TEXTURE=128          # MB
HWUI_LAYER=80             # MB
MAX_CACHED_PROCESSES=96
ANIM_POCO_MODE="0.3"      # mínimo recomendado HyperOS 3

# Red
DNS_VALIDITY=600          # segundos
TCP_RWND=12
```

---

## Qué copiar a `scripts/legacy/` (v7)

Copiar tal cual, sin modificar:

```
scripts/legacy/
├── core/
│   ├── config.sh          ← incluye HEAVY_APPS, CRITICAL_SYSTEM_APPS
│   ├── adb_utils.sh
│   ├── database.sh
│   ├── device_profile.sh
│   └── display.sh
├── engines/
│   ├── bloatware.sh
│   ├── performance.sh     ← performance_apply_poco_mode() se invoca desde Rust
│   ├── memory.sh
│   ├── camera_fix.sh      ← candidato a invocar como script completo desde Rust
│   ├── network.sh
│   └── thermal.sh
├── modes/
│   ├── full_optimize.sh
│   ├── maintenance.sh
│   ├── monitor.sh
│   └── emergency.sh
└── tools/
    ├── benchmark.sh
    ├── diagnostico.sh
    ├── mega-verificar.sh
    ├── measure-boot.sh
    └── optimize-boot.sh   ← ⚠️ BUG com.xiaomi.joyose — NO usar la lista BOOT_APPS directamente
```

**NO copiar:** `ruta-optima.sh` (obsoleto, referencias a scripts inexistentes), `log-apply.sh` (reemplazado por SQLite), `test-verificacion.sh` (incorporado a mega-verificar), `restore.sh` (formato de backup legacy).

---

## Decisiones de arquitectura para v7

| Módulo Bash | Equivalente v7 |
|-------------|----------------|
| `config.sh::HEAVY_APPS` | JSON en `src/profiles/bloatware.json` |
| `config.sh::constantes numéricas` | Constantes Rust en `profiles.rs` |
| `adb_utils.sh` | `src-tauri/src/adb_bridge.rs` |
| `database.sh` | `tauri-plugin-sql` + schema extendido |
| `device_profile.sh` | `adb_bridge.rs` + `DeviceSelector.tsx` |
| `display.sh` | `Cockpit.tsx` + gauges React |
| `bloatware.sh` | Script legacy invocado desde `profiles.rs` |
| `performance.sh` | Tweaks en `profiles.rs` como structs |
| `memory.sh` | Script legacy invocado desde `profiles.rs` |
| `camera_fix.sh` | Script legacy invocado como proceso |
| `thermal.sh` | Guardrail en `adb_bridge.rs` |
| `monitor.sh` (loop 3s) | `telemetry.rs` (loop 1s, Tauri events) |
| `emergency.sh` | `EmergencyMode` Rust invocando scripts legacy |
| `db_detect_ota_regressions()` | `ota_watch.rs` + tabla `ota_events` |
| `benchmark.sh` | `benchmark.rs` |

---

*SCRIPTS_INVENTORY.md v1.0 — 20/05/2026*
