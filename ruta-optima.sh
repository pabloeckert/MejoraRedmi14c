#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  RUTA ÓPTIMA AUTÓNOMA — MejoraRedmi14c v5.0

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"
#  Analiza el dispositivo y aplica la mejor configuración
#  automáticamente, sin intervención del usuario.
#
#  Flujo:
#  1. Backup general
#  2. Diagnóstico completo
#  3. Selección automática del perfil óptimo
#  4. Aplicación de tweaks
#  5. Verificación post-optimización
#
#  Uso: ./ruta-optima.sh
# ═══════════════════════════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  🛤️  RUTA ÓPTIMA AUTÓNOMA — MejoraRedmi14c v$VERSION  ║${NC}"
echo -e "${BOLD}║  Tu teléfono, optimizado sin que hagas nada       ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── VERIFICAR CONEXIÓN ───
if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    echo "   Conectá tu teléfono por USB y activá la depuración USB."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
RAM_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
RAM_GB=$(echo "scale=1; $RAM_KB / 1048576" | bc 2>/dev/null || echo "?")
STORAGE_AVAIL=$(adb shell df /data 2>/dev/null | tail -1 | awk '{print $4}')
STORAGE_PCT=$(adb shell df /data 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
CORES=$(adb shell nproc 2>/dev/null | tr -d '\r')

echo -e "${CYAN}📱 Dispositivo: $DEVICE (Android $ANDROID)${NC}"
[ -n "$HYPEROS" ] && [ "$HYPEROS" != "null" ] && echo -e "${CYAN}   HyperOS: $HYPEROS${NC}"
echo -e "${CYAN}   RAM: ${RAM_GB}GB | Batería: ${BATTERY}% | Cores: $CORES${NC}"
echo ""

# ═══════════════════════════════════════════════
#  PASO 1: BACKUP GENERAL
# ═══════════════════════════════════════════════
echo -e "${BOLD}[1/5] 💾 BACKUP GENERAL${NC}"
echo "════════════════════════════════════════════"
echo ""

# Ejecutar backup directamente (sin el menú interactivo)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SERIAL=$(adb get-serialno 2>/dev/null | tr -d '\r')
BACKUP_NAME="${DEVICE}_${SERIAL}_${TIMESTAMP}"
BACKUP_DIR="$SCRIPT_DIR/backups/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR"

echo "   📁 backups/$BACKUP_NAME"
echo ""

# Identidad
cat > "$BACKUP_DIR/identidad.txt" << EOF
BACKUP — MejoraRedmi14c — Ruta Óptima
Fecha: $(date)
Modelo: $DEVICE
Serial: $SERIAL
Android: $ANDROID
HyperOS: ${HYPEROS:-N/A}
RAM: ${RAM_GB}GB
Batería: ${BATTERY}%
EOF

# Paquetes
adb shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-todos.txt"
adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-desactivados.txt"

# Settings
adb shell settings list global 2>/dev/null > "$BACKUP_DIR/settings-global.txt"
adb shell settings list system 2>/dev/null > "$BACKUP_DIR/settings-system.txt"
adb shell settings list secure 2>/dev/null > "$BACKUP_DIR/settings-secure.txt"

# Resolución
adb shell wm size 2>/dev/null > "$BACKUP_DIR/resolucion.txt"
adb shell wm density 2>/dev/null > "$BACKUP_DIR/dpi.txt"

# Batería y estado
adb shell dumpsys battery 2>/dev/null > "$BACKUP_DIR/bateria.txt"

echo -e "   ${GREEN}✅ Backup completado${NC}"
echo ""

# ═══════════════════════════════════════════════
#  PASO 2: DIAGNÓSTICO
# ═══════════════════════════════════════════════
echo -e "${BOLD}[2/5] 🔍 DIAGNÓSTICO${NC}"
echo "════════════════════════════════════════════"
echo ""

# Detectar problemas
ISSUES=0

# RAM
MEM_AVAIL_KB=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
if [ -n "$RAM_KB" ] && [ -n "$MEM_AVAIL_KB" ]; then
    MEM_USED_PCT=$(( (RAM_KB - MEM_AVAIL_KB) * 100 / RAM_KB ))
    if [ "$MEM_USED_PCT" -gt 80 ]; then
        echo -e "   ${RED}💾 RAM: ${MEM_USED_PCT}% usado — crítico${NC}"
        ISSUES=$((ISSUES + 1))
    elif [ "$MEM_USED_PCT" -gt 60 ]; then
        echo -e "   ${YELLOW}💾 RAM: ${MEM_USED_PCT}% usado — moderado${NC}"
    else
        echo -e "   ${GREEN}💾 RAM: ${MEM_USED_PCT}% usado — saludable${NC}"
    fi
fi

# Almacenamiento
if [ -n "$STORAGE_PCT" ] && [ "$STORAGE_PCT" -gt 85 ]; then
    echo -e "   ${RED}💿 Almacenamiento: ${STORAGE_PCT}% lleno — crítico${NC}"
    ISSUES=$((ISSUES + 1))
elif [ -n "$STORAGE_PCT" ] && [ "$STORAGE_PCT" -gt 70 ]; then
    echo -e "   ${YELLOW}💿 Almacenamiento: ${STORAGE_PCT}% lleno${NC}"
else
    echo -e "   ${GREEN}💿 Almacenamiento: ${STORAGE_PCT}% lleno — OK${NC}"
fi

# Batería
if [ -n "$BATTERY" ] && [ "$BATTERY" -lt 20 ]; then
    echo -e "   ${RED}🔋 Batería: ${BATTERY}% — cargá antes de optimizar${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "   ${GREEN}🔋 Batería: ${BATTERY}%${NC}"
fi

# Resolución override
OVERRIDE_SIZE=$(adb shell wm size 2>/dev/null | grep "Override size:" | grep -o '[0-9]*x[0-9]*')
if [ -n "$OVERRIDE_SIZE" ]; then
    echo -e "   ${RED}🖥️  Resolución alterada: $OVERRIDE_SIZE — restaurando${NC}"
    adb shell wm size reset 2>/dev/null
    adb shell wm density reset 2>/dev/null
    ISSUES=$((ISSUES + 1))
else
    echo -e "   ${GREEN}🖥️  Resolución: nativa${NC}"
fi

# Apps desactivadas previamente
DISABLED_COUNT=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
echo -e "   ${CYAN}📦 Apps desactivadas: $DISABLED_COUNT${NC}"

echo ""

# ═══════════════════════════════════════════════
#  PASO 3: SELECCIÓN AUTOMÁTICA DE PERFIL
# ═══════════════════════════════════════════════
echo -e "${BOLD}[3/5] 🎯 SELECCIÓN DE PERFIL${NC}"
echo "════════════════════════════════════════════"
echo ""

# Lógica de selección:
# - Batería < 40% → Batería
# - RAM > 75% y batería OK → Rendimiento
# - Caso general → Equilibrado
PROFILE=""
PROFILE_NAME=""

if [ "$BATTERY" -lt 40 ] 2>/dev/null; then
    PROFILE="bateria"
    PROFILE_NAME="🔋 Batería (ahorro)"
    echo "   Batería baja (${BATTERY}%) → perfil de ahorro"
elif [ "$MEM_USED_PCT" -gt 75 ] 2>/dev/null; then
    PROFILE="rendimiento"
    PROFILE_NAME="🚀 Rendimiento (agresivo)"
    echo "   RAM alta (${MEM_USED_PCT}%) → perfil de rendimiento"
else
    PROFILE="equilibrado"
    PROFILE_NAME="📱 Equilibrado (recomendado)"
    echo "   Estado normal → perfil equilibrado"
fi

echo ""
echo -e "   ${GREEN}Perfil seleccionado: $PROFILE_NAME${NC}"
echo ""

# ═══════════════════════════════════════════════
#  PASO 4: APLICAR OPTIMIZACIÓN
# ═══════════════════════════════════════════════
echo -e "${BOLD}[4/5] ⚡ APLICANDO OPTIMIZACIÓN${NC}"
echo "════════════════════════════════════════════"
echo ""

case "$PROFILE" in
    bateria)
        bash "$SCRIPT_DIR/perfil-bateria.sh"
        ;;
    rendimiento)
        bash "$SCRIPT_DIR/perfil-rendimiento.sh"
        ;;
    equilibrado)
        bash "$SCRIPT_DIR/perfil-equilibrado.sh"
        ;;
