#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Dashboard terminal en tiempo real (tput)
#  Layout: 3 paneles + log scrolleable
# ═══════════════════════════════════════════════════════════════

DISPLAY_LOG_LINES=()
DISPLAY_LOG_MAX=8
DISPLAY_INITIALIZED=0

# ─── Renderizar barra de progreso ASCII ───
display_render_bar() {
    local value="$1"
    local max="${2:-100}"
    local width="${3:-20}"
    local filled=$(( value * width / (max > 0 ? max : 1) ))
    [ "$filled" -gt "$width" ] && filled=$width
    local empty=$(( width - filled ))
    local bar=""
    local i
    for (( i=0; i<filled; i++ )); do bar+="█"; done
    for (( i=0; i<empty;  i++ )); do bar+="░"; done
    echo "$bar"
}

# ─── Color de temperatura según nivel ───
_temp_color() {
    local t="${1:-0}"
    if   [ "$t" -ge 42 ]; then echo -e "${RED}${BOLD}";
    elif [ "$t" -ge 38 ]; then echo -e "${YELLOW}";
    elif [ "$t" -ge 30 ]; then echo -e "${GREEN}";
    else echo -e "${CYAN}"; fi
}

# ─── Inicializar dashboard (limpiar pantalla y guardar estado) ───
display_init() {
    DISPLAY_INITIALIZED=1
    DISPLAY_LOG_LINES=()
    tput smcup 2>/dev/null || true  # guardar buffer de pantalla
    tput civis  2>/dev/null || true  # ocultar cursor
    clear
    trap 'display_cleanup; exit 0' INT TERM
}

# ─── Dibujar el frame completo del dashboard ───
display_draw_frame() {
    local serial="${DEVICE_SERIAL:-???}"
    local model="${DEVICE_MODEL:-?}"
    local hora; hora=$(date '+%H:%M:%S')
    local nick; nick=$(db_get_nickname 2>/dev/null || echo "Redmi")

    tput cup 0 0
    printf "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════════════════╗${NC}\n"
    printf "${CYAN}${BOLD}║  📱 %-22s ║  🔗 %-12s ║  %-18s ║  %8s  ║${NC}\n" \
        "$PROJECT_NAME v$VERSION" "$nick" "$model" "$hora"
    printf "${CYAN}${BOLD}╠════════════════════════╦═════════════════════════╦═══════════════════════╣${NC}\n"
    printf "${CYAN}${BOLD}║  MÉTRICAS EN VIVO      ║   PROGRESO ACTUAL       ║   HISTORIAL            ║${NC}\n"
    printf "${CYAN}${BOLD}║  ──────────────────    ║   ─────────────────     ║   ───────────────      ║${NC}\n"
}

# ─── Actualizar panel izquierdo (métricas) ───
display_update_metrics() {
    local cpu="${1:-0}"
    local ram="${2:-0}"
    local temp="${3:-0}"
    local batt="${4:-0}"
    local disk="${5:-0}"

    local cpu_bar;  cpu_bar=$(display_render_bar  "$cpu"  100 10)
    local ram_bar;  ram_bar=$(display_render_bar  "$ram"  100 10)
    local temp_bar; temp_bar=$(display_render_bar "$temp"  60 10)
    local batt_bar; batt_bar=$(display_render_bar "$batt" 100 10)
    local disk_bar; disk_bar=$(display_render_bar "$disk" 100 10)

    local tc; tc=$(_temp_color "$temp")

    tput cup 5 0
    printf "║  CPU:  ${CYAN}[%-10s]${NC} %3d%%   " "$cpu_bar"  "$cpu"
    tput cup 6 0
    printf "║  RAM:  ${YELLOW}[%-10s]${NC} %3d%%   " "$ram_bar"  "$ram"
    tput cup 7 0
    printf "║  TEMP: ${tc}[%-10s]${NC} %3d°C  " "$temp_bar" "$temp"
    tput cup 8 0
    printf "║  BATT: ${GREEN}[%-10s]${NC} %3d%%   " "$batt_bar" "$batt"
    tput cup 9 0
    printf "║  DISK: ${MAGENTA}[%-10s]${NC} %3d%%   " "$disk_bar" "$disk"
    tput cup 10 0
    printf "║                          "
}

# ─── Actualizar panel central (progreso) ───
display_update_progress() {
    local step="${1:-0}"
    local total="${2:-1}"
    local phase="${3:-...}"
    local apps_ok="${4:-0}"
    local apps_total="${5:-0}"

    local pct=$(( step * 100 / (total > 0 ? total : 1) ))
    local prog_bar; prog_bar=$(display_render_bar "$step" "$total" 18)

    tput cup 5 26
    printf "║   Paso: %3d/%d              " "$step" "$total"
    tput cup 6 26
    printf "║   Fase: %-20s" "${phase:0:20}"
    tput cup 7 26
    printf "║   Apps: %4d/%d            " "$apps_ok" "$apps_total"
    tput cup 8 26
    printf "║   ──────────────────       "
    tput cup 9 26
    printf "║   ${CYAN}[%-18s]${NC} %3d%%" "$prog_bar" "$pct"
    tput cup 10 26
    printf "║                           "
}

