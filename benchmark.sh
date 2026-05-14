#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  BENCHMARK COMPLETO — MejoraRedmi14c
#  Ejecutar ANTES y DESPUÉS de optimizar para comparar.
#
#  Mide: CPU, RAM, almacenamiento, apps, procesos, servicios,
#  tiempo de arranque, temperatura, y identifica qué ralentiza.
#
#  Uso: ./benchmark.sh [antes|despues]
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MODE="${1:-antes}"
REPORT_FILE="$SCRIPT_DIR/benchmark_${MODE}_${TIMESTAMP}.txt"

header() { echo -e "${CYAN}════════════════════════════════════════════${NC}"; }
section() { echo -e "\n${GREEN}[$1] $2${NC}"; echo "[$1] $2" >> "$REPORT_FILE"; }
info() { echo "  $1"; echo "  $1" >> "$REPORT_FILE"; }
warn_info() { echo -e "  ${YELLOW}⚠️  $1${NC}"; echo "  ⚠️  $1" >> "$REPORT_FILE"; }
problem() { echo -e "  ${RED}🔴 $1${NC}"; echo "  🔴 $1" >> "$REPORT_FILE"; }
good() { echo -e "  ${GREEN}✅ $1${NC}"; echo "  ✅ $1" >> "$REPORT_FILE"; }

# ═══════════════════════════════════════════════
#  INICIO
# ═══════════════════════════════════════════════

echo ""
header
echo -e "${CYAN}  📊 BENCHMARK COMPLETO — MejoraRedmi14c v$VERSION${NC}"
echo -e "${CYAN}  Modo: ${MODE^^}${NC}"
echo -e "${CYAN}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
header
echo ""

# Iniciar reporte
{
    echo "════════════════════════════════════════════"
    echo "  BENCHMARK COMPLETO — MejoraRedmi14c v$VERSION"
    echo "  Modo: ${MODE^^}"
    echo "  Fecha: $(date -Iseconds)"
    echo "════════════════════════════════════════════"
} > "$REPORT_FILE"

# Verificar conexión
if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    exit 1
fi

# ═══════════════════════════════════════════════
#  1. INFORMACIÓN DEL DISPOSITIVO
# ═══════════════════════════════════════════════
section "1/10" "INFORMACIÓN DEL DISPOSITIVO"

MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
BUILD=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
SECURITY=$(adb shell getprop ro.build.version.security_patch 2>/dev/null | tr -d '\r')
ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')
SOC=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\r')
BOARD=$(adb shell getprop ro.product.board 2>/dev/null | tr -d '\r')
SERIAL=$(adb shell getprop ro.serialno 2>/dev/null | tr -d '\r')
SERIAL_MASKED="${SERIAL:0:4}****"
UPTIME=$(adb shell cat /proc/uptime 2>/dev/null | cut -d' ' -f1 | cut -d'.' -f1)
UPTIME_HOURS=$((UPTIME / 3600))
UPTIME_MINS=$(((UPTIME % 3600) / 60))

info "Fabricante:   $MFR"
info "Modelo:       $MODEL"
info "Android:      $ANDROID (SDK $SDK)"
info "HyperOS:      ${HYPEROS:-N/A}"
info "Build:        $BUILD"
info "Security:     $SECURITY"
info "CPU ABI:      $ABI"
info "SoC:          $SOC"
info "Board:        $BOARD"
info "Serial:       $SERIAL_MASKED"
info "Tiempo encendido: ${UPTIME_HOURS}h ${UPTIME_MINS}m"
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  2. CPU — BENCHMARK
# ═══════════════════════════════════════════════
section "2/10" "CPU — BENCHMARK"

CORES=$(adb shell nproc 2>/dev/null | tr -d '\r')
LOAD1=$(adb shell cat /proc/loadavg 2>/dev/null | awk '{print $1}')
LOAD5=$(adb shell cat /proc/loadavg 2>/dev/null | awk '{print $2}')
LOAD15=$(adb shell cat /proc/loadavg 2>/dev/null | awk '{print $3}')

