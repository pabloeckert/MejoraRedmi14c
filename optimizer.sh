#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  MejoraRedmi14c — Menú principal
#  Optimizador Android por ADB
#  Redmi 14C / HyperOS
#
#  Flujo: Conectar → Verificar → Benchmark → Menú
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
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
    echo "║     📱 MejoraRedmi14c v$VERSION                ║"
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

            # Validar que sea un dispositivo Xiaomi/Redmi/POCO
            if ! echo "$MFR" | grep -qi "xiaomi\|redmi\|poco"; then
                echo -e "  ${YELLOW}⚠️  Este script está optimizado para dispositivos Xiaomi/Redmi/POCO.${NC}"
                echo "     Dispositivo detectado: $MFR $DEVICE"
                echo "     Algunos tweaks pueden no ser compatibles."
                read -p "  ¿Continuar de todos modos? [S/n]: " CONFIRM_MFR_OPT
                if [ "$CONFIRM_MFR_OPT" = "n" ] || [ "$CONFIRM_MFR_OPT" = "N" ]; then
                    echo "  Cancelado."
                    exit 0
                fi
            fi

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
    TEMP_C=$(awk "BEGIN {printf \"%.1f\", $TEMP / 10}" 2>/dev/null || echo "?")
    MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
    MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
    DISABLED=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
    TOTAL=$(adb shell pm list packages 2>/dev/null | grep -c "package:" || echo "0")

    echo "  📊 Estado rápido"
    echo "     🔋 Batería:       ${BATTERY}%"
    TEMP_VAL=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
    if [ -n "$TEMP_VAL" ]; then
        TEMP_DISP=$((TEMP_VAL / 10))
        echo "     🌡️  Temperatura:    ${TEMP_DISP}°C"
    fi
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
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║     📱 MejoraRedmi14c v$VERSION                                        ║"
    echo "║     Optimizador Android por ADB                                    ║"
    echo "╠═══════════════════════════════════════════════════════════════════╣"
    echo "║                                                                   ║"
    if [ $CONNECTED -eq 1 ]; then
        printf "║   📱 Conectado: %-20s (Android %-4s)              ║\n" "$DEVICE" "$ANDROID"
    else
        echo "║   ⚠️  Sin conexión                                                  ║"
    fi
    echo "║                                                                   ║"
    echo "╠═══════════════════════════════════════════════════════════════════╣"
    echo "║                                                                   ║"
    echo "║  🔥 MEGA OPTIMIZER (todo en uno):                                 ║"
    echo "║   1) 🔥 Mega Optimizer (avanzado)                                 ║"
    echo "║       → Hace TODO de una: limpia basura, acelera apps,            ║"
    echo "║         optimiza RAM, red, GPU y bloatware en ~5 min              ║"
    echo "║   2) 🔍 Verificar optimizaciones                                  ║"
    echo "║       → Revisa qué se aplicó y qué falta                          ║"
    echo "║   3) 🚨 Restaurar todo a fábrica                                   ║"
    echo "║       → Vuelve TODO al estado original (como recién comprado)     ║"
    echo "║                                                                   ║"
    echo "║  💾 Backup:                                                       ║"
    echo "║   4) 💾 Backup general local                                       ║"
    echo "║       → Guarda configs, apps y estado del teléfono en tu PC       ║"
    echo "║                                                                   ║"
    echo "║  🛤️  Ruta autónoma:                                                ║"
    echo "║   5) 🛤️  Ruta óptima automática                                     ║"
    echo "║       → Analiza tu teléfono y aplica la mejor config sin que       ║"
    echo "║         hagas nada                                                ║"
    echo "║                                                                   ║"
    echo "║  📊 Benchmark:                                                    ║"
    echo "║   6) 🔍 Benchmark ANTES (diagnóstico)                             ║"
    echo "║       → Mide qué tan rápido es tu teléfono AHORA                  ║"
    echo "║   7) 🔍 Benchmark DESPUÉS (verificar)                             ║"
    echo "║       → Mide la mejora después de optimizar                       ║"
    echo "║                                                                   ║"
    echo "║  🚀 Perfiles de optimización:                                     ║"
    echo "║   8) 🚀 Rendimiento (agresivo)                                    ║"
    echo "║       → Máxima velocidad, sacrifica un poco de batería            ║"
    echo "║   9) 📱 Equilibrado (recomendado)                                 ║"
    echo "║       → Buen balance entre velocidad y duración de batería        ║"
    echo "║  10) 🔋 Batería (ahorro)                                          ║"
    echo "║       → Prioriza que dure todo el día                              ║"
    echo "║  11) 🎮 Gaming (máximo rendimiento)                               ║"
    echo "║       → Para juegos pesados: GPU al mango, sin distracciones      ║"
    echo "║                                                                   ║"
    echo "║  📸💬 Fix apps específicas:                                        ║"
    echo "║  12) 📸💬 Fix Cámara + WhatsApp                                    ║"
    echo "║       → Arregla cámara lenta y WhatsApp que se traba              ║"
    echo "║                                                                   ║"
    echo "║  ⚡ Optimización avanzada:                                        ║"
    echo "║  13) 🧈 Fluidez (baseline profiles)                               ║"
    echo "║       → Hace que todo se sienta más suave al deslizar             ║"
    echo "║  14) 🌐 Tweaks de red                                             ║"
    echo "║       → Internet más rápido: DNS, TCP, WiFi optimizado            ║"
    echo "║  15) 💾 Tweaks de memoria                                         ║"
    echo "║       → Mejor gestión de RAM: menos apps que se cierran solas     ║"
    echo "║                                                                   ║"
    echo "║  🔧 Herramientas:                                                 ║"
    echo "║  16) 🔧 Mantenimiento                                             ║"
    echo "║       → Limpieza periódica de cache y archivos basura             ║"
    echo "║  17) 🔍 Diagnóstico detallado                                     ║"
    echo "║       → Muestra todo el estado del teléfono en detalle            ║"
    echo "║  18) 💾 Rescue Points                                             ║"
    echo "║       → Carga de seguridad: podés volver atrás si algo falla      ║"
    echo "║  19) 🧪 Test de verificación                                      ║"
    echo "║       → Verifica que todas las optimizaciones se aplicaron bien    ║"
    echo "║  20) 🔧 Reparación rápida                                         ║"
    echo "║       → Arregla problemas comunes sin restaurar todo              ║"
    echo "║                                                                   ║"
    echo "║  🚀📸💬 Turbo:                                                     ║"
    echo "║  22) 🚀📸💬 WhatsApp + Cámara ULTRA RÁPIDOS                       ║"
    echo "║       → speed compile + pre-calentado + memoria optimizada        ║"
    echo "║  23) ⚡ Boot más rápido                                           ║"
    echo "║       → Desactiva boot receivers + dexopt apps críticas           ║"
    echo "║  24) ⏱️  Medir tiempo de arranque                                  ║"
    echo "║       → Compara antes/después del reboot                          ║"
    echo "║                                                                   ║"
    echo "║  🚀 Todo en uno:                                                  ║"
    echo "║  25) 🚀 OPTIMIZACIÓN COMPLETA + LOG + REBOOT                     ║"
    echo "║       → Ejecuta TODO: mega + turbo + verificar + log + reinicio  ║"
    echo "║                                                                   ║"
    echo "║  🚨 Emergencia:                                                   ║"
    echo "║  21) 🚨 Restaurar todo (emergencia)                               ║"
    echo "║       → Último recurso: revierte TODO como si nada hubiera        ║"
    echo "║         pasado                                                   ║"
    echo "║                                                                   ║"
    echo "║    r) 🔄 Reconectar dispositivo                                   ║"
    echo "║    0) Salir                                                       ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
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
                bash "$SCRIPT_DIR/emergencia.sh"
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
       12) bash "$SCRIPT_DIR/fix-cam-whatsapp.sh" ;;
       13) bash "$SCRIPT_DIR/tweaks-smooth.sh" ;;
       14) bash "$SCRIPT_DIR/tweaks-red.sh" ;;
       15) bash "$SCRIPT_DIR/tweaks-memoria.sh" ;;
       16) bash "$SCRIPT_DIR/mantenimiento.sh" ;;
       17) bash "$SCRIPT_DIR/diagnostico.sh" ;;
       18) bash "$SCRIPT_DIR/rescue.sh" ;;
       19) bash "$SCRIPT_DIR/test-verificacion.sh" ;;
       20) bash "$SCRIPT_DIR/rapido.sh" ;;
       21) bash "$SCRIPT_DIR/emergencia.sh" ;;
       22) bash "$SCRIPT_DIR/turbo-apps.sh" ;;
       23) bash "$SCRIPT_DIR/optimize-boot.sh" ;;
       24) bash "$SCRIPT_DIR/measure-boot.sh" ;;
       25)
            echo -e "  ${BOLD}🚀 OPTIMIZACIÓN COMPLETA${NC}"
            echo "     Esto va a ejecutar: mega-optimizer + turbo-apps + verificar"
            echo "     Genera log en ./logs/ y reinicia el teléfono automáticamente."
            echo ""
            read -p "  ¿Ejecutar optimización completa? [S/n]: " CONFIRM_FULL
            if [ "$CONFIRM_FULL" != "n" ] && [ "$CONFIRM_FULL" != "N" ]; then
                bash "$SCRIPT_DIR/run-optimize.sh"
            fi
            ;;
        r|R) connect_device ;;
        0) echo "  ¡Chau! 👋"; exit 0 ;;
        *) echo -e "  ${RED}❌ Opción no válida${NC}" ;;
    esac

    echo ""
    read -p "  Presioná Enter para continuar..."
done
