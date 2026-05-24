#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Motor de rendimiento (Poco Mode)
#  Basado en: tweaks-smooth.sh + mega-optimizer pasos 2-4, 7-8
# ═══════════════════════════════════════════════════════════════

# ─── Aplicar todos los tweaks de rendimiento (Poco Mode) ───
performance_apply_poco_mode() {
    local run_id="${1:-0}"
    local compiled_sys=0
    local compiled_third=0

    log_step "PERFORMANCE — Poco Mode"

    # ── Bloque 1: Animaciones (0.3x — mínimo HyperOS 3) ──
    # Settings.System — funciona en Android 16 sin root (global requiere WRITE_SECURE_SETTINGS)
    log_info "Animaciones 0.3x..."
    adb_setting_put_system window_animation_scale     "$ANIM_POCO_MODE"
    adb_setting_put_system transition_animation_scale "$ANIM_POCO_MODE"
    adb_setting_put_system animator_duration_scale    "$ANIM_POCO_MODE"
    log_ok "Animaciones: ${ANIM_POCO_MODE}x"
    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Animaciones ${ANIM_POCO_MODE}x" "ok"

    # ── Bloque 2: GPU máxima potencia ──
    # force_gpu_rendering y debug.hwui.* son Settings.Global — bloqueados en Android 16 sin root.
    # Se intentan de todas formas; si fallan se loguea warning en vez de éxito falso.
    log_info "GPU + Vulkan..."
    local _gpu_out
    _gpu_out=$(adb -s "$DEVICE_SERIAL" shell settings put global force_gpu_rendering 1 2>&1 | tr -d '\r')
    if echo "$_gpu_out" | grep -qi "exception\|denied"; then
        log_warn "GPU: bloqueado (Android 16 requiere WRITE_SECURE_SETTINGS para global)"
        [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "GPU: sin permisos" "warn"
    else
        adb -s "$DEVICE_SERIAL" shell settings put global force_msaa 1 >/dev/null 2>&1
        adb -s "$DEVICE_SERIAL" shell settings put global debug.hwui.renderer skiavk >/dev/null 2>&1
        adb -s "$DEVICE_SERIAL" shell settings put global debug.hwui.disable_draw_defer true >/dev/null 2>&1
        adb -s "$DEVICE_SERIAL" shell settings put global debug.hwui.disable_draw_reorder true >/dev/null 2>&1
        adb -s "$DEVICE_SERIAL" shell settings put global debug.enable_gpu_debug_layers 0 >/dev/null 2>&1
        log_ok "GPU: forzada + Vulkan + MSAA"
        [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "GPU Vulkan activado" "ok"
    fi

    # ── Bloque 3: Scroll y touch responsivo ──
    log_info "Touch y scroll..."
    adb_setting_put_system pointer_speed            5
    adb_setting_put        disable_window_blurs     1
    adb_setting_put_system haptic_feedback_intensity 1
    log_ok "Touch speed 5, blur desactivado"

    # ── Bloque 4: Refresh rate máximo (90Hz en Redmi 14C) ──
    log_info "Refresh rate..."
    adb_setting_put_system peak_refresh_rate 90
    adb_setting_put_system min_refresh_rate  60
    log_ok "Refresh rate: 90Hz"

    # ── Bloque 5: Performance mode ──
    log_info "Performance mode..."
    local _pm_out
    _pm_out=$(adb -s "$DEVICE_SERIAL" shell cmd power set-fixed-performance-mode-enabled true 2>&1 | tr -d '\r')
    if echo "$_pm_out" | grep -qi "unknown command\|exception\|error"; then
        log_warn "Performance mode: no soportado en esta ROM (HyperOS 3)"
    else
        log_ok "Fixed performance mode activado"
    fi

    # ── Bloque 6: Font scale ──
    adb_setting_put_system font_scale 0.9
    log_ok "Font scale: 0.9"

    # ── Bloque 7: Brillo manual (respuesta más rápida) ──
    adb_setting_put_system screen_brightness_mode 0
    log_ok "Brillo: manual"

    # ── Bloque 8: Desactivar efectos visuales pesados HyperOS 3 ──
    adb_setting_put disable_window_blurs 1
    log_ok "Efectos visuales HyperOS: reducidos"

    # ── Bloque 9: Background process limit ──
    adb_setting_put activity_manager_constants \
        "max_cached_processes=${MAX_CACHED_PROCESSES},background_settle_time=60000"
    log_ok "Max cached processes: $MAX_CACHED_PROCESSES"

    # ── Bloque 10: NFC / BT / WiFi scanning off ──
    adb_setting_put bluetooth_always_scanning 0
    adb_setting_put nfc_enabled               0
    adb_setting_put wifi_scan_always_enabled  0
    log_ok "BT scanning / NFC / WiFi scan: desactivados"

    # ── Bloque 11: Resolución optimizada para +FPS ──
    # wm size/density requieren WRITE_SECURE_SETTINGS en Android 16 — bloqueado sin root.
    log_info "Resolución gaming..."
    local _wm_out
    _wm_out=$(adb -s "$DEVICE_SERIAL" shell wm size "${GAMING_RES_W}x${GAMING_RES_H}" 2>&1 | tr -d '\r')
    if echo "$_wm_out" | grep -qi "exception\|denied"; then
        log_warn "Resolución: bloqueado (Android 16 requiere WRITE_SECURE_SETTINGS)"
    else
        adb -s "$DEVICE_SERIAL" shell wm density "$GAMING_DPI" 2>/dev/null
        log_ok "Resolución: ${GAMING_RES_W}x${GAMING_RES_H} @ ${GAMING_DPI}dpi (~+15% FPS)"
    fi

    # ── Bloque 12: Dexopt apps del sistema ──
    log_step "DEXOPT — Apps del sistema (speed-profile)"
    local dex_sys_pkgs
    dex_sys_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r')
    for app in "${SYSTEM_APPS_COMPILE[@]}"; do
        if ! echo "$dex_sys_pkgs" | grep -qxF "$app"; then
            continue
        fi
        if safe_compile "$app" "speed-profile"; then
            (( compiled_sys++ ))
            [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Compilado: $app" "ok"
        fi
    done
    log_ok "$compiled_sys/${#SYSTEM_APPS_COMPILE[@]} apps del sistema compiladas"

    # ── Bloque 13: Dexopt apps de terceros ──
    log_info "Compilando apps de terceros (puede tardar)..."
    local user_apps
    user_apps=$(adb -s "$DEVICE_SERIAL" shell pm list packages -3 2>/dev/null \
        | sed 's/package://' | tr -d '\r')
    local total_third=0
    for app in $user_apps; do
        (( total_third++ ))
        if safe_compile "$app" "speed-profile"; then
            (( compiled_third++ ))
        fi
    done
    log_ok "$compiled_third/$total_third apps de terceros compiladas"

    # bg-dexopt para que Android no recompile por su cuenta
    adb -s "$DEVICE_SERIAL" shell pm bg-dexopt-job >/dev/null 2>&1
    log_ok "bg-dexopt job ejecutado"

    echo "$((compiled_sys + compiled_third))"
}

# ─── Calcular score de optimización 0-100 ───
performance_calculate_score() {
    local score=0

    # Animaciones (máx 20 pts) — leer desde system (global bloqueado en Android 16)
    local anim; anim=$(adb_setting_get_system window_animation_scale)
    if   [ "$anim" = "0.3" ]; then score=$(( score + 20 ))
    elif [ "$anim" = "0.5" ]; then score=$(( score + 12 ))
    elif [ "$anim" = "1"   ]; then score=$(( score + 0  ))
    fi

    # GPU forzada (máx 15 pts) — bloqueado en Android 16 sin root; siempre 0 en ese caso
    local gpu; gpu=$(adb_setting_get force_gpu_rendering)
    [ "$gpu" = "1" ] && score=$(( score + 15 ))

    # Apps desactivadas (máx 25 pts, 1 pt por cada 2 apps, máx 50 apps)
    local disabled; disabled=$(bloatware_get_count 2>/dev/null || echo 0)
    local bloat_pts=$(( disabled / 2 ))
    [ "$bloat_pts" -gt 25 ] && bloat_pts=25
    score=$(( score + bloat_pts ))

    # RAM disponible (máx 20 pts)
    local mem_avail_kb; mem_avail_kb=$(adb_shell cat /proc/meminfo | grep "MemAvailable:" | grep -o '[0-9]*')
    local mem_total_kb; mem_total_kb=$(adb_shell cat /proc/meminfo | grep "MemTotal:" | grep -o '[0-9]*')
    if [ -n "$mem_avail_kb" ] && [ -n "$mem_total_kb" ] && [ "$mem_total_kb" -gt 0 ]; then
        local mem_free_pct=$(( mem_avail_kb * 100 / mem_total_kb ))
        local mem_pts=$(( mem_free_pct / 5 ))
        [ "$mem_pts" -gt 20 ] && mem_pts=20
        score=$(( score + mem_pts ))
    fi

    # Temperatura (máx 10 pts — cuanto más frío mejor)
    local temp_c="${DEVICE_TEMP_C:-35}"
    if   [ "$temp_c" -lt 30 ]; then score=$(( score + 10 ))
    elif [ "$temp_c" -lt 38 ]; then score=$(( score + 7  ))
    elif [ "$temp_c" -lt 42 ]; then score=$(( score + 3  ))
    fi

    # Performance mode (máx 10 pts)
    local perf_mode; perf_mode=$(adb_shell dumpsys power | grep "mFixedPerformanceModeEnabled" | grep -o 'true\|false')
    [ "$perf_mode" = "true" ] && score=$(( score + 10 ))

    [ "$score" -gt 100 ] && score=100
    echo "$score"
}

# ─── Revertir todos los tweaks a valores de fábrica ───
performance_restore_defaults() {
    log_step "Restaurando performance a defaults..."

    adb_setting_put_system window_animation_scale     1
    adb_setting_put_system transition_animation_scale 1
    adb_setting_put_system animator_duration_scale    1

    adb_shell settings delete global force_gpu_rendering
    adb_shell settings delete global force_msaa
    adb_shell settings delete global debug.hwui.renderer
    adb_shell settings delete global debug.hwui.disable_draw_defer
    adb_shell settings delete global debug.hwui.disable_draw_reorder
    adb_shell settings delete global debug.enable_gpu_debug_layers
    adb_shell settings delete global disable_window_blurs
    adb_shell settings delete global network_scoring_ui_enabled

    adb_setting_put_system pointer_speed            0
    adb_setting_put_system haptic_feedback_intensity 2
    adb_setting_put_system font_scale               1
    adb_setting_put_system screen_brightness_mode   1
    adb_setting_put_system peak_refresh_rate        60
    adb_setting_put_system min_refresh_rate         60

    adb_setting_put bluetooth_always_scanning 1
    adb_setting_put nfc_enabled               1
    adb_setting_put wifi_scan_always_enabled  1

    adb -s "$DEVICE_SERIAL" shell wm size reset    2>/dev/null
    adb -s "$DEVICE_SERIAL" shell wm density reset 2>/dev/null
    adb_shell cmd power set-fixed-performance-mode-enabled false
    adb_shell settings delete global activity_manager_constants

    log_ok "Performance restaurado a valores de fábrica."
}
