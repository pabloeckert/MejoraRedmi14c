#!/bin/bash
# ═══════════════════════════════════════════════
#  Configuración compartida — MejoraRedmi14c v5.0
#  Todos los scripts deben sourcear este archivo
# ═══════════════════════════════════════════════

VERSION="5.0"

# ─── Valores de optimización (CANON) ───
# Estos son los ÚNICOS valores válidos. No inventar otros.

# Animaciones por perfil
ANIM_RENDIMIENTO="0.3"
ANIM_EQUILIBRADO="0.5"
ANIM_BATERIA="0.5"
ANIM_GAMING="0.3"

# Memoria
SWAPPINESS_RENDIMIENTO=30
SWAPPINESS_EQUILIBRADO=60
SWAPPINESS_BATERIA=60
SWAPPINESS_GAMING=30
SWAPPINESS_FIX_CAM=20

MAX_CACHED_RENDIMIENTO=32
MAX_CACHED_EQUILIBRADO=32
MAX_CACHED_GAMING=64
MAX_CACHED_FIX_CAM=96

# LMK (Low Memory Killer)
LMK_DEFAULT="1536,2048,4096,6144,10240,20480"
LMK_AGGRESSIVE="2048,4096,8192,12288,20480,40960"

# Dalvik VM
DALVIK_HEAP="512m"
DALVIK_GROWTH="256m"

# HWUI Cache
HWUI_TEXTURE_DEFAULT=72
HWUI_LAYER_DEFAULT=48
HWUI_TEXTURE_LARGE=96
HWUI_LAYER_LARGE=64
HWUI_TEXTURE_XL=128
HWUI_LAYER_XL=80

# Red
DNS_VALIDITY=600
TCP_RWND=10

# Thermal
THERMAL_MAX_TEMP=40

# Apps pesadas para force-stop (lista canónica)
HEAVY_APPS=(
    "com.facebook.katana"
    "com.instagram.android"
    "com.zhiliaoapp.musically"
    "com.google.android.youtube"
    "com.snapchat.android"
    "com.twitter.android"
    "com.spotify.music"
    "com.whatsapp"
    "com.google.android.apps.maps"
    "com.google.android.gm"
    "com.android.chrome"
    "org.telegram.messenger"
    "com.discord"
    "com.reddit.frontpage"
    "com.pinterest"
)

# Apps críticas del sistema (NUNCA desactivar)
CRITICAL_SYSTEM_APPS=(
    "com.android.systemui"
    "com.android.settings"
    "com.android.phone"
    "com.miui.home"
    "com.android.vending"
    "com.google.android.gms"
    "com.android.dialer"
    "com.android.contacts"
    "com.android.mms"
    "com.android.camera"
)

# ─── Colores ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Configuración de Logs ───
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Función para inicializar el log en un script
# Uso: init_log "nombre-del-script"
init_log() {
    local script_name="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    CURRENT_LOG="$LOG_DIR/${script_name}_${timestamp}.log"
    
    # Rotar logs: mantener los últimos 10 de este script
    ls -t "$LOG_DIR/${script_name}"_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
    
    echo "--- LOG INICIADO: $(date '+%Y-%m-%d %H:%M:%S') ---" > "$CURRENT_LOG"
    echo "Script: $script_name" >> "$CURRENT_LOG"
    echo "Dispositivo: $(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')" >> "$CURRENT_LOG"
    echo "------------------------------------------------" >> "$CURRENT_LOG"
}

# ─── Funciones de logging comunes ───
log_raw() {
    local msg="$1"
    echo -e "$msg"
    if [ -n "$CURRENT_LOG" ]; then
        # Eliminar secuencias de escape ANSI para el archivo de log
        echo -e "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$CURRENT_LOG"
    fi
}

log_ok() { log_raw "  ${GREEN}✅ $1${NC}"; }
log_warn() { log_raw "  ${YELLOW}⚠️  $1${NC}"; }
log_fail() { log_raw "  ${RED}❌ $1${NC}"; }
log_info() { log_raw "  ${CYAN}$1${NC}"; }

log_step() {
    log_raw ""
    log_raw "${CYAN}════════════════════════════════════════════${NC}"
    log_raw "${BOLD}  $1${NC}"
    log_raw "${CYAN}════════════════════════════════════════════${NC}"
}

# ─── Función segura para settings (sin eval) ───
safe_put() {
    local key="$1"
    local value="$2"
    adb shell settings put global "$key" "$value" 2>/dev/null
}

safe_put_system() {
    local key="$1"
    local value="$2"
    adb shell settings put system "$key" "$value" 2>/dev/null
}

safe_delete() {
    local key="$1"
    adb shell settings delete global "$key" 2>/dev/null
}
