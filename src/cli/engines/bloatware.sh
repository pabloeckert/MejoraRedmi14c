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

# ─── Ejecutar desactivación WHITELIST: elimina TODO paquete de terceros ───
# que no esté en el array whitelist dado (inverso de bloatware_run). Solo
# opera sobre pm list packages -3 (apps de terceros) — nunca sobre paquetes
# de sistema, así no toca temas/launcher/wallpaper por construcción.
bloatware_run_whitelist() {
    local profile_name="${1:-PROFILE_SINDY_WHITELIST}"
    local run_id="${2:-0}"

    log_step "BLOATWARE WHITELIST — Perfil: $profile_name"

    local -n whitelist_array="$profile_name"

    local third_party_pkgs; third_party_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages -3 2>/dev/null \
        | sed 's/package://' | tr -d '\r')
    local disabled_pkgs; disabled_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null \
        | sed 's/package://' | tr -d '\r')

    # Calcular el complemento: paquetes de terceros que NO están en la whitelist
    local to_disable=()
    local pkg
    for pkg in $third_party_pkgs; do
        local protected=0
        local w
        for w in "${whitelist_array[@]}"; do
            [[ "$pkg" == "$w" ]] && { protected=1; break; }
        done
        [ "$protected" -eq 0 ] && to_disable+=("$pkg")
    done

    # Preview explícito antes de ejecutar — la inversión de lógica es más
    # propensa a errores por omisión que una blacklist curada.
    log_info "Preview — ${#to_disable[@]} paquete(s) de terceros a desactivar (no están en $profile_name):"
    for pkg in "${to_disable[@]}"; do
        log_info "  - $(pkg_name "$pkg") ($pkg)"
    done

    if [ -t 0 ]; then
        echo ""
        read -rp "  ¿Confirmar desactivación de estos ${#to_disable[@]} paquete(s)? [s/N]: " CONFIRM_WL
        if [[ ! "$CONFIRM_WL" =~ ^[Ss]$ ]]; then
            log_warn "Cancelado por el usuario — no se desactivó nada."
            echo 0
            return 0
        fi
    fi

    local count_ok=0
    local count_skip=0
    local total="${#to_disable[@]}"
    local processed=0

    for pkg in "${to_disable[@]}"; do
        (( processed++ ))

        if is_critical_pkg "$pkg"; then
            log_warn "PROTEGIDA: $(pkg_name "$pkg") ($pkg)"
            (( count_skip++ ))
            continue
        fi

        if echo "$disabled_pkgs" | grep -qF "$pkg"; then
            db_log_app_action "$pkg" "$(pkg_name "$pkg")" "already_disabled" "$run_id"
            continue
        fi

        if safe_disable_pkg "$pkg"; then
            local app_name; app_name=$(pkg_name "$pkg")
            log_ok "$app_name"
            db_log_app_action "$pkg" "$app_name" "disabled" "$run_id"
            (( count_ok++ ))
            if [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ]; then
                display_add_log "$app_name desactivado" "ok"
                display_update_progress "$processed" "$total" "Bloatware whitelist" "$count_ok" "$total"
            fi
        else
            (( count_skip++ ))
        fi
    done

    log_info "Resultado: $count_ok nuevas | $count_skip saltadas | ${#whitelist_array[@]} protegidas por whitelist"
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

    # Revertir el fallback RUN_ANY_IN_BACKGROUND de safe_disable_pkg() (Intento 3):
    # esos paquetes siguen habilitados/instalados, así que no aparecen en
    # "pm list packages -d" y quedarían bloqueados en background para siempre
    # si no se revierten explícitamente acá.
    local catalog_pkg
    for catalog_pkg in "${PROFILE_POCO_MODE[@]}" "${PROFILE_XIAOMI_TELEMETRY[@]}"; do
        adb -s "$DEVICE_SERIAL" shell cmd appops set "$catalog_pkg" RUN_ANY_IN_BACKGROUND allow >/dev/null 2>&1
    done
    log_ok "RUN_ANY_IN_BACKGROUND restaurado (allow) en el catálogo completo."

    log_ok "$restored app(s) reactivadas."
    echo "$restored"
}

# ─── Cantidad actual de apps desactivadas en el dispositivo ───
bloatware_get_count() {
    adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null | wc -l | tr -d ' '
}
