#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — Perfil EQUILIBRADO
#  Para: uso diario sin perder funciones
#  Animaciones 0.5x + GPU + solo 3 apps seguras
# ═══════════════════════════════════════════

set -e

echo ""
echo "📱 PERFIL EQUILIBRADO — Phone Optimizer v2.1"
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

# ─── 1. ANIMACIONES ───
echo "[1/4] 💨 Animaciones rápidas (0.5x)..."
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
echo "      ✅ Animaciones ajustadas"

# ─── 2. GPU ───
echo "[2/4] 🎨 Forzando renderizado GPU..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
echo "      ✅ GPU rendering activado"

# ─── 3. BLOATWARE (solo 100% seguro) ───
echo "[3/4] 🧹 Desactivando bloatware seguro..."
BLOAT=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.xiaomi.glgm"
)

DISABLED=0
for PKG in "${BLOAT[@]}"; do
    OUT=$(adb shell pm disable-user --user 0 "$PKG" 2>&1)
    if echo "$OUT" | grep -q "disabled\|Success"; then
        DISABLED=$((DISABLED + 1))
    fi
done
echo "      ✅ $DISABLED apps desactivadas"

# ─── 4. CACHE LIGERA ───
echo "[4/4] 🗑️  Limpiando cache (segura)..."
adb shell pm trim-caches 256M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
echo "      ✅ Cache limpiada"

echo ""
echo "════════════════════════════════════════════"
echo "📱 ¡PERFIL EQUILIBRADO APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones: 0.5x"
echo "   GPU:         Forzada"
echo "   Bloatware:   Solo $DISABLED apps (seguras)"
echo "   Cache:       Ligera"
echo ""
echo "   Para revertir: ./emergencia.sh"
echo ""
