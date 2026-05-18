#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  ⚡ BOOT OPTIMIZER — Arranque más rápido
#  MejoraRedmi14c — Redmi 14C / HyperOS
#
#  Enfocado en reducir tiempo de boot:
#  - Desactiva apps con boot receivers innecesarios
#  - Limpia cache de arranque
#  - dexopt de apps críticas del sistema
#  - Optimiza servicios que compiten al inicio
#  - Pre-compile apps de uso frecuente
#
#  USO: ./optimize-boot.sh [--dry-run]
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/config.sh" ]; then
    source "$SCRIPT_DIR/config.sh"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/boot-optimize_${TIMESTAMP}.log"

DRY_RUN=0
for arg in "$@"; do
    [ "$arg" = "--dry-run" ] && DRY_RUN=1
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

CHANGES=0

log() { echo "$*" | tee -a "$LOG_FILE"; }
ok()  { log -e "  ${GREEN}✅ $1${NC}"; CHANGES=$((CHANGES + 1)); }
warn(){ log -e "  ${YELLOW}⚠️  $1${NC}"; }
fail(){ log -e "  ${RED}❌ $1${NC}"; }

run_cmd() {
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] $*"
        return 0
    fi
    "$@"
}

safe_compile() {
    local pkg="$1"
    local mode="${2:-speed-profile}"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] compile -m $mode -f $pkg"
        return 0
    fi
    adb shell cmd package compile -m "$mode" -f "$pkg" 2>/dev/null
    return $?
}

# ═══════════════════════════════════════════════
#  VERIFICACIÓN
# ═══════════════════════════════════════════════

log ""
log -e "${BOLD}⚡ BOOT OPTIMIZER — Arranque más rápido${NC}"
log -e "${CYAN}   $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log ""

if ! adb get-state >/dev/null 2>&1; then
    fail "No se detectó ningún dispositivo."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
log -e "  📱 ${BOLD}$DEVICE${NC} (Android $ANDROID)"
log ""

# ═══════════════════════════════════════════════
#  1. DESACTIVAR BOOT RECEIVERS INNECESARIOS
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 1. DESACTIVANDO BOOT RECEIVERS INNECESARIOS ═══${NC}"
log ""

# Apps que arrancan al boot sin necesidad
BOOT_APPS=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.daemon"
    "com.miui.hybrid"
    "com.miui.personalassistant"
    "com.mi.globalminusscreen"
    "com.miui.cloudservice"
    "com.miui.cloudbackup"
    "com.miui.micloudsync"
    "com.facebook.katana"
    "com.facebook.services"
    "com.facebook.appmanager"
    "com.facebook.system"
    "com.instagram.android"
    "com.zhiliaoapp.musically"
    "com.google.android.apps.youtube.music"
    "com.google.android.apps.wellbeing"
    "com.google.android.feedback"
    "com.netflix.mediaclient"
    "com.opera.mini.native"
    "com.amazon.appmanager"
    "com.xiaomi.joyose"
    "com.xiaomi.scanner"
    "com.xiaomi.mipicks"
    "com.xiaomi.glgm"
    "com.google.android.apps.subscriptions.red"
    "com.google.android.apps.tachyon"
    "com.google.ar.lens"
    "com.android.chrome"
)

BOOT_DISABLED=0
BOOT_ALREADY=0
for pkg in "${BOOT_APPS[@]}"; do
    # Verificar si ya está desactivado
    IS_DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "$pkg" || echo "0")
    if [ "$IS_DISABLED" -gt 0 ]; then
        BOOT_ALREADY=$((BOOT_ALREADY + 1))
        continue
    fi

    # Desactivar
    if [ "$DRY_RUN" -eq 0 ]; then
        OUT=$(adb shell pm disable-user --user 0 "$pkg" 2>&1)
        if echo "$OUT" | grep -q "disabled\|new state: disabled"; then
            ok "$pkg"
            BOOT_DISABLED=$((BOOT_DISABLED + 1))
        fi
    else
        log "  🔍 [DRY-RUN] Desactivar: $pkg"
        BOOT_DISABLED=$((BOOT_DISABLED + 1))
    fi
done

log "  📊 Desactivadas: $BOOT_DISABLED | Ya estaban: $BOOT_ALREADY"
log ""

# ═══════════════════════════════════════════════
#  2. LIMPIAR CACHE DE ARRANQUE
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 2. LIMPIANDO CACHE DE ARRANQUE ═══${NC}"
log ""

run_cmd adb shell pm trim-caches 2G 2>/dev/null
ok "Cache de sistema recortada"

# Limpiar cache de apps pesadas
for APP in com.whatsapp com.instagram.android com.facebook.katana; do
    run_cmd adb shell pm clear --cache-only "$APP" 2>/dev/null
