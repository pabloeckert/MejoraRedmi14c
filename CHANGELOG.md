# Changelog

## v5.1.1 (2026-05-14)

### Correcciones de código
- `config.sh`: VERSION corregida a "5.1" (era "5.0" — inconsistencia con git tag y CHANGELOG)
- `mega-optimizer.sh`: logs ahora van a `logs/` igual que `turbo-apps.sh`, `optimize-boot.sh` y `run-optimize.sh`
- `run-optimize.sh`: array expansion `${EXTRA_ARGS[@]}` → `"${EXTRA_ARGS[@]}"` (SC2068 — evita word-splitting)
- `restore.sh`: `$(cat archivo)` → `"$(cat archivo)"` en llamadas a adb (evita word-splitting en valores con espacios)
- `restore.sh`: agrega validación de existencia del directorio de backup antes de intentar leer archivos

### Calidad de código
- Eliminadas redeclaraciones redundantes de variables de color (RED/GREEN/YELLOW/CYAN/BOLD/NC) en `backup.sh`, `benchmark.sh`, `optimize-boot.sh`, `optimizer.sh`, `rapido.sh`, `ruta-optima.sh` — todas ya están definidas en `config.sh` que cada script sourcea

### CI/CD
- Nuevo workflow `.github/workflows/shellcheck.yml`: valida todos los scripts `.sh` con ShellCheck (nivel error) en push/PR a main y ramas `claude/**`

### Documentación
- `README.md`: reescrito con formato markdown correcto (tablas, code fences, estructura clara)
- Nuevo `CONTRIBUTING.md`: guía de desarrollo, convenciones, valores canónicos, flujo de PR
- `CTO_SESSION.md`: roadmap de trabajo por fases con estado de cada sesión

## v5.1 (2026-05-06)

### Arquitectura
- Archivo de configuración compartido (`config.sh`) — elimina duplicación y contradicciones
- Lista canónica de apps pesadas (`HEAVY_APPS`) compartida entre todos los scripts
- Valores de swappiness, LMK, Dalvik, HWUI centralizados en un solo lugar

### Seguridad
- Eliminado `eval` de `run_cmd()` — previene inyección de comandos
- Check de temperatura robusto: aborta si no puede leer la temperatura
- Flag `--no-thermal` requiere escribir `SI_ESTOY_SEGURO` para confirmar
- Benchmark ya NO modifica el sistema (solo mide)

### Consistencia
- Todos los scripts versionados como v5.0 via `$VERSION`
- `emergencia.sh` y `mega-restaurar.sh` consolidados en un solo script
- Perfil batería ya no desactiva auto-time (no rompe el reloj)
- Perfil gaming guarda backup de resolución en archivo (además del trap)

### Limpieza
- Eliminado `mega-restaurar.sh` (duplicaba `emergencia.sh`)
- Deploy a GitHub Pages solo incluye archivos web
- Agregada licencia MIT

## v5.0 (2026-05-06)

### Seguridad
- Thermal management: ya NO se desactiva por default. Solo se desactiva con flag `--no-thermal` y warning explícito
- Validación de modelo de dispositivo antes de ejecutar optimizaciones
- Check de temperatura: aborta si el dispositivo está a >40°C

### UX Writer
- Versión unificada en todos los archivos (v5.0)
- Link roto a TUTORIAL.md arreglado
- Nombres de scripts más descriptivos con aliases

### UX Designer
- Progress bar con pasos numerados en mega-optimizer
- Preview de perfiles antes de aplicar
- Loading state en la app web

### Backend
- Variables correctamente entrecomilladas
- Fallback para `bc` con `awk`
- Log rotation (mantiene últimos 5 logs)
- Reconnect automático en operaciones largas
- try/catch global en app.js

### QA
- Modo `--dry-run` en mega-optimizer
- Validación de precondiciones (modelo, temperatura, conexión)
- Verificación post-aplicación

### DevOps/SRE
- Post-apply health check
- Rollback automático si falla un paso
- Log de qué perfil se aplicó y cuándo
- Thermal safety check integrado
