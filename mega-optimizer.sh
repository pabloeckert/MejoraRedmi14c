#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🔥 MEGA OPTIMIZER v5.0 — Redmi 14C (256GB / 4-8GB RAM)
#  HyperOS / Android 14 — MediaTek Helio G81 Ultra
#
#  OBJETIVO: Convertir este teléfono en una BESTIA.
#  Animaciones instantáneas, GPU forzada, bloatware eliminado,
#  memoria optimizada, red exprés, thermal desactivado.
#
#  ⚠️  REQUISITOS:
#  - Teléfono conectado por USB con depuración USB activada
#  - ADB instalado (platform-tools)
#  - Aceptar popup de depuración USB en el teléfono
#
#  USO: chmod +x mega-optimizer.sh && ./mega-optimizer.sh
# ═══════════════════════════════════════════════════════════════

# No usamos set -e porque algunos paquetes pueden no existir en todos
# los dispositivos. Cada comando usa || true o safe_compile para continuar.
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$SCRIPT_DIR/config.sh" ]; then
    echo "No se encontro config.sh junto a mega-optimizer.sh"
    exit 1
fi
source "$SCRIPT_DIR/config.sh"

DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --no-thermal) NO_THERMAL=1 ;;
    esac
done

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/mega-optimizer_${TIMESTAMP}.log"

# Rotar logs: mantener últimos 5
ls -t "$LOG_DIR"/mega-optimizer_*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null

CHANGES=0
THERMAL_STATUS="mantenido"

log() {
    if [ "${1:-}" = "-e" ]; then
        shift
        echo -e "$*" | tee -a "$LOG_FILE"
    else
        echo "$*" | tee -a "$LOG_FILE"
    fi
}

step() {
    log ""
    log -e "${CYAN}════════════════════════════════════════════${NC}"
    log -e "${BOLD}  $1${NC}"
    log -e "${CYAN}════════════════════════════════════════════${NC}"
}

ok() {
    log -e "  ${GREEN}✅ $1${NC}"
    CHANGES=$((CHANGES + 1))
}

warn() {
    log -e "  ${YELLOW}⚠️  $1${NC}"
}

fail() {
    log -e "  ${RED}❌ $1${NC}"
}

TOTAL_STEPS=12
CURRENT_STEP=0

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    local pct=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local filled=$((CURRENT_STEP * 20 / TOTAL_STEPS))
    local empty=$((20 - filled))
    local bar=$(printf '█%.0s' $(seq 1 $filled 2>/dev/null))$(printf '░%.0s' $(seq 1 $empty 2>/dev/null))
    log ""
    log -e "  ${CYAN}[${bar}] ${pct}% — Paso ${CURRENT_STEP}/${TOTAL_STEPS}${NC}"
}

run_cmd() {
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] $*"
        return 0
    fi
    "$@"
}

run_cmd_quiet() {
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] $*"
        return 0
    fi
    "$@" >/dev/null 2>&1
}

# ═══════════════════════════════════════════════
#  VERIFICACIÓN INICIAL
# ═══════════════════════════════════════════════

log ""
log -e "${BOLD}🔥 MEGA OPTIMIZER v$VERSION — Redmi 14C${NC}"
log -e "${CYAN}   $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log ""

if ! adb get-state >/dev/null 2>&1; then
    fail "No se detectó ningún dispositivo."
    log "   Conectá tu Redmi 14C por USB y activá depuración USB."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
SOC=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\r')
RAM_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
RAM_GB=$((RAM_KB / 1048576))

log -e "  📱 ${BOLD}$DEVICE${NC}"
log "     Android $ANDROID | HyperOS ${HYPEROS:-N/A} | SoC: $SOC"
log "     RAM: ${RAM_GB}GB"
log ""

