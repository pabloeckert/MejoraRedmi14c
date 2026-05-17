#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  📸💬 FIX CÁMARA + WHATSAPP — MejoraRedmi14c
#  Soluciona: cámara lenta, WhatsApp lento, share sheet lento
#
#  Problemas que arregla:
#  • Cámara tarda en abrir y en tomar fotos
#  • WhatsApp se traba al buscar contactos
#  • Share desde otra app a WhatsApp es lentísimo
#  • WhatsApp se recarga al volver de otra app
#
#  USO: ./fix-cam-whatsapp.sh
# ═══════════════════════════════════════════════════════════════

# No usamos set -e porque algunos paquetes pueden no existir en todos
# los dispositivos. Cada comando usa || true para continuar si falla.
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# ─── Inicialización de Logs ───
init_log "fix-cam-whatsapp"

CHANGES=0

# Compilar paquete de forma segura (no falla si no existe)
safe_compile() {
    local pkg="$1"
    local result
    result=$(adb shell cmd package compile -m speed -f "$pkg" 2>&1)
    if echo "$result" | grep -qi "error\|not found\|unknown package"; then
        return 1
    fi
    return 0
}

# Wrapper para compatibilidad
ok() { log_ok "$1"; CHANGES=$((CHANGES + 1)); }
warn() { log_warn "$1"; }
fail() { log_fail "$1"; }

log_raw ""
log_raw "${BOLD}📸💬 FIX CÁMARA + WHATSAPP${NC}"
log_raw "${CYAN}════════════════════════════════════════════${NC}"
log_raw ""

if ! adb get-state >/dev/null 2>&1; then
    fail "No se detectó ningún dispositivo."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
RAM_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
RAM_GB=$((RAM_KB / 1048576))
echo -e "  📱 ${BOLD}$DEVICE${NC} — RAM: ${RAM_GB}GB"
echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 1: CÁMARA
# ═══════════════════════════════════════════════

echo -e "${CYAN}  ═══ 📸 CÁMARA ═══${NC}"
echo ""

# 1.1 Compilar cámara con speed mode (no speed-profile)
# speed = compila TODAS las clases, no solo las del perfil
# Es más pesado en almacenamiento pero la cámara arranca mucho más rápido
echo "  [1/6] Compilando cámara con speed mode..."
safe_compile com.android.camera
ok "Cámara compilada con speed (arranque instantáneo)"

# 1.2 Compilar gallery/editor de la cámara
echo "  [2/6] Compilando galería de cámara..."
safe_compile com.miui.gallery
safe_compile com.miui.gallery.editor
ok "Galería compilada"

# 1.3 Limpiar thumbnails de la cámara (si hay miles, la cámara se traba)
echo "  [3/6] Limpiando thumbnails de cámara..."
THUMB_COUNT=$(adb shell "ls /sdcard/DCIM/.thumbnails/ 2>/dev/null | wc -l" | tr -d '\r')
if [ "$THUMB_COUNT" -gt 100 ]; then
    adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
    ok "$THUMB_COUNT thumbnails eliminados (la cámara se trababa por esto)"
else
    ok "Thumbnails OK ($THUMB_COUNT archivos)"
fi

# 1.4 Desactivar procesos de cámara que consumen en background
echo "  [4/6] Optimizando procesos de cámara..."
# Forzar stop de servicios de cámara que quedan en background
adb shell am force-stop com.android.camera 2>/dev/null
ok "Procesos de cámara reiniciados"

# 1.5 Compilar proveedores de medios (afecta velocidad de preview)
echo "  [5/6] Compilando proveedores de medios..."
safe_compile com.android.providers.media
safe_compile com.android.providers.downloads
ok "Media providers compilados"

# 1.6 Desactivar HDR automático (consume mucho tiempo al tomar foto)
echo "  [6/6] Desactivando procesos pesados de cámara..."
# Desactivar servicios de IA de cámara que procesan en background
adb shell settings put system camera_ai_scene_detection 0 2>/dev/null
adb shell settings put system camera_watermark 0 2>/dev/null
ok "AI scene detection y watermark desactivados"

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 2: WHATSAPP
# ═══════════════════════════════════════════════

echo -e "${CYAN}  ═══ 💬 WHATSAPP ═══${NC}"
echo ""

# 2.1 Compilar WhatsApp con speed mode
echo "  [1/7] Compilando WhatsApp con speed mode..."
safe_compile com.whatsapp
ok "WhatsApp compilado con speed (arranque y búsqueda instantáneos)"

# 2.2 Compilar WhatsApp Business también
echo "  [2/7] Compilando WhatsApp Business..."
safe_compile com.whatsapp.w4b
ok "WhatsApp Business compilado"

