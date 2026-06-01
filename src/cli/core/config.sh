#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Configuración Maestra v6.0
#  Compatible: HyperOS 3.0 / Android 16 / Helio G81 Ultra
#  Target: Redmi 14C (2409BRN2CL) — Latin America
# ═══════════════════════════════════════════════════════════════

readonly VERSION="6.0"
readonly PROJECT_NAME="PhoneOptimizer Pro"
readonly BUILD_DATE="2026-05"

# Directorios base — calculados relativos al script
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$SCRIPT_ROOT/data"
LOGS_DIR="$SCRIPT_ROOT/logs"
BACKUPS_DIR="$SCRIPT_ROOT/backups"
DB_FILE="$DATA_DIR/devices.db"

mkdir -p "$DATA_DIR" "$LOGS_DIR" "$BACKUPS_DIR"

# ─── Colores terminal ───
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly NC='\033[0m'

# ─── Límites de seguridad ───
readonly THERMAL_MAX_TEMP=42
readonly THERMAL_WARN_TEMP=38
readonly BATTERY_MIN_PCT=20
readonly STORAGE_WARN_PCT=85

# ─── Animaciones (HyperOS 3 — mínimo recomendado 0.3x) ───
readonly ANIM_POCO_MODE="0.3"
readonly ANIM_BALANCED="0.5"
readonly ANIM_BATTERY="0.5"
readonly ANIM_DEFAULT="1"

# ─── Resolución gaming Redmi 14C (720x1600 nativo) ───
# 85% del nativo para evitar artefactos en HyperOS 3
readonly GAMING_RES_W=612
readonly GAMING_RES_H=1360
readonly GAMING_DPI=260

# ─── Memoria ───
readonly SWAPPINESS_PERFORMANCE=20
readonly SWAPPINESS_BALANCED=40
readonly SWAPPINESS_GAMING=20
readonly MAX_CACHED_PROCESSES=96
readonly DALVIK_HEAP="512m"
readonly DALVIK_GROWTH="256m"
readonly HWUI_TEXTURE=128
readonly HWUI_LAYER=80
readonly LMK_PERFORMANCE="2048,4096,8192,12288,20480,40960"
readonly LMK_DEFAULT="1536,2048,4096,6144,10240,20480"

# ─── Red ───
readonly DNS_VALIDITY=600
readonly TCP_RWND=12

# ─── Mantenimiento ───
readonly MAINTENANCE_INTERVAL_DAYS=7

# ─── Apps del sistema a compilar con dexopt ───
SYSTEM_APPS_COMPILE=(
    "com.android.systemui"
    "com.miui.home"
    "com.android.settings"
    "com.android.phone"
    "com.android.dialer"
    "com.android.contacts"
    "com.android.mms"
    "com.android.camera"
    "com.google.android.gms"
    "com.android.vending"
    "com.miui.securitycenter"
    "com.android.filemanager"
    "com.android.launcher"
)

# ─── Apps pesadas para force-stop (lista canónica 2026) ───
HEAVY_APPS=(
    "com.facebook.katana"
    "com.facebook.stella"
    "com.instagram.android"
    "com.zhiliaoapp.musically"
    "com.google.android.youtube"
    "com.snapchat.android"
    "com.twitter.android"
    "com.spotify.music"
    "com.google.android.apps.maps"
    "com.google.android.gm"
    "com.android.chrome"
    "org.telegram.messenger"
    "com.discord"
    "com.reddit.frontpage"
    "com.pinterest"
)

# ─── Apps críticas del sistema — NUNCA desactivar ───
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
    "com.xiaomi.account"
    "com.xiaomi.joyose"     # NUNCA — gestor térmico del Helio G81 Ultra
    "com.android.stk"       # SIM Toolkit — necesario para la SIM
    "com.google.android.as.oss" # Private Compute Core
)

# ─── Funciones de logging ───
CURRENT_LOG=""

