#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Perfil EQUILIBRADO — MejoraRedmi14c
#  Para: uso diario sin perder funciones
#  Animaciones 0.5x + GPU + 10 apps seguras
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/bloatware-db.sh"
source "$SCRIPT_DIR/rescue.sh"

echo ""
echo "📱 PERFIL EQUILIBRADO — MejoraRedmi14c v$VERSION"
echo "════════════════════════════════════════════"
echo ""

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
RESCUE_NAME="pre-equilibrado_$(date +%Y%m%d_%H%M%S)"
create_rescue_point "$RESCUE_NAME" > /dev/null
echo "   ✅ Rescue point '$RESCUE_NAME' creado"
echo ""

# ─── 1. ANIMACIONES ───
echo "[1/5] 💨 Animaciones rápidas ($ANIM_EQUILIBRADO)..."
adb shell settings put global window_animation_scale "$ANIM_EQUILIBRADO"
adb shell settings put global transition_animation_scale "$ANIM_EQUILIBRADO"
adb shell settings put global animator_duration_scale "$ANIM_EQUILIBRADO"
echo "      ✅ Animaciones ajustadas"

# ─── 2. GPU ───
echo "[2/5] 🎨 Forzando renderizado GPU..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
echo "      ✅ GPU rendering activado"

# ─── 3. BLOATWARE (solo 100% seguro) ───
echo "[3/5] 🧹 Desactivando bloatware seguro..."
RESULT=$(disable_packages EQUILIBRADO_BLOAT)
DISABLED=$(echo "$RESULT" | awk '{print $1}')
ALREADY=$(echo "$RESULT" | awk '{print $2}')
NOTFOUND=$(echo "$RESULT" | awk '{print $3}')
echo "      ✅ $DISABLED apps desactivadas ($ALREADY ya estaban, $NOTFOUND no encontradas)"

# ─── 4. CACHE LIGERA ───
echo "[4/5] 🗑️  Cache ligera..."
adb shell pm trim-caches 256M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
echo "      ✅ Cache limpiada"

# ─── 5. RED ───
echo "[5/5] 🌐 Optimizando red..."
adb shell settings put global wifi_scan_always_enabled 0 2>/dev/null
echo "      ✅ WiFi scanning desactivado"

echo ""
echo "════════════════════════════════════════════"
echo "📱 ¡PERFIL EQUILIBRADO APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones:  0.5x"
echo "   GPU:          Forzada"
echo "   Bloatware:    $DISABLED apps (seguras)"
echo "   Cache:        Ligera"
echo "   Red:          WiFi scanning desactivado"
echo ""
echo "   💾 Rescue point: $RESCUE_NAME"
echo "   Para revertir: ./emergencia.sh o ./rescue.sh"
echo ""