done
ok "Cache de apps pesadas limpiada"

log ""

# ═══════════════════════════════════════════════
#  3. DEXOPT APPS CRÍTICAS DE ARRANQUE
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 3. COMPILANDO APPS CRÍTICAS (DEXOPT) ═══${NC}"
log ""

# Apps que DEBEN estar compiladas para boot rápido
CRITICAL_APPS=(
    "com.android.systemui"
    "com.miui.home"
    "com.android.settings"
    "com.android.phone"
    "com.android.dialer"
    "com.android.contacts"
    "com.android.mms"
    "com.android.launcher"
    "com.android.vending"
    "com.google.android.gms"
    "com.android.providers.media"
    "com.android.providers.contacts"
    "com.android.providers.telephony"
    "com.android.providers.settings"
    "com.android.providers.apps"
    "com.android.systemui.plugin"
)

COMPILED=0
for app in "${CRITICAL_APPS[@]}"; do
    safe_compile "$app" speed-profile
    if [ $? -eq 0 ]; then
        ok "$app"
        COMPILED=$((COMPILED + 1))
    else
        warn "$app (no se pudo compilar)"
    fi
done

log "  📊 Apps críticas compiladas: $COMPILED/${#CRITICAL_APPS[@]}"
log ""

# ═══════════════════════════════════════════════
#  4. OPTIMIZAR SERVICIOS DE ARRANQUE
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 4. OPTIMIZANDO SERVICIOS DE ARRANQUE ═══${NC}"
log ""

# Reducir procesos en cache (menos competencia al boot)
run_cmd adb shell settings put global activity_manager_constants "max_cached_processes=32"
ok "Max cached processes: 32"

# Desactivar verificación de apps en arranque
run_cmd adb shell settings put global verifier_verify_adb_installs 0
ok "Verificación ADB desactivada"

# Reducir delay de animaciones de inicio
run_cmd adb shell settings put global window_animation_scale 0.1
run_cmd adb shell settings put global transition_animation_scale 0.1
run_cmd adb shell settings put global animator_duration_scale 0.1
ok "Animaciones a 0.1x (boot se siente más rápido)"

log ""

# ═══════════════════════════════════════════════
#  5. DESACTIVAR SERVICIOS PESADOS AL INICIO
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 5. DESACTIVANDO SERVICIOS PESADOS ═══${NC}"
log ""

# Servicios que consumen RAM al inicio
HEAVY_SERVICES=(
    "com.google.android.gms/.chimera.GmsIntentOperationService"
    "com.google.android.gms/.adservices.api.AdServicesCommonService"
)

for svc in "${HEAVY_SERVICES[@]}"; do
    PKG=$(echo "$svc" | cut -d'/' -f1)
    run_cmd adb shell am force-stop "$PKG" 2>/dev/null
    ok "Detenido: $svc"
done

log ""

# ═══════════════════════════════════════════════
#  6. ESTADO FINAL
# ═══════════════════════════════════════════════

log -e "${CYAN}═══ 6. ESTADO FINAL ═══${NC}"
log ""

UPTIME=$(adb shell cat /proc/uptime 2>/dev/null | awk '{print $1}')
log "  ⏱️  Uptime actual: ${UPTIME}s"

MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
if [ -n "$MEM_AVAIL" ] && [ -n "$MEM_TOTAL" ]; then
    MEM_AVAIL_MB=$((MEM_AVAIL / 1024))
    MEM_PCT=$(( MEM_AVAIL * 100 / MEM_TOTAL ))
    log "  💾 RAM disponible: ${MEM_AVAIL_MB}MB (${MEM_PCT}% libre)"
fi

DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:")
log "  📦 Apps desactivadas: $DISABLED"

PROCS=$(adb shell ps 2>/dev/null | wc -l)
log "  ⚙️  Procesos activos: $PROCS"

log ""
log -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
log -e "${GREEN}  ⚡ BOOT OPTIMIZER COMPLETADO${NC}"
log -e "  ${GREEN}Cambios aplicados: $CHANGES${NC}"
log ""
log "  📄 Log: $LOG_FILE"
log ""
log "  ⚠️  REINICIÁ EL TELÉFONO para aplicar los cambios."
log ""

# Preguntar reboot
if [ "$DRY_RUN" -eq 0 ]; then
    read -p "  ¿Reiniciar ahora? [S/n]: " REBOOT_CONFIRM
    if [ "$REBOOT_CONFIRM" != "n" ] && [ "$REBOOT_CONFIRM" != "N" ]; then
        log "  🔄 Reiniciando..."
        adb reboot 2>/dev/null
        log "  ✅ Teléfono reiniciándose..."
    fi
fi
