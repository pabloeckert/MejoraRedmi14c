#!/bin/bash
# ============================================================
# BACKUP COMPLETO — Snapshot seguro + LOG
# ============================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="snapshot_${TIMESTAMP}"
LOGFILE="logs/backup_${TIMESTAMP}.log"

mkdir -p "$BACKUP_DIR"
mkdir -p "logs"

log() {
    echo "[$(date +"%H:%M:%S")] $1" | tee -a "$LOGFILE"
}

log "📦 Iniciando backup en $BACKUP_DIR"

log "[1/8] Guardando lista de paquetes..."
adb shell pm list packages -f > "$BACKUP_DIR/01_paquetes.txt" 2>>"$LOGFILE"

log "[2/8] Guardando paquetes deshabilitados..."
adb shell pm list packages -d > "$BACKUP_DIR/02_deshabilitados.txt" 2>>"$LOGFILE"

log "[3/8] Guardando animaciones..."
adb shell settings get global window_animation_scale > "$BACKUP_DIR/03_window_scale.txt" 2>>"$LOGFILE"
adb shell settings get global transition_animation_scale > "$BACKUP_DIR/04_transition_scale.txt" 2>>"$LOGFILE"
adb shell settings get global animator_duration_scale > "$BACKUP_DIR/05_animator_scale.txt" 2>>"$LOGFILE"

log "[4/8] Guardando GPU..."
adb shell getprop debug.hwui.renderer > "$BACKUP_DIR/06_gpu_renderer.txt" 2>>"$LOGFILE"
adb shell getprop debug.hwui.force_msaa > "$BACKUP_DIR/07_gpu_msaa.txt" 2>>"$LOGFILE"
adb shell getprop debug.hwui.use_anisotropic_filtering > "$BACKUP_DIR/08_gpu_af.txt" 2>>"$LOGFILE"

log "[5/8] Guardando settings globales..."
adb shell settings list global > "$BACKUP_DIR/09_settings_global.txt" 2>>"$LOGFILE"

log "[6/8] Guardando settings secure..."
adb shell settings list secure > "$BACKUP_DIR/10_settings_secure.txt" 2>>"$LOGFILE"

log "[7/8] Guardando DPI y resolución..."
adb shell wm density > "$BACKUP_DIR/13_dpi.txt" 2>>"$LOGFILE"
adb shell wm size > "$BACKUP_DIR/14_resolucion.txt" 2>>"$LOGFILE"

log "[8/8] Backup finalizado correctamente."
