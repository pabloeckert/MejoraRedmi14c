#!/bin/bash
# ═══════════════════════════════════════════════
#  Utilidades Comunes — MejoraRedmi14c
#  Funciones auxiliares para todos los scripts
# ═══════════════════════════════════════════════

# ─── Configuración de Logs ───
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Función para inicializar el log en un script
init_log() {
    local script_name="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    CURRENT_LOG="$LOG_DIR/${script_name}_${timestamp}.log"
    
    # Rotar logs: mantener los últimos 10 de este script
    ls -t "$LOG_DIR/${script_name}"_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
    
    echo "--- LOG INICIADO: $(date '+%Y-%m-%d %H:%M:%S') ---" > "$CURRENT_LOG"
    echo "Script: $script_name" >> "$CURRENT_LOG"
    echo "Dispositivo: $(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')" >> "$CURRENT_LOG"
    echo "------------------------------------------------" >> "$CURRENT_LOG"
}

# ─── Funciones de logging comunes ───
log_raw() {
    local msg="$1"
    echo -e "$msg"
    if [ -n "$CURRENT_LOG" ]; then
        # Eliminar secuencias de escape ANSI para el archivo de log
        echo -e "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$CURRENT_LOG"
    fi
}

log_ok() { log_raw "  ${GREEN}✅ $1${NC}"; }
log_warn() { log_raw "  ${YELLOW}⚠️  $1${NC}"; }
log_fail() { log_raw "  ${RED}❌ $1${NC}"; }
log_info() { log_raw "  ${CYAN}$1${NC}"; }

log_step() {
    log_raw ""
    log_raw "${CYAN}════════════════════════════════════════════${NC}"
    log_raw "${BOLD}  $1${NC}"
    log_raw "${CYAN}════════════════════════════════════════════${NC}"
}

# ─── Función segura para settings ───
safe_put() {
    local key="$1"
    local value="$2"
    adb shell settings put global "$key" "$value" 2>/dev/null
}

safe_put_system() {
    local key="$1"
    local value="$2"
    adb shell settings put system "$key" "$value" 2>/dev/null
}

safe_delete() {
    local key="$1"
    adb shell settings delete global "$key" 2>/dev/null
}

# ─── Funciones de compilación y PM ───
safe_compile() {
    local pkg="$1"
    local mode="${2:-speed-profile}"
    local result
    result=$(adb shell cmd package compile -m "$mode" -f "$pkg" 2>&1)
    if echo "$result" | grep -qi "error\|not found\|unknown package"; then
        return 1
    fi
    return 0
}
