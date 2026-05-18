#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Modo mantenimiento semanal
#  Objetivo: < 5 minutos. Sin dexopt completo ni backup.
#  Basado en: mantenimiento.sh original
# ═══════════════════════════════════════════════════════════════

mode_maintenance() {
    local start_time; start_time=$(date +%s)
    local run_id=0

    log_section "MANTENIMIENTO SEMANAL"

    # Verificar temperatura
    thermal_gate_check || exit 1

    local score_before; score_before=$(performance_calculate_score)
    memory_get_stats
    local ram_before_mb="${MEMORY_AVAIL_MB:-0}"

    run_id=$(db_start_run "maintenance" "$score_before" "$ram_before_mb" \
                          "$DEVICE_BATTERY_PCT" "$DEVICE_TEMP_C")

    # ── Paso 1: Detectar y corregir regresiones OTA ──
    log_step "Detectando regresiones OTA..."
    local regressions_fixed
    regressions_fixed=$(bloatware_fix_regressions "$run_id")
    if [ "${regressions_fixed:-0}" -gt 0 ]; then
        log_ok "$regressions_fixed app(s) re-desactivadas (OTA las había reactivado)"
    else
        log_ok "Sin regresiones OTA detectadas."
    fi

    # ── Paso 2: Limpiar cache ──
    log_step "Limpiando cache..."
    local freed_mb; freed_mb=$(memory_clean_cache)

    # ── Paso 3: Cerrar apps pesadas ──
    log_step "Cerrando apps pesadas..."
    local killed; killed=$(memory_kill_heavy_apps)

    # ── Paso 4: Re-compilar cámara y WhatsApp ──
    log_step "Re-compilando cámara y WhatsApp..."
    local cam_compiled; cam_compiled=$(camera_fix_apply "$run_id")

    # ── Paso 5: Score actual vs último run ──
    memory_get_stats
    local score_after; score_after=$(performance_calculate_score)

    local end_time; end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    db_end_run "$run_id" "$score_after" "${MEMORY_AVAIL_MB:-0}" \
               "${regressions_fixed:-0}" "$cam_compiled" "$duration" \
               "Mantenimiento semanal"

    db_record_metrics \
        "$MEMORY_USED_PCT" 0 "$DEVICE_TEMP_C" "$DEVICE_BATTERY_PCT" \
        "$(bloatware_get_count)" 0

    local last_run; last_run=$(db_get_last_run)

    echo ""
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║  🔧 MANTENIMIENTO COMPLETADO                         ║${NC}"
    echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
    printf  "${CYAN}${BOLD}║  Duración:           %2dmin %2ds                       ║${NC}\n" \
        $(( duration / 60 )) $(( duration % 60 ))
    printf  "${CYAN}${BOLD}║  Regresiones OTA:    %-4d re-desactivadas             ║${NC}\n" "${regressions_fixed:-0}"
    printf  "${CYAN}${BOLD}║  Cache liberado:     %-4dMB                           ║${NC}\n" "${freed_mb:-0}"
    printf  "${CYAN}${BOLD}║  Apps cerradas:      %-4d                             ║${NC}\n" "${killed:-0}"
    printf  "${CYAN}${BOLD}║  Apps compiladas:    %-4d                             ║${NC}\n" "${cam_compiled:-0}"
    printf  "${CYAN}${BOLD}║  Score:              %3d%% → %3d%%                    ║${NC}\n" "$score_before" "$score_after"
    echo -e "${CYAN}${BOLD}║  Próximo:            en 7 días                       ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
}
