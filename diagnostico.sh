#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  DIAGNÓSTICO — MejoraRedmi14c v3.0
#  Informe completo del estado del dispositivo
#  Inspirado en: BloatwareHatao (device health monitoring)
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔍 DIAGNÓSTICO — MejoraRedmi14c v3.0"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    exit 1
fi

# ─── INFO DEL DISPOSITIVO ───
MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
BUILD=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
SECURITY=$(adb shell getprop ro.build.version.security_patch 2>/dev/null | tr -d '\r')
ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')
SOC=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\r')

echo "📱 $MFR $MODEL"
echo "   Android:     $ANDROID (SDK $SDK)"
echo "   HyperOS:     ${HYPEROS:-N/A}"
echo "   Build:       $BUILD"
echo "   Security:    $SECURITY"
echo "   CPU ABI:     $ABI"
echo "   SoC:         $SOC"
echo ""

# ─── CHECKS DEL SISTEMA ───
echo "╔═══════════════════════════════════════════╗"
echo "║  ESTADO DEL SISTEMA                        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Animaciones
ANIM=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
if [ "$ANIM" = "1" ] || [ "$ANIM" = "null" ] || [ -z "$ANIM" ]; then
    echo "  🎬 Animaciones:       $ANIMx (normal)"
elif [ "$(echo "$ANIM < 1" | bc 2>/dev/null)" = "1" ]; then
    echo "  🎬 Animaciones:       ${ANIM}x (optimizado ⚡)"
else
    echo "  🎬 Animaciones:       ${ANIM}x"
fi

# GPU
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
MSAA=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')
VULKAN=$(adb shell settings get global debug.hwui.renderer 2>/dev/null | tr -d '\r')
if [ "$GPU" = "1" ]; then
    echo "  🎨 GPU Rendering:     Forzada ⚡"
    [ "$MSAA" = "1" ] && echo "  🎨 MSAA:              Activado"
    [ "$VULKAN" = "skiavk" ] && echo "  🎨 Renderer:          Vulkan ⚡"
else
    echo "  🎨 GPU Rendering:     Por defecto"
fi

# Resolución/DPI
SIZE=$(adb shell wm size 2>/dev/null | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
OVERRIDE=$(adb shell wm size 2>/dev/null | grep "Override size:" | grep -o '[0-9]*x[0-9]*')
DPI=$(adb shell wm density 2>/dev/null | grep "Physical density:" | grep -o '[0-9]*')
OVERRIDE_DPI=$(adb shell wm density 2>/dev/null | grep "Override density:" | grep -o '[0-9]*')
echo "  🖥️  Resolución:        $SIZE"
[ -n "$OVERRIDE" ] && echo "  🖥️  Override:           $OVERRIDE (reducida ⚡)"
echo "  🖥️  DPI:               $DPI"
[ -n "$OVERRIDE_DPI" ] && echo "  🖥️  DPI Override:       $OVERRIDE_DPI"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  ESTADO DE HARDWARE                        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Batería
BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null || echo "?")
CHARGING=$(adb shell dumpsys battery 2>/dev/null | grep "AC powered:" | grep -o 'true\|false')
VOLTAGE=$(adb shell dumpsys battery 2>/dev/null | grep "voltage:" | grep -o '[0-9]*')
HEALTH=$(adb shell dumpsys battery 2>/dev/null | grep "health:" | grep -o '[0-9]*')

# Interpretar salud de batería
case "$HEALTH" in
    2) HEALTH_STR="Buena ✅" ;;
    3) HEALTH_STR="Sobrecalentada ⚠️" ;;
    4) HEALTH_STR="Muerta 💀" ;;
    5) HEALTH_STR="Voltaje alto ⚠️" ;;
    6) HEALTH_STR="No especificada" ;;
    7) HEALTH_STR="Falla ⚠️" ;;
    *) HEALTH_STR="Desconocida" ;;
esac

echo "  🔋 Batería:           ${BATTERY}%"
echo "  🌡️  Temperatura:       ${TEMP_C}°C"
echo "  ⚡ Voltaje:           ${VOLTAGE}mV"
echo "  💚 Salud:             $HEALTH_STR"
[ "$CHARGING" = "true" ] && echo "  🔌 Cargando:          Sí"

