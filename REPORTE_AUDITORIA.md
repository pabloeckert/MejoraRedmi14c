# Reporte de auditoría — MejoraRedmi14c

Fecha: 2026-09-10

Repo `C:\Github\Herramientas\MejoraRedmi14c` — remote `pabloeckert/MejoraRedmi14c`, rama `claude/mejora-redmi-14c-n984ap` (no tocada, no mergeada).

## Resumen ejecutivo

Repo sano en general, con 4 commits locales sin pushear de una sesión previa (no tocados). Se instaló `ruff` (no estaba disponible) y se aplicó autofix seguro sobre `forge/`+`src/`. Se encontró un bug real de clave duplicada en un diccionario grande de catálogo de apps, y un hallazgo de higiene (archivo de config de Claude Code trackeado en git). `vendor/adb/` (binarios oficiales de Android platform-tools, ~15 MB) está correctamente gitignoreado y justificado en `CLAUDE.md` — no se tocó.

## Hallazgos por severidad

- **Alto**: ninguno.
- **Medio** — bug real de lógica, no corregido (requiere decisión): `forge/core/packages_db.py` tiene la clave `"com.google.android.apps.youtube.music"` duplicada — línea 206 (categoría `_G`, Google) y línea 315 (categoría `_E`). En Python el segundo valor pisa silenciosamente al primero, así que YouTube Music termina categorizado como `_E` en vez de `_G`. Falta decidir cuál categoría es la correcta y borrar la entrada duplicada equivocada — no se corrigió automáticamente porque cambiar la categoría equivocada podría afectar lógica de negocio sin contexto suficiente.
- **Bajo**: `.claude/settings.local.json` está **trackeado en git** (a diferencia de MejoraPC y MejoraTCL40se, que lo gitignoran). No contiene secretos ni API keys — es solo el allowlist de permisos de Claude Code — pero expone el username de Windows (`Pablo`) y seriales de dispositivo en rutas de comandos permitidos. Riesgo bajo, pero vale decidir si sacarlo del tracking para consistencia con los otros repos del toolkit.
- **Bajo**: 42 hallazgos de `ruff` no autofixeables de forma segura (detalle abajo) — code smells reales pero requieren criterio de negocio, no son mecánicos.

## Verificaciones realizadas

- `git status`: working tree limpio salvo los cambios de `ruff --fix` aplicados en esta auditoría. 4 commits locales sin pushear de una sesión previa — no tocados.
- Búsqueda de secretos: sin resultados (ni siquiera `ANTHROPIC_API_KEY`, que se lee de variable de entorno, no hardcodeada).
- `vendor/adb/`: confirmado no trackeado, cubierto por `.gitignore`, y explícitamente documentado/justificado en `CLAUDE.md`.
- `src/cli/data/devices.db`: no trackeado (gitignoreado explícitamente por ruta exacta).
- Dependencias Python (`anthropic>=0.28.0`, `plyer>=2.1.0`): ya instaladas, confirmado.
- Se instaló `ruff` 0.16.6 (no estaba en el entorno). El repo no tiene `[tool.ruff]` en `pyproject.toml` ni `ruff.toml` — corrió con la configuración por defecto de esa versión. `py_compile` sobre todo `forge/` antes y después de los cambios: sin errores de sintaxis en ningún momento.

## Acciones tomadas

- `ruff check forge src --fix` (solo fixes seguros, sin `--unsafe-fixes`): 25 correcciones aplicadas en 6 archivos (`forge/core/adb_bridge.py`, `forge/core/app_scanner.py`, `forge/core/ota_watcher.py`, `forge/db/database.py`, `forge/services/maintenance_check.py`, `forge/services/ota_check.py`) — imports sin ordenar/sin usar, anotaciones `Optional[X]` modernizadas a `X | None`, un import deprecado. Verificado con `py_compile` que nada quedó roto. Cambios sin commitear, a revisión del usuario.

Quedan 42 hallazgos de `ruff` sin tocar (no son autofix seguro, cambian comportamiento observable):
- 17 `BLE001` (except genérico `Exception` sin especificar) — mayormente en `forge/services/ota_check.py`, patrón deliberado para no crashear el watcher, pero vale revisar si conviene loguear el error atrapado.
- 11 `PLW1510` (`subprocess.run` sin `check=` explícito) — agregar `check=False` es semánticamente neutro pero se prefirió no tocar 11 llamadas a `adb`/`fastboot` sin poder probar contra el dispositivo real.
- 10 `DTZ005` (`datetime.now()` sin timezone) — cambiar a UTC-aware podría afectar comparaciones de timestamps ya persistidos en `%LOCALAPPDATA%/RedmiForge/ota_state.json` y en la SQLite; requiere decisión sobre migración de datos existentes.
- 3 `S110` (try/except/pass) — mismo criterio que BLE001.
- 1 `F601` (el duplicado de dict ya descrito arriba).

## Pendientes que requieren decisión humana

1. `forge/core/packages_db.py` línea 206 vs 315 — decidir la categoría correcta de `com.google.android.apps.youtube.music` y borrar la entrada duplicada.
2. Decidir si sacar `.claude/settings.local.json` del tracking de git (consistencia con los otros repos del toolkit).
3. Los 42 hallazgos de `ruff` restantes — requieren revisión caso por caso, no autofix.
4. Los 4 commits locales sin pushear — decidir si pushear.
5. Cambios de `ruff --fix` sin commitear — revisar y decidir si commitear.
