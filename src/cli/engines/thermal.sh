#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Gestión térmica inteligente
#
#  ADVERTENCIA CRÍTICA:
#  com.xiaomi.joyose NO se toca NUNCA.
#  Es el gestor térmico nativo del Helio G81 Ultra.
#  Desactivarlo = sobrecalentamiento garantizado en juegos.
#  Confirmado: XDA Forums + GitHub mcxiaoke gist (2025-2026).
# ═══════════════════════════════════════════════════════════════

# ─── Leer temperatura del dispositivo en °C ───
thermal_check() {
    local temp_raw
    temp_raw=$(adb -s "$DEVICE_SERIAL" shell dumpsys battery 2>/dev/null \
        | grep "temperature:" | grep -o '[0-9]*')
    local temp_c=$(( ${temp_raw:-350} / 10 ))
    DEVICE_TEMP_C="$temp_c"

    local status
    if   [ "$temp_c" -gt 42 ]; then status="HOT"
    elif [ "$temp_c" -ge 38 ]; then status="WARM"
    elif [ "$temp_c" -ge 30 ]; then status="NORMAL"
    else status="COLD"; fi

    DEVICE_TEMP_STATUS="$status"
    echo "$temp_c"
}

# ─── Verificar si la temperatura permite operar ───
# Retorna: 0=OK, 1=BLOQUEADO (>42°C)
thermal_gate_check() {
    thermal_check >/dev/null
    local temp="${DEVICE_TEMP_C:-35}"
    local status="${DEVICE_TEMP_STATUS:-NORMAL}"

    if [ "$temp" -gt "$THERMAL_MAX_TEMP" ]; then
        log_fail "TEMPERATURA CRÍTICA: ${temp}°C (>${THERMAL_MAX_TEMP}°C)"
        log_fail "Esperá que el teléfono se enfríe antes de optimizar."
        log_info  "Temperatura actual: ${temp}°C | Límite: ${THERMAL_MAX_TEMP}°C"
        return 1
    fi

    if [ "$temp" -ge "$THERMAL_WARN_TEMP" ]; then
        log_warn "Temperatura elevada: ${temp}°C (${status}). Continuando..."
    else
        log_ok "Temperatura: ${temp}°C (${status}) — OK para optimizar"
    fi

    return 0
}

# ─── Activar performance mode sin tocar el gestor térmico ───
# Solo ajusta performance mode del sistema + refresh rate máximo
thermal_apply_performance() {
    log_info "Thermal: activando performance mode del sistema..."
    adb_shell cmd power set-fixed-performance-mode-enabled true
    adb_setting_put_system peak_refresh_rate 90
    adb_setting_put_system min_refresh_rate  60
    log_ok "Performance mode: activado | Refresh: 90Hz"
    # NOTA: NO se toca com.xiaomi.joyose — ver advertencia arriba
}

# ─── Desactivar performance mode forzado ───
thermal_restore() {
    adb_shell cmd power set-fixed-performance-mode-enabled false
    adb_shell settings delete system peak_refresh_rate
    adb_shell settings delete system min_refresh_rate
    log_ok "Performance mode: desactivado"
}
