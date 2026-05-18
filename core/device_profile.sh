#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Identificación y perfil de dispositivo
# ═══════════════════════════════════════════════════════════════

# Variables globales exportadas por este módulo:
# DEVICE_SERIAL, DEVICE_MODEL, DEVICE_MFR, DEVICE_ANDROID,
# DEVICE_HYPEROS, DEVICE_RAM_GB, DEVICE_STORAGE_GB,
# DEVICE_BATTERY_PCT, DEVICE_TEMP_C, DEVICE_SERIAL_MASKED

# ─── Detectar todos los dispositivos ADB conectados ───
device_detect_all() {
    adb devices 2>/dev/null | grep -v "List of" | awk '/\tdevice$/{print $1}'
}

# ─── Seleccionar dispositivo (auto si 1, menú si 2+) ───
device_select() {
    local -n _serials="$1"
    local count="${#_serials[@]}"

    if [ "$count" -eq 0 ]; then
        log_fail "No hay dispositivos conectados."
        exit 1
    elif [ "$count" -eq 1 ]; then
        DEVICE_SERIAL="${_serials[0]}"
        log_ok "Dispositivo único seleccionado: $DEVICE_SERIAL"
    else
        display_show_device_selector _serials
    fi
}

# ─── Leer info completa del dispositivo y exportar variables globales ───
device_read_info() {
    local serial="$1"
    DEVICE_SERIAL="$serial"

    DEVICE_MODEL=$(adb -s "$serial" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
    DEVICE_MFR=$(adb -s "$serial" shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
    DEVICE_ANDROID=$(adb -s "$serial" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    DEVICE_HYPEROS=$(adb -s "$serial" shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')

    # RAM en GB
    local ram_kb
    ram_kb=$(adb -s "$serial" shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
    DEVICE_RAM_GB=$(( ${ram_kb:-0} / 1048576 ))

    # Almacenamiento en GB (df -h /data)
    local storage_kb
    storage_kb=$(adb -s "$serial" shell df /data 2>/dev/null | tail -1 | awk '{print $2}' | tr -d 'KMG')
    DEVICE_STORAGE_GB=$(( ${storage_kb:-0} / 1048576 ))

    # Batería
    local batt_raw
    batt_raw=$(adb -s "$serial" shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
    DEVICE_BATTERY_PCT="${batt_raw:-0}"

    # Temperatura (en décimas de grado → °C)
    local temp_raw
    temp_raw=$(adb -s "$serial" shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
    DEVICE_TEMP_C=$(( ${temp_raw:-0} / 10 ))

    # Serial enmascarado para logs (últimos 4 caracteres)
    DEVICE_SERIAL_MASKED="****${serial: -4}"

    log_ok "📱 $DEVICE_MFR $DEVICE_MODEL (Android $DEVICE_ANDROID / HyperOS ${DEVICE_HYPEROS:-N/A})"
    log_info "   Serial: $DEVICE_SERIAL_MASKED | RAM: ${DEVICE_RAM_GB}GB | Batt: ${DEVICE_BATTERY_PCT}% | Temp: ${DEVICE_TEMP_C}°C"
}

# ─── Validar que el dispositivo sea compatible ───
device_validate_compatibility() {
    # Verificar marca Xiaomi/Redmi/POCO
    if ! echo "$DEVICE_MFR" | grep -qi "xiaomi\|redmi\|poco"; then
        log_warn "Dispositivo no es Xiaomi/Redmi/POCO ($DEVICE_MFR $DEVICE_MODEL)."
        log_warn "Algunos tweaks pueden no funcionar."
    fi

    # Verificar autorización ADB
    local state
    state=$(adb -s "$DEVICE_SERIAL" get-state 2>/dev/null | tr -d '\r')
    if [ "$state" != "device" ]; then
        log_fail "Dispositivo no autorizado (estado: ${state:-offline})."
        log_info  "Aceptá el popup de Depuración USB en el teléfono."
        exit 1
    fi

    # Verificar Android 14+
    local major
    major=$(echo "$DEVICE_ANDROID" | cut -d. -f1)
    if [ "${major:-0}" -lt 14 ]; then
        log_warn "Android $DEVICE_ANDROID — se recomienda Android 14+ para HyperOS."
    fi

    # Advertir si batería < 20%
    if [ "${DEVICE_BATTERY_PCT:-100}" -lt "${BATTERY_MIN_PCT:-20}" ]; then
        log_warn "Batería baja: ${DEVICE_BATTERY_PCT}%. Conectá el cargador."
    fi

    log_ok "Dispositivo validado y autorizado."
}

# ─── Mantener pantalla siempre encendida durante la sesión ───
device_keepalive_enable() {
    adb -s "$DEVICE_SERIAL" shell settings put system stay_on_while_plugged_in 3 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell settings put system screen_off_timeout 2147483647 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell settings put global heads_up_notifications_enabled 0 2>/dev/null
    log_info "Pantalla: siempre encendida durante la sesión."
}

# ─── Restaurar timeouts de pantalla y notificaciones ───
device_keepalive_disable() {
    adb -s "$DEVICE_SERIAL" shell settings put system stay_on_while_plugged_in 0 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell settings put system screen_off_timeout 300000 2>/dev/null
    adb -s "$DEVICE_SERIAL" shell settings put global heads_up_notifications_enabled 1 2>/dev/null
    log_info "Pantalla: timeout restaurado a 5 min."
}

# ─── Obtener apodo del dispositivo ───
device_get_nickname() {
    db_get_nickname 2>/dev/null || echo "Redmi-1"
}