# RAM
MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
MEM_FREE=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemFree:" | grep -o '[0-9]*')
if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    MEM_TOTAL_GB=$(echo "scale=1; $MEM_TOTAL / 1048576" | bc 2>/dev/null || echo "?")
    MEM_USED_GB=$(echo "scale=1; $MEM_USED / 1048576" | bc 2>/dev/null || echo "?")
    MEM_AVAIL_GB=$(echo "scale=1; $MEM_AVAIL / 1048576" | bc 2>/dev/null || echo "?")
    echo "  💾 RAM:               ${MEM_USED_GB}/${MEM_TOTAL_GB} GB (${MEM_PCT}%)"
    echo "  💾 RAM Disponible:    ${MEM_AVAIL_GB} GB"
fi

# CPU
LOAD=$(adb shell cat /proc/loadavg 2>/dev/null | cut -d' ' -f1)
CORES=$(adb shell nproc 2>/dev/null | tr -d '\r')
if [ -n "$LOAD" ] && [ -n "$CORES" ]; then
    CPU_PCT=$(echo "scale=0; $LOAD * 100 / $CORES" | bc 2>/dev/null || echo "?")
    echo "  ⚡ CPU:               ${CPU_PCT}% (load: $LOAD, $CORES cores)"
fi

# Almacenamiento
STORAGE=$(adb shell df /data 2>/dev/null | tail -1)
if [ -n "$STORAGE" ]; then
    TOTAL_KB=$(echo "$STORAGE" | awk '{print $2}')
    USED_KB=$(echo "$STORAGE" | awk '{print $3}')
    AVAIL_KB=$(echo "$STORAGE" | awk '{print $4}')
    if [ -n "$TOTAL_KB" ] && [ "$TOTAL_KB" -gt 0 ] 2>/dev/null; then
        TOTAL_GB=$(echo "scale=1; $TOTAL_KB / 1048576" | bc 2>/dev/null || echo "?")
        USED_GB=$(echo "scale=1; $USED_KB / 1048576" | bc 2>/dev/null || echo "?")
        AVAIL_GB=$(echo "scale=1; $AVAIL_KB / 1048576" | bc 2>/dev/null || echo "?")
        STORAGE_PCT=$((USED_KB * 100 / TOTAL_KB))
        echo "  💿 Almacenamiento:    ${USED_GB}/${TOTAL_GB} GB (${STORAGE_PCT}%)"
        echo "  💿 Disponible:        ${AVAIL_GB} GB"
    fi
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  ESTADO DE OPTIMIZACIÓN                    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Apps desactivadas
DISABLED_COUNT=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
echo "  📦 Apps desactivadas:  $DISABLED_COUNT"

# Apps de terceros
THIRD_COUNT=$(adb shell pm list packages -3 2>/dev/null | grep -c "package:" || echo "0")
echo "  📱 Apps de terceros:   $THIRD_COUNT"

# Apps del sistema
SYS_COUNT=$(adb shell pm list packages -s 2>/dev/null | grep -c "package:" || echo "0")
echo "  ⚙️  Apps del sistema:   $SYS_COUNT"

# SELinux
SELINUX=$(adb shell getenforce 2>/dev/null | tr -d '\r')
if [ "$SELINUX" = "Enforcing" ]; then
    echo "  🔒 SELinux:           Enforcing ✅"
elif [ "$SELINUX" = "Permissive" ]; then
    echo "  🔒 SELinux:           Permissive ⚠️"
else
    echo "  🔒 SELinux:           $SELINUX"
fi

# WiFi scanning
WIFI_SCAN=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
if [ "$WIFI_SCAN" = "0" ]; then
    echo "  📶 WiFi Scanning:     Desactivado ✅"
else
    echo "  📶 WiFi Scanning:     Activo"
fi

# Rescue points
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/rescue-points" ]; then
    RP_COUNT=$(ls -1d "$SCRIPT_DIR/rescue-points"/*/ 2>/dev/null | wc -l)
    echo "  💾 Rescue Points:     $RP_COUNT"
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  TOP 10 APPS POR CONSUMO DE BATERÍA        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Battery stats por app
BATTERY_STATS=$(adb shell dumpsys batterystats --charged 2>/dev/null | grep "Uid" | head -10)
if [ -n "$BATTERY_STATS" ]; then
    echo "$BATTERY_STATS" | while IFS= read -r line; do
        UID_NUM=$(echo "$line" | grep -o 'Uid [0-9]*' | awk '{print $2}')
        PKG=$(adb shell pm list packages -U 2>/dev/null | grep "uid:$UID_NUM" | head -1 | sed 's/package://' | sed 's/ uid:.*//' | tr -d '\r')
        if [ -n "$PKG" ]; then
            echo "  $PKG"
        fi
    done
else
    echo "  (stats no disponibles — ejecutá después de un ciclo de carga completa)"
fi

echo ""
echo "════════════════════════════════════════════"
echo ""
