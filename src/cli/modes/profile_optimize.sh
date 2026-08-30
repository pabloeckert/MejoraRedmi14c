#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  profile_optimize.sh — Debloat personalizado basado en perfil
#
#  Requiere que Python haya generado data/profile_runtime.sh
#  antes de invocar este modo (lo hace adb_bridge.py).
#
#  Diferencia con full_optimize.sh:
#    - Solo ejecuta FASE 1 (backup) + FASE 2 (debloat personalizado)
#      + performance básico. Sin camera fix, dexopt, ni reboot.
#    - La lista de apps viene de PROFILE_RUNTIME (no PROFILE_POCO_MODE).
# ═══════════════════════════════════════════════════════════════

mode_profile_optimize() {
    local start_time; start_time=$(date +%s)
    local runtime_profile="$SCRIPT_DIR/data/profile_runtime.sh"

    # ── Verificar que el perfil de runtime existe ──
    if [ ! -f "$runtime_profile" ]; then
        log_fail "Perfil de runtime no encontrado: $runtime_profile"
        log_info "La app Redmi Forge genera este archivo antes de ejecutar."
        exit 1
    fi

    source "$runtime_profile"

    if [ "${#PROFILE_RUNTIME[@]}" -eq 0 ]; then
        log_warn "Lista de debloat vacía — el usuario protegió todas las apps."
        log_info "No hay nada que desactivar según este perfil."
        return 0
    fi

    log_info "Perfil cargado: ${#PROFILE_RUNTIME[@]} apps a desactivar"

    # ── FASE 0: Verificación de seguridad ──
    log_section "FASE 0 — Verificación"
    thermal_gate_check || exit 1

    # ── FASE 1: Backup automático ──
    log_section "FASE 1 — Backup"
    local snap_path
    snap_path=$(adb_take_snapshot "$DEVICE_SERIAL" "$BACKUPS_DIR")
    if [ -z "$snap_path" ]; then
        log_fail "Abortando — no se pudo crear un backup verificable (¿se desconectó el dispositivo?)"
        exit 1
    fi
    log_ok "Backup: $snap_path"

    memory_get_stats
    local ram_before_mb="${MEMORY_AVAIL_MB:-0}"
    local score_before; score_before=$(performance_calculate_score)

    local run_id
    run_id=$(db_start_run "profile" "$score_before" "$ram_before_mb" "${DEVICE_BATTERY_PCT:-0}" "${DEVICE_TEMP_C:-0}")
    log_info "Run ID: $run_id"

    # ── FASE 2: Debloat personalizado ──
    log_section "FASE 2 — Debloat personalizado"
    local apps_disabled
    apps_disabled=$(bloatware_run "PROFILE_RUNTIME" "$run_id")
    log_ok "Apps desactivadas: $apps_disabled"
    # bloatware_run mezcla log ANSI + número en stdout; extraer solo el entero para DB
    apps_disabled=$(printf '%s' "$apps_disabled" | grep -E '^[0-9]+$' | tail -1)
    apps_disabled="${apps_disabled:-0}"

    # ── Telemetría Xiaomi — siempre, sin opción de proteger ──
    log_section "FASE 2b — Telemetría Xiaomi"
    bloatware_run "PROFILE_XIAOMI_TELEMETRY" "$run_id" >/dev/null

    # ── FASE 3: Performance básico ──
    log_section "FASE 3 — Ajustes de sistema"
    performance_apply_poco_mode "$run_id"
    network_apply_optimization "$run_id"

    # ── Finalizar run en DB ──
    memory_get_stats
    local ram_after_mb="${MEMORY_AVAIL_MB:-0}"
    local score_after; score_after=$(performance_calculate_score)

    local end_time; end_time=$(date +%s)
    local duration=$(( end_time - start_time ))
    db_end_run "$run_id" "$score_after" "$ram_after_mb" "$apps_disabled" "0" "$duration" \
               "Perfil personalizado — HyperOS 3"

    log_section "Optimización personalizada completada"
    log_ok "Apps desactivadas: $apps_disabled | Tiempo: ${duration}s"
}
