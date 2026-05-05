# Changelog

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