esac

# Siempre aplicar tweaks de fluidez después del perfil
echo ""
echo "   Aplicando tweaks de fluidez adicionales..."
bash "$SCRIPT_DIR/tweaks-smooth.sh" 2>/dev/null || true

echo ""

# ═══════════════════════════════════════════════
#  PASO 5: VERIFICACIÓN
# ═══════════════════════════════════════════════
echo -e "${BOLD}[5/5] 🧪 VERIFICACIÓN${NC}"
echo "════════════════════════════════════════════"
echo ""

# Verificar resolución
OVERRIDE_CHECK=$(adb shell wm size 2>/dev/null | grep "Override size:")
if [ -n "$OVERRIDE_CHECK" ]; then
    echo -e "   ${RED}⚠️  Resolución alterada — restaurando${NC}"
    adb shell wm size reset 2>/dev/null
    adb shell wm density reset 2>/dev/null
fi

# Verificar animaciones
ANIM=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
echo -e "   🎬 Animaciones: ${ANIM}x"

# Verificar GPU
GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
[ "$GPU" = "1" ] && echo -e "   🎨 GPU: forzada ⚡"

# RAM post-optimización
MEM_AVAIL_POST=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')
if [ -n "$RAM_KB" ] && [ -n "$MEM_AVAIL_POST" ]; then
    MEM_POST_PCT=$(( (RAM_KB - MEM_AVAIL_POST) * 100 / RAM_KB ))
    MEM_FREED=$(( (MEM_AVAIL_POST - MEM_AVAIL_KB) / 1024 ))
    echo -e "   💾 RAM post-optimización: ${MEM_POST_PCT}% usado (liberados ${MEM_FREED}MB)"
fi

# Apps desactivadas post
DISABLED_POST=$(adb shell pm list packages -d 2>/dev/null | grep -c "package:" || echo "0")
echo -e "   📦 Apps desactivadas: $DISABLED_POST"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🛤️  ¡RUTA ÓPTIMA COMPLETADA!${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""
echo "   📱 Dispositivo:     $DEVICE"
echo "   🎯 Perfil aplicado: $PROFILE_NAME"
echo "   💾 Backup:          backups/$BACKUP_NAME"
echo ""
echo "   📊 Resultados:"
echo "      RAM:     ${MEM_USED_PCT}% → ${MEM_POST_PCT}%"
echo "      Apps:    $DISABLED_COUNT → $DISABLED_POST desactivadas"
echo ""
echo "   💡 Si algo anda mal:"
echo "      • Reparación rápida:  ./rapido.sh"
echo "      • Restaurar TODO:     ./emergencia.sh"
echo "      • Restaurar backup:   ./rescue.sh"
echo ""
