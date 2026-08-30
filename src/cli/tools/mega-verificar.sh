#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🔍 VERIFICADOR MEGA OPTIMIZER
#  Verifica que todas las optimizaciones se aplicaron correctamente
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# config.sh vive en ../core/, no en este directorio (mismo bug que BUG 1 de
# optimize-boot.sh). Acá era más grave que en los otros scripts: con el path
# viejo el source fallaba en silencio y dejaba $ANIM_POCO_MODE, $SWAPPINESS_
# PERFORMANCE, $MAX_CACHED_PROCESSES, $DALVIK_HEAP, $DNS_VALIDITY y $TCP_RWND
# todos vacíos — "grep -q ''" contra cualquier valor real siempre matchea, así
# que TODOS los checks de animaciones/memoria/red reportaban ✅ PASS sin
# importar el valor real del dispositivo. El score final quedaba inflado.
source "$SCRIPT_DIR/../core/config.sh"

PASS=0
FAIL=0

check() {
    local name="$1"
    local expected="$2"
    local actual="$3"
    
    if echo "$actual" | grep -q "$expected"; then
        echo -e "  ${GREEN}✅ $name${NC} → $actual"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}❌ $name${NC} → esperado: $expected | actual: $actual"
        FAIL=$((FAIL + 1))
    fi
}

echo ""
echo -e "${BOLD}🔍 VERIFICADOR MEGA OPTIMIZER${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo -e "  📱 $DEVICE (Android $ANDROID)"
echo ""

# ANIMACIONES — el CLI las aplica en namespace "system" (ver engines/performance.sh),
# no "global": HyperOS 3 no parece leer las claves de animación desde Settings.Global
# (quedan en 0.0 ahí incluso con "system" en 0.3, verificado con el dispositivo real
# 30/08/2026). Chequear "global" acá siempre daba falso negativo.
echo -e "${CYAN}  🎬 ANIMACIONES${NC}"
WIN=$(adb shell settings get system window_animation_scale 2>/dev/null | tr -d '\r')
TRANS=$(adb shell settings get system transition_animation_scale 2>/dev/null | tr -d '\r')
ANIM=$(adb shell settings get system animator_duration_scale 2>/dev/null | tr -d '\r')
check "Window animation" "$ANIM_POCO_MODE" "$WIN"
check "Transition animation" "$ANIM_POCO_MODE" "$TRANS"
check "Animator duration" "$ANIM_POCO_MODE" "$ANIM"

# GPU
echo ""
echo -e "${CYAN}  🎨 GPU${NC}"
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
MSAA=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')
VK=$(adb shell settings get global debug.hwui.renderer 2>/dev/null | tr -d '\r')
check "Force GPU rendering" "1" "$GPU"
check "Force MSAA" "1" "$MSAA"
check "Vulkan renderer" "skiavk" "$VK"

# RESOLUCIÓN
echo ""
echo -e "${CYAN}  🖥️  RESOLUCIÓN${NC}"
SIZE=$(adb shell wm size 2>/dev/null | grep "Override size" | grep -o '[0-9]*x[0-9]*')
DPI=$(adb shell wm density 2>/dev/null | grep "Override density" | grep -o '[0-9]*')
if [ -z "$SIZE" ]; then
    echo -e "  ${YELLOW}⚠️  Resolución: sin override (fábrica)${NC}"
else
    echo -e "  ${GREEN}✅ Resolución override: $SIZE${NC}"
    PASS=$((PASS + 1))
fi
if [ -n "$DPI" ]; then
    echo -e "  ${GREEN}✅ DPI override: $DPI${NC}"
    PASS=$((PASS + 1))
fi

# MEMORIA
echo ""
echo -e "${CYAN}  💾 MEMORIA${NC}"
SWAP=$(adb shell settings get global sys_swappiness 2>/dev/null | tr -d '\r')
PROC=$(adb shell settings get global activity_manager_constants 2>/dev/null | tr -d '\r')
HEAP=$(adb shell settings get global dalvik_vm_heapsize 2>/dev/null | tr -d '\r')
check "Swappiness" "$SWAPPINESS_PERFORMANCE" "$SWAP"
check "Max cached processes" "$MAX_CACHED_PROCESSES" "$PROC"
check "Dalvik heap" "$DALVIK_HEAP" "$HEAP"

# RED
echo ""
echo -e "${CYAN}  🌐 RED${NC}"
DNS=$(adb shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null | tr -d '\r')
TCP=$(adb shell settings get global tcp_default_init_rwnd 2>/dev/null | tr -d '\r')
WIFI=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
check "DNS validity" "$DNS_VALIDITY" "$DNS"
check "TCP window" "$TCP_RWND" "$TCP"
check "WiFi scan disabled" "0" "$WIFI"

# BLOATWARE
echo ""
echo -e "${CYAN}  📦 BLOATWARE${NC}"
DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:")
TOTAL=$(adb shell pm list packages 2>/dev/null | grep -c "package:")
echo -e "  📊 Apps desactivadas: ${BOLD}$DISABLED${NC} de $TOTAL"
if [ "$DISABLED" -gt 30 ]; then
    echo -e "  ${GREEN}✅ Bloatware significativo eliminado${NC}"
    PASS=$((PASS + 1))
else
    echo -e "  ${YELLOW}⚠️  Pocas apps desactivadas ($DISABLED)${NC}"
    FAIL=$((FAIL + 1))
fi

# REFRESH RATE
echo ""
echo -e "${CYAN}  🔄 REFRESH RATE${NC}"
RATE=$(adb shell settings get system peak_refresh_rate 2>/dev/null | tr -d '\r')
check "Peak refresh rate" "90" "$RATE"

# RAM STATUS
echo ""
echo -e "${CYAN}  📊 ESTADO ACTUAL DE RAM${NC}"
MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    MEM_AVAIL_GB=$(awk "BEGIN {printf \"%.1f\", $MEM_AVAIL / 1048576}" 2>/dev/null)
    echo -e "  RAM disponible: ${BOLD}${MEM_AVAIL_GB}GB${NC} ($(( 100 - MEM_PCT ))% libre)"
fi

# BATERÍA
echo ""
echo -e "${CYAN}  🔋 BATERÍA${NC}"
# Anclado — "Capacity level:" también matchea un grep suelto de "level:"
BATT=$(adb shell dumpsys battery 2>/dev/null | grep -E "^\s*level:" | grep -o '[0-9]*' | head -1)
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(awk "BEGIN {printf \"%.1f\", $TEMP / 10}" 2>/dev/null)
echo -e "  Nivel: ${BOLD}${BATT}%${NC} | Temperatura: ${TEMP_C}°C"

# SCORE
echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
SCORE=$((PASS * 100 / TOTAL))
echo -e "  ${BOLD}📊 SCORE: $PASS/$TOTAL ($SCORE%)${NC}"
if [ "$SCORE" -ge 90 ]; then
    echo -e "  ${GREEN}🔥 ¡MÁXIMA OPTIMIZACIÓN!${NC}"
elif [ "$SCORE" -ge 70 ]; then
    echo -e "  ${GREEN}✅ Buena optimización${NC}"
elif [ "$SCORE" -ge 50 ]; then
    echo -e "  ${YELLOW}⚠️  Optimización parcial${NC}"
else
    echo -e "  ${RED}❌ Pocas optimizaciones aplicadas${NC}"
fi
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""
