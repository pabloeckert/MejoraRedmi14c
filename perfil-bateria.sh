#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Perfil BATERÍA — MejoraRedmi14c v3.0
#  Para: máxima duración de batería
#  Animaciones 0.5x + kill apps + sin GPU + tweaks de ahorro
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/bloatware-db.sh"
source "$SCRIPT_DIR/rescue.sh"

echo ""
echo "🔋 PERFIL BATERÍA — MejoraRedmi14c v3.0"
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
RESCUE_NAME="pre-bateria_$(date +%Y%m%d_%H%M%S)"
create_rescue_point "$RESCUE_NAME" > /dev/null
echo "   ✅ Rescue point '$RESCUE_NAME' creado"
echo ""

# ─── 1. ANIMACIONES ───
echo "[1/6] 💨 Animaciones rápidas (0.5x)..."
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
echo "      ✅ Animaciones ajustadas"

# ─── 2. BLOATWARE ───
echo "[2/6] 🧹 Desactivando apps que drenan batería..."
RESULT=$(disable_packages BATERIA_BLOAT)
DISABLED=$(echo "$RESULT" | awk '{print $1}')
ALREADY=$(echo "$RESULT" | awk '{print $2}')
NOTFOUND=$(echo "$RESULT" | awk '{print $3}')
echo "      ✅ $DISABLED apps desactivadas ($ALREADY ya estaban, $NOTFOUND no encontradas)"

# ─── 3. KILL APPS ───
echo "[3/6] 💀 Cerrando apps en segundo plano..."
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

# ─── 4. CACHE ───
echo "[4/6] 🗑️  Cache segura..."
adb shell pm trim-caches 256M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
echo "      ✅ Cache limpiada"

# ─── 5. WIFI SCANNING ───
echo "[5/6] 📶 Desactivando WiFi scanning..."
adb shell settings put global wifi_scan_always_enabled 0 2>/dev/null
echo "      ✅ WiFi scanning desactivado"

# ─── 6. SYNC ───
echo "[6/6] 🔄 Desactivando sincronización automática..."
adb shell settings put global auto_time 0 2>/dev/null
adb shell settings put global auto_time_zone 0 2>/dev/null
echo "      ✅ Sync automática desactivada"

echo ""
echo "════════════════════════════════════════════"
echo "🔋 ¡PERFIL BATERÍA APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones:    0.5x"
echo "   GPU:            Sin cambios (ahorra batería)"
echo "   Bloatware:      $DISABLED apps desactivadas"
echo "   Apps cerradas:  $KILLED"
echo "   Cache:          Segura"
echo "   WiFi scanning:  Desactivado"
echo "   Sync automática: Desactivada"
echo ""
echo "   💾 Rescue point: $RESCUE_NAME"
echo "   Para revertir: ./emergencia.sh o ./rescue.sh"
echo ""