init_log() {
    local script_name="$1"
    local timestamp; timestamp=$(date +%Y%m%d_%H%M%S)
    CURRENT_LOG="$LOGS_DIR/${DEVICE_SERIAL:-unknown}_${script_name}_${timestamp}.log"
    ls -t "$LOGS_DIR/${DEVICE_SERIAL:-unknown}_${script_name}"_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
    echo "--- LOG INICIADO: $(date '+%Y-%m-%d %H:%M:%S') ---" > "$CURRENT_LOG"
    echo "Script: $script_name | Dispositivo: ${DEVICE_MODEL:-?} (${DEVICE_SERIAL:-?})" >> "$CURRENT_LOG"
    echo "------------------------------------------------" >> "$CURRENT_LOG"
}

log_raw() {
    local msg="$1"
    echo -e "$msg"
    if [ -n "$CURRENT_LOG" ]; then
        echo -e "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$CURRENT_LOG"
    fi
}

log_ok()      { log_raw "  ${GREEN}✅ $1${NC}"; }
log_warn()    { log_raw "  ${YELLOW}⚠️  $1${NC}"; }
log_fail()    { log_raw "  ${RED}❌ $1${NC}"; }
log_info()    { log_raw "  ${CYAN}→  $1${NC}"; }
log_step()    { log_raw ""; log_raw "${CYAN}${BOLD}  ━━━ $1 ━━━${NC}"; }
log_section() {
    log_raw ""
    log_raw "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
    log_raw "${BLUE}${BOLD}║  $1${NC}"
    log_raw "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
}

# ─── ADB helpers (requieren DEVICE_SERIAL definido) ───
adb_shell() {
    adb -s "$DEVICE_SERIAL" shell "$@" 2>/dev/null | tr -d '\r'
}

adb_setting_put() {
    adb_shell settings put global "$1" "$2"
}

adb_setting_put_system() {
    adb_shell settings put system "$1" "$2"
}

adb_setting_get() {
    adb_shell settings get global "$1"
}

adb_setting_get_system() {
    adb_shell settings get system "$1"
}

adb_setting_delete() {
    adb_shell settings delete global "$1"
}

# Verifica que el paquete no sea crítico antes de actuar sobre él
is_critical_pkg() {
    local pkg="$1"
    for critical in "${CRITICAL_SYSTEM_APPS[@]}"; do
        [[ "$pkg" == "$critical" ]] && return 0
    done
    return 1
}

safe_disable_pkg() {
    local pkg="$1"
    if is_critical_pkg "$pkg"; then
        log_warn "SALTADO (crítico): $pkg"
        return 1
    fi
    local out
    # Intento 1: disable-user (apps de usuario instaladas desde Play Store)
    out=$(adb -s "$DEVICE_SERIAL" shell pm disable-user --user 0 "$pkg" 2>&1 | tr -d '\r')
    if echo "$out" | grep -qi "disabled\|new state: disabled"; then
        return 0
    fi
    # Intento 2: uninstall -k para paquetes del sistema que Android 16 / HyperOS 3
    # bloquea con SecurityException: Cannot disable system packages.
    # Reversible con: pm install-existing --user 0 <pkg>
    out=$(adb -s "$DEVICE_SERIAL" shell pm uninstall -k --user 0 "$pkg" 2>&1 | tr -d '\r')
    echo "$out" | grep -qi "success" && return 0
    return 1
}

safe_uninstall_pkg() {
    local pkg="$1"
    if is_critical_pkg "$pkg"; then
        log_warn "SALTADO (crítico): $pkg"
        return 1
    fi
    local out
    out=$(adb -s "$DEVICE_SERIAL" shell pm uninstall -k --user 0 "$pkg" 2>&1 | tr -d '\r')
    echo "$out" | grep -qi "success" && return 0
    return 1
}

safe_compile() {
    local pkg="$1"
    local mode="${2:-speed}"
    adb -s "$DEVICE_SERIAL" shell cmd package compile -m "$mode" -f "$pkg" >/dev/null 2>&1
    return $?
}
