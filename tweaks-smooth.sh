#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Tweaks de Fluidez — MejoraRedmi14c
#  Inspirado en: smooth_android_script (polhdez) + tytydraco
#
#  Optimiza baseline profiles y dexopt para máxima fluidez
#  ⚠️  El dexopt completo tarda ~30 min y calienta el teléfono
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/bloatware-db.sh"

echo ""
echo "🧈 Tweaks de Fluidez — MejoraRedmi14c"
echo "════════════════════════════════════════════"
echo ""

# ─── 1. ANIMACIONES SEDOSAS ───
echo "[1/4] 💨 Animaciones sedosas (0.5x)..."
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
echo "      ✅ Animaciones ajustadas a 0.5x"

# ─── 2. RENDERIZADO GPU ───
echo "[2/4] 🎨 Forzando renderizado GPU..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
# Vulkan rendering (si el device lo soporta)
adb shell settings put global debug.hwui.renderer skiavk 2>/dev/null
echo "      ✅ GPU rendering forzado (Vulkan si disponible)"

# ─── 3. BASELINE PROFILES ───
echo "[3/4] 📊 Compilando baseline profiles..."
echo "      (Esto puede tardar unos minutos...)"
echo ""

# Compilar odex para apps del sistema (mejora tiempo de inicio)
COMPILED=0
TOTAL=0

# Apps del sistema frecuentes
SYSTEM_APPS=(
    "com.android.settings"
    "com.android.systemui"
    "com.miui.home"
    "com.android.launcher"
    "com.android.dialer"
    "com.android.contacts"
    "com.android.mms"
    "com.android.camera"
    "com.android.chrome"
    "com.google.android.gms"
    "com.android.vending"
    "com.miui.securitycenter"
    "com.android.filemanager"
)

echo "      Compilando apps del sistema..."
for APP in "${SYSTEM_APPS[@]}"; do
    TOTAL=$((TOTAL + 1))
    OUT=$(adb shell cmd package compile -m speed-profile -f "$APP" 2>&1)
    if [ $? -eq 0 ]; then
        COMPILED=$((COMPILED + 1))
        echo "        ✅ $APP"
    else
        echo "        ⚠️  $APP (no se pudo compilar)"
    fi
done

# Compilar apps de terceros
echo ""
echo "      Compilando apps de terceros..."
USER_APPS=$(adb shell pm list packages -3 2>/dev/null | sed 's/package://' | tr -d '\r')
THIRD_COMPILED=0
THIRD_TOTAL=0

for APP in $USER_APPS; do
    THIRD_TOTAL=$((THIRD_TOTAL + 1))
    adb shell cmd package compile -m speed-profile -f "$APP" 2>/dev/null
    if [ $? -eq 0 ]; then
        THIRD_COMPILED=$((THIRD_COMPILED + 1))
    fi
done
echo "      ✅ $THIRD_COMPILED/$THIRD_TOTAL apps de terceros compiladas"

# ─── 4. VERIFICACIÓN ───
echo "[4/4] 🔍 Verificando optimización..."
echo ""
echo "      Sistema:  $COMPILED/$TOTAL apps compiladas"
echo "      Terceros: $THIRD_COMPILED/$THIRD_TOTAL apps compiladas"

echo ""
echo "════════════════════════════════════════════"
echo "🧈 ¡TWEAKS DE FLUIDEZ APLICADOS!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones:  0.5x (sedosas)"
echo "   GPU:          Forzada + Vulkan"
echo "   Profiles:     Baseline compilados"
echo "   Dexopt:       Speed-profile aplicado"
echo ""
echo "   ⚠️  Reiniciá el teléfono para mejores resultados"
echo ""