CPU_PCT=$(awk "BEGIN {printf \"%d\", $LOAD1 * 100 / $CORES}" 2>/dev/null || echo "?")

info "Cores:        $CORES"
info "Load avg:     $LOAD1 (1m) / $LOAD5 (5m) / $LOAD15 (15m)"
info "CPU uso:      ~${CPU_PCT}%"

# CPU frequency
CPU_FREQ=$(adb shell cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null | tr -d '\r')
CPU_MAX=$(adb shell cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq 2>/dev/null | tr -d '\r')
if [ -n "$CPU_FREQ" ] && [ -n "$CPU_MAX" ]; then
    CPU_FREQ_MHZ=$((CPU_FREQ / 1000))
    CPU_MAX_MHZ=$((CPU_MAX / 1000))
    info "CPU freq:     ${CPU_FREQ_MHZ}MHz / ${CPU_MAX_MHZ}MHz (max)"
fi

# CPU benchmark: tiempo para procesar un cálculo intensivo
echo "  Ejecutando benchmark CPU..."
BENCH_START=$(date +%s%N)
adb shell "for i in \$(seq 1 10000); do echo \$i > /dev/null; done" 2>/dev/null
BENCH_END=$(date +%s%N)
CPU_BENCH_MS=$(( (BENCH_END - BENCH_START) / 1000000 ))
info "CPU bench:    ${CPU_BENCH_MS}ms (10k iteraciones)"

if [ "$CPU_BENCH_MS" -lt 3000 ]; then
    good "CPU rendimiento: EXCELENTE"
elif [ "$CPU_BENCH_MS" -lt 6000 ]; then
    good "CPU rendimiento: BUENO"
elif [ "$CPU_BENCH_MS" -lt 10000 ]; then
    warn_info "CPU rendimiento: REGULAR — considerá cerrar apps"
else
    problem "CPU rendimiento: LENTO — hay algo consumiendo CPU"
fi

# Top procesos por CPU
echo "" >> "$REPORT_FILE"
info "--- Top 10 procesos por CPU ---"
TOP_CPU=$(adb shell top -n 1 -b -o %CPU 2>/dev/null | head -15 | tail -10)
echo "$TOP_CPU" >> "$REPORT_FILE"
echo "$TOP_CPU" | while IFS= read -r line; do
    [ -n "$line" ] && info "$line"
done
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  3. RAM — BENCHMARK
# ═══════════════════════════════════════════════
section "3/10" "RAM — BENCHMARK"

MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
MEM_FREE=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemFree:" | grep -o '[0-9]*')
MEM_BUFFERS=$(adb shell cat /proc/meminfo 2>/dev/null | grep "Buffers:" | grep -o '[0-9]*')
MEM_CACHED=$(adb shell cat /proc/meminfo 2>/dev/null | grep "^Cached:" | grep -o '[0-9]*')
SWAP_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "SwapTotal:" | grep -o '[0-9]*')
SWAP_FREE=$(adb shell cat /proc/meminfo 2>/dev/null | grep "SwapFree:" | grep -o '[0-9]*')

if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    MEM_TOTAL_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_TOTAL / 1048576}" 2>/dev/null)
    MEM_USED_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_USED / 1048576}" 2>/dev/null)
    MEM_AVAIL_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_AVAIL / 1048576}" 2>/dev/null)
    MEM_FREE_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_FREE / 1048576}" 2>/dev/null)
    MEM_CACHED_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_CACHED / 1048576}" 2>/dev/null)

    info "RAM Total:    ${MEM_TOTAL_GB} GB"
    info "RAM Usada:    ${MEM_USED_GB} GB (${MEM_PCT}%)"
    info "RAM Disponible: ${MEM_AVAIL_GB} GB"
    info "RAM Libre:    ${MEM_FREE_GB} GB"
    info "RAM Cached:   ${MEM_CACHED_GB} GB"

    if [ "$MEM_PCT" -lt 60 ]; then
        good "RAM: Uso saludable (< 60%)"
    elif [ "$MEM_PCT" -lt 75 ]; then
        warn_info "RAM: Uso moderado ($MEM_PCT%)"
    elif [ "$MEM_PCT" -lt 90 ]; then
        problem "RAM: Uso alto ($MEM_PCT%) — cerrá apps en segundo plano"
    else
        problem "RAM: Uso crítico ($MEM_PCT%) — el teléfono va a laggear"
    fi
