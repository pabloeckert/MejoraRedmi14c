#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Funciones ADB robustas con retry
# ═══════════════════════════════════════════════════════════════

# ─── Esperar hasta TIMEOUT segundos a que el dispositivo esté listo ───
adb_wait_for_device() {
    local serial="$1"
    local timeout="${2:-60}"
    local elapsed=0
    local spinner=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local i=0

    while [ "$elapsed" -lt "$timeout" ]; do
        local state
        state=$(adb -s "$serial" get-state 2>/dev/null | tr -d '\r')
        [ "$state" = "device" ] && return 0
        printf "\r  ${CYAN}%s${NC} Esperando dispositivo %s... (%ds/%ds)" \
            "${spinner[$i]}" "$serial" "$elapsed" "$timeout"
        i=$(( (i + 1) % ${#spinner[@]} ))
        sleep 2
        elapsed=$(( elapsed + 2 ))
    done

    echo ""
    return 1
}

# ─── Verificar estado de conexión de un serial ───
# Retorna: 0=ok, 1=unauthorized, 2=offline/no encontrado
adb_verify_connection() {
    local serial="$1"
    local state
    state=$(adb -s "$serial" get-state 2>/dev/null | tr -d '\r')
    case "$state" in
        device)       return 0 ;;
        unauthorized) return 1 ;;
        *)            return 2 ;;
    esac
}

# ─── Ejecutar comando ADB con reintentos automáticos ───
adb_exec_with_retry() {
    local serial="$1"
    shift
    local max_retries="${1:-3}"
    shift
    local cmd=("$@")
    local attempt=1

    while [ "$attempt" -le "$max_retries" ]; do
        if adb -s "$serial" shell "${cmd[@]}" 2>/dev/null; then
            return 0
        fi
        log_warn "Intento $attempt/$max_retries fallido para: ${cmd[*]}"
        sleep 1
        (( attempt++ ))
    done
    return 1
}

# ─── Verificar si un paquete existe en el dispositivo ───
adb_pkg_exists() {
    local serial="$1"
    local pkg="$2"
    adb -s "$serial" shell pm list packages 2>/dev/null | grep -qF "package:$pkg"
}

# ─── Verificar si un paquete está desactivado ───
adb_pkg_is_disabled() {
    local serial="$1"
    local pkg="$2"
    adb -s "$serial" shell pm list packages -d 2>/dev/null | grep -qF "package:$pkg"
}

# ─── getprop con retry y limpieza de output ───
adb_get_prop() {
    local serial="$1"
    local prop="$2"
    local val
    val=$(adb -s "$serial" shell getprop "$prop" 2>/dev/null | tr -d '\r\n')
    # Si vino vacío, un reintento
    if [ -z "$val" ]; then
        sleep 1
        val=$(adb -s "$serial" shell getprop "$prop" 2>/dev/null | tr -d '\r\n')
    fi
    echo "$val"
}

# ─── Crear backup completo del estado del dispositivo ───
adb_take_snapshot() {
    local serial="$1"
    local backup_dir="$2"
    local timestamp; timestamp=$(date +%Y%m%d_%H%M%S)
    local snap_dir="$backup_dir/${serial}_${timestamp}"

    mkdir -p "$snap_dir"

    log_info "Creando snapshot → $snap_dir"

    # Lista de paquetes
    adb -s "$serial" shell pm list packages 2>/dev/null \
        | sed 's/package://' | tr -d '\r' | sort > "$snap_dir/all_packages.txt"

    # Paquetes desactivados
    adb -s "$serial" shell pm list packages -d 2>/dev/null \
        | sed 's/package://' | tr -d '\r' | sort > "$snap_dir/disabled_packages.txt"

    # Settings globales / system / secure
    adb -s "$serial" shell settings list global  2>/dev/null > "$snap_dir/settings_global.txt"
    adb -s "$serial" shell settings list system  2>/dev/null > "$snap_dir/settings_system.txt"
    adb -s "$serial" shell settings list secure  2>/dev/null > "$snap_dir/settings_secure.txt"

    # Resolución y densidad
    adb -s "$serial" shell wm size    2>/dev/null > "$snap_dir/wm_size.txt"
    adb -s "$serial" shell wm density 2>/dev/null > "$snap_dir/wm_density.txt"

    # Estado de batería
    adb -s "$serial" shell dumpsys battery 2>/dev/null > "$snap_dir/battery.txt"

    # Info del sistema
    {
        echo "model=$(adb_get_prop "$serial" ro.product.model)"
        echo "android=$(adb_get_prop "$serial" ro.build.version.release)"
        echo "hyperos=$(adb_get_prop "$serial" ro.mi.os.version.name)"
        echo "date=$(date '+%Y-%m-%d %H:%M:%S')"
    } > "$snap_dir/device_info.txt"

    log_ok "Snapshot guardado: $(basename "$snap_dir")"
    echo "$snap_dir"
}
