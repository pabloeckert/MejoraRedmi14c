#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — Perfil RENDIMIENTO
#  Para: quien quiere que el teléfono vuele
#  Animaciones 0.3x + GPU + 21 apps desactivadas
# ═══════════════════════════════════════════

set -e

echo ""
echo "🚀 PERFIL RENDIMIENTO — Phone Optimizer v2.1"
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

# ─── 1. ANIMACIONES ───
echo "[1/5] ⚡ Animaciones ultra rápido (0.3x)..."
adb shell settings put global window_animation_scale 0.3
adb shell settings put global transition_animation_scale 0.3
adb shell settings put global animator_duration_scale 0.3
echo "      ✅ Animaciones ajustadas"

# ─── 2. GPU ───
echo "[2/5] 🎨 Forzando renderizado GPU..."
adb shell settings put global force_gpu_rendering 1
adb shell settings put global force_msaa 1
echo "      ✅ GPU rendering activado"

# ─── 3. BLOATWARE ───
echo "[3/5] 🧹 Desactivando bloatware..."
BLOAT=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.miui.hybrid"
    "com.xiaomi.glgm"
    "com.google.android.music"
    "com.google.android.videos"
    "com.google.android.apps.googleassistant"
    "com.google.ar.lens"
    "com.google.android.apps.turbo"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.amazon.appmanager"
    "com.netflix.partner.activation"
)

DISABLED=0
NOTFOUND=0
for PKG in "${BLOAT[@]}"; do
    OUT=$(adb shell pm disable-user --user 0 "$PKG" 2>&1)
    if echo "$OUT" | grep -q "disabled\|Success"; then
        DISABLED=$((DISABLED + 1))
    else
        NOTFOUND=$((NOTFOUND + 1))
    fi
done
echo "      ✅ $DISABLED apps desactivadas, $NOTFOUND no encontradas"

# ─── 4. KILL APPS ───
echo "[4/5] 💀 Cerrando apps pesadas..."
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

# ─── 5. CACHE ───
echo "[5/5] 🗑️  Limpiando cache..."
adb shell pm trim-caches 512M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
adb shell "rm -rf /data/local/tmp/*" 2>/dev/null
adb shell "rm -rf /data/tombstones/*" 2>/dev/null
adb shell "rm -rf /data/anr/*" 2>/dev/null
echo "      ✅ Cache limpiada"

echo ""
echo "════════════════════════════════════════════"
echo "🚀 ¡PERFIL RENDIMIENTO APLICADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Animaciones: 0.3x"
echo "   GPU:         Forzada"
echo "   Bloatware:   $DISABLED apps desactivadas"
echo "   Cache:       Profunda"
echo ""
echo "   Para revertir: ./emergencia.sh"
echo ""
