#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Motor de optimización de memoria
#  Basado en: tweaks-memoria.sh + mega-optimizer paso 5
#  Target: Helio G81 Ultra, 4GB RAM + HyperOS Memory Extension
# ═══════════════════════════════════════════════════════════════

# ─── Aplicar todos los tweaks de memoria ───
memory_apply_optimization() {
    local run_id="${1:-0}"

    log_step "MEMORIA — Helio G81 Ultra"

    # Swappiness agresiva para Poco Mode
    adb_setting_put sys_swappiness "$SWAPPINESS_PERFORMANCE"
    log_ok "Swappiness: $SWAPPINESS_PERFORMANCE (menos swap, más RAM real)"

    # LMK agresivo (liberar RAM rápido)
    adb_setting_put lmk_minfree_levels "$LMK_PERFORMANCE"
    log_ok "LMK: thresholds altos (libera RAM más rápido)"

    # Max cached processes
    adb_setting_put activity_manager_constants \
        "max_cached_processes=${MAX_CACHED_PROCESSES},background_settle_time=60000"
    log_ok "Max cached processes: $MAX_CACHED_PROCESSES"

    # Dalvik/ART heap ampliado
    adb_setting_put dalvik_vm_heapsize      "$DALVIK_HEAP"
    adb_setting_put dalvik_vm_heapgrowthlimit "$DALVIK_GROWTH"
    log_ok "Dalvik heap: $DALVIK_HEAP / growth: $DALVIK_GROWTH"

    # HWUI cache XL (scrolling suave)
    adb_setting_put hwui_texture_cache_size  "$HWUI_TEXTURE"
    adb_setting_put hwui_layer_cache_size    "$HWUI_LAYER"
    adb_setting_put hwui_r_buffer_cache_size 12
    adb_setting_put hwui_gradient_cache_size 4
    log_ok "HWUI cache XL: texturas=${HWUI_TEXTURE}MB layers=${HWUI_LAYER}MB"

    # Memory Extension HyperOS 3 (RAM virtual 4GB → 8GB)
    adb_setting_put miui_memory_expand_enable 1
    adb_setting_put memory_expand_size        4096
    log_ok "HyperOS Memory Extension: activada (+4GB virtual)"

    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Memoria optimizada" "ok"
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

    # Temp y logs del sistema
    adb -s "$DEVICE_SERIAL" shell "rm -rf /data/local/tmp/*"       2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /data/tombstones/*"      2>/dev/null
    adb -s "$DEVICE_SERIAL" shell "rm -rf /data/anr/*"             2>/dev/null
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
    adb_shell settings delete global sys_swappiness
    adb_shell settings delete global lmk_minfree_levels
    adb_shell settings delete global activity_manager_constants
    adb_shell settings delete global dalvik_vm_heapsize
    adb_shell settings delete global dalvik_vm_heapgrowthlimit
    adb_shell settings delete global hwui_texture_cache_size
    adb_shell settings delete global hwui_layer_cache_size
    adb_shell settings delete global hwui_r_buffer_cache_size
    adb_shell settings delete global hwui_gradient_cache_size
    adb_shell settings delete global miui_memory_expand_enable
    adb_shell settings delete global memory_expand_size
    log_ok "Memoria restaurada a defaults."
}
