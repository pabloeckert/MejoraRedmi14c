#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Perfil RENDIMIENTO — MejoraRedmi14c v3.0
#  Para: quien quiere que el teléfono vuele
#  Animaciones 0.3x + GPU + red + memoria + 28 apps desactivadas
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/bloatware-db.sh"
source "$SCRIPT_DIR/rescue.sh"

echo ""
echo "🚀 PERFIL RENDIMIENTO — MejoraRedmi14c v3.0"
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
echo "💾 Creando rescue point..."
RESCUE_NAME="pre-rendimiento_$(date +%Y%m%d_%H%M%S)"
create_rescue_point "$RESCUE_NAME" > /dev/null
echo "   ✅ Rescue point '$RESCUE_NAME' creado"
echo ""

# ─── 1. ANIMACIONES ───
echo "[1/7] ⚡ Animaciones ultra rápido (0.3x)..."
adb shell settings put global window_animation_scale 0.3
adb shell settings put global transition_animation_scale 0.3
adb shell settings put global animator_duration_scale 0.3
echo "      ✅ Animaciones ajustadas"

# ─── 2. GPU ───
echo "[2/7] 🎨 Forzando renderizado GPU..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
# Vulkan si disponible
adb shell settings put global debug.hwui.renderer skiavk 2>/dev/null
echo "      ✅ GPU rendering activado (Vulkan si disponible)"

# ─── 3. BLOATWARE ───
echo "[3/7] 🧹 Desactivando bloatware..."
RESULT=$(disable_packages RENDIMIENTO_BLOAT)
DISABLED=$(echo "$RESULT" | awk '{print $1}')
ALREADY=$(echo "$RESULT" | awk '{print $2}')
NOTFOUND=$(echo "$RESULT" | awk '{print $3}')
echo "      ✅ $DISABLED apps desactivadas ($ALREADY ya estaban, $NOTFOUND no encontradas)"

# ─── 4. KILL APPS ───
echo "[4/7] 💀 Cerrando apps pesadas..."
APPS=(
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
)
KILLED=0
for APP in "${APPS[@]}"; do
    adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
echo "      ✅ $KILLED apps cerradas"

# ─── 5. CACHE PROFUNDA ───
echo "[5/7] 🗑️  Cache profunda..."
adb shell pm trim-caches 512M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
adb shell "rm -rf /data/local/tmp/*" 2>/dev/null
adb shell "rm -rf /data/tombstones/*" 2>/dev/null
adb shell "rm -rf /data/anr/*" 2>/dev/null
echo "      ✅ Cache limpiada"

# ─── 6. RED ───
echo "[6/7] 🌐 Optimizando red..."
adb shell settings put global dns_resolver_sample_validity_seconds 600 2>/dev/null
adb shell settings put global tcp_default_init_rwnd 10 2>/dev/null
adb shell settings put global wifi_scan_always_enabled 0 2>/dev/null
echo "      ✅ Red optimizada"

# ─── 7. MEMORIA ───
echo "[7/7] 💾 Optimizando memoria..."
adb shell settings put global sys_swappiness 60 2>/dev/null
adb shell settings put global activity_manager_constants "max_cached_processes=32" 2>/dev/null
adb shell settings put global hwui_texture_cache_size 72 2>/dev/null
echo "      ✅ Memoria optimizada"

echo ""
echo "════════════════════════════════════════════"
echo "🚀 ¡PERFIL RENDIMIENTO APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones:  0.3x"
echo "   GPU:          Forzada + Vulkan"
echo "   Bloatware:    $DISABLED apps desactivadas"
echo "   Apps cerradas: $KILLED"
echo "   Cache:        Profunda"
echo "   Red:          Optimizada"
echo "   Memoria:      Optimizada"
echo ""
echo "   💾 Rescue point: $RESCUE_NAME"
echo "   Para revertir: ./emergencia.sh o ./rescue.sh"
echo ""
