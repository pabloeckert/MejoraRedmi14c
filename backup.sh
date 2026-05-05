#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  BACKUP GENERAL — MejoraRedmi14c v3.0
#  Crea un backup completo del estado del dispositivo
#  Guarda todo en una carpeta con la identidad del teléfono
#
#  Uso: ./backup.sh
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── COLORES ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "💾 BACKUP GENERAL — MejoraRedmi14c v3.0"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo -e "${RED}❌ No se detectó ningún dispositivo.${NC}"
    echo "   Conectá tu teléfono por USB y activá la depuración USB."
    exit 1
fi

# ─── IDENTIDAD DEL DISPOSITIVO ───
MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
MFR=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
SDK=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
BUILD=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')
HYPEROS=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')
SERIAL=$(adb get-serialno 2>/dev/null | tr -d '\r')
SECURITY=$(adb shell getprop ro.build.version.security_patch 2>/dev/null | tr -d '\r')
SOC=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\r')
ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')

echo "📱 Dispositivo detectado:"
echo "   Fabricante:    $MFR"
echo "   Modelo:        $MODEL"
echo "   Serial:        $SERIAL"
echo "   Android:       $ANDROID (SDK $SDK)"
[ -n "$HYPEROS" ] && [ "$HYPEROS" != "null" ] && echo "   HyperOS:       $HYPEROS"
echo "   Build:         $BUILD"
echo "   Security:      $SECURITY"
echo "   SoC:           $SOC"
echo "   ABI:           $ABI"
echo ""

# ─── CREAR CARPETA DE BACKUP ───
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${MODEL}_${SERIAL}_${TIMESTAMP}"
BACKUP_DIR="$SCRIPT_DIR/backups/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR"

echo "📁 Carpeta de backup: backups/$BACKUP_NAME"
echo ""

# ─── 1. IDENTIDAD DEL DISPOSITIVO ───
echo "[1/8] 📋 Guardando identidad del dispositivo..."
cat > "$BACKUP_DIR/identidad.txt" << EOF
═══════════════════════════════════════════
  BACKUP — MejoraRedmi14c
  Fecha: $(date)
═══════════════════════════════════════════

📱 DISPOSITIVO
   Fabricante:    $MFR
   Modelo:        $MODEL
   Serial:        $SERIAL
   Android:       $ANDROID (SDK $SDK)
   HyperOS:       ${HYPEROS:-N/A}
   Build:         $BUILD
   Security:      $SECURITY
   SoC:           $SOC
   ABI:           $ABI

═══════════════════════════════════════════
EOF
echo "      ✅ identidad.txt"

# ─── 2. LISTA DE PAQUETES ───
echo "[2/8] 📦 Guardando lista de paquetes..."
adb shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-todos.txt"
echo "      ✅ paquetes-todos.txt ($(wc -l < "$BACKUP_DIR/paquetes-todos.txt") paquetes)"

adb shell pm list packages -s 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-sistema.txt"
echo "      ✅ paquetes-sistema.txt ($(wc -l < "$BACKUP_DIR/paquetes-sistema.txt") paquetes)"

adb shell pm list packages -3 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-terceros.txt"
echo "      ✅ paquetes-terceros.txt ($(wc -l < "$BACKUP_DIR/paquetes-terceros.txt") paquetes)"

adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$BACKUP_DIR/paquetes-desactivados.txt"
echo "      ✅ paquetes-desactivados.txt ($(wc -l < "$BACKUP_DIR/paquetes-desactivados.txt") paquetes)"

# ─── 3. CONFIGURACIÓN DEL SISTEMA ───
echo "[3/8] ⚙️  Guardando configuración del sistema..."
adb shell settings list global 2>/dev/null > "$BACKUP_DIR/settings-global.txt"
adb shell settings list system 2>/dev/null > "$BACKUP_DIR/settings-system.txt"
adb shell settings list secure 2>/dev/null > "$BACKUP_DIR/settings-secure.txt"
echo "      ✅ settings-global.txt"
echo "      ✅ settings-system.txt"
echo "      ✅ settings-secure.txt"

# ─── 4. RESOLUCIÓN Y DPI ───
echo "[4/8] 🖥️  Guardando resolución y DPI..."
{
    echo "=== Resolución ==="
    adb shell wm size 2>/dev/null
    echo ""
    echo "=== DPI ==="
    adb shell wm density 2>/dev/null
} > "$BACKUP_DIR/resolucion-dpi.txt"
echo "      ✅ resolucion-dpi.txt"

# ─── 5. ESTADO DE BATERÍA ───
echo "[5/8] 🔋 Guardando estado de batería..."
adb shell dumpsys battery 2>/dev/null > "$BACKUP_DIR/bateria.txt"
echo "      ✅ bateria.txt"

# ─── 6. INFORMACIÓN DE MEMORIA ───
echo "[6/8] 💾 Guardando información de memoria..."
{
    echo "=== /proc/meminfo ==="
    adb shell cat /proc/meminfo 2>/dev/null
    echo ""
    echo "=== Procesos por RAM (top 30) ==="
    adb shell "ps -A -o PID,USER,RSS,COMM --sort=-rss" 2>/dev/null | head -31
} > "$BACKUP_DIR/memoria.txt"
echo "      ✅ memoria.txt"

# ─── 7. ESTADO DE RED ───
echo "[7/8] 🌐 Guardando estado de red..."
{
    echo "=== WiFi ==="
    adb shell dumpsys wifi 2>/dev/null | grep -E "^Wi-Fi|SSID|BSSID|IP|Link speed|Frequency|Signal" | head -20
    echo ""
    echo "=== DNS ==="
    adb shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null
    echo ""
    echo "=== WiFi Scan ==="
    adb shell settings get global wifi_scan_always_enabled 2>/dev/null
} > "$BACKUP_DIR/red.txt"
echo "      ✅ red.txt"

# ─── 8. CONFIGURACIÓN DE ANIMACIONES Y GPU ───
echo "[8/8] 🎨 Guardando configuración visual..."
{
    echo "=== Animaciones ==="
    echo "window_animation_scale: $(adb shell settings get global window_animation_scale 2>/dev/null)"
    echo "transition_animation_scale: $(adb shell settings get global transition_animation_scale 2>/dev/null)"
    echo "animator_duration_scale: $(adb shell settings get global animator_duration_scale 2>/dev/null)"
    echo ""
    echo "=== GPU ==="
    echo "force_gpu_rendering: $(adb shell settings get global force_gpu_rendering 2>/dev/null)"
    echo "force_msaa: $(adb shell settings get global force_msaa 2>/dev/null)"
    echo "hwui.renderer: $(adb shell settings get global debug.hwui.renderer 2>/dev/null)"
    echo ""
    echo "=== SELinux ==="
    adb shell getenforce 2>/dev/null
} > "$BACKUP_DIR/visual-gpu.txt"
echo "      ✅ visual-gpu.txt"

# ─── RESUMEN ───
echo ""
echo "════════════════════════════════════════════"
echo -e "${GREEN}💾 ¡BACKUP COMPLETADO!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "   📁 Carpeta: backups/$BACKUP_NAME"
echo ""
echo "   Archivos generados:"
ls -1 "$BACKUP_DIR" | while read f; do
    SIZE=$(du -h "$BACKUP_DIR/$f" | cut -f1)
    echo "     📄 $f ($SIZE)"
done
echo ""
echo "   Total: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "   💡 Este backup guarda el ESTADO del dispositivo."
echo "      Para restaurar apps desactivadas: ./emergencia.sh"
echo ""
