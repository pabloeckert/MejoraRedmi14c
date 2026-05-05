#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  MejoraRedmi14c v4.0 — Menú principal
#  Optimizador Android por ADB
#  Redmi 14C / HyperOS
#
#  Flujo: Conectar → Verificar → Benchmark → Menú
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONNECTED=0
DEVICE=""
ANDROID=""

# ─── COLORES ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ═══════════════════════════════════════════════
#  PASO 1: CONECTAR TELÉFONO
# ═══════════════════════════════════════════════
connect_device() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     📱 MejoraRedmi14c v4.0                ║"
    echo "║     Optimizador Android por ADB            ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    echo "║   PASO 1: Conectar teléfono               ║"
    echo "║                                           ║"
    echo "╚═══════════════════════════════════════════╝"
    echo ""
    echo "  📋 Instrucciones:"
    echo "     1. Conectá tu Redmi 14C por USB"
    echo "     2. Activá Depuración USB en el teléfono"
    echo "     3. Aceptá el popup de depuración USB"
    echo ""
    echo "  Buscando dispositivos..."
    echo ""

    # Esperar conexión
    ATTEMPTS=0
    MAX_ATTEMPTS=30
    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
        if adb get-state >/dev/null 2>&1; then
            CONNECTED=1
            DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
            MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
            HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')

            echo -e "  ${GREEN}✅ ¡DISPOSITIVO CONECTADO!${NC}"
            echo ""
            echo "  📱 $MFR $DEVICE"
            echo "     Android $ANDROID"
            [ -n "$HYPEROS" ] && [ "$HYPEROS" != "null" ] && echo "     HyperOS $HYPEROS"
            echo ""
            echo "  Verificando autorización..."

            STATE=$(adb get-state 2>/dev/null | tr -d '\r')
            if [ "$STATE" = "device" ]; then
                echo -e "  ${GREEN}✅ Autorizado${NC}"
                echo ""
                read -p "  Presioná Enter para continuar..."
                return 0
            elif [ "$STATE" = "unauthorized" ]; then
                echo -e "  ${RED}❌ No autorizado — aceptá el popup en el teléfono${NC}"
                echo "     Esperando autorización..."
                sleep 3
                ATTEMPTS=$((ATTEMPTS - 1))  # No contar este intento
            fi
        fi

        ATTEMPTS=$((ATTEMPTS + 1))
        if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
            echo -ne "  ⏳ Esperando dispositivo... ($ATTEMPTS/$MAX_ATTEMPTS)\r"
            sleep 2
        fi
    done

    echo ""
    echo -e "  ${RED}❌ No se detectó ningún dispositivo.${NC}"
    echo ""
    echo "  Posibles soluciones:"
    echo "     • Verificá que el cable USB transferencia datos (no solo carga)"
    echo "     • Activá Depuración USB: Ajustes > Opciones de desarrollador"
    echo "     • Aceptá el popup de depuración USB en el teléfono"
    echo "     • Probá otro cable o puerto USB"
    echo ""
    echo "  ¿Querés intentar de nuevo?"
    echo "    1) Reintentar"
    echo "    2) Continuar sin conexión (limitado)"
    echo "    0) Salir"
    echo ""
    read -p "  Opción: " RETRY
    case $RETRY in
        1) connect_device ;;
        2) return 0 ;;
        0) exit 0 ;;
        *) connect_device ;;
    esac
}

