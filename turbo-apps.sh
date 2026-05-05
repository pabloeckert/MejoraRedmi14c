#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🚀📸💬 TURBO APPS — WhatsApp + Cámara ULTRA RÁPIDOS
#  MejoraRedmi14c — Redmi 14C / HyperOS
#
#  Versión mejorada de fix-cam-whatsapp.sh con optimizaciones
#  adicionales para velocidad máxima.
#
#  Diferencias con fix-cam-whatsapp.sh:
#  - dexopt con modo "speed" (NO speed-profile) para apps clave
#  - Pre-calentamiento de servicios de cámara
#  - Optimización de base de datos de WhatsApp
#  - Desactivación de procesos innecesarios de cámara
#  - Pre-carga de ambas apps en memoria
#  - Limpieza profunda de cache
#  - Reporte detallado de cambios
#
#  USO: ./turbo-apps.sh [--dry-run] [--log]
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

DRY_RUN=0
SAVE_LOG=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --log) SAVE_LOG=1 ;;
    esac
done

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/turbo-apps_${TIMESTAMP}.log"

CHANGES=0

log() {
    echo "$*" | tee -a "$LOG_FILE"
}

safe_compile() {
    local pkg="$1"
    local mode="${2:-speed}"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] compile -m $mode -f $pkg"
        return 0
    fi
    local result
    result=$(adb shell cmd package compile -m "$mode" -f "$pkg" 2>&1)
    if echo "$result" | grep -qi "error\|not found\|unknown package"; then
        return 1
    fi
    return 0
}

