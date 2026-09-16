# Informe de sesión — Limpieza de repo + hardening de seguridad

**Proyecto:** MejoraRedmi14c (PhoneOptimizer Pro / Redmi Forge)
**Fecha:** 14–16 de septiembre de 2026
**Rango de commits:** `b647e9a` → `13c89d4` (5 commits, 2 sesiones de trabajo)
**Estado al cierre:** ✅ Todo verificado y pusheado a `main`
**Responsable de ejecución:** Claude (chat web) + Claude Code (CLI, local)
**Solicitante:** Pablo Eckert

---

## 1. Resumen ejecutivo

El proyecto tenía tres arquitecturas viviendo en paralelo (CLI Bash en producción, UI Python/PySide6 pausada, web app pausada, más un stub Electron obsoleto), un archivo de instrucciones para otra IA (Gemini), un PR abierto de una cuarta IA (Qwen), y **un bug de seguridad activo** que podía dejar el teléfono sin protección térmica. Se ejecutó una limpieza completa más dos fixes de seguridad/estabilidad. Al cierre de la sesión se detectó y corrigió un **gap de sincronización real**: un commit de seguridad había quedado sin pushear durante la transición de herramientas (detallado en §5).

**Números finales:** 38 archivos tocados · −5.477 líneas · +196 líneas · 5 commits · 2 bugs de seguridad/estabilidad corregidos · 1 archivo de otra IA eliminado · 1 PR de otra IA pendiente de cierre manual.

---

## 2. Línea de tiempo y commits

| # | Commit | Qué hizo | Quién |
|---|--------|----------|-------|
| 1 | `8ffc6ee` | Borra `app/` (Electron), `src/web/`, `forge/ui/` + `main.py` (UI PySide6), archivo `python` vacío | Claude (chat) |
| 2 | `d659920` | Borra `GEMINI.md` (instrucciones para Google Gemini) y workflow de GitHub Actions roto que publicaba la web ya eliminada | Claude (chat) |
| 3 | `1e06c65` | `install.ps1` nuevo + corrección de referencias a la UI borrada en `setup.ps1`/`setup.bat` | Claude (chat) |
| 4 | `5cc7775` | Timeout de 90s en `safe_compile()` (antes podía colgar el script indefinidamente) + progreso por app en el loop de DEXOPT de terceros | **Claude Code** (local, contra el dispositivo real) |
| 5 | `13c89d4` | Reintegra el guardrail de `com.xiaomi.joyose` en `optimize-boot.sh`, que había quedado generado pero **sin pushear** desde la sesión de chat anterior a la migración a Claude Code | Claude (chat) |

---

## 3. Hallazgos por severidad

### 🔴 Crítico — Resuelto

**Guardrail térmico ausente en `optimize-boot.sh`** (`src/cli/tools/optimize-boot.sh`)
El script incluía `com.xiaomi.joyose` (gestor térmico del Helio G81 Ultra) en su lista de candidatos a desactivar. La función que debía protegerlo, `safe_disable_pkg()`, vive en `core/config.sh` — pero el script la cargaba con una ruta relativa incorrecta (buscaba `config.sh` en su propio directorio, `tools/`, en vez de `../core/`). El resultado: el guardrail **nunca se activaba**, y el loop de desactivación llamaba `adb shell pm disable-user` directo, sin ninguna verificación.
**Riesgo real:** si este script (distinto del `run.sh` principal) se hubiera ejecutado, el teléfono habría perdido gestión térmica activa.
**Fix:** ruta de `source` corregida con abort explícito si `config.sh` no aparece; `joyose` retirado del array de candidatos; el loop ahora pasa siempre por `safe_disable_pkg()` como defensa en profundidad.
Ya documentado como **BUG 1** en `CLAUDE.md` antes de esta sesión — quedaba pendiente de resolución.

### 🟠 Alto — Resuelto

**`safe_compile()` sin timeout** (`src/cli/core/config.sh`)
Cada llamada a `adb shell cmd package compile` podía bloquear el script entero sin límite de tiempo. Se observó en vivo durante un `run.sh --full` real: el panel quedó aparentemente detenido en "3/9, Performance, 33%" durante varios minutos. Diagnóstico por `ps -A` en el dispositivo confirmó que `dex2oat64` seguía corriendo (estado `D`, uninterruptible sleep por I/O) — no era un cuelgue, pero era indistinguible de uno sin conectarse por ADB aparte.
**Fix (Claude Code, verificado contra el dispositivo real `NB5XWCLZSGB6J74D`):** `timeout 90s` envolviendo la llamada a `adb`, con log de warning explícito en caso de timeout (exit 124). El loop de compilación de apps de terceros en `engines/performance.sh` ahora reporta progreso por app (`Compilando (n/total): paquete...`), igual que ya hacía el bloque de apps del sistema.

### 🟡 Medio — Resuelto

**Rastro de otra herramienta de IA en el repo** (`GEMINI.md`)
Archivo completo de instrucciones para que Google Gemini trabajara sobre este repo, duplicando el propósito de `CLAUDE.md`. Eliminado a pedido explícito del usuario ("solo trabajo con el dev IA de Claude").

**PR #8 abierto por otra IA — pendiente de acción manual**
`github.com/pabloeckert/MejoraRedmi14c/pull/8`, creado por **"qwen-chat coder"** (Qwen/Alibaba) el 18 de mayo de 2026. Toca `.gitignore`, `CLAUDE.md`, `README.md`; referencia `src/web/` y `QUICKSTART.md`, ambos ya inexistentes tras esta limpieza. Entraría en conflicto directo si se mergeara.
**Estado:** no se pudo cerrar automáticamente (`gh` CLI no estaba instalada en la máquina local). Instrucciones de cierre manual entregadas al usuario. **Sigue abierto al cierre de este informe — acción pendiente del lado del usuario.**