# ═══════════════════════════════════════════════
#  PASO 2: VERIFICAR CONEXIÓN
# ═══════════════════════════════════════════════
verify_connection() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     🔍 PASO 2: Verificar conexión          ║"
    echo "╚═══════════════════════════════════════════╝"
    echo ""

    if ! adb get-state >/dev/null 2>&1; then
        echo -e "  ${RED}❌ Dispositivo no conectado${NC}"
        return 1
    fi

    echo -e "  ${GREEN}✅ Dispositivo conectado${NC}"
    echo ""

    # Info detallada
    MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
    MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
    ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    SDK=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
    BUILD=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')
    HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
    ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')
    SOC=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\r')

    echo "  📱 Dispositivo"
    echo "     Fabricante:    $MFR"
    echo "     Modelo:        $MODEL"
    echo "     Android:       $ANDROID (SDK $SDK)"
    [ -n "$HYPEROS" ] && [ "$HYPEROS" != "null" ] && echo "     HyperOS:       $HYPEROS"
    echo "     Build:         $BUILD"
    echo "     CPU ABI:       $ABI"
    echo "     SoC:           $SOC"
    echo ""

    # Estado rápido
    BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
    TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
    TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null || echo "?")
    MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
    MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
    DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
    TOTAL=$(adb shell pm list packages 2>/dev/null | grep -c "package:" || echo "0")

    echo "  📊 Estado rápido"
    echo "     🔋 Batería:       ${BATTERY}% (${TEMP_C}°C)"
    if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
        MEM_PCT=$(( (MEM_TOTAL - MEM_AVAIL) * 100 / MEM_TOTAL ))
        echo "     💾 RAM:           ${MEM_PCT}% usado"
    fi
    echo "     📦 Apps:          $TOTAL instaladas, $DISABLED desactivadas"
    echo ""

    echo -e "  ${GREEN}✅ Verificación completada${NC}"
    echo ""
    read -p "  Presioná Enter para continuar..."
}

# ═══════════════════════════════════════════════
#  PASO 3: BENCHMARK
# ═══════════════════════════════════════════════
run_benchmark() {
    bash "$SCRIPT_DIR/benchmark.sh" "$1"
}

# ═══════════════════════════════════════════════
#  MENÚ PRINCIPAL
# ═══════════════════════════════════════════════
show_menu() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     📱 MejoraRedmi14c v4.0                ║"
    echo "║     Optimizador Android por ADB            ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    if [ $CONNECTED -eq 1 ]; then
        echo "║   📱 Conectado: $DEVICE (Android $ANDROID)"
    else
        echo "║   ⚠️  Sin conexión                          ║"
    fi
    echo "║                                           ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    echo "║   🔥 MEGA OPTIMIZER (todo en uno):        ║"
    echo "║     1) 🔥 Mega Optimizer (RECOMENDADO)    ║"
    echo "║     2) 🔍 Verificar optimizaciones        ║"
    echo "║     3) 🚨 Restaurar todo a fábrica         ║"
    echo "║                                           ║"
    echo "║   💾 Backup:                              ║"
    echo "║     4) 💾 Backup general local             ║"
    echo "║                                           ║"
    echo "║   🛤️  Ruta autónoma:                       ║"
    echo "║     5) 🛤️  Ruta óptima automática          ║"
    echo "║                                           ║"
    echo "║   📊 Benchmark:                           ║"
    echo "║     6) 🔍 Benchmark ANTES (diagnóstico)   ║"
    echo "║     7) 🔍 Benchmark DESPUÉS (verificar)   ║"
    echo "║                                           ║"
    echo "║   🚀 Perfiles de optimización:            ║"
    echo "║     8) 🚀 Rendimiento (agresivo)          ║"
    echo "║     9) 📱 Equilibrado (recomendado)       ║"
    echo "║    10) 🔋 Batería (ahorro)                ║"
    echo "║    11) 🎮 Gaming (máximo rendimiento)     ║"
    echo "║                                           ║"
    echo "║   ⚡ Optimización avanzada:               ║"
    echo "║    12) 🧈 Fluidez (baseline profiles)     ║"
    echo "║    13) 🌐 Tweaks de red                   ║"
    echo "║    14) 💾 Tweaks de memoria               ║"
    echo "║                                           ║"
    echo "║   🔧 Herramientas:                        ║"
    echo "║    15) 🔧 Mantenimiento                   ║"
    echo "║    16) 🔍 Diagnóstico detallado            ║"
    echo "║    17) 💾 Rescue Points                   ║"
    echo "║    18) 🧪 Test de verificación             ║"
    echo "║    19) 🔧 Reparación rápida               ║"
    echo "║                                           ║"
    echo "║   🚨 Emergencia:                          ║"
    echo "║    20) 🚨 Restaurar todo (emergencia)     ║"
    echo "║                                           ║"
    echo "║     r) 🔄 Reconectar dispositivo          ║"
    echo "║     0) Salir                              ║"
    echo "║                                           ║"
    echo "╚═══════════════════════════════════════════╝"
    echo ""
}

