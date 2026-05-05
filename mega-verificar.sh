#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🔍 VERIFICADOR MEGA OPTIMIZER
#  Verifica que todas las optimizaciones se aplicaron correctamente
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

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

# ANIMACIONES
echo -e "${CYAN}  🎬 ANIMACIONES${NC}"
WIN=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
TRANS=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')
ANIM=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')
check "Window animation" "0.1" "$WIN"
check "Transition animation" "0.1" "$TRANS"
check "Animator duration" "0.1" "$ANIM"

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
check "Swappiness" "30" "$SWAP"
check "Max cached processes" "64" "$PROC"
check "Dalvik heap" "512m" "$HEAP"

# RED
echo ""
echo -e "${CYAN}  🌐 RED${NC}"
DNS=$(adb shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null | tr -d '\r')
TCP=$(adb shell settings get global tcp_default_init_rwnd 2>/dev/null | tr -d '\r')
WIFI=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
check "DNS validity" "600" "$DNS"
check "TCP window" "10" "$TCP"
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

# THERMAL
echo ""
echo -e "${CYAN}  🌡️  THERMAL${NC}"
THERMAL=$(adb shell settings get global thermal_limit_enabled 2>/dev/null | tr -d '\r')
check "Thermal limit disabled" "0" "$THERMAL"

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
    MEM_AVAIL_GB=$(echo "scale=1; $MEM_AVAIL / 1048576" | bc 2>/dev/null)
    echo -e "  RAM disponible: ${BOLD}${MEM_AVAIL_GB}GB${NC} ($(( 100 - MEM_PCT ))% libre)"
fi

# BATERÍA
echo ""
echo -e "${CYAN}  🔋 BATERÍA${NC}"
BATT=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null)
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
