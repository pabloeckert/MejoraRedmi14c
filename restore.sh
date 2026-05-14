#!/bin/bash
# ============================================================
# RESTAURACIÓN COMPLETA — Reversión total + LOG
# ============================================================

if [ -z "$1" ]; then
    echo "Uso: ./restore.sh carpeta_snapshot"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: directorio de backup no encontrado: $BACKUP_DIR"
    exit 1
fi
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/restore_${TIMESTAMP}.log"
mkdir -p logs

log() {
    echo "[$(date +"%H:%M:%S")] $1" | tee -a "$LOGFILE"
}

log "♻ Restaurando desde $BACKUP_DIR..."

log "[1/7] Restaurando animaciones..."
adb shell settings put global window_animation_scale "$(cat "$BACKUP_DIR/03_window_scale.txt")" 2>>"$LOGFILE"
adb shell settings put global transition_animation_scale "$(cat "$BACKUP_DIR/04_transition_scale.txt")" 2>>"$LOGFILE"
adb shell settings put global animator_duration_scale "$(cat "$BACKUP_DIR/05_animator_scale.txt")" 2>>"$LOGFILE"

log "[2/7] Restaurando GPU..."
adb shell settings put global debug.hwui.renderer "$(cat "$BACKUP_DIR/06_gpu_renderer.txt")" 2>>"$LOGFILE"
adb shell setprop debug.hwui.force_msaa "$(cat "$BACKUP_DIR/07_gpu_msaa.txt")" 2>>"$LOGFILE"
adb shell setprop debug.hwui.use_anisotropic_filtering "$(cat "$BACKUP_DIR/08_gpu_af.txt")" 2>>"$LOGFILE"

log "[3/7] Restaurando DPI y resolución..."
adb shell wm density reset 2>>"$LOGFILE"
adb shell wm size reset 2>>"$LOGFILE"

log "[4/7] Restaurando paquetes..."
while read -r PKG; do
    PKG_NAME=$(echo "$PKG" | sed 's/package://')
    adb shell pm enable "$PKG_NAME" 2>>"$LOGFILE"
done < "$BACKUP_DIR/02_deshabilitados.txt"

log "[5/7] Restaurando settings globales..."
adb shell settings put global captive_portal_mode 1 2>>"$LOGFILE"
adb shell settings put global wifi_scan_always_enabled 1 2>>"$LOGFILE"

log "[6/7] Restaurando thermal..."
adb shell setprop persist.sys.thermal.policy balanced 2>>"$LOGFILE"

log "[7/7] ✔ Restauración completa."
