#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — Perfil BATERÍA
#  Para: máxima duración de batería
#  Animaciones 0.5x + kill apps + sin GPU
# ═══════════════════════════════════════════

set -e

echo ""
echo "🔋 PERFIL BATERÍA — Phone Optimizer v2.1"
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

# ─── 2. BLOATWARE (apps que drenan batería) ───
echo "[2/4] 🧹 Desactivando apps que drenan batería..."
BLOAT=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
)

DISABLED=0
for PKG in "${BLOAT[@]}"; do
    OUT=$(adb shell pm disable-user --user 0 "$PKG" 2>&1)
    if echo "$OUT" | grep -q "disabled\|Success"; then
        DISABLED=$((DISABLED + 1))
    fi
done
echo "      ✅ $DISABLED apps desactivadas"

# ─── 3. KILL APPS ───
echo "[3/4] 💀 Cerrando apps en segundo plano..."
APPS=(
    "com.facebook.katana"
    "com.instagram.android"
    "com.zhiliaoapp.musically"
    "com.google.android.youtube"
    "com.snapchat.android"
    "com.twitter.android"
    "com.spotify.music"
    "com.whatsapp"
)
KILLED=0
for APP in "${APPS[@]}"; do
    adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
echo "      ✅ $KILLED apps cerradas"

# ─── 4. CACHE ───
echo "[4/4] 🗑️  Limpiando cache..."
adb shell pm trim-caches 256M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
echo "      ✅ Cache limpiada"

echo ""
echo "════════════════════════════════════════════"
echo "🔋 ¡PERFIL BATERÍA APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones: 0.5x"
echo "   GPU:         Sin cambios (ahorra batería)"
echo "   Bloatware:   $DISABLED apps desactivadas"
echo "   Apps cerradas: $KILLED"
echo ""
echo "   Para revertir: ./emergencia.sh"
echo ""