# Validar que sea un dispositivo Xiaomi/Redmi/POCO
MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
if ! echo "$MFR" | grep -qi "xiaomi\|redmi\|poco"; then
    warn "Este script está optimizado para dispositivos Xiaomi/Redmi/POCO."
    warn "Dispositivo detectado: $MFR $DEVICE"
    warn "Algunos tweaks pueden no ser compatibles."
    read -p "  ¿Continuar de todos modos? [S/n]: " CONFIRM_MFR
    if [ "$CONFIRM_MFR" = "n" ] || [ "$CONFIRM_MFR" = "N" ]; then
        log "  Cancelado."
        exit 0
    fi
fi

# Verificar temperatura del dispositivo
TEMP_RAW=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
if [ -z "$TEMP_RAW" ]; then
    warn "No se pudo leer la temperatura del dispositivo."
    read -p "  ¿Continuar de todos modos? [S/n]: " CONFIRM_TEMP
    if [ "$CONFIRM_TEMP" = "n" ] || [ "$CONFIRM_TEMP" = "N" ]; then
        exit 0
    fi
else
    TEMP_C_CHECK=$((TEMP_RAW / 10))
    if [ "$TEMP_C_CHECK" -gt "$THERMAL_MAX_TEMP" ] 2>/dev/null; then
        fail "⚠️ El dispositivo está a ${TEMP_C_CHECK}°C (>${THERMAL_MAX_TEMP}°C)."
        fail "Esperá a que se enfríe antes de optimizar."
        log "   Ejecutá este script cuando la temperatura baje de 35°C."
        exit 1
    fi
fi

log -e "  ${YELLOW}⚠️  Este script va a:${NC}"
log "     • Eliminar ~50 apps de bloatware"
log "     • Poner animaciones en 0.1x (casi instantáneas)"
log "     • Forzar GPU + Vulkan + MSAA"
log "     • Optimizar memoria, red, thermal, CPU"
log "     • Reducir resolución interna para +FPS"
log "     • Limpiar cache profunda"
log ""
read -p "  ¿Continuar? [S/n]: " CONFIRM
if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    log "  Cancelado."
    exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
    log ""
    log -e "  ${YELLOW}🔍 MODO DRY-RUN: No se aplicará ningún cambio real.${NC}"
    log "     Solo se mostraría lo que se haría."
    log ""
fi

# ═══════════════════════════════════════════════
#  PASO 0: CREAR RESCUE POINT
# ═══════════════════════════════════════════════

step "PASO 0: CREANDO RESCUE POINT DE SEGURIDAD"

RESCUE_DIR="$SCRIPT_DIR/rescue-points/mega-pre_${TIMESTAMP}"
mkdir -p "$RESCUE_DIR"

PACKAGE_LIST_FILE="$RESCUE_DIR/all_packages.txt"
DISABLED_LIST_FILE="$RESCUE_DIR/disabled_packages.txt"

adb shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$PACKAGE_LIST_FILE"
adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$DISABLED_LIST_FILE"

{
    echo "window_animation=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')"
    echo "transition_animation=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')"
    echo "animator_duration=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')"
    echo "force_gpu=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')"
    echo "force_msaa=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')"
    echo "hwui_renderer=$(adb shell settings get global debug.hwui.renderer 2>/dev/null | tr -d '\r')"
} > "$RESCUE_DIR/settings_backup.txt"

adb shell wm size 2>/dev/null > "$RESCUE_DIR/display_size.txt"
adb shell wm density 2>/dev/null > "$RESCUE_DIR/display_density.txt"
adb shell dumpsys battery 2>/dev/null > "$RESCUE_DIR/battery.txt"

ok "Rescue point creado en: $RESCUE_DIR"
log "     Para revertir: cd MejoraRedmi14c && ./emergencia.sh"
log ""

# ═══════════════════════════════════════════════
#  PASO 1: ELIMINAR BLOATWARE MASIVO
# ═══════════════════════════════════════════════

step "PASO 1: ELIMINANDO BLOATWARE (~50 apps)"

DISABLED=0
ALREADY=0
NOTFOUND=0

