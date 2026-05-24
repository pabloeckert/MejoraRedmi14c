# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Redmi Forge — CLAUDE.md para Claude Code

> **Repo base:** https://github.com/pabloeckert/MejoraRedmi14c  
> **Actualizado:** 24 de mayo de 2026

---

## Estado actual del proyecto

| Carpeta / archivo | Estado | Descripción |
|-------------------|--------|-------------|
| `src/cli/` | ✅ Producción | Toolkit Bash v6.0 — núcleo intocable |
| `src/web/` | ✅ Funcional | Web App alternativa (WebUSB) |
| `forge/` | ✅ Sprint 1–3 completo | UI Python/PySide6 — funcional con debloat personalizado |
| `main.py` | ✅ Funcional | Entry point de Redmi Forge |
| `SCRIPTS_INVENTORY.md` | ✅ Completo | Audit de todos los `.sh` |
| `app/profiles/` | 🔧 Reservado | JSONs de perfiles futuros (battery, gaming, default, experimental) |
| `app/` (resto) | ⛔ Obsoleto | Stub Electron — ignorar |

No avancés al siguiente sprint sin confirmación explícita.

---

## Comandos de desarrollo

```bash
# ─── Redmi Forge (UI Python) ────────────────────────────────────────────
pip install -r requirements.txt   # instalar PySide6 (una sola vez)
python main.py                    # arrancar la app

# ─── Seed de datos de desarrollo (sin dispositivo real) ─────────────────
python -m forge.dev.seed          # puebla la DB con un dispositivo ficticio

# ─── CLI Bash (núcleo — no modificar) ───────────────────────────────────
cd src/cli && ./run.sh            # auto-detección de dispositivo
cd src/cli && ./run.sh --full     # optimización completa (Poco Mode)
cd src/cli && ./run.sh --maintenance
cd src/cli && ./run.sh --monitor
cd src/cli && ./run.sh --emergency

# ─── Diagnóstico y verificación ─────────────────────────────────────────
bash src/cli/diagnostico.sh
bash src/cli/tools/mega-verificar.sh
bash src/cli/tools/benchmark.sh

# ─── Web App alternativa ─────────────────────────────────────────────────
cd src/web && python3 -m http.server 8000   # → http://localhost:8000 (WebUSB)
```

**Requisitos Redmi Forge:** Python 3.11+, PySide6 ≥ 6.7.0, ADB en PATH o en `vendor/adb/adb.exe`.  
**Requisitos CLI:** bash 4+ (WSL o Git Bash en Windows), ADB, sqlite3, dispositivo con USB debugging.  
**ADB en Windows:** la app detecta automáticamente WSL → Git Bash en ese orden. Ver `forge/core/adb_bridge.py:find_shell()`.

---

## Bugs críticos conocidos

- **BUG 1** `src/cli/tools/optimize-boot.sh:115` — lista directa que desactiva `com.xiaomi.joyose`. El guardrail en `safe_disable_pkg()` de `core/config.sh` lo previene solo si se usa esa función; la lista hardcodeada en ese archivo es peligrosa.

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

- **Modelo:** Redmi 14C (24117RK2CG)
- **SoC:** Helio G81 Ultra (MediaTek MT6769H)
- **OS:** HyperOS 3 / Android 16
- **Tweaks validados en v6.0 (NO tocar sin testear):**
  - `swappiness=20`, LMK agresivo, Dalvik + HWUI heap XL
  - Resolución `612x1360 @ 260dpi`, Animaciones `0.3x`
  - Vulkan + MSAA forzado
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
│       └── settings.py           — configuración general
│
├── Core
│   ├── forge/core/adb_bridge.py    — find_adb(), find_shell(), list_devices(),
│   │                                  get_device_info(), run_cli_script() (generator)
│   ├── forge/core/device_watcher.py — QThread: poll ADB cada 2s, emite signals
│   ├── forge/core/debloat_engine.py — build_debloat_list(), dry_run_report(),
│   │                                  write_runtime_profile() → escribe profile_runtime.sh
│   ├── forge/core/apps_catalog.py  — DEBLOAT_CATALOG, HEAVY_APPS_SET, WIZARD_APPS,
│   │                                  SAFETYNET_PROTECTED, BUSINESS_CRITICAL, WORK_INDICATOR_APPS
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

### Puente Python → Bash (clave para entender el flujo)

Cuando el usuario ejecuta "Optimizar" con un perfil guardado:

1. `debloat_engine.build_debloat_list(serial)` calcula qué packages remover según el perfil
2. `debloat_engine.write_runtime_profile()` escribe `src/cli/data/profile_runtime.sh` con el array `PROFILE_RUNTIME`
3. `adb_bridge.run_cli_script("--full", serial)` invoca `run.sh --profile` (no `--full`)
4. `run.sh` sourcea `modes/profile_optimize.sh`, que sourcea `profile_runtime.sh` y llama a `bloatware_run`
5. El output se streaming vía generator al `ExecutionScreen`

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

## Roadmap — 6 sprints

No empezar el siguiente sprint sin OK de Pablo.

| Sprint | Foco | Estado |
|--------|------|--------|
| **S1 — Foundation** | UI Python/PySide6 + cockpit + detección ADB | ✅ Completo |
| **S2 — Telemetría** | Gauges en vivo + SQLite timeseries | ✅ Funcional (DeviceWatcher + metrics) |
| **S3 — Perfiles + Bash bridge** | Wizard perfil + Poco Mode + bridge profile_runtime.sh | ✅ Completo |
| **S4 — OTA watch** | Detector fingerprint + diff tweaks + auto-heal | ⏳ Pendiente |
| **S5 — Benchmark + Histórico** | Medición pre/post + gráficos 30/90 días | ⏳ Pendiente |
| **S6 — Ollama + Release** | Integración Ollama + PyInstaller MSI + auto-update | ⏳ Pendiente |

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

*CLAUDE.md v2.0 — 24/05/2026 — MejoraRedmi14C (S1-S3 completos, próximo S4)*
