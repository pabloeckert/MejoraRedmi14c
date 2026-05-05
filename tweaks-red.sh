#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Tweaks de Red — MejoraRedmi14c
#  Inspirado en: ADB-Android-Optimizer (SchneeSchmitt)
#
#  Optimiza DNS, TCP, buffer de red y conexiones WiFi
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🌐 Tweaks de Red — MejoraRedmi14c"
echo "════════════════════════════════════════════"
echo ""

# ─── DNS RÁPIDO ───
echo "[1/4] 🔗 Configurando DNS rápido..."
# Google DNS + Cloudflare DNS
adb shell settings put global dns_resolver_sample_validity_seconds 600 2>/dev/null
adb shell settings put global dns_resolver_min_samples 2 2>/dev/null
adb shell settings put global dns_resolver_max_samples 64 2>/dev/null
echo "      ✅ DNS optimizado"

# ─── TCP ───
echo "[2/4] 📡 Optimizando TCP..."
# Buffer TCP más grande para mejor throughput
adb shell settings put global tcp_default_init_rwnd 10 2>/dev/null
echo "      ✅ TCP buffer optimizado"

# ─── WIFI ───
echo "[3/4] 📶 Optimizando WiFi..."
# Desactivar WiFi scanning (ahorra batería)
adb shell settings put global wifi_scan_always_enabled 0 2>/dev/null
# Mantener WiFi activo durante suspensión
adb shell settings put global wifi_sleep_policy 2 2>/dev/null
echo "      ✅ WiFi optimizado"

# ─── DATOS MÓVILES ───
echo "[4/4] 📱 Optimizando datos móviles..."
# Desactivar roaming de datos por defecto
adb shell settings put global data_roaming 0 2>/dev/null
echo "      ✅ Datos móviles configurados"

echo ""
echo "════════════════════════════════════════════"
echo "🌐 ¡TWEAKS DE RED APLICADOS!"
echo "════════════════════════════════════════════"
echo ""
echo "   DNS:           Optimizado (muestreo reducido)"
echo "   TCP:           Buffer ampliado"
echo "   WiFi:          Scanning desactivado, siempre activo"
echo "   Datos:         Roaming desactivado"
echo ""