fi

if [ -n "$SWAP_TOTAL" ] && [ "$SWAP_TOTAL" -gt 0 ] 2>/dev/null; then
    SWAP_USED=$((SWAP_TOTAL - SWAP_FREE))
    SWAP_PCT=$((SWAP_USED * 100 / SWAP_TOTAL))
    info "Swap:         ${SWAP_USED}kB / ${SWAP_TOTAL}kB (${SWAP_PCT}%)"
    if [ "$SWAP_PCT" -gt 50 ]; then
        problem "Swap uso alto ($SWAP_PCT%) — la RAM no alcanza"
    fi
fi

echo "" >> "$REPORT_FILE"
info "--- Top 10 apps por uso de RAM ---"
TOP_MEM=$(adb shell dumpsys meminfo --sort-by-pss 2>/dev/null | grep -A 12 "Total PSS by process" | tail -10)
if [ -z "$TOP_MEM" ]; then
    TOP_MEM=$(adb shell "ps -eo pid,rss,comm --sort=-rss" 2>/dev/null | head -11 | tail -10)
fi
echo "$TOP_MEM" >> "$REPORT_FILE"
echo "$TOP_MEM" | while IFS= read -r line; do
    [ -n "$line" ] && info "$line"
done
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  4. ALMACENAMIENTO
# ═══════════════════════════════════════════════
section "4/10" "ALMACENAMIENTO"

STORAGE=$(adb shell df /data 2>/dev/null | tail -1)
if [ -n "$STORAGE" ]; then
    TOTAL_KB=$(echo "$STORAGE" | awk '{print $2}')
    USED_KB=$(echo "$STORAGE" | awk '{print $3}')
    AVAIL_KB=$(echo "$STORAGE" | awk '{print $4}')
    if [ -n "$TOTAL_KB" ] && [ "$TOTAL_KB" -gt 0 ] 2>/dev/null; then
        TOTAL_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_KB / 1048576}" 2>/dev/null)
        USED_GB=$(awk "BEGIN {printf \"%.1f\", $USED_KB / 1048576}" 2>/dev/null)
        AVAIL_GB=$(awk "BEGIN {printf \"%.1f\", $AVAIL_KB / 1048576}" 2>/dev/null)
        STORAGE_PCT=$((USED_KB * 100 / TOTAL_KB))

        info "Total:        ${TOTAL_GB} GB"
        info "Usado:        ${USED_GB} GB (${STORAGE_PCT}%)"
        info "Disponible:   ${AVAIL_GB} GB"

        if [ "$STORAGE_PCT" -lt 70 ]; then
            good "Almacenamiento: saludable"
        elif [ "$STORAGE_PCT" -lt 85 ]; then
            warn_info "Almacenamiento: moderado ($STORAGE_PCT%)"
        else
            problem "Almacenamiento: casi lleno ($STORAGE_PCT%) — afecta rendimiento"
        fi
    fi
fi

