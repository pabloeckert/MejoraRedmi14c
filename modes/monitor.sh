#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Modo monitoreo en tiempo real
#  Actualiza cada 3 segundos. Guarda métricas en DB cada 15s.
#  Salir con Ctrl+C.
# ═══════════════════════════════════════════════════════════════

mode_monitor() {
    local iteration=0
    local session_start; session_start=$(date +%s)

    log_info "Monitor en tiempo real — Ctrl+C para salir"
    sleep 1

    display_init
    display_draw_frame

    trap '_monitor_cleanup' INT TERM

    while true; do
        (( iteration++ ))

        # Leer métricas del dispositivo
        local meminfo; meminfo=$(adb_shell cat /proc/meminfo)
        local mem_total_kb; mem_total_kb=$(echo "$meminfo" | grep "MemTotal:"     | grep -o '[0-9]*')
        local mem_avail_kb; mem_avail_kb=$(echo "$meminfo" | grep "MemAvailable:" | grep -o '[0-9]*')
        local mem_used_pct=0
        if [ "${mem_total_kb:-0}" -gt 0 ]; then
            mem_used_pct=$(( (mem_total_kb - mem_avail_kb) * 100 / mem_total_kb ))
        fi

        # Temperatura
        local temp_raw; temp_raw=$(adb_shell dumpsys battery | grep "temperature:" | grep -o '[0-9]*')
        local temp_c=$(( ${temp_raw:-350} / 10 ))
        DEVICE_TEMP_C="$temp_c"

        # Batería
        local batt_raw; batt_raw=$(adb_shell dumpsys battery | grep "level:" | grep -o '[0-9]*')
        DEVICE_BATTERY_PCT="${batt_raw:-0}"

        # CPU load (load average 1 min como %)
        local load_avg; load_avg=$(adb_shell cat /proc/loadavg | awk '{print $1}')
        local cpu_pct; cpu_pct=$(echo "$load_avg * 100 / 8" | bc 2>/dev/null || echo 0)
        [ "${cpu_pct:-0}" -gt 100 ] && cpu_pct=100

        # Almacenamiento
        local disk_used_pct=0
        local disk_info; disk_info=$(adb_shell df /data 2>/dev/null | tail -1)
        local disk_total; disk_total=$(echo "$disk_info" | awk '{print $2}')
        local disk_used;  disk_used=$(echo  "$disk_info" | awk '{print $3}')
        if [ "${disk_total:-0}" -gt 0 ]; then
            disk_used_pct=$(( disk_used * 100 / disk_total ))
        fi

        # Apps desactivadas
        local disabled_count; disabled_count=$(bloatware_get_count)

        # Score
        local score; score=$(performance_calculate_score)

        # Actualizar paneles del dashboard
        display_update_metrics "$cpu_pct" "$mem_used_pct" "$temp_c" \
                               "$DEVICE_BATTERY_PCT" "$disk_used_pct"
        display_update_progress "$score" 100 "Monitoreo" "$disabled_count" 0
        display_update_history

        # Top 5 procesos por RAM (log)
        if [ $(( iteration % 5 )) -eq 1 ]; then
            local top_proc
            top_proc=$(adb_shell "ps -A -o NAME,RSS --sort=-rss 2>/dev/null | head -4 | tail -3")
            while IFS= read -r proc; do
                [ -n "$proc" ] && display_add_log "Proceso: $proc" "info"
            done <<< "$top_proc"
        fi

        # Guardar métricas en DB cada 5 iteraciones (15 segundos)
        if [ $(( iteration % 5 )) -eq 0 ]; then
            db_record_metrics "$mem_used_pct" "$cpu_pct" "$temp_c" \
                              "$DEVICE_BATTERY_PCT" "$disabled_count" "$disk_used_pct"
        fi

        # Alerta de temperatura
        if [ "$temp_c" -gt "$THERMAL_MAX_TEMP" ]; then
            display_add_log "ALERTA: Temp ${temp_c}°C — muy alta!" "warn"
        fi

        sleep 3
    done
}

# ─── Limpieza al salir (Ctrl+C) ───
_monitor_cleanup() {
    display_cleanup
    local session_end; session_end=$(date +%s)
    local duration=$(( session_end - session_start ))
    echo ""
    echo -e "${CYAN}${BOLD}  Sesión de monitoreo finalizada.${NC}"
    printf  "  Duración: %dmin %ds | Iteraciones: %d\n" \
        $(( duration / 60 )) $(( duration % 60 )) "$iteration"
    echo ""
    exit 0
}