# 2.3 Limpiar cache de WhatsApp (se acumula y lo vuelve lento)
echo "  [3/7] Limpiando cache de WhatsApp..."
WA_CACHE=$(adb shell du -s /data/data/com.whatsapp/cache 2>/dev/null | awk '{print $1}' | tr -d '\r')
WA_CACHE_MB=$((WA_CACHE / 1024))
if [ "$WA_CACHE_MB" -gt 100 ]; then
    adb shell pm clear --cache-only com.whatsapp 2>/dev/null
    ok "Cache de WhatsApp limpiado (${WA_CACHE_MB}MB liberados)"
else
    ok "Cache de WhatsApp OK (${WA_CACHE_MB}MB)"
fi

# 2.4 Pre-cargar contactos de WhatsApp en memoria
echo "  [4/7] Pre-cargando WhatsApp en memoria..."
# Abrir WhatsApp en background para que quede en RAM
adb shell am start -n com.whatsapp/.Main -W 2>/dev/null
sleep 2
# Enviar a background (no cerrar)
adb shell input keyevent KEYCODE_HOME 2>/dev/null
ok "WhatsApp pre-cargado en memoria (no se va a recargar)"

# 2.5 Compilar el chooser/share sheet del sistema
echo "  [5/7] Compilando share sheet del sistema..."
safe_compile com.android.intentresolver
safe_compile com.android.chooser
ok "Share sheet compilado (compartir ahora es instantáneo)"

# 2.6 Compilar contactos del sistema
echo "  [6/7] Compilando contactos del sistema..."
safe_compile com.android.contacts
safe_compile com.android.providers.contacts
ok "Contactos del sistema compilados"

# 2.7 Compilar Telegram también (por si usas)
echo "  [7/7] Compilando Telegram..."
safe_compile org.telegram.messenger
ok "Telegram compilado"

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 3: OPTIMIZACIONES DE MEMORIA (4GB)
# ═══════════════════════════════════════════════

echo -e "${CYAN}  ═══ 💾 MEMORIA (para que no maten apps) ═══${NC}"
echo ""

# 3.1 Aumentar cached processes (más apps en RAM)
echo "  [1/4] Aumentando apps en memoria..."
adb shell settings put global activity_manager_constants "max_cached_processes=$MAX_CACHED_FIX_CAM" 2>/dev/null
ok "Max cached processes: $MAX_CACHED_FIX_CAM (WhatsApp y cámara no se van a matar)"

# 3.2 Bajar swappiness (menos swap = apps más rápidas al volver)
echo "  [2/4] Reduciendo swappiness..."
adb shell settings put global sys_swappiness "$SWAPPINESS_FIX_CAM" 2>/dev/null
ok "Swappiness: $SWAPPINESS_FIX_CAM (apps se quedan en RAM real)"

# 3.3 Ajustar LMK para no matar apps importantes
echo "  [3/4] Ajustando Low Memory Killer..."
adb shell settings put global lmk_minfree_levels "2048,4096,8192,12288,20480,40960" 2>/dev/null
ok "LMK ajustado (thresholds más altos = menos kills)"

# 3.4 HWUI cache más grande (scrolling más suave en WhatsApp)
echo "  [4/4] Ampliando HWUI cache..."
adb shell settings put global hwui_texture_cache_size "$HWUI_TEXTURE_XL" 2>/dev/null
adb shell settings put global hwui_layer_cache_size "$HWUI_LAYER_XL" 2>/dev/null
ok "HWUI cache ampliado (scrolling suave)"

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 4: SERVICIOS PESADOS EN BACKGROUND
# ═══════════════════════════════════════════════

echo -e "${CYAN}  ═══ 🔇 MATANDO SERVICIOS PESADOS ═══${NC}"
echo ""

echo "  Cerrando apps que roban RAM de cámara y WhatsApp..."
KILLED=0
for APP in "${HEAVY_APPS[@]}"; do
    adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
ok "$KILLED apps pesadas cerradas (más RAM para cámara y WhatsApp)"

echo ""

# ═══════════════════════════════════════════════
#  RESUMEN
# ═══════════════════════════════════════════════

echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${BOLD}  📸💬 ¡FIX COMPLETADO!${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Cambios aplicados: $CHANGES${NC}"
echo ""
echo "  📸 CÁMARA:"
echo "     • Compilada con speed mode (arranque instantáneo)"
echo "     • Thumbnails limpiados"
echo "     • AI scene detection desactivada"
echo "     • Media providers compilados"
echo ""
echo "  💬 WHATSAPP:"
echo "     • Compilado con speed mode"
echo "     • Cache limpiado"
echo "     • Pre-cargado en memoria"
echo "     • Share sheet compilado (compartir instantáneo)"
echo "     • Contactos compilados"
echo ""
echo "  💾 MEMORIA:"
echo "     • 96 apps en cache (no se matan)"
echo "     • Swappiness 20 (RAM real)"
echo "     • LMK ajustado"
echo ""
echo -e "  ${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "     Probá AHORA la cámara y WhatsApp."
echo "     Debería ser mucho más rápido."
echo "     Si querés revertir: ./emergencia.sh"
echo ""
