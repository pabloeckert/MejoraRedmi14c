#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  REPARACIÓN RÁPIDA — MejoraRedmi14c v5.0

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"
#  Arregla los problemas más comunes causados por los tweaks
#  Sin restaurar TODO (más rápido y selectivo que emergencia.sh)
#
#  Casos de uso:
#  - Pantalla en rectángulo (resolución rota por perfil gaming)
#  - Iconos gigantes (DPI cambiado)
#  - Teléfono lento después de un tweak
#  - Apps que no arrancan (bloatware desactivado por error)
#  - WiFi o red rota
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "🔧 REPARACIÓN RÁPIDA — MejoraRedmi14c v$VERSION"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    echo "   Conectá tu teléfono por USB y activá la depuración USB."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo "📱 Dispositivo: $DEVICE (Android $ANDROID)"
echo ""

# ─── DETECTAR PROBLEMAS ───
echo "🔍 Detectando problemas..."
echo ""

PROBLEMS=0
FIXED=0

# 1. Verificar resolución
CURRENT_SIZE=$(adb shell wm size 2>/dev/null)
PHYSICAL_SIZE=$(echo "$CURRENT_SIZE" | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
OVERRIDE_SIZE=$(echo "$CURRENT_SIZE" | grep "Override size:" | grep -o '[0-9]*x[0-9]*')

if [ -n "$OVERRIDE_SIZE" ]; then
    echo -e "  ${RED}🖥️  PROBLEMA: Resolución alterada${NC}"
    echo "     Física: $PHYSICAL_SIZE → Override: $OVERRIDE_SIZE"
    echo "     Esto causa pantalla en rectángulo o iconos raros"
    PROBLEMS=$((PROBLEMS + 1))

    read -p "  ¿Reparar resolución? [S/n]: " FIX_SIZE
    if [ "$FIX_SIZE" != "n" ] && [ "$FIX_SIZE" != "N" ]; then
        adb shell wm size reset 2>/dev/null
        echo -e "  ${GREEN}✅ Resolución restaurada a $PHYSICAL_SIZE${NC}"
        FIXED=$((FIXED + 1))
    fi
else
    echo -e "  ${GREEN}✅ Resolución: $PHYSICAL_SIZE (normal)${NC}"
fi

# 2. Verificar DPI
CURRENT_DPI=$(adb shell wm density 2>/dev/null)
PHYSICAL_DPI=$(echo "$CURRENT_DPI" | grep "Physical density:" | grep -o '[0-9]*')
OVERRIDE_DPI=$(echo "$CURRENT_DPI" | grep "Override density:" | grep -o '[0-9]*')

if [ -n "$OVERRIDE_DPI" ]; then
    echo -e "  ${RED}🖥️  PROBLEMA: DPI alterado${NC}"
    echo "     Físico: ${PHYSICAL_DPI}dpi → Override: ${OVERRIDE_DPI}dpi"
    echo "     Esto causa iconos gigantes o pantalla rara"
    PROBLEMS=$((PROBLEMS + 1))

    read -p "  ¿Reparar DPI? [S/n]: " FIX_DPI
    if [ "$FIX_DPI" != "n" ] && [ "$FIX_DPI" != "N" ]; then
        adb shell wm density reset 2>/dev/null
        echo -e "  ${GREEN}✅ DPI restaurado a ${PHYSICAL_DPI}${NC}"
        FIXED=$((FIXED + 1))
    fi
else
    echo -e "  ${GREEN}✅ DPI: ${PHYSICAL_DPI} (normal)${NC}"
fi

# 3. Verificar animaciones
WIN_ANIM=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
TRANS_ANIM=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')
DUR_ANIM=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')

if [ "$WIN_ANIM" = "null" ] || [ -z "$WIN_ANIM" ]; then
    WIN_ANIM="1"
fi

# Solo marcar como problema si las animaciones están desactivadas (0) o inconsistentes
if [ "$WIN_ANIM" = "0" ] || [ "$TRANS_ANIM" = "0" ] || [ "$DUR_ANIM" = "0" ]; then
    echo -e "  ${YELLOW}🎬 PROBLEMA: Animaciones desactivadas${NC}"
    echo "     window=$WIN_ANIM, transition=$TRANS_ANIM, animator=$DUR_ANIM"
    PROBLEMS=$((PROBLEMS + 1))

    read -p "  ¿Restaurar animaciones a 1x? [S/n]: " FIX_ANIM
    if [ "$FIX_ANIM" != "n" ] && [ "$FIX_ANIM" != "N" ]; then
        adb shell settings put global window_animation_scale 1
        adb shell settings put global transition_animation_scale 1
        adb shell settings put global animator_duration_scale 1
        echo -e "  ${GREEN}✅ Animaciones restauradas a 1x${NC}"
        FIXED=$((FIXED + 1))
    fi
elif [ "$WIN_ANIM" != "$TRANS_ANIM" ] || [ "$TRANS_ANIM" != "$DUR_ANIM" ]; then
    echo -e "  ${YELLOW}🎬 PROBLEMA: Animaciones inconsistentes${NC}"
    echo "     window=$WIN_ANIM, transition=$TRANS_ANIM, animator=$DUR_ANIM"
    PROBLEMS=$((PROBLEMS + 1))

    read -p "  ¿Igualar animaciones a 1x? [S/n]: " FIX_ANIM
    if [ "$FIX_ANIM" != "n" ] && [ "$FIX_ANIM" != "N" ]; then
        adb shell settings put global window_animation_scale 1
        adb shell settings put global transition_animation_scale 1
        adb shell settings put global animator_duration_scale 1
        echo -e "  ${GREEN}✅ Animaciones restauradas a 1x${NC}"
        FIXED=$((FIXED + 1))
    fi
else
    echo -e "  ${GREEN}✅ Animaciones: ${WIN_ANIM}x (consistentes)${NC}"
fi

# 4. Verificar apps críticas del sistema
CRITICAL_APPS=(
    "com.android.systemui"
    "com.android.settings"
    "com.android.phone"
    "com.miui.home"
    "com.android.vending"
    "com.google.android.gms"
)

DISABLED_LIST=$(adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r')
BROKEN_APPS=()

for PKG in "${CRITICAL_APPS[@]}"; do
    if echo "$DISABLED_LIST" | grep -q "$PKG"; then
        BROKEN_APPS+=("$PKG")
    fi
done

if [ ${#BROKEN_APPS[@]} -gt 0 ]; then
    echo -e "  ${RED}📦 PROBLEMA: Apps críticas desactivadas${NC}"
    for APP in "${BROKEN_APPS[@]}"; do
        echo "     ❌ $APP"
    done
    PROBLEMS=$((PROBLEMS + 1))

    read -p "  ¿Reactivar apps críticas? [S/n]: " FIX_APPS
    if [ "$FIX_APPS" != "n" ] && [ "$FIX_APPS" != "N" ]; then
        for APP in "${BROKEN_APPS[@]}"; do
            adb shell pm enable "$APP" 2>/dev/null
        done
        echo -e "  ${GREEN}✅ ${#BROKEN_APPS[@]} apps críticas reactivadas${NC}"
        FIXED=$((FIXED + 1))
    fi
else
    echo -e "  ${GREEN}✅ Apps críticas: todas activas${NC}"
fi

# 5. Verificar WiFi scanning
WIFI_SCAN=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
if [ "$WIFI_SCAN" = "0" ]; then
    echo -e "  ${CYAN}📶 WiFi scanning: desactivado (ahorra batería)${NC}"
else
    echo -e "  ${CYAN}📶 WiFi scanning: activado${NC}"
fi

# 6. Verificar GPU rendering
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
if [ "$GPU" = "1" ]; then
    echo -e "  ${CYAN}🎨 GPU rendering: forzado${NC}"
else
    echo -e "  ${CYAN}🎨 GPU rendering: por defecto${NC}"
fi

# 7. Verificar bloatware desactivado
DISABLED_COUNT=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
echo -e "  ${CYAN}📦 Apps desactivadas: $DISABLED_COUNT${NC}"

echo ""
echo "════════════════════════════════════════════"

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ ¡TODO ESTÁ BIEN! No se encontraron problemas.${NC}"
else
    echo -e "${GREEN}🔧 Reparación completada: $FIXED/$PROBLEMS problemas corregidos${NC}"
fi

echo "════════════════════════════════════════════"
echo ""

if [ $FIXED -gt 0 ]; then
    echo "   💡 Si algo sigue raro, reiniciá el teléfono."
    echo "   💡 Para restaurar TODO: ./emergencia.sh"
fi
echo ""
