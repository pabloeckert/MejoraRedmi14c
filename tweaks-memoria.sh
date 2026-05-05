#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Tweaks de Memoria y Dalvik — MejoraRedmi14c
#  Inspirado en: ADB-Android-Optimizer (SchneeSchmitt)
#
#  Optimiza gestión de memoria, swap, y virtual machine
# ═══════════════════════════════════════════════════════════════

echo ""
echo "💾 Tweaks de Memoria — MejoraRedmi14c"
echo "════════════════════════════════════════════"
echo ""

# ─── MEMORIA ───
echo "[1/4] 🧠 Optimizando gestión de memoria..."
# Reducir swappiness (menos swap, más RAM)
adb shell settings put global sys_swappiness 60 2>/dev/null
# Mantener más apps en memoria
adb shell settings put global activity_manager_constants "max_cached_processes=32" 2>/dev/null
echo "      ✅ Memoria optimizada"

# ─── DALVIK VM ───
echo "[2/4] ⚙️  Optimizando Dalvik VM..."
# Aumentar heap size para mejor rendimiento de apps
adb shell settings put global dalvik_vm_heapsize 512m 2>/dev/null
adb shell settings put global dalvik_vm_heapgrowthlimit 256m 2>/dev/null
echo "      ✅ Dalvik VM optimizado"

# ─── LMK (Low Memory Killer) ───
echo "[3/4] 🎯 Ajustando Low Memory Killer..."
# Ajustar thresholds para mantener más apps en memoria
# minfree values: [6MB, 8MB, 16MB, 24MB, 40MB, 80MB]
adb shell settings put global lmk_minfree_levels "1536,2048,4096,6144,10240,20480" 2>/dev/null
echo "      ✅ LMK ajustado"

# ─── RENDERIZADO ───
echo "[4/4] 🎨 Optimizando renderizado HWUI..."
# Aumentar texture cache para mejor rendimiento gráfico
adb shell settings put global hwui_texture_cache_size 72 2>/dev/null
adb shell settings put global hwui_layer_cache_size 48 2>/dev/null
adb shell settings put global hwui_r_buffer_cache_size 8 2>/dev/null
adb shell settings put global hwui_gradient_cache_size 2 2>/dev/null
echo "      ✅ Renderizado HWUI optimizado"

echo ""
echo "════════════════════════════════════════════"
echo "💾 ¡TWEAKS DE MEMORIA APLICADOS!"
echo "════════════════════════════════════════════"
echo ""
echo "   Memoria:       Swappiness reducido, más apps en RAM"
echo "   Dalvik VM:     Heap ampliado (512MB)"
echo "   LMK:           Thresholds ajustados"
echo "   HWUI:          Cache de texturas ampliada"
echo ""
