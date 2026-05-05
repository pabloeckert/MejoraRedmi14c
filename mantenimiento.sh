#!/bin/bash
# ═══════════════════════════════════════════
#  MANTENIMIENTO — MejoraRedmi14c
#  Ejecutá esto 1 vez al mes
#  Solo cache + cerrar apps (sin desactivar nada)
# ═══════════════════════════════════════════

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo ""
echo "🔧 MANTENIMIENTO — MejoraRedmi14c v$VERSION"
echo "════════════════════════════════════════════"
echo ""

if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo "📱 Dispositivo: $DEVICE (Android $ANDROID)"
echo ""

# ─── 1. CACHE ───
echo "[1/3] 🗑️  Limpiando cache..."
adb shell pm trim-caches 256M 2>/dev/null
adb shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
echo "      ✅ Cache limpiada"

# ─── 2. CERRAR APPS ───
echo "[2/3] 💀 Cerrando apps en segundo plano..."
KILLED=0
for APP in "${HEAVY_APPS[@]}"; do
    adb shell am force-stop "$APP" 2>/dev/null && KILLED=$((KILLED + 1))
done
echo "      ✅ $KILLED apps cerradas"

# ─── 3. ESTADO ───
echo "[3/3] 📊 Estado del sistema..."
BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null || echo "$TEMP")

echo ""
echo "════════════════════════════════════════════"
echo "🔧 ¡MANTENIMIENTO COMPLETADO!"
echo "════════════════════════════════════════════"
echo ""
echo "   Cache:       Limpiada"
echo "   Apps cerradas: $KILLED"
echo "   Batería:     ${BATTERY}%"
echo "   Temperatura:  ${TEMP_C}°C"
echo ""
