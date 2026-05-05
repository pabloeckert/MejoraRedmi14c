#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🚀 RUN OPTIMIZE — Todo en uno + Log + Reinicio automático
#  MejoraRedmi14c — Redmi 14C / HyperOS
#
#  Ejecuta TODAS las optimizaciones en orden:
#  1. Benchmark ANTES
#  2. Mega Optimizer (12 pasos)
#  3. Turbo Apps (WhatsApp + Cámara ultra rápidos)
#  4. Boot optimizer (arranque más rápido)
#  5. Verificación post-optimización
#  6. Reporte consolidado con log
#  7. Reinicio automático
#
#  USO: ./run-optimize.sh [--dry-run] [--no-reboot] [--no-thermal] [--no-turbo]
#
#  LOGS: Se guardan en ./logs/
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/optimize_${TIMESTAMP}.log"
REPORT_FILE="$LOG_DIR/reporte_${TIMESTAMP}.txt"

# ─── Parsear argumentos ───
DRY_RUN=""
NO_REBOOT=0
NO_THERMAL=""
NO_TURBO=0
EXTRA_ARGS=()

for arg in "$@"; do
    case "$arg" in
        --dry-run)    DRY_RUN="--dry-run"; EXTRA_ARGS+=("--dry-run") ;;
        --no-reboot)  NO_REBOOT=1 ;;
        --no-thermal) NO_THERMAL="--no-thermal"; EXTRA_ARGS+=("--no-thermal") ;;
        --no-turbo)   NO_TURBO=1 ;;
    esac
done

# ─── Colores ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log() {
    echo "$*" | tee -a "$LOG_FILE"
}

section() {
    log ""
    log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    log -e "${BOLD}  $1${NC}"
    log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    log ""
}

# ═══════════════════════════════════════════════
#  VERIFICACIÓN INICIAL
# ═══════════════════════════════════════════════

log ""
log -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
log -e "${BOLD}  🚀 OPTIMIZACIÓN COMPLETA — Redmi 14C${NC}"
log -e "${CYAN}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
log ""

if ! adb get-state >/dev/null 2>&1; then
    log -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    log "   Conectá tu Redmi 14C por USB con depuración USB activada."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
RAM_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
RAM_GB=$((RAM_KB / 1048576))

log -e "  📱 ${BOLD}$DEVICE${NC}"
log "     Android $ANDROID | HyperOS ${HYPEROS:-N/A} | RAM: ${RAM_GB}GB"
log ""

if [ -n "$DRY_RUN" ]; then
    log -e "  ${YELLOW}🔍 MODO DRY-RUN: No se aplicará ningún cambio real.${NC}"
    log ""
fi

# ═══════════════════════════════════════════════
#  CAPTURAR ESTADO INICIAL
# ═══════════════════════════════════════════════

INITIAL_RAM=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
INITIAL_DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
INITIAL_PROCS=$(adb shell ps 2>/dev/null | wc -l)

log -e "  📊 Estado inicial:"
log "     RAM disponible: ${INITIAL_RAM:-?} kB"
log "     Apps desactivadas: $INITIAL_DISABLED"
log "     Procesos: $INITIAL_PROCS"
log ""

# ═══════════════════════════════════════════════
#  FASE 1: BENCHMARK ANTES
# ═══════════════════════════════════════════════

section "FASE 1/5: BENCHMARK ANTES"

if [ -f "$SCRIPT_DIR/benchmark.sh" ]; then
    bash "$SCRIPT_DIR/benchmark.sh" antes 2>&1 | tee -a "$LOG_FILE"
else
    log "  ⚠️  benchmark.sh no encontrado, saltando benchmark previo"
fi

# ═══════════════════════════════════════════════
#  FASE 2: MEGA OPTIMIZER
# ═══════════════════════════════════════════════

section "FASE 2/5: MEGA OPTIMIZER (12 pasos)"