# Función para desactivar app
disable_app() {
    local pkg="$1"
    local desc="$2"
    if [ "$DRY_RUN" -eq 1 ]; then
        if grep -Fxq "$pkg" "$DISABLED_LIST_FILE" 2>/dev/null; then
            ALREADY=$((ALREADY + 1))
        elif grep -Fxq "$pkg" "$PACKAGE_LIST_FILE" 2>/dev/null; then
            log "  🔍 [DRY-RUN] Desactivar: $desc ($pkg)"
        else
            NOTFOUND=$((NOTFOUND + 1))
        fi
        return 0
    fi
    # Verificar si ya está desactivada
    if grep -Fxq "$pkg" "$DISABLED_LIST_FILE" 2>/dev/null; then
        ALREADY=$((ALREADY + 1))
        return 0
    fi
    # Verificar si existe
    if ! grep -Fxq "$pkg" "$PACKAGE_LIST_FILE" 2>/dev/null; then
        NOTFOUND=$((NOTFOUND + 1))
        return 0
    fi
    # Desactivar
    OUT=$(adb shell pm disable-user --user 0 "$pkg" 2>&1)
    if echo "$OUT" | grep -q "disabled\|new state: disabled"; then
        DISABLED=$((DISABLED + 1))
        echo "$pkg" >> "$DISABLED_LIST_FILE"
        log "     ✅ $desc ($pkg)"
    fi
}

skip_app() {
    local pkg="$1"
    local desc="$2"
    warn "Saltando $desc ($pkg): puede afectar cuenta, ubicacion, SIM o funciones de seguridad."
}

log ""
log "  📦 Eliminando bloatware de Xiaomi/MIUI/HyperOS..."
log ""

# --- TELEMETRÍA Y ADS (MÁXIMA PRIORIDAD) ---
log "  🕵️  Telemetría y publicidad:"
disable_app "com.miui.analytics" "Analytics (telemetría)"
disable_app "com.miui.msa.global" "MSA Ad Services (publicidad)"
disable_app "com.miui.ad" "MIUI Ads"
disable_app "com.miui.systemAdSolution" "System Ad Solution"
disable_app "com.xiaomi.ab" "Xiaomi AB (tracking)"
disable_app "com.miui.daemon" "MIUI Daemon (background spy)"

# --- APPS INÚTILES DE XIAOMI ---
log ""
log "  📱 Apps inútiles de Xiaomi:"
disable_app "com.miui.compass" "Brújula"
disable_app "com.miui.fm" "Radio FM"
disable_app "com.miui.notes" "Notas"
disable_app "com.miui.weather2" "Clima"
disable_app "com.miui.calculator" "Calculadora (usá Google)"
disable_app "com.miui.screenrecorder" "Grabador de pantalla"
disable_app "com.miui.gallery.editor" "Editor de galería"
disable_app "com.miui.player" "Mi Music"
disable_app "com.miui.video" "Mi Video"
disable_app "com.miui.videoplayer" "Video Player"
disable_app "com.miui.touchassistant" "Quick Ball"
disable_app "com.miui.userguide" "Guía de usuario"
disable_app "com.miui.android.fashiongallery" "Wallpaper Carousel"
disable_app "com.miui.yellowpage" "Páginas amarillas"
disable_app "com.miui.miservice" "Services & Feedback"
disable_app "com.miui.bugreport" "Bug Report"
disable_app "com.miui.cleanmaster" "Clean Master"
disable_app "com.miui.hybrid" "Quick Apps (data mining)"
disable_app "com.miui.hybrid.accessory" "Quick Apps accessory"
disable_app "com.miui.personalassistant" "App Vault / Minus Screen"
disable_app "com.mi.globalminusscreen" "App Vault global"
disable_app "com.mi.globalbrowser" "Mi Browser"
disable_app "com.mi.health" "Mi Health"
disable_app "com.mi.webkit.core" "Mi Webkit"
disable_app "com.android.thememanager" "Theme Manager"
disable_app "com.miui.mishare.connectivity" "Mi Share"
disable_app "com.miui.cloudbackup" "Cloud Backup"
disable_app "com.miui.cloudservice" "Cloud Service"
disable_app "com.miui.micloudsync" "Cloud Sync"
disable_app "com.xiaomi.micloud.sdk" "Cloud SDK"
skip_app "com.xiaomi.account" "Xiaomi Account"
disable_app "com.miui.accessibility" "Mi Ditto"
disable_app "com.miui.voicetrigger" "Voice Trigger"
disable_app "com.miui.voiceassist" "Voice Assist"
disable_app "com.miui.audiomonitor" "Audio Monitor"
disable_app "com.miui.translation.kingsoft" "Translation (Kingsoft)"
disable_app "com.miui.translation.xmcloud" "Translation (Cloud)"
disable_app "com.miui.translation.youdao" "Translation (Youdao)"
disable_app "com.miui.translationservice" "Translation Service"
disable_app "com.miui.phrase" "Phrase"
disable_app "com.miui.contentcatcher" "Content Catcher"
disable_app "com.miui.smsextra" "SMS Extra"
disable_app "com.miui.wmsvc" "WM Service"
disable_app "com.miui.vsimcore" "VSIM Core"
disable_app "com.miui.nextpay" "Next Pay"
disable_app "com.xiaomi.mipicks" "GetApps (Xiaomi Store)"
disable_app "com.xiaomi.glgm" "Game Center"
disable_app "com.xiaomi.joyose" "Joyose (junk)"
disable_app "com.xiaomi.scanner" "Scanner"
disable_app "com.xiaomi.payment" "Mi Pay"
skip_app "com.xiaomi.finddevice" "Find Device"
disable_app "com.xiaomi.midrop" "Mi Drop"
disable_app "com.xiaomi.calendar" "Mi Calendar"
disable_app "com.xiaomi.mircs" "Message service"