# ═══════════════════════════════════════════════
#  FLUJO PRINCIPAL
# ═══════════════════════════════════════════════

# 1. Conectar
connect_device

# 2. Verificar (si está conectado)
if [ $CONNECTED -eq 1 ]; then
    verify_connection

    # 3. Benchmark antes (automático)
    echo ""
    echo "  📊 ¿Querés ejecutar el benchmark ANTES de optimizar?"
    echo "     (Recomendado para comparar después)"
    echo ""
    read -p "  Ejecutar benchmark [S/n]: " BENCH_CHOICE
    if [ "$BENCH_CHOICE" != "n" ] && [ "$BENCH_CHOICE" != "N" ]; then
        run_benchmark "antes"
    fi
fi

# 4. Menú principal
while true; do
    show_menu
    read -p "  Elegí una opción: " CHOICE
    echo ""

    # Verificar conexión antes de cada operación
    if [ "$CHOICE" != "0" ] && [ "$CHOICE" != "r" ] && [ "$CHOICE" != "R" ]; then
        if ! adb get-state >/dev/null 2>&1; then
            echo -e "  ${RED}❌ Dispositivo no conectado${NC}"
            echo "     Reconectá el teléfono y presioná Enter"
            read -p "  "
            continue
        fi
    fi

    case $CHOICE in
        1) bash "$SCRIPT_DIR/mega-optimizer.sh" ;;
        2) bash "$SCRIPT_DIR/mega-verificar.sh" ;;
        3)
            echo -e "  ${YELLOW}⚠️  Esto va a restaurar TODAS las apps y configuraciones${NC}"
            read -p "  ¿Estás seguro? [S/n]: " CONFIRM
            if [ "$CONFIRM" != "n" ] && [ "$CONFIRM" != "N" ]; then
                bash "$SCRIPT_DIR/mega-restaurar.sh"
            fi
            ;;
        4) bash "$SCRIPT_DIR/backup.sh" ;;
        5) bash "$SCRIPT_DIR/ruta-optima.sh" ;;
        6) run_benchmark "antes" ;;
        7) run_benchmark "despues" ;;
        8) bash "$SCRIPT_DIR/perfil-rendimiento.sh" ;;
        9) bash "$SCRIPT_DIR/perfil-equilibrado.sh" ;;
       10) bash "$SCRIPT_DIR/perfil-bateria.sh" ;;
       11) bash "$SCRIPT_DIR/perfil-gaming.sh" ;;
       12) bash "$SCRIPT_DIR/tweaks-smooth.sh" ;;
       13) bash "$SCRIPT_DIR/tweaks-red.sh" ;;
       14) bash "$SCRIPT_DIR/tweaks-memoria.sh" ;;
       15) bash "$SCRIPT_DIR/mantenimiento.sh" ;;
       16) bash "$SCRIPT_DIR/diagnostico.sh" ;;
       17) bash "$SCRIPT_DIR/rescue.sh" ;;
       18) bash "$SCRIPT_DIR/test-verificacion.sh" ;;
       19) bash "$SCRIPT_DIR/rapido.sh" ;;
       20) bash "$SCRIPT_DIR/emergencia.sh" ;;
        r|R) connect_device ;;
        0) echo "  ¡Chau! 👋"; exit 0 ;;
        *) echo -e "  ${RED}❌ Opción no válida${NC}" ;;
    esac

    echo ""
    read -p "  Presioná Enter para continuar..."
done
