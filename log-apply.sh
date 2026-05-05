#!/bin/bash
# Registra qué perfil se aplicó y cuándo
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_APPLY="$SCRIPT_DIR/apply-history.log"

log_apply() {
    local profile="$1"
    local details="$2"
    echo "$(date -Iseconds) | $profile | $details" >> "$LOG_APPLY"
}

case "${1:-}" in
    --show)
        if [ -f "$LOG_APPLY" ]; then
            echo "📋 Historial de optimizaciones:"
            echo "════════════════════════════════════════"
            cat "$LOG_APPLY"
        else
            echo "No hay historial aún."
        fi
        ;;
    *)
        if [ -n "$1" ]; then
            log_apply "$1" "${2:-}"
            echo "✅ Registrado: $1"
        else
            echo "Uso: $0 <perfil> [detalles]"
            echo "     $0 --show"
        fi
        ;;
esac