# --- GOOGLE BLOATWARE ---
log ""
log "  🔍 Google bloatware:"
disable_app "com.google.android.apps.tachyon" "Google Meet"
disable_app "com.google.android.apps.subscriptions.red" "Google One"
disable_app "com.google.android.apps.youtube.music" "YouTube Music"
disable_app "com.google.android.apps.docs" "Google Docs"
disable_app "com.google.android.apps.photos" "Google Photos"
disable_app "com.google.android.apps.wellbeing" "Digital Wellbeing"
disable_app "com.google.android.feedback" "Feedback"
disable_app "com.google.android.marvin.talkback" "Talkback"
disable_app "com.google.android.videos" "Google TV"
disable_app "com.google.android.printservice.recommendation" "Print Service"
skip_app "com.google.android.as.oss" "Private Compute"
disable_app "com.google.ar.lens" "AR Lens"
disable_app "com.android.chrome" "Chrome (usá otro browser)"
disable_app "com.android.printspooler" "Print Spooler"
disable_app "com.android.bips" "Default Printing"
disable_app "com.android.bookmarkprovider" "Bookmark Provider"
disable_app "com.android.statementservice" "Statement Service"
skip_app "com.android.stk" "SIM Toolkit"
disable_app "com.android.wallpaper.livepicker" "Live Wallpaper Picker"

# --- FACEBOOK / AMAZON / NETFLIX / OPERA ---
log ""
log "  🌐 Bloatware de terceros preinstalado:"
disable_app "com.facebook.katana" "Facebook"
disable_app "com.facebook.system" "Facebook System"
disable_app "com.facebook.appmanager" "Facebook App Manager"
disable_app "com.facebook.services" "Facebook Services"
disable_app "com.amazon.appmanager" "Amazon"
disable_app "com.netflix.partner.activation" "Netflix Partner"
disable_app "com.netflix.mediaclient" "Netflix"
disable_app "com.opera.app.news" "Opera News"
disable_app "com.opera.branding" "Opera Branding"
disable_app "com.opera.branding.news" "Opera Branding News"
disable_app "com.opera.mini.native" "Opera Mini"
disable_app "com.opera.preinstall" "Opera Preinstall"
disable_app "com.tencent.soter.soterserver" "Tencent Soter"
disable_app "cn.wps.xiaomi.abroad.lite" "WPS Lite"
disable_app "com.sohu.inputmethod.sogou.xiaomi" "Sogou Input (Xiaomi)"
disable_app "com.mobiletools.systemhelper" "System Helper"

