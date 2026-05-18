#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  ⏱️  BOOT TIMER — Mide tiempo de arranque
#  MejoraRedmi14c — Redmi 14C / HyperOS
#
#  Ejecutá ANTES de optimizar y DESPUÉS del reboot para comparar.
#  Guarda cada medición en logs/boot-times.log
#
#  USO: ./measure-boot.sh
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOT_LOG="$SCRIPT_DIR/logs/boot-times.log"
mkdir -p "$SCRIPT_DIR/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}⏱️  BOOT TIMER — Redmi 14C${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo -e "  📱 ${BOLD}$DEVICE${NC} (Android $ANDROID)"
echo ""

# ─── Uptime ───
UPTIME_SEC=$(adb shell cat /proc/uptime 2>/dev/null | awk '{print int($1)}')
UPTIME_MIN=$((UPTIME_SEC / 60))
UPTIME_REM=$((UPTIME_SEC % 60))
echo -e "  ⏱️  Uptime: ${BOLD}${UPTIME_MIN}m ${UPTIME_REM}s${NC} (${UPTIME_SEC}s)"

# ─── Init time ───
INIT_TIME=$(adb shell getprop ro.boottime.init 2>/dev/null | tr -d '\r')
if [ -n "$INIT_TIME" ]; then
    INIT_SEC=$((INIT_TIME / 1000000000))
    echo -e "  🔧 Init time: ${BOLD}${INIT_SEC}s${NC}"
fi

# ─── Boot completed ───
BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
if [ "$BOOT_COMPLETED" = "1" ]; then
    echo -e "  ✅ Boot completado"
else
    echo -e "  ⏳ Boot aún en progreso..."
fi

# ─── Servicios y procesos ───
SERVICES=$(adb shell dumpsys activity services 2>/dev/null | grep -c "ServiceRecord" || echo "?")
PROCS=$(adb shell ps 2>/dev/null | wc -l)
echo -e "  ⚙️  Servicios: ${BOLD}$SERVICES${NC} | Procesos: ${BOLD}$PROCS${NC}"

# ─── RAM ───
MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED_PCT=$(( (MEM_TOTAL - MEM_AVAIL) * 100 / MEM_TOTAL ))
    MEM_AVAIL_MB=$(( MEM_AVAIL / 1024 ))
    echo -e "  💾 RAM: ${BOLD}${MEM_AVAIL_MB}MB libre${NC} (${MEM_USED_PCT}% usado)"
fi

# ─── Apps desactivadas ───
DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:")
echo -e "  📦 Apps desactivadas: ${BOLD}$DISABLED${NC}"

# ─── WhatsApp y Cámara status ───
WA_STATUS="❌ no compilado"
CAM_STATUS="❌ no compilado"
WA_DEX=$(adb shell dumpsys package com.whatsapp 2>/dev/null | grep -c "speed\|speed-profile" || echo "0")
CAM_DEX=$(adb shell dumpsys package com.android.camera 2>/dev/null | grep -c "speed\|speed-profile" || echo "0")
[ "$WA_DEX" -gt 0 ] && WA_STATUS="✅ compilado"
[ "$CAM_DEX" -gt 0 ] && CAM_STATUS="✅ compilado"
echo -e "  📸 Cámara: $CAM_STATUS"
echo -e "  💬 WhatsApp: $WA_STATUS"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"

# ─── Guardar medición ───
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
cat >> "$BOOT_LOG" << LOG
--- $TIMESTAMP ---
Device: $DEVICE (Android $ANDROID)
Uptime: ${UPTIME_SEC}s
Init: ${INIT_SEC:-?}s
Services: $SERVICES
Processes: $PROCS
RAM: ${MEM_AVAIL_MB:-?}MB free (${MEM_USED_PCT:-?}% used)
Disabled apps: $DISABLED
Boot completed: $BOOT_COMPLETED
Camera: $CAM_STATUS
WhatsApp: $WA_STATUS
LOG

echo ""
echo -e "  📄 Medición guardada en: ${BOLD}$BOOT_LOG${NC}"

# ─── Comparar con medición anterior ───
PREV_COUNT=$(grep -c "^Uptime:" "$BOOT_LOG" 2>/dev/null || echo "0")
if [ "$PREV_COUNT" -gt 1 ]; then
    PREV_UPTIME=$(grep "^Uptime:" "$BOOT_LOG" 2>/dev/null | tail -2 | head -1 | grep -o '[0-9]*')
    if [ -n "$PREV_UPTIME" ] && [ "$PREV_UPTIME" != "$UPTIME_SEC" ]; then
        DIFF=$((PREV_UPTIME - UPTIME_SEC))
        echo ""
        if [ $DIFF -gt 0 ]; then
            echo -e "  ${GREEN}🚀 ¡${DIFF}s más rápido que la medición anterior!${NC}"
        elif [ $DIFF -lt 0 ]; then
            echo -e "  ${YELLOW}⚠️  $((-DIFF))s más lento que la medición anterior${NC}"
        else
            echo -e "  ⏱️  Mismo tiempo que la medición anterior"
        fi
    fi
fi

echo ""
echo -e "  💡 Ejecutá esto ANTES de optimizar y DESPUÉS del reboot"
echo -e "     para ver la diferencia real."
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""
