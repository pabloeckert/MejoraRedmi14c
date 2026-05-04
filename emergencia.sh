#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — MODO EMERGENCIA
#  Restaura TODO a los valores de fábrica
#  Usar cuando algo anda mal después de optimizar
# ═══════════════════════════════════════════

set -e

echo ""
echo "🚨 MODO EMERGENCIA — Phone Optimizer v2.1"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo "📱 Dispositivo: $DEVICE (Android $ANDROID)"
echo ""

# ─── 1. RESTAURAR APPS DEL SISTEMA ───
echo "[1/4] 🔄 Reactivando apps del sistema..."
APPS=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.hybrid"
    "com.miui.bugreport"
    "com.miui.cloudbackup"
    "com.miui.cloudservice"
    "com.miui.micloudsync"
    "com.xiaomi.glgm"
)

RESTORED=0
for PKG in "${APPS[@]}"; do
    OUT=$(adb shell pm enable "$PKG" 2>&1)
    if echo "$OUT" | grep -q "enabled\|new state: enabled"; then
        RESTORED=$((RESTORED + 1))
    fi
done

# También restaurar cualquier otra app desactivada
EXTRA=0
DISABLED_LIST=$(adb shell pm list packages -d 2>/dev/null | grep "package:" | sed 's/package://')
for PKG in $DISABLED_LIST; do
    PKG=$(echo "$PKG" | tr -d '\r')
    OUT=$(adb shell pm enable "$PKG" 2>&1)
    if echo "$OUT" | grep -q "enabled\|new state: enabled"; then
        EXTRA=$((EXTRA + 1))
    fi
done
echo "      ✅ $RESTORED apps del sistema + $EXTRA apps adicionales reactivadas"

# ─── 2. RESTAURAR ANIMACIONES ───
echo "[2/4] 🎬 Restaurando animaciones a 1x..."
adb shell settings put global window_animation_scale 1
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
echo "      ✅ Animaciones restauradas"

# ─── 3. RESTAURAR GPU ───
echo "[3/4] 🎨 Restaurando GPU a valores por defecto..."
adb shell settings delete global force_gpu_rendering 2>/dev/null
adb shell settings delete global force_msaa 2>/dev/null
echo "      ✅ GPU restaurada"

# ─── 4. REPARAR PERMISOS ───
echo "[4/4] 🔧 Reparando permisos del sistema..."
adb shell pm grant com.android.systemui android.permission.SYSTEM_ALERT_WINDOW 2>/dev/null
echo "      ✅ Permisos reparados"

echo ""
echo "════════════════════════════════════════════"
echo "🚨 ¡SISTEMA RESTAURADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Apps reactivadas:     $RESTORED + $EXTRA adicionales"
echo "   Animaciones:          1x (normal)"
echo "   GPU:                  Por defecto"
echo "   Permisos:             Reparados"
echo ""
echo "   El teléfono debería funcionar como antes."
echo "   Si sigue lento, reiniciá el teléfono."
echo ""