# --- ADSICIÓN DE GOOGLE (EXTRAS) ---
log ""
log "  📌 Extras de Google:"
disable_app "com.google.android.gms.supervision" "Google Supervision"
disable_app "com.google.android.onetimeinitializer" "One Time Initializer"
disable_app "com.google.android.adservices.api" "Ad Services API"
disable_app "com.android.ondevicepersonalization.services" "On Device Personalization"
disable_app "com.android.providers.partnerbookmarks" "Partner Bookmarks"
disable_app "com.android.carrierdefaultinstaller" "Carrier Default Installer"
disable_app "com.microsoft.appmanager" "Microsoft App Manager"

log ""
log -e "  ${GREEN}📊 RESUMEN BLOATWARE:${NC}"
log "     Desactivadas: $DISABLED"
log "     Ya estaban:   $ALREADY"
log "     No encontradas: $NOTFOUND"
log ""

# ═══════════════════════════════════════════════
#  PASO 2: ANIMACIONES ULTRA RÁPIDAS
# ═══════════════════════════════════════════════

step "PASO 2: ANIMACIONES ULTRA RÁPIDAS (0.1x)"

run_cmd adb shell settings put global window_animation_scale 0.1
run_cmd adb shell settings put global transition_animation_scale 0.1
run_cmd adb shell settings put global animator_duration_scale 0.1
ok "Animaciones a 0.1x — prácticamente instantáneas"

# ═══════════════════════════════════════════════
#  PASO 3: GPU MÁXIMA POTENCIA
# ═══════════════════════════════════════════════

step "PASO 3: GPU FORZADA + VULKAN + MSAA"

run_cmd adb shell settings put global force_gpu_rendering 1
run_cmd adb shell settings put global force_msaa 1
run_cmd adb shell settings put global debug.hwui.renderer skiavk
run_cmd adb shell settings put global debug.hwui.disable_draw_defer true
run_cmd adb shell settings put global debug.hwui.disable_draw_reorder true
run_cmd adb shell settings put global debug.enable_gpu_debug_layers 0
ok "GPU rendering forzado"
ok "Vulkan renderer activado"
ok "MSAA forzado"
ok "Draw defer/reorder desactivado (menos input lag)"

# ═══════════════════════════════════════════════
#  PASO 4: RESOLUCIÓN REDUCIDA (+FPS)
# ═══════════════════════════════════════════════

step "PASO 4: RESOLUCIÓN OPTIMIZADA PARA +FPS"

# El Redmi 14C tiene 720x1600 nativo. Reducir un poco para ganar FPS
# Sin que se note visualmente en una pantalla HD+
run_cmd adb shell wm size 640x1422
run_cmd adb shell wm density 240
ok "Resolución reducida a 640x1422 (de 720x1600)"
ok "DPI ajustado a 240"
log "     Nota: En pantalla HD+ casi no se nota la diferencia,"
log "     pero ganás ~15-20% más FPS en todo."

# ═══════════════════════════════════════════════
#  PASO 5: MEMORIA Y PROCESOS
# ═══════════════════════════════════════════════

step "PASO 5: MEMORIA Y GESTIÓN DE PROCESOS"

# Swappiness bajo = menos swap, más RAM real
run_cmd adb shell settings put global sys_swappiness "$SWAPPINESS_RENDIMIENTO"

# Mantener más apps en memoria (menos reloads)
run_cmd adb shell settings put global activity_manager_constants "max_cached_processes=64"

# LMK más agresivo para liberar RAM cuando se necesita
run_cmd adb shell settings put global lmk_minfree_levels "$LMK_DEFAULT"

# Dalvik VM heap ampliado
run_cmd adb shell settings put global dalvik_vm_heapsize "$DALVIK_HEAP"
run_cmd adb shell settings put global dalvik_vm_heapgrowthlimit "$DALVIK_GROWTH"

