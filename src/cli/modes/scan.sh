#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  scan.sh — Lee el estado real del dispositivo antes de optimizar
#
#  Salida: reporte en terminal con indicadores de qué ya está
#  aplicado y qué falta. No modifica nada en el dispositivo.
#
#  Uso: ./run.sh --scan
# ═══════════════════════════════════════════════════════════════

mode_scan() {
    local serial="${DEVICE_SERIAL}"

    log_section "SCAN — Estado real del dispositivo"

    # ── Memoria RAM ───────────────────────────────────────────────
    log_step "Memoria"
    local mem_total mem_avail
    mem_total=$(adb -s "$serial" shell cat /proc/meminfo 2>/dev/null \
        | grep "^MemTotal:"     | grep -o '[0-9]*' | head -1 | tr -d '\r')
    mem_avail=$(adb -s "$serial" shell cat /proc/meminfo 2>/dev/null \
        | grep "^MemAvailable:" | grep -o '[0-9]*' | head -1 | tr -d '\r')
    local mem_total_mb=$(( ${mem_total:-0} / 1024 ))
    local mem_avail_mb=$(( ${mem_avail:-0} / 1024 ))
    local mem_free_pct=0
    [ "${mem_total:-0}" -gt 0 ] && mem_free_pct=$(( mem_avail * 100 / mem_total ))
    log_ok   "RAM total:       ${mem_total_mb} MB"
    log_info  "RAM disponible:  ${mem_avail_mb} MB (${mem_free_pct}% libre)"

    # ── Apps del perfil de runtime ────────────────────────────────
    log_step "Apps del perfil de runtime"
    local runtime_profile="$SCRIPT_DIR/data/profile_runtime.sh"
    local count_done=0 count_pending=0 count_missing=0

    if [ -f "$runtime_profile" ]; then
        source "$runtime_profile"
        local all_pkgs disabled_pkgs
        all_pkgs=$(adb -s "$serial" shell pm list packages 2>/dev/null \
            | sed 's/package://' | tr -d '\r')
        disabled_pkgs=$(adb -s "$serial" shell pm list packages -d 2>/dev/null \
            | sed 's/package://' | tr -d '\r')

        for pkg in "${PROFILE_RUNTIME[@]}"; do
            if echo "$disabled_pkgs" | grep -qxF "$pkg"; then
                log_ok  "YA DESACTIVADA:  $pkg"
                (( count_done++ ))
            elif echo "$all_pkgs" | grep -qxF "$pkg"; then
                log_warn "PENDIENTE:       $pkg"
                (( count_pending++ ))
            else
                log_info "NO INSTALADA:    $pkg"
                (( count_missing++ ))
            fi
        done
        log_info "Resumen: $count_done ya hechas | $count_pending pendientes | $count_missing no instaladas"
    else
        log_warn "profile_runtime.sh no encontrado — generalo con la app Redmi Forge primero"
    fi

    # ── Tweaks de performance actuales ───────────────────────────
    log_step "Tweaks de performance"

    local anim refresh blur gpu perf_mode wm_size wm_dpi
    # Animaciones: Settings.System (global bloqueado en Android 16 sin root)
    anim=$(adb -s "$serial" shell settings get system window_animation_scale 2>/dev/null | tr -d '\r')
    # GPU: Settings.Global — en Android 16 sin root siempre null (bloqueado)
    gpu=$(adb -s "$serial"  shell settings get global force_gpu_rendering    2>/dev/null | tr -d '\r')
    refresh=$(adb -s "$serial" shell settings get system peak_refresh_rate   2>/dev/null | tr -d '\r')
    blur=$(adb -s "$serial" shell settings get global disable_window_blurs   2>/dev/null | tr -d '\r')
    wm_size=$(adb -s "$serial" shell wm size    2>/dev/null | tr -d '\r' | grep -o '[0-9]*x[0-9]*' | head -1)
    wm_dpi=$(adb -s "$serial"  shell wm density 2>/dev/null | tr -d '\r' | grep -o '[0-9]*' | head -1)
    perf_mode=$(adb -s "$serial" shell dumpsys power 2>/dev/null \
        | grep "mFixedPerformanceModeEnabled" | grep -o 'true\|false' | head -1 | tr -d '\r')

    _scan_tweak "Animaciones"      "${anim:-no conf.}"   "0.3"
    _scan_tweak "Refresh rate Hz"  "${refresh:-no conf.}" "90"
    # Blur: bloqueado en Android 16 sin root (WRITE_SECURE_SETTINGS requerido)
    if [ "${blur:-null}" = "1" ]; then
        log_ok  "$(printf '%-22s' "Blur desact.") 1  [ya aplicado]"
    else
        log_info "$(printf '%-22s' "Blur desact.") bloqueado en Android 16 (requiere root)"
    fi
    # GPU y resolución: bloqueados en Android 16 sin root — mostrar estado real
    if [ "${gpu:-null}" = "1" ]; then
        log_ok  "$(printf '%-22s' "GPU forzada") 1  [ya aplicado]"
    else
        log_info "$(printf '%-22s' "GPU forzada") bloqueado en Android 16 (requiere root)"
    fi
    if [ "${wm_size:-null}" = "${GAMING_RES_W}x${GAMING_RES_H}" ]; then
        log_ok  "$(printf '%-22s' "Resolución") ${wm_size}  [ya aplicado]"
    else
        log_info "$(printf '%-22s' "Resolución") ${wm_size:-?}  → bloqueado en Android 16 (requiere root)"
    fi
    if [ "${perf_mode:-false}" = "true" ]; then
        log_ok  "$(printf '%-22s' "Performance mode") true  [ya aplicado]"
    else
        log_info "$(printf '%-22s' "Performance mode") no soportado en HyperOS 3"
    fi

    log_section "SCAN completado — ${count_pending} apps pendientes, ${count_done} ya listas"
}

# ─── Helper: muestra tweak con indicador visual ──────────────────
_scan_tweak() {
    local label="$1" value="$2" target="$3"
    if [ "$value" = "$target" ]; then
        log_ok  "$(printf '%-22s' "$label") $value  [ya aplicado]"
    else
        log_warn "$(printf '%-22s' "$label") $value  → target: $target"
    fi
}