### 🟢 Bajo — Resuelto

- 12 rutas hardcodeadas a `C:\Users\Pablo\...` en `.claude/settings.local.json`, corregidas a `C:\Users\tabeg\...` (usuario real de la máquina tras reinstalación limpia de Windows)
- `setup.ps1` no avisaba si faltaba `ANTHROPIC_API_KEY` (usada por `app_scanner.py` para clasificar apps desconocidas vía Claude Haiku) — agregado aviso no bloqueante
- Mención de "Resolución 612x1360 @ 260dpi" en `README.md`, ya marcada como "MUERTO en Android 16" en `CLAUDE.md` pero no corregida ahí — alineada
- Referencias colgantes a la UI borrada en `CLAUDE.md`, `GEMINI.md` (antes de borrarlo) y `README.md`

### Arquitectura consolidada

Antes de esta sesión coexistían **tres implementaciones completas** del mismo producto:
1. `src/cli/` — toolkit Bash, en producción real ✅ (se mantiene, intacto)
2. `src/web/` — app web vía WebUSB, pausada sin mantenimiento ❌ (eliminada)
3. `forge/ui/` + `main.py` — app de escritorio Python/PySide6, pausada a propósito según el propio `CLAUDE.md` ❌ (eliminada)

Y un cuarto proyecto, ya muerto desde antes: `app/` (Electron), marcado "obsoleto, ignorar" en la documentación existente ❌ (eliminado).

**Se conservó** `forge/core/` y `forge/services/ota_check.py` (el OTA watcher headless que corre vía Task Scheduler en producción) — no dependían de la UI y estaban en uso real.

---

## 4. Verificaciones realizadas antes de cada push

- ✅ `bash -n` sobre todos los `.sh` de `src/cli/` — sintaxis limpia en cada commit
- ✅ `python3 -m py_compile` sobre todos los `.py` que quedaron en `forge/` — compilación limpia
- ✅ JSON de `.claude/settings.local.json` validado con `json.load()` tras cada edición
- ✅ Búsqueda exhaustiva de referencias colgantes (`grep -rl`) a cada elemento borrado, en todo tipo de archivo (`.py`, `.sh`, `.md`, `.json`, `.toml`, `.txt`, `.yml`), repetida después de cada tanda de cambios
- ✅ Fix de timeout probado **contra el dispositivo físico real** (`NB5XWCLZSGB6J74D`) por Claude Code, no solo verificado por sintaxis

---

## 5. Incidente de proceso: gap de sincronización (transparencia total)

Durante la sesión se migró el trabajo del chat web a **Claude Code** (instalado localmente por el usuario) para poder iterar directo contra el dispositivo. En esa transición, un commit ya generado en el chat web (`8f4b2d3`, con el fix del guardrail de `joyose` + rutas de usuario + aviso de API key) **nunca llegó a pushearse** — quedó en un clon local del chat, mientras Claude Code partía de un estado anterior (`1e06c65`) y agregaba su propio commit (`5cc7775`) encima.

**Cómo se detectó:** al retomar la sesión de chat después del trabajo de Claude Code, se hizo `git fetch` + verificación directa del contenido de `origin/main` (no solo del log de commits) antes de asumir que todo estaba sincronizado. La verificación mostró que `optimize-boot.sh` en GitHub todavía tenía la ruta de `source` rota — el bug crítico de §3 **había estado "resuelto" solo localmente, nunca en producción real**, durante aproximadamente 2 horas de reloj.

**Cómo se corrigió:** se extrajo el diff puntual del commit huérfano (4 archivos, sin overlap con lo tocado por Claude Code), se verificó que aplicaba limpio sobre el `origin/main` actualizado, y se re-commiteó como `13c89d4` con atribución explícita de por qué existe este commit "extra".

**Lección de proceso:** cuando dos sesiones/herramientas distintas trabajan sobre el mismo repo en paralelo o en secuencia, el log de commits local no es evidencia suficiente de que algo está en producción — hay que verificar contra el remoto directamente.

---

## 6. Estado final del repo

```
src/cli/                  ✅ Producción — intacto, ahora con guardrails reales
forge/core/                ✅ Funcional — sin cambios
forge/services/ota_check.py ✅ Producción (Task Scheduler) — sin cambios
forge/ui/                  ⛔ Eliminado
src/web/                   ⛔ Eliminado
app/ (Electron)             ⛔ Eliminado
GEMINI.md                  ⛔ Eliminado
.github/workflows/deploy.yml ⛔ Eliminado (publicaba src/web/, roto tras la limpieza)
```

## 7. Pendientes abiertos (acción del usuario)

| Ítem | Acción requerida | Bloqueante |
|------|-------------------|------------|
| PR #8 (qwen-chat coder) | Cerrar manualmente en GitHub sin mergear | No, pero recomendado antes de que alguien lo mergee por error |
| Verificación de campo del fix de timeout | Correr `run.sh --full` o `--maintenance` completo contra el dispositivo y confirmar que el panel muestra progreso en la fase de DEXOPT de terceros | No |
| Encoding de `—` en logs | Cosmético, aparece como `Ã¢â‚¬â€` en algunas terminales por mismatch UTF-8 | No |

---

*Informe generado documentando el estado real verificado contra GitHub al cierre de la sesión, no solo el historial de intenciones.*