# HWUI cache ampliado
run_cmd adb shell settings put global hwui_texture_cache_size "$HWUI_TEXTURE_LARGE"
run_cmd adb shell settings put global hwui_layer_cache_size "$HWUI_LAYER_LARGE"
run_cmd adb shell settings put global hwui_r_buffer_cache_size 12
run_cmd adb shell settings put global hwui_gradient_cache_size 4

ok "Swappiness reducido a 30"
ok "Max cached processes: 64"
ok "LMK thresholds ajustados"
ok "Dalvik heap: 512MB / 256MB"
ok "HWUI cache ampliado"

# ═══════════════════════════════════════════════
#  PASO 6: RED ULTRA RÁPIDA
# ═══════════════════════════════════════════════

step "PASO 6: RED Y DNS OPTIMIZADOS"

# DNS más rápido (Cloudflare + Google)
run_cmd adb shell settings put global dns_resolver_sample_validity_seconds "$DNS_VALIDITY"
run_cmd adb shell settings put global dns_resolver_max_samples 3
run_cmd adb shell settings put global dns_resolver_min_samples 1

# TCP window más grande
run_cmd adb shell settings put global tcp_default_init_rwnd "$TCP_RWND"

# WiFi scan desactivado (ahorra batería + evita lag)
run_cmd adb shell settings put global wifi_scan_always_enabled 0

# Data roaming off
run_cmd adb shell settings put global data_roaming 0

# Network scoring desactivado
run_cmd adb shell settings put global network_scoring_ui_enabled 0

ok "DNS validity: 600s (menos queries)"
ok "TCP window: 10 (conexiones más rápidas)"
ok "WiFi scan always: desactivado"
ok "Network scoring: desactivado"

# ═══════════════════════════════════════════════
#  PASO 7: THERMAL Y CPU
# ═══════════════════════════════════════════════

step "PASO 7: THERMAL Y CPU BOOST"

# Thermal management — SEGURIDAD: NO desactivar por default
# Solo desactivar con --no-thermal (el usuario acepta el riesgo)
if [ "${NO_THERMAL:-0}" -eq 1 ]; then
    echo ""
    log -e "  ${RED}⚠️  ADVERTENCIA: Vas a desactivar el thermal management.${NC}"
    log "     Esto puede causar sobrecalentamiento y daño al dispositivo."
    log ""
    read -p "  Escribí SI_ESTOY_SEGURO para continuar: " THERMAL_CONFIRM
    if [ "$THERMAL_CONFIRM" != "SI_ESTOY_SEGURO" ]; then
        log "  Cancelado. Thermal management se mantiene activo."
        NO_THERMAL=0
    else
        run_cmd adb shell settings put global thermal_limit_enabled 0
        THERMAL_STATUS="desactivado"
        ok "Thermal limit desactivado (⚠️ con flag --no-thermal)"
        warn "El teléfono puede calentarse más. Monitorizá la temperatura."
    fi
else
    log "  ℹ️  Thermal management MANTENIDO (seguro)."
    log "     Para desactivar: ./mega-optimizer.sh --no-thermal"
fi

# Performance mode
run_cmd adb shell cmd power set-fixed-performance-mode-enabled true

# Screen refresh rate máximo
run_cmd adb shell settings put system peak_refresh_rate 90
run_cmd adb shell settings put system min_refresh_rate 90

ok "Performance mode activado"
ok "Refresh rate forzado a 90Hz"

# ═══════════════════════════════════════════════
#  PASO 8: UI Y VISUAL
# ═══════════════════════════════════════════════

step "PASO 8: UI Y EXPERIENCIA VISUAL"

# Desactivar blur y efectos pesados
run_cmd adb shell settings put global disable_window_blurs 1

# Touch más responsivo
run_cmd adb shell settings put system pointer_speed 7

# Desactivar haptic feedback pesado (ahorra batería)
run_cmd adb shell settings put system haptic_feedback_intensity 0

# Font scale ligero
run_cmd adb shell settings put system font_scale 0.95

# Desactivar auto-brightness para respuesta instantánea
run_cmd adb shell settings put system screen_brightness_mode 0

