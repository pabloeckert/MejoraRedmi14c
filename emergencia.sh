#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  MODO EMERGENCIA — MejoraRedmi14c v3.0
#  Restaura TODO a los valores de fábrica
#  Usar cuando algo anda mal después de optimizar
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/rescue.sh"

echo ""
echo "🚨 MODO EMERGENCIA — MejoraRedmi14c v3.0"
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

# ─── 0. VER SI HAY RESCUE POINT ───
RESCUE_DIR="$SCRIPT_DIR/rescue-points"
if [ -d "$RESCUE_DIR" ] && [ -n "$(ls -A "$RESCUE_DIR" 2>/dev/null)" ]; then
    echo "💾 Se encontraron rescue points. ¿Restaurar desde uno?"
    echo ""
    list_rescue_points
    read -p "  Nombre del rescue point (Enter para restaurar manualmente): " RP_NAME
    if [ -n "$RP_NAME" ] && [ -d "$RESCUE_DIR/$RP_NAME" ]; then
        restore_rescue_point "$RP_NAME"
        echo ""
        echo "   ⚠️  Si algo sigue mal, reiniciá el teléfono."
        echo ""
        exit 0
    fi
    echo ""
    echo "  Procediendo con restauración manual..."
    echo ""
fi

# ─── 1. RESTAURAR APPS DEL SISTEMA ───
echo "[1/6] 🔄 Reactivando apps del sistema..."
APPS=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.miui.hybrid"
    "com.miui.msightservice"
    "com.miui.thirdappassistant"
    "com.miui.miservice"
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.miui.cloudbackup"
    "com.miui.cloudservice"
    "com.miui.micloudsync"
    "com.miui.globalminuscreen"
    "com.miui.yellowpage"
    "com.miui.accessibility"
    "com.xiaomi.glgm"
    "com.xiaomi.scanner"
    "com.xiaomi.finddevice"
    "com.xiaomi.payment"
    "com.xiaomi.mispicks"
    "com.xiaomi.aiasst.vision"
    "com.mipay.wallet"
    "com.miui.voiceassist"
    "com.miui.weather2"
    "com.miui.gallery.editor"
    "com.miui.notes"
    "com.miui.screenrecorder"
    "com.miui.calculator"
    "com.mi.globalbrowser"
    "com.miui.player"
    "com.miui.video"
    "com.google.android.adservices.api"
    "com.google.android.marvin.talkback"
    "com.google.android.videos"
    "com.google.android.apps.tachyon"
    "com.google.android.feedback"
    "com.google.android.onetimeinitializer"
    "com.google.android.gms.supervision"
    "com.google.android.apps.youtube.music"
    "com.google.android.apps.photos"
    "com.google.android.apps.messaging"
    "com.android.chrome"
    "com.android.ondevicepersonalization.services"
    "com.android.providers.partnerbookmarks"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.microsoft.appmanager"
    "com.android.carrierdefaultinstaller"
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
echo "[2/6] 🎬 Restaurando animaciones a 1x..."
adb shell settings put global window_animation_scale 1
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
echo "      ✅ Animaciones restauradas"

# ─── 3. RESTAURAR GPU ───
echo "[3/6] 🎨 Restaurando GPU a valores por defecto..."
adb shell settings delete global force_gpu_rendering 2>/dev/null
adb shell settings delete global force_msaa 2>/dev/null
adb shell settings delete global debug.hwui.renderer 2>/dev/null
adb shell settings delete global debug.hwui.disable_draw_defer 2>/dev/null
adb shell settings delete global debug.hwui.disable_draw_reorder 2>/dev/null
echo "      ✅ GPU restaurada"

# ─── 4. RESTAURAR RESOLUCIÓN ───
echo "[4/6] 🖥️  Restaurando resolución..."
adb shell wm size reset 2>/dev/null
adb shell wm density reset 2>/dev/null
echo "      ✅ Resolución restaurada"

# ─── 5. RESTAURAR RED Y MEMORIA ───
echo "[5/6] 🌐💾 Restaurando red y memoria..."
# Red
adb shell settings delete global dns_resolver_sample_validity_seconds 2>/dev/null
adb shell settings delete global tcp_default_init_rwnd 2>/dev/null
adb shell settings put global wifi_scan_always_enabled 1 2>/dev/null
adb shell settings put global data_roaming 0 2>/dev/null
# Memoria
adb shell settings delete global sys_swappiness 2>/dev/null
adb shell settings delete global activity_manager_constants 2>/dev/null
adb shell settings delete global dalvik_vm_heapsize 2>/dev/null
adb shell settings delete global dalvik_vm_heapgrowthlimit 2>/dev/null
# HWUI
adb shell settings delete global hwui_texture_cache_size 2>/dev/null
adb shell settings delete global hwui_layer_cache_size 2>/dev/null
adb shell settings delete global hwui_r_buffer_cache_size 2>/dev/null
adb shell settings delete global hwui_gradient_cache_size 2>/dev/null
# Sync
adb shell settings put global auto_time 1 2>/dev/null
adb shell settings put global auto_time_zone 1 2>/dev/null
echo "      ✅ Red y memoria restauradas"

# ─── 6. REPARAR PERMISOS ───
echo "[6/6] 🔧 Reparando permisos del sistema..."
adb shell pm grant com.android.systemui android.permission.SYSTEM_ALERT_WINDOW 2>/dev/null
adb shell pm grant com.android.systemui android.permission.READ_PHONE_STATE 2>/dev/null
echo "      ✅ Permisos reparados"

echo ""
echo "════════════════════════════════════════════"
echo "🚨 ¡SISTEMA RESTAURADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Apps reactivadas:     $RESTORED + $EXTRA adicionales"
echo "   Animaciones:          1x (normal)"
echo "   GPU:                  Por defecto"
echo "   Resolución:           Restaurada"
echo "   Red/Memoria:          Por defecto"
echo "   Permisos:             Reparados"
echo ""
echo "   El teléfono debería funcionar como antes."
echo "   Si sigue lento, reiniciá el teléfono."
echo ""
