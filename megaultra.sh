#!/bin/bash
# ============================================================
# ULTRA MEGA OPTIMIZER — Seguro + LOG
# ============================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/optimizer_${TIMESTAMP}.log"
mkdir -p logs

log() {
    echo "[$(date +"%H:%M:%S")] $1" | tee -a "$LOGFILE"
}

log "🚀 Iniciando ULTRA MEGA OPTIMIZER seguro..."

log "[1/8] Optimizando GPU..."
adb shell settings put global debug.hwui.renderer opengl 2>>"$LOGFILE"
adb shell setprop debug.egl.force_msaa true 2>>"$LOGFILE"
adb shell setprop debug.hwui.force_msaa true 2>>"$LOGFILE"
adb shell setprop debug.hwui.use_anisotropic_filtering true 2>>"$LOGFILE"
adb shell setprop debug.hwui.use_dithering true 2>>"$LOGFILE"

log "[2/8] Ajustando animaciones..."
adb shell settings put global window_animation_scale 0.1 2>>"$LOGFILE"
adb shell settings put global transition_animation_scale 0.1 2>>"$LOGFILE"
adb shell settings put global animator_duration_scale 0.1 2>>"$LOGFILE"

log "[3/8] Optimizando memoria..."
adb shell settings put global activity_manager_constants "max_cached_processes=64" 2>>"$LOGFILE"

log "[4/8] Optimizando red..."
adb shell settings put global wifi_scan_always_enabled 0 2>>"$LOGFILE"
adb shell settings put global captive_portal_mode 0 2>>"$LOGFILE"

log "[5/8] Limpiando sistema..."
adb shell pm trim-caches 2G 2>>"$LOGFILE"
adb shell rm -rf /sdcard/Android/data/*/cache/* 2>>"$LOGFILE"
adb shell rm -rf /sdcard/Android/media/*/cache/* 2>>"$LOGFILE"

log "[6/8] Cerrando apps pesadas..."
HEAVY_APPS=("com.facebook.katana" "com.instagram.android" "com.netflix.mediaclient")
for APP in "${HEAVY_APPS[@]}"; do
    adb shell am force-stop "$APP" 2>>"$LOGFILE"
done

log "[7/8] Compilando apps..."
adb shell cmd package bg-dexopt-job 2>>"$LOGFILE"

log "[8/8] Ajustando thermal seguro..."
adb shell setprop persist.sys.thermal.policy balanced 2>>"$LOGFILE"

log "🔥 Optimización completada."
