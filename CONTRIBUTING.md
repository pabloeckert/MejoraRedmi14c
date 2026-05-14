# Guía de contribución — MejoraRedmi14c

## Cómo contribuir

1. Fork del repositorio
2. Crear rama descriptiva: `git checkout -b feat/nombre-feature`
3. Hacer cambios (ver convenciones abajo)
4. Testear localmente con `--dry-run`
5. Abrir Pull Request hacia `main`

## Convenciones de código

### Bash

**Todos los scripts deben:**

```bash
# 1. Usar #!/bin/bash como shebang
#!/bin/bash

# 2. Sourcear config.sh (no declarar variables propias que ya estén ahí)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# 3. Usar set +e (los comandos adb pueden fallar en algunos dispositivos)
set +e

# 4. Usar las funciones de logging de config.sh
log_ok "Operación exitosa"
log_warn "Advertencia"
log_fail "Error"
log_info "Información"

# 5. Usar safe_put() para settings globales
safe_put "window_animation_scale" "0.3"         # global
safe_put_system "screen_brightness_mode" "1"     # system

# 6. Citar variables siempre: "$VAR" no $VAR
# 7. Citar arrays siempre: "${array[@]}" no ${array[@]}
```

**No hacer:**
- Declarar `RED=`, `GREEN=`, `CYAN=`, etc. — ya están en `config.sh`
- Hardcodear valores que ya están en `config.sh` (swappiness, animaciones, etc.)
- Usar `eval`
- Escribir logs fuera de `logs/`

### Agregar un nuevo script

1. Empezar con el boilerplate de `config.sh`:

```bash
#!/bin/bash
set +e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/config.sh" ] || { echo "config.sh no encontrado"; exit 1; }
source "$SCRIPT_DIR/config.sh"
```

2. Los logs van a `logs/`:

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/mi-script_${TIMESTAMP}.log"
```

3. Agregar `chmod +x mi-script.sh` en el README y en `optimizer.sh` si corresponde.

### Agregar paquetes a bloatware-db.sh

Cada paquete usa el formato:

```bash
NOMBRE_VAR="com.paquete.app|Categoria|🟢|Descripción breve"
```

Niveles de riesgo:
- 🔴 NUNCA desactivar (sistema crítico)
- 🟡 Precaución (puede afectar funciones)
- 🟢 Seguro desactivar

Los arrays de perfiles (`SAFE_DISABLE`, `PERFORMANCE_DISABLE`, etc.) solo deben incluir paquetes 🟢.

## Valores canónicos

Todos los valores de optimización viven en `config.sh`. Al agregar tweaks nuevos:

1. Definir la constante en `config.sh`
2. Referenciarla desde el script con `$NOMBRE_CONSTANTE`
3. No hardcodear el valor en el script

## Tests

Antes de hacer PR, verificar con:

```bash
./mega-optimizer.sh --dry-run   # Ver cambios sin aplicar
./test-verificacion.sh           # Post-apply health check
shellcheck *.sh                  # Validación estática (CI lo hace automáticamente)
```

## Commits

Formato: `tipo: descripción corta en español`

Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`

Ejemplos:
- `feat: agregar soporte para Redmi Note 13`
- `fix: corregir swappiness en perfil gaming`
- `docs: actualizar TUTORIAL.md con pasos ADB en Mac`

## CI/CD

El repositorio tiene dos workflows en `.github/workflows/`:

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `shellcheck.yml` | Push/PR con cambios en `.sh` | Valida todos los scripts con ShellCheck (nivel error) |
| `deploy.yml` | Push a `main` | Deploya app web a GitHub Pages |

Un PR no debe romper ShellCheck. Si ShellCheck reporta un error legítimo, corregirlo. Si es un falso positivo, agregar `# shellcheck disable=SCxxxx` con comentario explicando por qué.