# ─── Actualizar panel derecho (historial desde DB) ───
display_update_history() {
    local stats; stats=$(db_get_stats_summary 2>/dev/null || echo "0|0|0|0")
    local runs;     runs=$(echo "$stats"     | cut -d'|' -f1)
    local ram_mb;   ram_mb=$(echo "$stats"   | cut -d'|' -f2)
    local apps_dis; apps_dis=$(echo "$stats" | cut -d'|' -f3)
    local score;    score=$(echo "$stats"    | cut -d'|' -f4)
    local last_run; last_run=$(db_get_last_run 2>/dev/null || echo "nunca")

    local ram_gb; ram_gb=$(echo "scale=1; ${ram_mb:-0} / 1024" | bc 2>/dev/null || echo "?")

    tput cup 5 53
    printf "║   Runs totales:  %-5d     " "${runs:-0}"
    tput cup 6 53
    printf "║   RAM liberada:  %-5sGB   " "$ram_gb"
    tput cup 7 53
    printf "║   Apps desact:   %-5d     " "${apps_dis:-0}"
    tput cup 8 53
    printf "║   Último run:    %-10s" "${last_run:0:10}"
    tput cup 9 53
    printf "║   Score actual:  %-3d%%     " "${score:-0}"
    tput cup 10 53
    printf "║                           "
}

# ─── Agregar línea al log scrolleable ───
display_add_log() {
    local msg="$1"
    local type="${2:-info}"
    local hora; hora=$(date '+%H:%M:%S')
    local prefix

    case "$type" in
        ok)   prefix="${GREEN}✅${NC}" ;;
        warn) prefix="${YELLOW}⚠️ ${NC}" ;;
        fail) prefix="${RED}❌${NC}" ;;
        *)    prefix="${CYAN}→ ${NC}" ;;
    esac

    local line="  [${hora}] ${prefix} ${msg}"
    DISPLAY_LOG_LINES+=("$line")

    # Mantener solo las últimas N líneas
    while [ "${#DISPLAY_LOG_LINES[@]}" -gt "$DISPLAY_LOG_MAX" ]; do
        DISPLAY_LOG_LINES=("${DISPLAY_LOG_LINES[@]:1}")
    done

    _display_redraw_log
}

# ─── Redibujar el área de log ───
_display_redraw_log() {
    local separator_row=11
    tput cup $separator_row 0
    printf "${CYAN}${BOLD}╠══════════════════════════════════════════════════════════════════════════╣${NC}\n"
    printf "${CYAN}${BOLD}║  LOG EN TIEMPO REAL                                                      ║${NC}\n"

    local log_row=$(( separator_row + 2 ))
    local i
    for (( i=0; i<DISPLAY_LOG_MAX; i++ )); do
        tput cup $(( log_row + i )) 0
        if [ "$i" -lt "${#DISPLAY_LOG_LINES[@]}" ]; then
            printf "║  %-72s║\n" "$(echo -e "${DISPLAY_LOG_LINES[$i]}" | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-70)"
        else
            printf "║%-74s║\n" ""
        fi
    done
    local bottom_row=$(( log_row + DISPLAY_LOG_MAX ))
    tput cup $bottom_row 0
    printf "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

# ─── Restaurar terminal ───
display_cleanup() {
    tput cnorm  2>/dev/null || true  # restaurar cursor
    tput rmcup  2>/dev/null || true  # restaurar buffer
    DISPLAY_INITIALIZED=0
}

# ─── Pantalla de resultados finales ───
display_show_completion_screen() {
    local score_before="${1:-0}"
    local score_after="${2:-0}"
    local duration="${3:-0}"
    local apps_disabled="${4:-0}"
    local apps_compiled="${5:-0}"

    display_cleanup
    local mins=$(( duration / 60 ))
    local secs=$(( duration % 60 ))
    local gain=$(( score_after - score_before ))

    echo ""
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║          📱 PhoneOptimizer Pro — RESULTADO FINAL             ║${NC}"
    echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    printf  "${CYAN}${BOLD}║  Score antes:   %3d%%                                         ║${NC}\n" "$score_before"
    printf  "${CYAN}${BOLD}║  Score ahora:   %3d%%   ${GREEN}(+%d puntos)${NC}${CYAN}${BOLD}                       ║${NC}\n" "$score_after" "$gain"
    printf  "${CYAN}${BOLD}║  Duración:      %dmin %ds                                     ║${NC}\n" "$mins" "$secs"
    printf  "${CYAN}${BOLD}║  Apps desact:   %-4d                                          ║${NC}\n" "$apps_disabled"
    printf  "${CYAN}${BOLD}║  Apps compil:   %-4d                                          ║${NC}\n" "$apps_compiled"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    echo -e "${CYAN}${BOLD}║  Próximo mantenimiento: en 7 días                            ║${NC}"
    echo -e "${CYAN}${BOLD}║  Si algo falla: ./run.sh --emergency                         ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ─── Selección de dispositivo si hay múltiples ───
display_show_device_selector() {
    local -n _devs="$1"
    echo ""
    echo -e "${BOLD}  Múltiples dispositivos detectados — elegí uno:${NC}"
    echo ""
    local i=1
    for serial in "${_devs[@]}"; do
        local model; model=$(adb -s "$serial" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
        local nick;  nick=$(sqlite3 "$DB_FILE" "SELECT nickname FROM devices WHERE serial='$serial';" 2>/dev/null)
        printf "    %d) %-15s %-20s %s\n" "$i" "${nick:-Redmi-$i}" "$model" "$serial"
        (( i++ ))
    done
    echo ""
    read -rp "  Número [1]: " CHOICE
    CHOICE="${CHOICE:-1}"
    local idx=$(( CHOICE - 1 ))
    DEVICE_SERIAL="${_devs[$idx]:-${_devs[0]}}"
    echo ""
}
