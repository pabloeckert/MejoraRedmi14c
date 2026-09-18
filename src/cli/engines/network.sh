#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Motor de optimización de red
#  Basado en: tweaks-red.sh + mega-optimizer paso 6
# ═══════════════════════════════════════════════════════════════

# ─── Aplicar optimizaciones de red ───
network_apply_optimization() {
    local run_id="${1:-0}"

    log_step "RED — DNS + TCP + WiFi"

    # DNS optimizado
    adb_setting_put dns_resolver_sample_validity_seconds "$DNS_VALIDITY"
    adb_setting_put dns_resolver_min_samples 1
    adb_setting_put dns_resolver_max_samples 3
    log_ok "DNS: validity=${DNS_VALIDITY}s, samples 1-3 (menos queries)"

    # TCP window más grande
    adb_setting_put tcp_default_init_rwnd "$TCP_RWND"
    log_ok "TCP: window=$TCP_RWND (conexiones más rápidas)"

    # WiFi scan desactivado
    adb_setting_put wifi_scan_always_enabled 0
    log_ok "WiFi scan always: desactivado (ahorra batería + evita lag)"

    # Data roaming off
    adb_setting_put data_roaming 0
    log_ok "Data roaming: desactivado"

    # Network scoring off
    adb_setting_put network_scoring_ui_enabled 0
    log_ok "Network scoring: desactivado"

    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Red optimizada" "ok"
}

# ─── Revertir configuración de red a defaults ───
network_restore_defaults() {
    adb_shell settings delete global dns_resolver_sample_validity_seconds 2>/dev/null
    adb_shell settings delete global dns_resolver_min_samples 2>/dev/null
    adb_shell settings delete global dns_resolver_max_samples 2>/dev/null
    adb_shell settings delete global tcp_default_init_rwnd 2>/dev/null
    adb_setting_put wifi_scan_always_enabled 1
    adb_shell settings delete global wifi_sleep_policy 2>/dev/null
    adb_setting_put data_roaming 0
    adb_shell settings delete global network_scoring_ui_enabled 2>/dev/null
    adb_shell settings delete global captive_portal_mode 2>/dev/null
    log_ok "Red restaurada a defaults."
}

# ─── Obtener estado actual de red ───
network_get_stats() {
    local wifi_state; wifi_state=$(adb_shell cmd wifi status | grep "Wifi is" | head -1)
    local signal;     signal=$(adb_shell dumpsys wifi | grep "mWifiInfo" | grep -o 'rssi=[-0-9]*' | head -1)
    local dns;        dns=$(adb_shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null)

    NETWORK_WIFI_STATE="${wifi_state:-desconocido}"
    NETWORK_SIGNAL="${signal:-rssi=?}"
    NETWORK_DNS_VALIDITY="${dns:-no configurado}"

    log_info "WiFi: $NETWORK_WIFI_STATE | Signal: $NETWORK_SIGNAL | DNS validity: ${NETWORK_DNS_VALIDITY}s"
}