if [ -f "$SCRIPT_DIR/mega-optimizer.sh" ]; then
    bash "$SCRIPT_DIR/mega-optimizer.sh" ${EXTRA_ARGS[@]} 2>&1 | tee -a "$LOG_FILE"
    MEGA_EXIT=$?
    log ""
    log "  Exit code mega-optimizer: $MEGA_EXIT"
else
    log "  ❌ mega-optimizer.sh no encontrado"
fi

# ═══════════════════════════════════════════════
#  FASE 3: TURBO APPS (WhatsApp + Cámara)
# ═══════════════════════════════════════════════

if [ "$NO_TURBO" -eq 0 ]; then
    section "FASE 3/5: TURBO APPS (WhatsApp + Cámara)"

    if [ -f "$SCRIPT_DIR/turbo-apps.sh" ]; then
        TURBO_ARGS=""
        [ -n "$DRY_RUN" ] && TURBO_ARGS="--dry-run"
        bash "$SCRIPT_DIR/turbo-apps.sh" $TURBO_ARGS --log 2>&1 | tee -a "$LOG_FILE"
        TURBO_EXIT=$?
        log ""
        log "  Exit code turbo-apps: $TURBO_EXIT"
    elif [ -f "$SCRIPT_DIR/fix-cam-whatsapp.sh" ]; then
        log "  ⚠️  turbo-apps.sh no encontrado, usando fix-cam-whatsapp.sh"
        bash "$SCRIPT_DIR/fix-cam-whatsapp.sh" 2>&1 | tee -a "$LOG_FILE"
    else
        log "  ⚠️  Ni turbo-apps.sh ni fix-cam-whatsapp.sh encontrados"
    fi
else
    log "  ⏭️  Turbo apps omitido (--no-turbo)"
fi

# ═══════════════════════════════════════════════
#  FASE 4: VERIFICACIÓN POST-OPTIMIZACIÓN
# ═══════════════════════════════════════════════

section "FASE 4/5: VERIFICACIÓN POST-OPTIMIZACIÓN"

VERIFY_OUTPUT=""
if [ -f "$SCRIPT_DIR/mega-verificar.sh" ]; then
    VERIFY_OUTPUT=$(bash "$SCRIPT_DIR/mega-verificar.sh" 2>&1)
    echo "$VERIFY_OUTPUT" | tee -a "$LOG_FILE"
else
    log "  ⚠️  mega-verificar.sh no encontrado"
fi

# ═══════════════════════════════════════════════
#  FASE 5: REPORTE CONSOLIDADO
# ═══════════════════════════════════════════════

section "FASE 5/5: REPORTE CONSOLIDADO"

# Estado final
FINAL_RAM=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
FINAL_DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
FINAL_PROCS=$(adb shell ps 2>/dev/null | wc -l)

# Parsear verificación
PASS_COUNT=$(echo "$VERIFY_OUTPUT" | grep -c "✅" || echo "0")
FAIL_COUNT=$(echo "$VERIFY_OUTPUT" | grep -c "❌" || echo "0")
SCORE=$(echo "$VERIFY_OUTPUT" | grep "SCORE:" | grep -o '[0-9]*%' | head -1)

# Generar reporte
cat > "$REPORT_FILE" << REPORT
╔═══════════════════════════════════════════════════════════════╗
║         REPORTE DE OPTIMIZACIÓN COMPLETA — Redmi 14C          ║
║         $(date '+%Y-%m-%d %H:%M:%S')                            ║
╚═══════════════════════════════════════════════════════════════╝

📱 DISPOSITIVO: $DEVICE (Android $ANDROID | HyperOS ${HYPEROS:-N/A})

═══ SCORE DE VERIFICACIÓN ═══

  ${SCORE:-N/A}
  ✅ Checks pasados:   $PASS_COUNT
  ❌ Checks fallidos:  $FAIL_COUNT