# Tamaño de caché
CACHE_SIZE=$(adb shell du -s /data/data/*/cache 2>/dev/null | awk '{sum+=$1} END {print sum}')
if [ -n "$CACHE_SIZE" ]; then
    CACHE_MB=$((CACHE_SIZE / 1024))
    info "Cache total:  ${CACHE_MB} MB"
    if [ "$CACHE_MB" -gt 2000 ]; then
        problem "Cache grande (${CACHE_MB}MB) — limpiá con mantenimiento"
    fi
fi
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  5. BATERÍA Y TEMPERATURA
# ═══════════════════════════════════════════════
section "5/10" "BATERÍA Y TEMPERATURA"

BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(awk "BEGIN {printf \"%.1f\", $TEMP / 10}" 2>/dev/null || echo "?")
VOLTAGE=$(adb shell dumpsys battery 2>/dev/null | grep "voltage:" | grep -o '[0-9]*')
HEALTH=$(adb shell dumpsys battery 2>/dev/null | grep "health:" | grep -o '[0-9]*')
CHARGING=$(adb shell dumpsys battery 2>/dev/null | grep "AC powered:" | grep -o 'true\|false')
PLUGGED=$(adb shell dumpsys battery 2>/dev/null | grep "plugged:" | grep -o '[0-9]*')

info "Nivel:        ${BATTERY}%"
info "Temperatura:  ${TEMP_C}°C"
info "Voltaje:      ${VOLTAGE}mV"

case "$HEALTH" in
    2) good "Salud batería: BUENA" ;;
    3) problem "Salud batería: SOBRECALENTADA" ;;
    4) problem "Salud batería: MUERTA" ;;
    5) warn_info "Salud batería: VOLTAJE ALTO" ;;
    *) info "Salud batería: $HEALTH" ;;
esac

if [ "$TEMP" -lt 300 ]; then
    good "Temperatura: FRÍA (${TEMP_C}°C)"
elif [ "$TEMP" -lt 350 ]; then
    good "Temperatura: NORMAL (${TEMP_C}°C)"
elif [ "$TEMP" -lt 400 ]; then
    warn_info "Temperatura: TIBIA (${TEMP_C}°C) — puede afectar rendimiento"
else
    problem "Temperatura: ALTA (${TEMP_C}°C) — va a thermal throttle"
fi

# Battery drain rate (si no está cargando)
if [ "$CHARGING" = "false" ] && [ "$UPTIME" -gt 300 ]; then
    # Estimación simple
    info "Estado:       Descargando"
else
    info "Estado:       Cargando"
fi
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  6. APPS INSTALADAS Y DESACTIVADAS
# ═══════════════════════════════════════════════
section "6/10" "APPS INSTALADAS Y DESACTIVADAS"

TOTAL_APPS=$(adb shell pm list packages 2>/dev/null | grep -c "package:")
SYSTEM_APPS=$(adb shell pm list packages -s 2>/dev/null | grep -c "package:")
USER_APPS=$(adb shell pm list packages -3 2>/dev/null | grep -c "package:")
DISABLED_APPS=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:")

info "Total:        $TOTAL_APPS apps"
info "Sistema:      $SYSTEM_APPS"
info "De terceros:  $USER_APPS"
info "Desactivadas: $DISABLED_APPS"

if [ "$DISABLED_APPS" -eq 0 ]; then
    warn_info "Ninguna app desactivada — el bloatware sigue activo"
elif [ "$DISABLED_APPS" -lt 10 ]; then
    info "Pocas apps desactivadas ($DISABLED_APPS)"
elif [ "$DISABLED_APPS" -lt 30 ]; then
    good "Buen número de apps desactivadas ($DISABLED_APPS)"
else
    good "Muchas apps desactivadas ($DISABLED_APPS)"
fi

# Apps de terceros que consumen más recursos
echo "" >> "$REPORT_FILE"
info "--- Apps de terceros instaladas ---"
THIRD_PARTY=$(adb shell pm list packages -3 2>/dev/null | sed 's/package://' | tr -d '\r' | sort)
echo "$THIRD_PARTY" >> "$REPORT_FILE"

# Apps que más drenan batería
echo "" >> "$REPORT_FILE"
info "--- Apps con más wakelocks ---"
WAKELOCKS=$(adb shell dumpsys power 2>/dev/null | grep "Wake Locks:" -A 20 | grep "PARTIAL_WAKE_LOCK" | head -10)
if [ -n "$WAKELOCKS" ]; then
    echo "$WAKELOCKS" >> "$REPORT_FILE"
    echo "$WAKELOCKS" | while IFS= read -r line; do
        [ -n "$line" ] && info "$line"
    done
fi
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  7. SERVICIOS Y PROCESOS EN SEGUNDO PLANO
# ═══════════════════════════════════════════════
section "7/10" "SERVICIOS Y PROCESOS EN SEGUNDO PLANO"

RUNNING_PROCS=$(adb shell ps 2>/dev/null | wc -l)
info "Procesos activos: $RUNNING_PROCS"

# Servicios corriendo
RUNNING_SERVICES=$(adb shell dumpsys activity services 2>/dev/null | grep "ServiceRecord" | wc -l)
info "Servicios activos: $RUNNING_SERVICES"

# Apps con servicios en segundo plano (no del sistema)
echo "" >> "$REPORT_FILE"
info "--- Apps con servicios en segundo plano ---"
BG_SERVICES=$(adb shell dumpsys activity services 2>/dev/null | grep "ServiceRecord" | grep -v "com.android" | grep -v "com.google" | grep -v "com.miui" | head -15)
if [ -n "$BG_SERVICES" ]; then
    echo "$BG_SERVICES" >> "$REPORT_FILE"
    echo "$BG_SERVICES" | while IFS= read -r line; do
        [ -n "$line" ] && info "$(echo "$line" | grep -o '{[^}]*}' | head -1)"
    done
fi

# Broadcast receivers activos
RECEIVERS=$(adb shell dumpsys activity broadcasts 2>/dev/null | grep "ReceiverList" | wc -l)
info "Broadcast receivers: $RECEIVERS"
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  8. RED Y CONECTIVIDAD
# ═══════════════════════════════════════════════
section "8/10" "RED Y CONECTIVIDAD"

# WiFi
WIFI_STATE=$(adb shell settings get global wifi_on 2>/dev/null | tr -d '\r')
WIFI_SCAN=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
WIFI_SIGNAL=$(adb shell dumpsys wifi 2>/dev/null | grep "mWifiInfo" | grep -o 'rssi=-[0-9]*' | grep -o '[0-9]*')

if [ "$WIFI_STATE" = "1" ]; then
    info "WiFi:         ACTIVO"
    [ -n "$WIFI_SIGNAL" ] && info "Señal WiFi:   -${WIFI_SIGNAL}dBm"
else
    info "WiFi:         Inactivo"
fi

if [ "$WIFI_SCAN" = "0" ]; then
    good "WiFi scanning: Desactivado (ahorra batería)"
else
    warn_info "WiFi scanning: Activo (consume batería)"
fi

# Datos móviles
DATA_ROAMING=$(adb shell settings get global data_roaming 2>/dev/null | tr -d '\r')
info "Data roaming: $([ "$DATA_ROAMING" = "0" ] && echo "Desactivado" || echo "Activo")"

# DNS
DNS=$(adb shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null | tr -d '\r')
if [ "$DNS" = "600" ]; then
    good "DNS: Optimizado (${DNS}s)"
else
    info "DNS: Por defecto"
fi
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  9. CONFIGURACIÓN ACTUAL
# ═══════════════════════════════════════════════
section "9/10" "CONFIGURACIÓN ACTUAL"

# Animaciones
WIN=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
TRANS=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')
ANIM_DUR=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')
info "Animaciones:  window=$WIN, transition=$TRANS, animator=$ANIM_DUR"

# GPU
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
MSAA=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')
VULKAN=$(adb shell settings get global debug.hwui.renderer 2>/dev/null | tr -d '\r')
info "GPU:          force=$GPU, msaa=$MSAA, renderer=$VULKAN"

# Resolución
SIZE=$(adb shell wm size 2>/dev/null | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
OVERRIDE=$(adb shell wm size 2>/dev/null | grep "Override size:" | grep -o '[0-9]*x[0-9]*')
DPI=$(adb shell wm density 2>/dev/null | grep "Physical density:" | grep -o '[0-9]*')
OVERRIDE_DPI=$(adb shell wm density 2>/dev/null | grep "Override density:" | grep -o '[0-9]*')
info "Resolución:   $SIZE"
[ -n "$OVERRIDE" ] && info "Override:     $OVERRIDE"
info "DPI:          $DPI"
[ -n "$OVERRIDE_DPI" ] && info "DPI Override: $OVERRIDE_DPI"

# Memoria
SWAPPINESS=$(adb shell settings get global sys_swappiness 2>/dev/null | tr -d '\r')
info "Swappiness:   ${SWAPPINESS:-por defecto}"

# SELinux
SELINUX=$(adb shell getenforce 2>/dev/null | tr -d '\r')
info "SELinux:      $SELINUX"
echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  10. DIAGNÓSTICO — ¿QUÉ RALENTIZA EL TELÉFONO?
# ═══════════════════════════════════════════════
section "10/10" "DIAGNÓSTICO — ¿QUÉ RALENTIZA EL TELÉFONO?"

PROBLEMS=0

echo ""

# --- Check 1: Bloatware activo ---
if [ "$DISABLED_APPS" -lt 5 ]; then
    problem "BLOATWARE ACTIVO: Solo $DISABLED_APPS apps desactivadas de $SYSTEM_APPS del sistema"
    info "  → Solución: Ejecutá un perfil de optimización (rendimiento/equilibrado/gaming)"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Bloatware controlado: $DISABLED_APPS apps desactivadas"
fi

# --- Check 2: RAM alta ---
if [ -n "$MEM_PCT" ] && [ "$MEM_PCT" -gt 80 ]; then
    problem "RAM ALTA ($MEM_PCT%): Poca memoria disponible"
    info "  → Solución: Ejecutá un perfil de optimización o cerrá apps manualmente"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "RAM OK ($MEM_PCT%)"
fi

# --- Check 3: Temperatura alta ---
if [ "$TEMP" -gt 400 ]; then
    problem "TEMPERATURA ALTA (${TEMP_C}°C): El teléfono va a thermal throttle"
    info "  → Solución: Dejá enfriar el teléfono antes de optimizar"
    PROBLEMS=$((PROBLEMS + 1))
elif [ "$TEMP" -gt 350 ]; then
    warn_info "Temperatura tibia (${TEMP_C}°C): puede afectar rendimiento"
else
    good "Temperatura OK (${TEMP_C}°C)"
fi

# --- Check 4: Almacenamiento lleno ---
if [ -n "$STORAGE_PCT" ] && [ "$STORAGE_PCT" -gt 85 ]; then
    problem "ALMACENAMIENTO LLENO ($STORAGE_PCT%): Afecta rendimiento general"
    info "  → Solución: Ejecutá ./mantenimiento.sh o limpiá cache manualmente"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Almacenamiento OK ($STORAGE_PCT%)"
fi

# --- Check 5: WiFi scanning activo ---
if [ "$WIFI_SCAN" != "0" ]; then
    problem "WiFi SCANNING ACTIVO: Consume batería en segundo plano"
    info "  → Solución: Ejecutá un perfil de optimización para desactivarlo"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "WiFi scanning desactivado"
fi

# --- Check 6: Animaciones por defecto ---
if [ "$WIN" = "1" ] || [ "$WIN" = "null" ] || [ -z "$WIN" ]; then
    warn_info "ANIMACIONES POR DEFECTO (1x): Más lentas de lo necesario"
    info "  → Solución: Ejecutá un perfil de optimización para ajustarlas"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Animaciones optimizadas (${WIN}x)"
fi

# --- Check 7: GPU no forzada ---
if [ "$GPU" != "1" ]; then
    warn_info "GPU RENDERING NO FORZADO: Algunas apps usan CPU para renderizar"
    info "  → Solución: Ejecutá un perfil de optimización para forzar GPU"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "GPU rendering forzado"
fi

# --- Check 8: Cache grande ---
if [ -n "$CACHE_MB" ] && [ "$CACHE_MB" -gt 2000 ]; then
    problem "CACHE GRANDE (${CACHE_MB}MB): Ocupa espacio y puede ralentizar"
    info "  → Solución: Ejecutá ./mantenimiento.sh para limpiar cache"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Cache tamaño OK (${CACHE_MB:-?}MB)"
fi

# --- Check 9: Muchos procesos ---
if [ "$RUNNING_PROCS" -gt 400 ]; then
    problem "MUCHOS PROCESOS ($RUNNING_PROCS): Consume RAM y CPU"
    info "  → Solución: Cerrá apps manualmente o ejecutá un perfil de optimización"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Procesos OK ($RUNNING_PROCS)"
fi

# --- Check 10: Uptime largo sin reinicio ---
if [ "$UPTIME" -gt 604800 ]; then
    UPTIME_DAYS=$((UPTIME / 86400))
    warn_info "SIN REINICIAR HACE ${UPTIME_DAYS}días: La RAM se fragmenta con el tiempo"
    info "  → Recomendación: Reiniciá el teléfono al menos 1 vez por semana"
    PROBLEMS=$((PROBLEMS + 1))
else
    good "Uptime OK (${UPTIME_HOURS}h ${UPTIME_MINS}m)"
fi

echo "" >> "$REPORT_FILE"

# ═══════════════════════════════════════════════
#  RESUMEN FINAL
# ═══════════════════════════════════════════════
header
echo -e "${CYAN}  📊 RESUMEN DEL BENCHMARK${NC}"
header
echo ""

echo "  📱 $MFR $MODEL (Android $ANDROID)"
echo ""

if [ -n "$CPU_PCT" ]; then
    echo "  ⚡ CPU:           ~${CPU_PCT}% (bench: ${CPU_BENCH_MS}ms)"
fi
if [ -n "$MEM_TOTAL_GB" ]; then
    echo "  💾 RAM:           ${MEM_USED_GB}/${MEM_TOTAL_GB}GB (${MEM_PCT}%)"
fi
if [ -n "$TOTAL_GB" ]; then
    echo "  💿 Almacenamiento: ${USED_GB}/${TOTAL_GB}GB (${STORAGE_PCT}%)"
fi
echo "  🔋 Batería:       ${BATTERY}% (${TEMP_C}°C)"
echo "  📦 Apps:          $TOTAL_APPS total, $DISABLED_APPS desactivadas"
echo "  🔄 Procesos:      $RUNNING_PROCS"
echo ""

echo "  ──── Problemas encontrados ────"
echo "  🔴 Problemas:     $PROBLEMS"
echo ""

if [ "$PROBLEMS" -eq 0 ]; then
    echo -e "  ${GREEN}🏆 ¡TELÉFONO PERFECTAMENTE OPTIMIZADO!${NC}"
else
    echo -e "  ${RED}🔴 Se encontraron $PROBLEMS problemas. Ejecutá un perfil de optimización.${NC}"
fi

echo ""
header
echo -e "${CYAN}  📄 Reporte guardado en: $(basename "$REPORT_FILE")${NC}"
header
echo ""

# Guardar resumen en el reporte
{
    echo "════════════════════════════════════════════"
    echo "  RESUMEN"
    echo "════════════════════════════════════════════"
    echo "  CPU: ~${CPU_PCT}% (bench: ${CPU_BENCH_MS}ms)"
    echo "  RAM: ${MEM_USED_GB}/${MEM_TOTAL_GB}GB (${MEM_PCT}%)"
    echo "  Almacenamiento: ${USED_GB}/${TOTAL_GB}GB (${STORAGE_PCT}%)"
    echo "  Batería: ${BATTERY}% (${TEMP_C}°C)"
    echo "  Apps: $TOTAL_APPS total, $DISABLED_APPS desactivadas"
    echo "  Procesos: $RUNNING_PROCS"
    echo "  Problemas: $PROBLEMS"
    echo "════════════════════════════════════════════"
} >> "$REPORT_FILE"