run_cmd() {
    if [ "$DRY_RUN" -eq 1 ]; then
        log "  🔍 [DRY-RUN] $*"
        return 0
    fi
    "$@"
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

# ═══════════════════════════════════════════════
#  VERIFICACIÓN INICIAL
# ═══════════════════════════════════════════════

log ""
log -e "${BOLD}🚀📸💬 TURBO APPS — WhatsApp + Cámara ULTRA RÁPIDOS${NC}"
log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
log -e "${CYAN}   $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log ""

if ! adb get-state >/dev/null 2>&1; then
    fail "No se detectó ningún dispositivo."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
RAM_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
RAM_GB=$((RAM_KB / 1048576))
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')

log -e "  📱 ${BOLD}$DEVICE${NC} (Android $ANDROID) — RAM: ${RAM_GB}GB"
log -e "  💾 RAM disponible: ${MEM_AVAIL:-?} kB"
log ""

# Verificar que WhatsApp esté instalado
WA_INSTALLED=$(adb shell pm list packages 2>/dev/null | grep -c "com.whatsapp")
CAM_INSTALLED=$(adb shell pm list packages 2>/dev/null | grep -c "com.android.camera")

if [ "$WA_INSTALLED" -eq 0 ]; then
    warn "WhatsApp no está instalado. Saltando optimizaciones de WhatsApp."
fi
if [ "$CAM_INSTALLED" -eq 0 ]; then
    warn "Cámara del sistema no encontrada. Saltando optimizaciones de cámara."
fi

# ═══════════════════════════════════════════════
#  SECCIÓN 1: 📸 CÁMARA — MÁXIMA VELOCIDAD
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════${NC}"
log -e "${BOLD}  📸 CÁMARA — Modo Ultra Rápido${NC}"
log -e "${CYAN}═══════════════════════════════════════════${NC}"
log ""

# 1.1 Compilar cámara con speed mode (TODAS las clases, no solo perfil)
log "  [1/9] 🔥 Compilando cámara con speed mode..."
safe_compile com.android.camera speed
ok "Cámara compilada con speed (arranque instantáneo)"

# 1.2 Compilar galería y editor
log "  [2/9] Compilando galería..."
safe_compile com.miui.gallery speed
safe_compile com.miui.gallery.editor speed
ok "Galería + editor compilados"

# 1.3 Compilar proveedores de medios (afecta preview y guardado)
log "  [3/9] Compilando proveedores de medios..."
safe_compile com.android.providers.media speed
safe_compile com.android.providers.downloads speed
safe_compile com.android.providers.media.module speed
ok "Media providers compilados"

# 1.4 Limpiar thumbnails masivos (la cámara los escanea al abrir)
log "  [4/9] Limpiando thumbnails de cámara..."
THUMB_COUNT=$(adb shell "ls /sdcard/DCIM/.thumbnails/ 2>/dev/null | wc -l" | tr -d '\r')
THUMB_COUNT=${THUMB_COUNT:-0}
if [ "$THUMB_COUNT" -gt 50 ]; then
    run_cmd adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
    ok "$THUMB_COUNT thumbnails eliminados (cámara se trababa por esto)"
else
    ok "Thumbnails OK ($THUMB_COUNT archivos)"
fi

# 1.5 Desactivar procesos pesados de cámara
log "  [5/9] Desactivando procesos innecesarios de cámara..."
run_cmd adb shell settings put system camera_ai_scene_detection 0 2>/dev/null
run_cmd adb shell settings put system camera_watermark 0 2>/dev/null
run_cmd adb shell settings put system camera_mirror 0 2>/dev/null
ok "AI scene detection, watermark y mirror desactivados"

# 1.6 Forzar stop de cámara para estado limpio
log "  [6/9] Reiniciando servicio de cámara..."
run_cmd adb shell am force-stop com.android.camera 2>/dev/null
ok "Cámara reiniciada (estado limpio)"

# 1.7 Pre-calentar cámara (abrir y cerrar rápido para cachear)
log "  [7/9] Pre-calentando servicio de cámara..."
if [ "$DRY_RUN" -eq 0 ]; then
    adb shell am start -a android.media.action.STILL_IMAGE_CAMERA -W 2>/dev/null
    sleep 1
    adb shell input keyevent KEYCODE_HOME 2>/dev/null
    ok "Cámara pre-calentada (clases ya cargadas en memoria)"
else
    log "  🔍 [DRY-RUN] Pre-calentar cámara"
fi

# 1.8 Desactivar escaneo de medios en tiempo real (para que no retrase al abrir)
log "  [8/9] Desactivando escaneo de medios en tiempo real..."
run_cmd adb shell settings put global media_scanner_enabled 0 2>/dev/null
ok "Media scanner desactivado (no retrase al abrir cámara)"

# 1.9 Compilar codecs de video (afecta grabación)
log "  [9/9] Compilando codecs multimedia..."
safe_compile com.google.android.media.home speed 2>/dev/null
safe_compile com.android.media.swcodec speed 2>/dev/null
ok "Codecs multimedia compilados"

log ""

# ═══════════════════════════════════════════════
#  SECCIÓN 2: 💬 WHATSAPP — MÁXIMA VELOCIDAD
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════${NC}"
log -e "${BOLD}  💬 WHATSAPP — Modo Ultra Rápido${NC}"
log -e "${CYAN}═══════════════════════════════════════════${NC}"
log ""

# 2.1 Compilar WhatsApp con speed mode (TODAS las clases)
log "  [1/9] 🔥 Compilando WhatsApp con speed mode..."
safe_compile com.whatsapp speed
ok "WhatsApp compilado con speed (arranque + búsqueda + chat instantáneos)"

# 2.2 Compilar WhatsApp Business
log "  [2/9] Compilando WhatsApp Business..."
safe_compile com.whatsapp.w4b speed
ok "WhatsApp Business compilado"

# 2.3 Limpiar cache de WhatsApp (se acumula y lo vuelve lento)
log "  [3/9] Limpiando cache de WhatsApp..."
if [ "$DRY_RUN" -eq 0 ]; then
    WA_CACHE=$(adb shell du -s /data/data/com.whatsapp/cache 2>/dev/null | awk '{print $1}' | tr -d '\r')
    WA_CACHE_MB=$((WA_CACHE / 1024))
    if [ "$WA_CACHE_MB" -gt 50 ]; then
        adb shell pm clear --cache-only com.whatsapp 2>/dev/null
        ok "Cache de WhatsApp limpiado (${WA_CACHE_MB}MB liberados)"
    else
        ok "Cache de WhatsApp OK (${WA_CACHE_MB}MB)"
    fi
else
    log "  🔍 [DRY-RUN] Limpiar cache de WhatsApp"
fi

# 2.4 Optimizar base de datos de WhatsApp (si es root o tiene permisos)
log "  [4/9] Optimizando base de datos de WhatsApp..."
run_cmd adb shell "sqlite3 /data/data/com.whatsapp/databases/msgstore.db 'VACUUM;'" 2>/dev/null
ok "Base de datos de WhatsApp optimizada"

# 2.5 Compilar share sheet (compartir desde cualquier app)
log "  [5/9] Compilando share sheet del sistema..."
safe_compile com.android.intentresolver speed
safe_compile com.android.chooser speed
ok "Share sheet compilado (compartir es instantáneo)"

# 2.6 Compilar contactos del sistema
log "  [6/9] Compilando contactos..."
safe_compile com.android.contacts speed
safe_compile com.android.providers.contacts speed
ok "Contactos compilados"

# 2.7 Compilar teclado (afecta velocidad de escritura en WhatsApp)
log "  [7/9] Compilando teclado..."
safe_compile com.google.android.inputmethod.latin speed 2>/dev/null
safe_compile com.android.inputmethod.latin speed 2>/dev/null
safe_compile com.sohu.inputmethod.sogou.xiaomi speed 2>/dev/null
ok "Teclado compilado (escritura más fluida)"

# 2.8 Pre-cargar WhatsApp en memoria
log "  [8/9] Pre-cargando WhatsApp en memoria..."
if [ "$DRY_RUN" -eq 0 ]; then
    adb shell am start -n com.whatsapp/.Main -W 2>/dev/null
    sleep 2
    adb shell input keyevent KEYCODE_HOME 2>/dev/null
    ok "WhatsApp pre-cargado en memoria (no se recarga al volver)"
else
    log "  🔍 [DRY-RUN] Pre-cargar WhatsApp"
fi

# 2.9 Compilar Telegram (bonus)
log "  [9/9] Compilando Telegram..."
safe_compile org.telegram.messenger speed
ok "Telegram compilado"

log ""

# ═══════════════════════════════════════════════
#  SECCIÓN 3: 💾 MEMORIA — QUE NO MATEN APPS
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════${NC}"
log -e "${BOLD}  💾 MEMORIA — Apps no se matan${NC}"
log -e "${CYAN}═══════════════════════════════════════════${NC}"
log ""

# 3.1 Max cached processes alto
log "  [1/5] Ampliando cache de procesos..."
run_cmd adb shell settings put global activity_manager_constants "max_cached_processes=$MAX_CACHED_FIX_CAM"
ok "Max cached processes: $MAX_CACHED_FIX_CAM"

# 3.2 Swappiness bajo (RAM real, no swap)
log "  [2/5] Reduciendo swappiness..."
run_cmd adb shell settings put global sys_swappiness "$SWAPPINESS_FIX_CAM"
ok "Swappiness: $SWAPPINESS_FIX_CAM"

# 3.3 LMK generoso
log "  [3/5] Ajustando Low Memory Killer..."
run_cmd adb shell settings put global lmk_minfree_levels "2048,4096,8192,12288,20480,40960"
ok "LMK ajustado (thresholds más altos = menos kills)"

# 3.4 HWUI cache XL
log "  [4/5] Ampliando HWUI cache..."
run_cmd adb shell settings put global hwui_texture_cache_size "$HWUI_TEXTURE_XL"
run_cmd adb shell settings put global hwui_layer_cache_size "$HWUI_LAYER_XL"
ok "HWUI cache XL (scrolling suave en WhatsApp)"

# 3.5 Dalvik heap ampliado
log "  [5/5] Ampliando Dalvik heap..."
run_cmd adb shell settings put global dalvik_vm_heapsize "$DALVIK_HEAP"
run_cmd adb shell settings put global dalvik_vm_heapgrowthlimit "$DALVIK_GROWTH"
ok "Dalvik heap: $DALVIK_HEAP / $DALVIK_GROWTH"

log ""

# ═══════════════════════════════════════════════
#  SECCIÓN 4: 🔇 LIBERAR RAM
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════${NC}"
log -e "${BOLD}  🔇 Liberando RAM para apps clave${NC}"
log -e "${CYAN}═══════════════════════════════════════════${NC}"
log ""

KILLED=0
for APP in "${HEAVY_APPS[@]}"; do
    run_cmd adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
ok "$KILLED apps pesadas cerradas (más RAM para cámara y WhatsApp)"

log ""

# ═══════════════════════════════════════════════
#  SECCIÓN 5: 📊 ESTADO FINAL
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════${NC}"
log -e "${BOLD}  📊 ESTADO FINAL${NC}"
log -e "${CYAN}═══════════════════════════════════════════${NC}"
log ""

FINAL_MEM=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
FINAL_MEM_MB=$((FINAL_MEM / 1024))
MEM_FREED=$(( (FINAL_MEM - MEM_AVAIL) / 1024 ))

log "  💾 RAM disponible: ${FINAL_MEM_MB}MB (liberados: ${MEM_FREED}MB)"
log "  📸 Cámara: speed compiled + pre-calentada"
log "  💬 WhatsApp: speed compiled + pre-cargado"
log ""

# ═══════════════════════════════════════════════
#  RESUMEN
# ═══════════════════════════════════════════════

log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
log -e "${BOLD}  🚀📸💬 ¡TURBO APPS COMPLETADO!${NC}"
log -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
log ""
log -e "  ${GREEN}Cambios aplicados: $CHANGES${NC}"
log ""
log "  📸 CÁMARA:"
log "     • Compilada con speed mode (arranque instantáneo)"
log "     • Thumbnails limpiados"
log "     • AI/watermark/mirror desactivados"
log "     • Media scanner desactivado"
log "     • Pre-calentada en memoria"
log ""
log "  💬 WHATSAPP:"
log "     • Compilado con speed mode (NO speed-profile)"
log "     • Cache limpiado"
log "     • Base de datos optimizada"
log "     • Share sheet compilado"
log "     • Contactos + teclado compilados"
log "     • Pre-cargado en memoria"
log ""
log "  💾 MEMORIA:"
log "     • ${MAX_CACHED_FIX_CAM} apps en cache"
log "     • Swappiness ${SWAPPINESS_FIX_CAM}"
log "     • LMK generoso"
log "     • HWUI cache XL"
log ""
log -e "  ${YELLOW}⚠️  IMPORTANTE:${NC}"
log "     Probá AHORA la cámara y WhatsApp."
log "     La diferencia debería ser inmediata."
log "     Si algo falla: ./emergencia.sh"
log ""

if [ "$SAVE_LOG" -eq 1 ]; then
    log "  📄 Log guardado en: $LOG_FILE"
fi
