#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🚨 RESTAURADOR MEGA OPTIMIZER
#  Restaura TODO a valores de fábrica
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}🚨 RESTAURADOR MEGA OPTIMIZER${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
echo -e "  📱 Dispositivo: ${BOLD}$DEVICE${NC}"
echo ""

read -p "  ¿Restaurar TODO a valores de fábrica? [S/n]: " CONFIRM
if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    echo "  Cancelado."
    exit 0
fi

echo ""
echo "[1/7] 🔄 Reactivando TODAS las apps desactivadas..."

# Reactivar TODAS las apps desactivadas
DISABLED_LIST=$(adb shell pm list packages -d 2>/dev/null | grep "package:" | sed 's/package://')
RESTORED=0
for PKG in $DISABLED_LIST; do
    PKG=$(echo "$PKG" | tr -d '\r')
    OUT=$(adb shell pm enable "$PKG" 2>&1)
    if echo "$OUT" | grep -q "enabled\|new state: enabled"; then
        RESTORED=$((RESTORED + 1))
    fi
done
echo -e "      ${GREEN}✅ $RESTORED apps reactivadas${NC}"

echo "[2/7] 🎬 Restaurando animaciones a 1x..."
adb shell settings put global window_animation_scale 1
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
echo -e "      ${GREEN}✅${NC}"

echo "[3/7] 🎨 Restaurando GPU..."
adb shell settings delete global force_gpu_rendering 2>/dev/null
adb shell settings delete global force_msaa 2>/dev/null
adb shell settings delete global debug.hwui.renderer 2>/dev/null
adb shell settings delete global debug.hwui.disable_draw_defer 2>/dev/null
adb shell settings delete global debug.hwui.disable_draw_reorder 2>/dev/null
echo -e "      ${GREEN}✅${NC}"

echo "[4/7] 🖥️  Restaurando resolución..."
adb shell wm size reset 2>/dev/null
adb shell wm density reset 2>/dev/null
echo -e "      ${GREEN}✅${NC}"

echo "[5/7] 💾 Restaurando memoria..."
adb shell settings delete global sys_swappiness 2>/dev/null
adb shell settings delete global activity_manager_constants 2>/dev/null
adb shell settings delete global dalvik_vm_heapsize 2>/dev/null
adb shell settings delete global dalvik_vm_heapgrowthlimit 2>/dev/null
adb shell settings delete global lmk_minfree_levels 2>/dev/null
adb shell settings delete global hwui_texture_cache_size 2>/dev/null
adb shell settings delete global hwui_layer_cache_size 2>/dev/null
adb shell settings delete global hwui_r_buffer_cache_size 2>/dev/null
adb shell settings delete global hwui_gradient_cache_size 2>/dev/null
echo -e "      ${GREEN}✅${NC}"

echo "[6/7] 🌐 Restaurando red..."
adb shell settings delete global dns_resolver_sample_validity_seconds 2>/dev/null
adb shell settings delete global tcp_default_init_rwnd 2>/dev/null
adb shell settings put global wifi_scan_always_enabled 1 2>/dev/null
adb shell settings put global data_roaming 0 2>/dev/null
adb shell settings delete global network_scoring_ui_enabled 2>/dev/null
echo -e "      ${GREEN}✅${NC}"

echo "[7/7] ⚙️  Restaurando thermal y visual..."
adb shell settings delete global thermal_limit_enabled 2>/dev/null
adb shell cmd power set-fixed-performance-mode-enabled false 2>/dev/null
adb shell settings delete system peak_refresh_rate 2>/dev/null
adb shell settings delete system min_refresh_rate 2>/dev/null
adb shell settings delete global disable_window_blurs 2>/dev/null
adb shell settings delete system pointer_speed 2>/dev/null
adb shell settings delete system haptic_feedback_intensity 2>/dev/null
adb shell settings delete system font_scale 2>/dev/null
adb shell settings put system screen_brightness_mode 1 2>/dev/null
adb shell settings delete system screen_brightness 2>/dev/null
adb shell settings put global bluetooth_always_scanning 1 2>/dev/null
adb shell settings put global nfc_enabled 1 2>/dev/null
adb shell settings put global auto_time 1 2>/dev/null
adb shell settings put global auto_time_zone 1 2>/dev/null
echo -e "      ${GREEN}✅${NC}"

echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${BOLD}🚨 ¡TODO RESTAURADO A FÁBRICA!${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""
echo "   Apps reactivadas:  $RESTORED"
echo "   Animaciones:       1x (normal)"
echo "   GPU:               Por defecto"
echo "   Resolución:        Fábrica"
echo "   Memoria:           Por defecto"
echo "   Red:               Por defecto"
echo "   Thermal:           Reactivado"
echo "   Refresh rate:      Por defecto"
echo ""
echo "   ⚠️  REINICIÁ el teléfono para aplicar los cambios."
echo ""