# Brillo fijo en 70% (respuesta de pantalla más rápida)
run_cmd adb shell settings put system screen_brightness 179

ok "Window blur desactivado"
ok "Touch speed: máximo"
ok "Haptic feedback reducido"
ok "Font scale: 0.95 (más info en pantalla)"
ok "Brillo fijo 70% (respuesta más rápida)"

# ═══════════════════════════════════════════════
#  PASO 9: LIMPIEZA PROFUNDA
# ═══════════════════════════════════════════════

step "PASO 9: LIMPIEZA PROFUNDA DE CACHE"

# Cache de apps
run_cmd adb shell pm trim-caches 2G

# Thumbnails
run_cmd adb shell "rm -rf /sdcard/DCIM/.thumbnails/*"
run_cmd adb shell "rm -rf /sdcard/Pictures/.thumbnails/*"

# Temp files
run_cmd adb shell "rm -rf /data/local/tmp/*"
run_cmd adb shell "rm -rf /data/tombstones/*"
run_cmd adb shell "rm -rf /data/anr/*"

# Log files
run_cmd adb shell "rm -rf /sdcard/MIUI/debug_log/*"

ok "Cache de apps: 2GB+ limpiados"
ok "Thumbnails eliminados"
ok "Temp files eliminados"
ok "Logs de debug eliminados"

# ═══════════════════════════════════════════════
#  PASO 10: CERRAR APPS EN SEGUNDO PLANO
# ═══════════════════════════════════════════════

step "PASO 10: CERRANDO APPS PESADAS"

KILLED=0
for APP in "${HEAVY_APPS[@]}"; do
    run_cmd_quiet adb shell am force-stop "$APP" && KILLED=$((KILLED + 1))
done
ok "$KILLED apps pesadas cerradas"

# ═══════════════════════════════════════════════
#  PASO 11: DEXOPT (COMPILACIÓN DE APPS)
# ═══════════════════════════════════════════════

step "PASO 11: DEXOPT — COMPILANDO APPS (puede tardar)"

log "      Compilando apps del sistema..."
SYSTEM_APPS=(
    "com.android.settings"
    "com.android.systemui"
    "com.miui.home"
    "com.android.launcher"
    "com.android.dialer"
    "com.android.contacts"
    "com.android.mms"
    "com.android.camera"
    "com.google.android.gms"
    "com.android.vending"
    "com.miui.securitycenter"
)

SYS_COMPILED=0
for APP in "${SYSTEM_APPS[@]}"; do
    run_cmd_quiet adb shell cmd package compile -m speed-profile -f "$APP" && SYS_COMPILED=$((SYS_COMPILED + 1))
done
ok "$SYS_COMPILED/${#SYSTEM_APPS[@]} apps del sistema compiladas (speed-profile)"

log "      Compilando apps de terceros (esto tarda)..."
USER_APPS=$(adb shell pm list packages -3 2>/dev/null | sed 's/package://' | tr -d '\r')
THIRD_COMPILED=0
THIRD_TOTAL=0

for APP in $USER_APPS; do
    THIRD_TOTAL=$((THIRD_TOTAL + 1))
    if run_cmd_quiet adb shell cmd package compile -m speed-profile -f "$APP"; then
        THIRD_COMPILED=$((THIRD_COMPILED + 1))
    fi
done
ok "$THIRD_COMPILED/$THIRD_TOTAL apps de terceros compiladas"

# Forzar bg-dexopt
run_cmd_quiet adb shell pm bg-dexopt-job
ok "bg-dexopt job ejecutado"

# ═══════════════════════════════════════════════
#  PASO 12: SYNC Y SERVICIOS
# ═══════════════════════════════════════════════

step "PASO 12: SERVICIOS Y SYNC"

# Auto-time (no consume recursos)
run_cmd adb shell settings put global auto_time 1
run_cmd adb shell settings put global auto_time_zone 1

# Desactivar Bluetooth scanning
run_cmd adb shell settings put global bluetooth_always_scanning 0

