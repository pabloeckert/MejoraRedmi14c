#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Perfil GAMING — MejoraRedmi14c
#  Inspirado en: Android-boost-performance (Naritsumi)
#              + ADB-Android-Optimizer (SchneeSchmitt)
#
#  Reduce resolución + GPU + memoria + kill apps para gaming
#  ⚠️  La reducción de resolución puede causar iconos grandes
#  ✅  Ahora restaura resolución automáticamente al salir
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/bloatware-db.sh"
source "$SCRIPT_DIR/rescue.sh"

# ─── GUARDAR RESOLUCIÓN ORIGINAL ───
ORIGINAL_SIZE=$(adb shell wm size 2>/dev/null | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
ORIGINAL_DPI=$(adb shell wm density 2>/dev/null | grep "Physical density:" | grep -o '[0-9]*')

# ─── RESTAURAR RESOLUCIÓN AL SALIR ───
restore_resolution() {
    echo ""
    echo "🔄 Restaurando resolución original..."
    adb shell wm size reset 2>/dev/null
    adb shell wm density reset 2>/dev/null
    echo "✅ Resolución restaurada a ${ORIGINAL_SIZE} @ ${ORIGINAL_DPI}dpi"
}

# Trap: restaurar resolución si el usuario interrumpe (Ctrl+C) o si termina normal
trap restore_resolution EXIT

echo ""
echo "🎮 PERFIL GAMING — MejoraRedmi14c"
echo "════════════════════════════════════════════"
echo ""

# Verificar conexión
if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    echo "   Conectá tu teléfono por USB y activá la depuración USB."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo "📱 Dispositivo: $DEVICE (Android $ANDROID)"
echo ""

# ─── GUARDAR RESCUE POINT ───
echo "💾 Creando rescue point antes de optimizar..."
RESCUE_NAME="pre-gaming_$(date +%Y%m%d_%H%M%S)"
create_rescue_point "$RESCUE_NAME" > /dev/null
echo "   ✅ Rescue point '$RESCUE_NAME' creado"
echo ""

# ─── 1. REDUCCIÓN DE RESOLUCIÓN ───
echo "[1/7] 🖥️  Reduciendo resolución para gaming..."
# Obtener resolución actual
CURRENT_SIZE=$(adb shell wm size 2>/dev/null | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
CURRENT_DPI=$(adb shell wm density 2>/dev/null | grep "Physical density:" | grep -o '[0-9]*')
echo "      Resolución actual: $CURRENT_SIZE @ ${CURRENT_DPI}dpi"

# Reducir a 720p para mejor rendimiento en gaming
# El Redmi 14C tiene 1612x720, bajamos a 1280x576
adb shell wm size 1280x576 2>/dev/null
adb shell wm density 280 2>/dev/null
echo "      ✅ Resolución reducida a 1280x576 @ 280dpi"
echo "      ℹ️  Se restaurará automáticamente al salir del script"
echo ""

# ─── 2. ANIMACIONES MÍNIMAS ───
echo "[2/7] ⚡ Animaciones al mínimo (0.3x)..."
adb shell settings put global window_animation_scale 0.3
adb shell settings put global transition_animation_scale 0.3
adb shell settings put global animator_duration_scale 0.3
echo "      ✅ Animaciones ultra rápidas"

# ─── 3. GPU MÁXIMA ───
echo "[3/7] 🎨 GPU al máximo..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
# Vulkan rendering
adb shell settings put global debug.hwui.renderer skiavk 2>/dev/null
# Desactivar efectos visuales innecesarios
adb shell settings put global debug.hwui.disable_draw_defer 1 2>/dev/null
adb shell settings put global debug.hwui.disable_draw_reorder 1 2>/dev/null
echo "      ✅ GPU forzada + Vulkan + sin efectos"

# ─── 4. MEMORIA MÁXIMA ───
echo "[4/7] 🧠 Memoria al máximo..."
adb shell settings put global sys_swappiness 30 2>/dev/null
adb shell settings put global activity_manager_constants "max_cached_processes=64" 2>/dev/null
# Desactivar compresión de memoria
adb shell settings put global zram_enabled 0 2>/dev/null
echo "      ✅ Memoria optimizada para gaming"

# ─── 5. BLOATWARE ───
echo "[5/7] 🧹 Desactivando bloatware gaming..."
RESULT=$(disable_packages GAMING_BLOAT)
DISABLED=$(echo "$RESULT" | awk '{print $1}')
ALREADY=$(echo "$RESULT" | awk '{print $2}')
NOTFOUND=$(echo "$RESULT" | awk '{print $3}')
echo "      ✅ $DISABLED apps desactivadas ($ALREADY ya estaban, $NOTFOUND no encontradas)"

# ─── 6. KILL APPS ───
echo "[6/7] 💀 Cerrando TODAS las apps..."
# Kill de todo excepto el sistema
APPS=(
    "com.facebook.katana"
    "com.instagram.android"
    "com.zhiliaoapp.musically"
    "com.google.android.youtube"
    "com.snapchat.android"
    "com.twitter.android"
    "com.spotify.music"
    "com.whatsapp"
    "com.google.android.gm"
    "com.google.android.apps.maps"
    "com.google.android.apps.photos"
    "com.android.chrome"
    "com.google.android.apps.messaging"
    "com.google.android.apps.nbu.files"
    "com.miui.cloudservice"
    "com.miui.micloudsync"
    "com.miui.cloudbackup"
)
KILLED=0
for APP in "${APPS[@]}"; do
    adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
echo "      ✅ $KILLED apps cerradas"

# ─── 7. CACHE PROFUNDA ───
echo "[7/7] 🗑️  Cache profunda..."
adb shell pm trim-caches 1G 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
adb shell "rm -rf /data/local/tmp/*" 2>/dev/null
adb shell "rm -rf /data/tombstones/*" 2>/dev/null
adb shell "rm -rf /data/anr/*" 2>/dev/null
echo "      ✅ Cache limpiada"

echo ""
echo "════════════════════════════════════════════"
echo "🎮 ¡PERFIL GAMING ACTIVADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Resolución:   1280x576 (reducida)"
echo "   DPI:          280"
echo "   Animaciones:  0.3x"
echo "   GPU:          Forzada + Vulkan"
echo "   Memoria:      Optimizada para gaming"
echo "   Bloatware:    $DISABLED apps desactivadas"
echo "   Apps cerradas: $KILLED"
echo "   Cache:        Profunda"
echo ""
echo "   💾 Rescue point: $RESCUE_NAME"
echo "   Para revertir: ./emergencia.sh o ./rescue.sh"
echo ""
echo "   ℹ️  La resolución se restaurará automáticamente"
echo "      cuando salgas de este script (Enter o Ctrl+C)"
echo ""
echo "   Presioná Enter para restaurar resolución y salir..."
read -p "  "
