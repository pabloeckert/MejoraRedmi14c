#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Modo optimización personalizada (Sindy)
#  Copia estructural de modes/full_optimize.sh — único cambio real:
#  FASE 2 usa bloatware_run_whitelist (whitelist) en vez de
#  bloatware_run (blacklist). Todo lo demás se reutiliza sin cambios.
# ═══════════════════════════════════════════════════════════════

mode_sindy_optimize() {
    local start_time; start_time=$(date +%s)
    local run_id=0
    local apps_disabled=0
    local apps_compiled=0

    # ── FASE 0: Preparación ──
    log_section "FASE 0 — Preparación"
    thermal_gate_check || exit 1
    device_quiet_mode_enable
    # Si el script aborta en cualquier fase posterior (exit 1), igual hay que
    # restaurar WiFi/datos/DND — si no, el teléfono queda sin conexión.
    trap device_quiet_mode_disable EXIT

    memory_get_stats
    local ram_before_mb="${MEMORY_AVAIL_MB:-0}"
    local score_before; score_before=$(performance_calculate_score)

    log_info "Score inicial: ${score_before}%"
    log_info "RAM disponible: ${ram_before_mb}MB"

    if [ -t 1 ] && command -v tput &>/dev/null && [ "$(tput cols 2>/dev/null || echo 0)" -ge 80 ]; then
        display_init
        display_draw_frame
        display_update_metrics \
            0 \
            "$MEMORY_USED_PCT" \
            "$DEVICE_TEMP_C" \
            "$DEVICE_BATTERY_PCT" \
            0
    fi

    # ── FASE 1: Backup automático ──
    log_section "FASE 1 — Backup"
    local snap_path
    snap_path=$(adb_take_snapshot "$DEVICE_SERIAL" "$BACKUPS_DIR")
    if [ -z "$snap_path" ]; then
        log_fail "Abortando — no se pudo crear un backup verificable (¿se desconectó el dispositivo?)"
        exit 1
    fi
    log_ok "Backup: $snap_path"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Backup creado" "ok"

    run_id=$(db_start_run "sindy" "$score_before" "$ram_before_mb" \
                          "$DEVICE_BATTERY_PCT" "$DEVICE_TEMP_C")
    log_info "Run ID: $run_id"

    # ── FASE 2: Bloatware — WHITELIST (único cambio real vs full_optimize.sh) ──
    log_section "FASE 2 — Bloatware (perfil whitelist Sindy)"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 2 9 "Bloatware"
    local _bloat_raw
    _bloat_raw=$(bloatware_run_whitelist "PROFILE_SINDY_WHITELIST" "$run_id")
    log_raw "$_bloat_raw"
    apps_disabled=$(printf '%s' "$_bloat_raw" | grep -E '^[0-9]+$' | tail -1)
    apps_disabled="${apps_disabled:-0}"

    # ── FASE 2b: Telemetría Xiaomi — siempre, sin opción de proteger ──
    log_section "FASE 2b — Telemetría Xiaomi"
    bloatware_run "PROFILE_XIAOMI_TELEMETRY" "$run_id" >/dev/null

    # ── FASE 3: Performance tweaks ──
    log_section "FASE 3 — Performance + Red + Thermal"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 3 9 "Performance"
    performance_apply_poco_mode "$run_id"
    thermal_apply_performance
    network_apply_optimization "$run_id"

    thermal_gate_check || { log_fail "Abortando fases restantes por temperatura crítica."; exit 1; }

    # ── FASE 4: Camera + WhatsApp fix (prioridad de Sindy) ──
    log_section "FASE 4 — Camera + WhatsApp Fix"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 4 9 "Camera Fix"
    local cam_raw
    cam_raw=$(camera_fix_apply "$run_id")
    log_raw "$cam_raw"
    local cam_compiled
    cam_compiled=$(printf '%s' "$cam_raw" | grep -E '^[0-9]+$' | tail -1)
    apps_compiled=$(( apps_compiled + ${cam_compiled:-0} ))

    # ── FASE 5: Dexopt adicional y memoria ──
    log_section "FASE 5 — Memoria + Dexopt sistema"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 5 9 "Dexopt"
    memory_apply_optimization "$run_id"

    # ── FASE 6: Limpieza y kill de apps pesadas ──
    log_section "FASE 6 — Limpieza"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 6 9 "Limpieza"
    memory_clean_cache
    memory_kill_heavy_apps

    # ── FASE 7: Verificación post-optimización ──
    log_section "FASE 7 — Verificación"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 7 9 "Verificación"

    thermal_check >/dev/null
    if [ "${DEVICE_TEMP_C:-0}" -gt 45 ]; then
        log_warn "Temperatura alta post-optimización: ${DEVICE_TEMP_C}°C"
    else
        log_ok "Temperatura: ${DEVICE_TEMP_C}°C — OK"
    fi

    memory_get_stats
    local ram_after_mb="${MEMORY_AVAIL_MB:-0}"
    local score_after; score_after=$(performance_calculate_score)
    log_ok "Score final: ${score_after}% (antes: ${score_before}%)"

    local end_time; end_time=$(date +%s)
    local duration=$(( end_time - start_time ))
    db_end_run "$run_id" "$score_after" "$ram_after_mb" \
               "$apps_disabled" "$apps_compiled" "$duration" \
               "Perfil Sindy (whitelist) — HyperOS 3"

    db_record_metrics \
        "$MEMORY_USED_PCT" 0 "$DEVICE_TEMP_C" "$DEVICE_BATTERY_PCT" \
        "$(bloatware_get_count)" 0

    trap - EXIT
    device_quiet_mode_disable

    # ── FASE 8: Reinicio ──
    log_section "FASE 8 — Reinicio"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_update_progress 8 9 "Reinicio"
    display_cleanup

    echo ""
    echo -e "${YELLOW}${BOLD}  ¿Querés reiniciar ahora para aplicar todos los cambios?${NC}"
    read -rp "  [S/n]: " REBOOT_CHOICE
    REBOOT_CHOICE="${REBOOT_CHOICE:-s}"

    if [[ "$REBOOT_CHOICE" =~ ^[Ss]$ ]]; then
        log_info "Reiniciando dispositivo..."
        adb -s "$DEVICE_SERIAL" reboot 2>/dev/null
        log_info "Esperando reconexión (máx 3 min)..."
        local waited=0
        while [ "$waited" -lt 180 ]; do
            sleep 10
            waited=$(( waited + 10 ))
            if adb_verify_connection "$DEVICE_SERIAL"; then
                log_ok "Dispositivo reconectado."
                break
            fi
            printf "\r  Esperando... %ds" "$waited"
        done
    else
        log_info "Reiniciá manualmente cuando puedas: Settings → General → Reiniciar"
    fi

    # ── FASE 9: Pantalla de resultados ──
    display_show_completion_screen \
        "$score_before" "$score_after" "$duration" \
        "$apps_disabled" "$apps_compiled"
}