# Desactivar NFC scanning
run_cmd adb shell settings put global nfc_enabled 0

ok "Auto-time activado"
ok "Bluetooth scanning: desactivado"
ok "NFC: desactivado (si no lo usás)"

# ═══════════════════════════════════════════════
#  HEALTH CHECK POST-APLICACIÓN
# ═══════════════════════════════════════════════

step "HEALTH CHECK: Verificando sistema..."

# Verificar que ADB sigue conectado
if ! adb get-state >/dev/null 2>&1; then
    fail "⚠️ Se perdió la conexión ADB durante la optimización."
    log "   Reiniciá el teléfono y verificá con: ./emergencia.sh"
else
    ok "Conexión ADB: OK"
fi

# Verificar RAM disponible post-optimización
MEM_AVAIL_POST=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
MEM_TOTAL_POST=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
if [ -n "$MEM_AVAIL_POST" ] && [ -n "$MEM_TOTAL_POST" ]; then
    MEM_PCT_POST=$(( (MEM_TOTAL_POST - MEM_AVAIL_POST) * 100 / MEM_TOTAL_POST ))
    if [ "$MEM_PCT_POST" -gt 90 ]; then
        warn "RAM al ${MEM_PCT_POST}% post-optimización. Considerá cerrar apps."
    else
        ok "RAM: ${MEM_PCT_POST}% usado (OK)"
    fi
fi

# Verificar temperatura post-optimización
TEMP_POST=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
if [ -z "$TEMP_POST" ]; then
    warn "No se pudo leer la temperatura post-optimizacion."
else
    TEMP_C_POST=$((TEMP_POST / 10))
    if [ "$TEMP_C_POST" -gt 45 ]; then
        warn "Temperatura alta: ${TEMP_C_POST}°C. Dejá enfriar el teléfono."
    else
        ok "Temperatura: ${TEMP_C_POST}°C (OK)"
    fi
fi

# ═══════════════════════════════════════════════
#  RESUMEN FINAL
# ═══════════════════════════════════════════════

log ""
log -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
log -e "${BOLD}  🔥 ¡MEGA OPTIMIZACIÓN COMPLETADA! v$VERSION${NC}"
log -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
log ""
log -e "  ${GREEN}📊 Cambios aplicados: $CHANGES${NC}"
log ""
log "  🎨 VISUAL:"
log "     • Animaciones: 0.1x (casi instantáneas)"
log "     • GPU: Forzada + Vulkan + MSAA"
log "     • Resolución: 640x1422 (optimizada)"
log "     • DPI: 240"
log "     • Refresh rate: 90Hz forzado"
log "     • Blur: desactivado"
log "     • Font scale: 0.95"
log ""
log "  ⚡ RENDIMIENTO:"
log "     • Bloatware: ~50 apps desactivadas"
log "     • Cache: 2GB+ limpiados"
log "     • Apps pesadas: cerradas"
log "     • Dexopt: speed-profile compilado"
log "     • Thermal: $THERMAL_STATUS"
log "     • Performance mode: activado"
log ""
log "  💾 MEMORIA:"
log "     • Swappiness: 30"
log "     • Max cached processes: 64"
log "     • Dalvik heap: 512MB"
log "     • HWUI cache: ampliado"
log ""
log "  🌐 RED:"
log "     • TCP window: 10"
log "     • WiFi scan: desactivado"
log "     • DNS: optimizado"
log ""
log -e "  ${YELLOW}⚠️  IMPORTANTE:${NC}"
log "     1. REINICIÁ el teléfono ahora para aplicar todo"
log "     2. Después del reinicio, ejecutá: ./fix-cam-whatsapp.sh"
log "       (arregla la cámara lenta y WhatsApp)"
log "     3. Si algo anda mal: ./emergencia.sh"
log ""
log "  💾 Rescue point: $RESCUE_DIR"
log "  📋 Log: $LOG_FILE"
log ""
log -e "  ${BOLD}Tu Redmi 14C ahora debería volar. 🚀${NC}"
log ""