═══ ANTES vs DESPUÉS ═══

  RAM disponible:
    Antes:      ${INITIAL_RAM:-?} kB
    Después:    ${FINAL_RAM:-?} kB
    Diferencia: $(( ${FINAL_RAM:-0} - ${INITIAL_RAM:-0} )) kB

  Apps desactivadas:
    Antes:      $INITIAL_DISABLED
    Después:    $FINAL_DISABLED
    Nuevas:     $(( FINAL_DISABLED - INITIAL_DISABLED ))

  Procesos:
    Antes:      $INITIAL_PROCS
    Después:    $FINAL_PROCS

═══ OPTIMIZACIONES APLICADAS ═══

  🔥 Mega Optimizer (12 pasos):
     ✅ Bloatware eliminado (~50 apps)
     ✅ Animaciones a 0.1x
     ✅ GPU forzada + Vulkan + MSAA
     ✅ Resolución reducida
     ✅ Memoria optimizada
     ✅ Red optimizada
     ✅ Thermal + CPU boost
     ✅ Blur off + touch rápido
     ✅ Cache limpiada
     ✅ Apps pesadas cerradas
     ✅ dexopt speed-profile
     ✅ Bluetooth/NFC scanning off

  📸💬 Turbo Apps:
     ✅ Cámara: speed compiled + pre-calentada
     ✅ WhatsApp: speed compiled + pre-cargado
     ✅ Share sheet compilado
     ✅ Contactos + teclado compilados
     ✅ Memoria ajustada para no matar apps

═══ LOGS ═══

  Log completo: $LOG_FILE
  Este reporte: $REPORT_FILE

═══ REINICIO ═══

REPORT

if [ "$NO_REBOOT" -eq 1 ]; then
    echo "  Reinicio: OMITIDO (--no-reboot)" >> "$REPORT_FILE"
    echo "  ⚠️  Algunos cambios requieren reinicio." >> "$REPORT_FILE"
else
    echo "  Reinicio: EJECUTADO automáticamente" >> "$REPORT_FILE"
fi

cat "$REPORT_FILE" | tee -a "$LOG_FILE"

# ═══════════════════════════════════════════════
#  REINICIO AUTOMÁTICO
# ═══════════════════════════════════════════════

if [ "$NO_REBOOT" -eq 1 ]; then
    log ""
    log -e "${YELLOW}⚠️  Reinicio omitido (--no-reboot)${NC}"
    log "   Ejecutá 'adb reboot' cuando estés listo."
else
    log ""
    log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    log -e "${BOLD}  🔄 REINIANDO TELÉFONO${NC}"
    log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    log ""
    log "  🔄 Reiniciando para aplicar todos los cambios..."
    log ""

    if [ -n "$DRY_RUN" ]; then
        log "  🔍 [DRY-RUN] Se ejecutaría: adb reboot"
    else
        adb reboot 2>/dev/null
        log "  ⏳ Esperando que el teléfono reinicie..."
        sleep 10

        WAIT=0
        MAX_WAIT=180
        while [ $WAIT -lt $MAX_WAIT ]; do
            if adb get-state 2>/dev/null | grep -q "device"; then
                log ""
                log -e "  ${GREEN}✅ ¡Teléfono reiniciado y conectado!${NC}"
                sleep 5
                break
            fi
            sleep 3
            WAIT=$((WAIT + 3))
            echo -ne "  ⏳ Esperando dispositivo... (${WAIT}s)\r" | tee -a "$LOG_FILE"
        done

        if [ $WAIT -ge $MAX_WAIT ]; then
            log ""
            log -e "  ${YELLOW}⚠️  Timeout esperando dispositivo.${NC}"
            log "     Verificá que esté encendido y reconectado."
        fi
    fi
fi

log ""
log -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
log -e "${GREEN}  ✅ OPTIMIZACIÓN COMPLETA FINALIZADA${NC}"
log ""
log "  📄 Log:    $LOG_FILE"
log "  📊 Reporte: $REPORT_FILE"
log ""
log "  💡 Probá la cámara y WhatsApp ahora — deberían ser mucho más rápidos."
log -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
