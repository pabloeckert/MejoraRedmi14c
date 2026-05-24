#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  🚀 PhoneOptimizer Pro v6.0 — Punto de entrada único
#
#  USO:
#    ./run.sh                   → automático (detecta qué hacer)
#    ./run.sh --full   / -f     → optimización completa
#    ./run.sh --maintenance / -s → mantenimiento semanal
#    ./run.sh --monitor  / -m   → monitoreo en tiempo real
#    ./run.sh --emergency / -e  → restaurar a fábrica
#
#  Target: Redmi 14C — HyperOS 3 / Android 16 / Helio G81 Ultra
# ═══════════════════════════════════════════════════════════════

set +e

# Verificar bash 4+
if [ "${BASH_VERSINFO[0]:-3}" -lt 4 ]; then
    echo "ERROR: Se requiere bash 4 o superior."
    echo "       En macOS: brew install bash && exec /usr/local/bin/bash $0 $*"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Cargar módulos en orden correcto ───
source "$SCRIPT_DIR/core/config.sh"
source "$SCRIPT_DIR/core/database.sh"
source "$SCRIPT_DIR/core/adb_utils.sh"
source "$SCRIPT_DIR/core/display.sh"
source "$SCRIPT_DIR/core/device_profile.sh"
source "$SCRIPT_DIR/data/bloatware_db.sh"
source "$SCRIPT_DIR/engines/bloatware.sh"
source "$SCRIPT_DIR/engines/performance.sh"
source "$SCRIPT_DIR/engines/memory.sh"
source "$SCRIPT_DIR/engines/camera_fix.sh"
source "$SCRIPT_DIR/engines/network.sh"
source "$SCRIPT_DIR/engines/thermal.sh"

# ─── Inicializar DB ───
db_init

# ─── Splash screen ───
clear
echo -e "${CYAN}${BOLD}"
cat << 'SPLASH'
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║       📱  PhoneOptimizer Pro  v6.0                          ║
  ║                                                              ║
  ║       Redmi 14C → Poco Mode  🚀                             ║
  ║       HyperOS 3 / Android 16 — Helio G81 Ultra              ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
SPLASH
echo -e "${NC}"

# ─── Verificar ADB disponible ───
if ! command -v adb &>/dev/null; then
    echo -e "${RED}  ❌ ADB no encontrado.${NC}"
    echo "     Instalá Android Platform Tools:"
    echo "     - Linux:  sudo apt install android-tools-adb"
    echo "     - macOS:  brew install android-platform-tools"
    echo "     - Windows: https://developer.android.com/tools/releases/platform-tools"
    exit 1
fi

# ─── Detectar dispositivos (hasta 60 segundos) ───
echo -e "${CYAN}  Buscando dispositivos ADB...${NC}"
WAIT=0
DEVICES=""
while [ "$WAIT" -lt 60 ]; do
    DEVICES=$(adb devices 2>/dev/null | grep -v "List of" | awk '/\tdevice$/{print $1}')
    [ -n "$DEVICES" ] && break
    printf "\r  ⏳ Esperando dispositivo... (%ds)" "$WAIT"
    sleep 2
    WAIT=$(( WAIT + 2 ))
done
echo ""

if [ -z "$DEVICES" ]; then
    echo -e "${RED}  ❌ No se encontró ningún dispositivo.${NC}"
    echo "     1. Conectá el Redmi 14C por USB"
    echo "     2. Activá Depuración USB: Ajustes → Sobre → Número de compilación (x7) → Opciones de desarrollo → Depuración USB"
    echo "     3. Aceptá el popup de depuración en el teléfono"
    exit 1
fi

# ─── Seleccionar dispositivo ───
DEVICES_ARRAY=($DEVICES)
device_select DEVICES_ARRAY

# ─── Leer info y validar ───
device_read_info "$DEVICE_SERIAL"
device_validate_compatibility

# ─── Activar keep-alive ───
device_keepalive_enable

# ─── Registrar en DB ───
db_register_device

init_log "run"

# ─── Determinar modo a ejecutar ───
MODE=""

# Flags de línea de comandos
for arg in "$@"; do
    case "$arg" in
        --emergency|-e) MODE="emergency" ;;
        --monitor|-m)   MODE="monitor"   ;;
        --maintenance|-s) MODE="maintenance" ;;
        --full|-f)      MODE="full"      ;;
        --profile|-p)   MODE="profile"   ;;
        --scan|-c)      MODE="scan"      ;;
    esac
done

if [ -z "$MODE" ]; then
    # Auto-selección basada en historial
    local_run_count=$(sqlite3 "$DB_FILE" \
        "SELECT COALESCE(run_count,0) FROM devices WHERE serial='$DEVICE_SERIAL';" 2>/dev/null || echo 0)

    if [ "${local_run_count:-0}" -eq 0 ]; then
        MODE="full"
        log_info "Primera vez con este dispositivo → Optimización completa"
    elif db_check_maintenance_due; then
        MODE="maintenance"
        LAST_RUN=$(db_get_last_run)
        log_info "Mantenimiento semanal detectado (último run: $LAST_RUN)"
    else
        # Menú interactivo
        echo ""
        echo -e "${BOLD}  ¿Qué querés hacer?${NC}"
        echo ""
        echo "    1) 🚀 Optimización completa (Poco Mode) — primera vez o re-optimizar"
        echo "    2) 🔧 Mantenimiento rápido                — regresiones OTA + cache"
        echo "    3) 📊 Monitoreo en tiempo real             — ver métricas en vivo"
        echo "    4) 🚨 Restaurar todo a fábrica             — si algo salió mal"
        echo ""
        read -rp "  Elegí [1-4] (Enter = mantenimiento): " CHOICE
        case "${CHOICE:-2}" in
            1) MODE="full"        ;;
            2) MODE="maintenance" ;;
            3) MODE="monitor"     ;;
            4) MODE="emergency"   ;;
            *) MODE="maintenance" ;;
        esac
    fi
fi

echo ""
log_info "Modo seleccionado: $MODE"
echo ""

# ─── Ejecutar el modo ───
case "$MODE" in
    full)
        source "$SCRIPT_DIR/modes/full_optimize.sh"
        mode_full_optimize
        ;;
    maintenance)
        source "$SCRIPT_DIR/modes/maintenance.sh"
        mode_maintenance
        ;;
    monitor)
        source "$SCRIPT_DIR/modes/monitor.sh"
        mode_monitor
        ;;
    emergency)
        source "$SCRIPT_DIR/modes/emergency.sh"
        mode_emergency
        ;;
    profile)
        source "$SCRIPT_DIR/modes/profile_optimize.sh"
        mode_profile_optimize
        ;;
    scan)
        source "$SCRIPT_DIR/modes/scan.sh"
        mode_scan
        ;;
esac

# ─── Cleanup final ───
device_keepalive_disable
display_cleanup 2>/dev/null

echo ""
echo -e "${GREEN}${BOLD}  ✅ PhoneOptimizer Pro completado.${NC}"
echo -e "${DIM}  Logs: $LOGS_DIR/${NC}"
echo -e "${DIM}  DB:   $DB_FILE${NC}"
echo ""
