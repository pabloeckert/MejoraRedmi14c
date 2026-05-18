#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Motor de desactivación de bloatware
#  Requiere: data/bloatware_db.sh, core/database.sh cargados
# ═══════════════════════════════════════════════════════════════

# ─── Ejecutar desactivación según perfil dado ───
bloatware_run() {
    local profile_name="${1:-PROFILE_POCO_MODE}"
    local run_id="${2:-0}"

    log_step "BLOATWARE — Perfil: $profile_name"

    # Obtener el array del perfil por nombre (bash nameref)
    local -n profile_array="$profile_name"

    # Cache de paquetes actuales y desactivados
    local all_pkgs; all_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null \
        | sed 's/package://' | tr -d '\r')
    local disabled_pkgs; disabled_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null \
        | sed 's/package://' | tr -d '\r')

    local count_ok=0
    local count_already=0
    local count_skip=0
    local count_notfound=0
    local total="${#profile_array[@]}"
    local processed=0

    for pkg in "${profile_array[@]}"; do
        (( processed++ ))

        # Verificar si es crítica
        if is_critical_pkg "$pkg"; then
            log_warn "PROTEGIDA: $(pkg_name "$pkg") ($pkg)"
            (( count_skip++ ))
            continue
        fi

        # Verificar si existe
        if ! echo "$all_pkgs" | grep -qF "$pkg"; then
            (( count_notfound++ ))
            continue
        fi

        # Verificar si ya está desactivada
        if echo "$disabled_pkgs" | grep -qF "$pkg"; then
            (( count_already++ ))
            db_log_app_action "$pkg" "$(pkg_name "$pkg")" "already_disabled" "$run_id"
            continue
        fi

        # Desactivar
        if safe_disable_pkg "$pkg"; then
            local app_name; app_name=$(pkg_name "$pkg")
            log_ok "$app_name"
            db_log_app_action "$pkg" "$app_name" "disabled" "$run_id"
            (( count_ok++ ))
            # Actualizar progreso en dashboard si está inicializado
            if [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ]; then
                display_add_log "$app_name desactivado" "ok"
                display_update_progress "$processed" "$total" "Bloatware" "$count_ok" "$total"
            fi
        else
            (( count_skip++ ))
        fi
    done

    log_info "Resultado: $count_ok nuevas | $count_already ya estaban | $count_notfound no encontradas | $count_skip saltadas"
    echo "$count_ok"
}

# ─── Detectar paquetes que se reactivaron después de una OTA ───
bloatware_detect_regressions() {
    log_step "Detectando regresiones OTA..."
    local regressions
    mapfile -t regressions < <(db_detect_ota_regressions)

    if [ "${#regressions[@]}" -eq 0 ]; then
        log_ok "Sin regresiones OTA detectadas."
        echo ""
        return 0
    fi

    log_warn "${#regressions[@]} app(s) reactivadas por OTA:"
    for pkg in "${regressions[@]}"; do
        log_warn "  ↩ $(pkg_name "$pkg") ($pkg)"
    done

    printf '%s\n' "${regressions[@]}"
}

# ─── Re-desactivar paquetes que regresaron desde el último run ───
bloatware_fix_regressions() {
    local run_id="${1:-0}"
    mapfile -t regressions < <(bloatware_detect_regressions)

    [ "${#regressions[@]}" -eq 0 ] && return 0

    log_step "Re-desactivando regresiones..."
    local fixed=0
    for pkg in "${regressions[@]}"; do
        if safe_disable_pkg "$pkg"; then
            log_ok "Re-desactivado: $(pkg_name "$pkg")"
            db_log_app_action "$pkg" "$(pkg_name "$pkg")" "regression_fixed" "$run_id"
            (( fixed++ ))
        fi
    done
    log_info "Regresiones corregidas: $fixed/${#regressions[@]}"
    echo "$fixed"
}

# ─── Reactivar TODOS los paquetes desactivados (restauración) ───
bloatware_restore_all() {
    log_step "Restaurando TODOS los paquetes desactivados..."

    local disabled_pkgs
    disabled_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null \
        | sed 's/package://' | tr -d '\r')

    local restored=0
    for pkg in $disabled_pkgs; do
        pkg=$(echo "$pkg" | tr -d '\r')
        [ -z "$pkg" ] && continue

        # Intentar enable
        local out
        out=$(adb -s "$DEVICE_SERIAL" shell pm enable "$pkg" 2>&1 | tr -d '\r')
        if echo "$out" | grep -qi "enabled\|new state: enabled"; then
            (( restored++ ))
            continue
        fi

        # Fallback: install-existing (para paquetes desinstalados con -k)
        out=$(adb -s "$DEVICE_SERIAL" shell pm install-existing --user 0 "$pkg" 2>&1 | tr -d '\r')
        echo "$out" | grep -qi "success" && (( restored++ ))
    done

    log_ok "$restored app(s) reactivadas."
    echo "$restored"
}

# ─── Cantidad actual de apps desactivadas en el dispositivo ───
bloatware_get_count() {
    adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null | wc -l | tr -d ' '
}
