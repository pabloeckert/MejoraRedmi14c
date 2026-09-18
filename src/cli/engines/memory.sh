#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Motor de optimización de memoria
#  Basado en: tweaks-memoria.sh + mega-optimizer paso 5
#  Target: Helio G81 Ultra, 4GB RAM + HyperOS Memory Extension
# ═══════════════════════════════════════════════════════════════

# ─── Aplicar saneamiento y optimización real de memoria ───
memory_apply_optimization() {
    local run_id="${1:-0}"

    log_step "MEMORIA — Saneamiento y optimización real (Android 16 / HyperOS 3)"

    # 1. Recorte de caché LRU a nivel de sistema y aplicaciones
    log_info "Recortando cachés de aplicaciones (pm trim-caches 2G)..."
    adb -s "$DEVICE_SERIAL" shell pm trim-caches 2G 2>/dev/null
    log_ok "Caché de sistema y apps recortada"

    # 2. Limpieza de caché específica para apps pesadas
    log_info "Limpiando caché de aplicaciones pesadas..."
    local cleaned_apps=0
    for app in "${HEAVY_APPS[@]}"; do
        if adb -s "$DEVICE_SERIAL" shell pm clear --cache-only "$app" 2>/dev/null | grep -qi "success"; then
            (( cleaned_apps++ ))
        fi
    done
    log_ok "Caché limpiada para $cleaned_apps aplicaciones pesadas"

    # 3. Limpieza de thumbnails y archivos temporales de usuario
    adb -s "$DEVICE_SERIAL" shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /sdcard/Pictures/.thumbnails/*" 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /data/local/tmp/*" 2>/dev/null
    log_ok "Archivos temporales y thumbnails limpiados"

    # 4. Detener procesos pesados en background que consumen RAM
    memory_kill_heavy_apps >/dev/null

    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Memoria saneada y optimizada" "ok"
}

# ─── Leer estadísticas de RAM del dispositivo ───
memory_get_stats() {
    local meminfo; meminfo=$(adb_shell cat /proc/meminfo)
    MEMORY_TOTAL_KB=$(echo "$meminfo" | grep "MemTotal:"     | grep -o '[0-9]*')
    MEMORY_FREE_KB=$(echo  "$meminfo" | grep "MemFree:"      | grep -o '[0-9]*')
    MEMORY_AVAIL_KB=$(echo "$meminfo" | grep "MemAvailable:" | grep -o '[0-9]*')

    local swap_info; swap_info=$(adb_shell cat /proc/swaps 2>/dev/null | tail -1)
    MEMORY_SWAP_TOTAL_KB=$(echo "$swap_info" | awk '{print $3}')
    MEMORY_SWAP_USED_KB=$(echo  "$swap_info" | awk '{print $4}')

    MEMORY_TOTAL_MB=$(( ${MEMORY_TOTAL_KB:-0} / 1024 ))
    MEMORY_AVAIL_MB=$(( ${MEMORY_AVAIL_KB:-0} / 1024 ))
    MEMORY_USED_MB=$(( MEMORY_TOTAL_MB - MEMORY_AVAIL_MB ))
    MEMORY_USED_PCT=0
    [ "$MEMORY_TOTAL_MB" -gt 0 ] && MEMORY_USED_PCT=$(( MEMORY_USED_MB * 100 / MEMORY_TOTAL_MB ))
}

# ─── Cerrar apps pesadas con force-stop ───
memory_kill_heavy_apps() {
    log_info "Cerrando apps pesadas..."
    local killed=0
    for app in "${HEAVY_APPS[@]}"; do
        adb -s "$DEVICE_SERIAL" shell am force-stop "$app" 2>/dev/null && (( killed++ ))
    done
    log_ok "$killed apps pesadas cerradas"
    echo "$killed"
}

# ─── Limpiar cache profunda — retorna MB estimados liberados ───
memory_clean_cache() {
    log_step "LIMPIEZA DE CACHE"

    local avail_before_kb; avail_before_kb=$(adb_shell cat /proc/meminfo | grep "MemAvailable:" | grep -o '[0-9]*')

    # Cache de apps (2GB)
    adb -s "$DEVICE_SERIAL" shell pm trim-caches 2G 2>/dev/null
    log_ok "pm trim-caches 2G ejecutado"

    # Thumbnails
    adb -s "$DEVICE_SERIAL" shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /sdcard/Pictures/.thumbnails/*" 2>/dev/null
    log_ok "Thumbnails eliminados"

    # Temp y logs accesibles
    adb -s "$DEVICE_SERIAL" shell "rm -rf /data/local/tmp/*"       2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /sdcard/MIUI/debug_log/*" 2>/dev/null
    log_ok "Temp files y logs de debug eliminados"

    local avail_after_kb; avail_after_kb=$(adb_shell cat /proc/meminfo | grep "MemAvailable:" | grep -o '[0-9]*')
    local freed_mb=$(( ( ${avail_after_kb:-0} - ${avail_before_kb:-0} ) / 1024 ))
    [ "$freed_mb" -lt 0 ] && freed_mb=0

    log_ok "Estimado liberado: ${freed_mb}MB"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Cache limpiada (~${freed_mb}MB)" "ok"
    echo "$freed_mb"
}

# ─── Revertir tweaks de memoria a defaults ───
memory_restore_defaults() {
    adb_shell settings delete global sys_swappiness 2>/dev/null
    adb_shell settings delete global lmk_minfree_levels 2>/dev/null
    adb_shell settings delete global activity_manager_constants 2>/dev/null
    adb_shell settings delete global dalvik_vm_heapsize 2>/dev/null
    adb_shell settings delete global dalvik_vm_heapgrowthlimit 2>/dev/null
    adb_shell settings delete global hwui_texture_cache_size 2>/dev/null
    adb_shell settings delete global hwui_layer_cache_size 2>/dev/null
    adb_shell settings delete global hwui_r_buffer_cache_size 2>/dev/null
    adb_shell settings delete global hwui_gradient_cache_size 2>/dev/null
    adb_shell settings delete global miui_memory_expand_enable 2>/dev/null
    adb_shell settings delete global memory_expand_size 2>/dev/null
    log_ok "Memoria restaurada a defaults."
}
