#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — DIAGNÓSTICO
#  Verifica el estado del dispositivo
# ═══════════════════════════════════════════

echo ""
echo "🔍 DIAGNÓSTICO — Phone Optimizer v2.1"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    exit 1
fi

MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
BUILD=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')

echo "📱 $MFR $MODEL"
echo "   Android $ANDROID (SDK $SDK)"
echo "   Build: $BUILD"
echo ""

# ─── CHECKS ───
echo "Estado del sistema:"
echo "─────────────────────────────────"

# Animaciones
ANIM=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
if [ "$ANIM" = "1" ] || [ "$ANIM" = "null" ] || [ -z "$ANIM" ]; then
    echo "  🎬 Animaciones:     $ANIM (normal)"
elif [ "$(echo "$ANIM < 1" | bc 2>/dev/null)" = "1" ]; then
    echo "  🎬 Animaciones:     $ANIM (optimizado ⚡)"
else
    echo "  🎬 Animaciones:     $ANIM"
fi

# GPU
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
if [ "$GPU" = "1" ]; then
    echo "  🎨 GPU Rendering:   Forzada ⚡"
else
    echo "  🎨 GPU Rendering:   Por defecto"
fi

# Batería
BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null || echo "?")
CHARGING=$(adb shell dumpsys battery 2>/dev/null | grep "powered:" | grep -o 'true\|false')
echo "  🔋 Batería:         ${BATTERY}% (${TEMP_C}°C)"

# RAM
MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    MEM_TOTAL_GB=$(echo "scale=1; $MEM_TOTAL / 1048576" | bc 2>/dev/null || echo "?")
    MEM_USED_GB=$(echo "scale=1; $MEM_USED / 1048576" | bc 2>/dev/null || echo "?")
    echo "  💾 RAM:             ${MEM_USED_GB}/${MEM_TOTAL_GB} GB (${MEM_PCT}%)"
fi

# CPU
LOAD=$(adb shell cat /proc/loadavg 2>/dev/null | cut -d' ' -f1)
CORES=$(adb shell nproc 2>/dev/null | tr -d '\r')
if [ -n "$LOAD" ] && [ -n "$CORES" ]; then
    CPU_PCT=$(echo "scale=0; $LOAD * 100 / $CORES" | bc 2>/dev/null || echo "?")
    echo "  ⚡ CPU:             ${CPU_PCT}% (load: $LOAD, $CORES cores)"
fi

# Almacenamiento
STORAGE=$(adb shell df /data 2>/dev/null | tail -1)
if [ -n "$STORAGE" ]; then
    TOTAL_KB=$(echo "$STORAGE" | awk '{print $2}')
    USED_KB=$(echo "$STORAGE" | awk '{print $3}')
    if [ -n "$TOTAL_KB" ] && [ "$TOTAL_KB" -gt 0 ] 2>/dev/null; then
        TOTAL_GB=$(echo "scale=1; $TOTAL_KB / 1048576" | bc 2>/dev/null || echo "?")
        USED_GB=$(echo "scale=1; $USED_KB / 1048576" | bc 2>/dev/null || echo "?")
        echo "  💿 Almacenamiento:  ${USED_GB}/${TOTAL_GB} GB"
    fi
fi

# Apps desactivadas
DISABLED_COUNT=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
echo "  📦 Apps desactivadas: $DISABLED_COUNT"

# SELinux
SELINUX=$(adb shell getenforce 2>/dev/null | tr -d '\r')
echo "  🔒 SELinux:         $SELINUX"

echo ""
echo "════════════════════════════════════════════"
echo ""
