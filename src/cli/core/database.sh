#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Gestión SQLite por dispositivo
#  Requiere: sqlite3 instalado, DB_FILE y DEVICE_SERIAL definidos
# ═══════════════════════════════════════════════════════════════

# ─── Inicializar la base de datos (crear si no existe) ───
db_init() {
    if ! command -v sqlite3 &>/dev/null; then
        log_warn "sqlite3 no está disponible — historial desactivado"
        DB_AVAILABLE=0
        return 1
    fi
    DB_AVAILABLE=1

    sqlite3 "$DB_FILE" <<'SQL'
CREATE TABLE IF NOT EXISTS devices (
    serial              TEXT PRIMARY KEY,
    model               TEXT,
    manufacturer        TEXT,
    android_version     TEXT,
    hyperos_version     TEXT,
    ram_gb              INTEGER,
    storage_gb          INTEGER,
    first_seen          TEXT,
    last_seen           TEXT,
    run_count           INTEGER DEFAULT 0,
    total_ram_freed_mb  INTEGER DEFAULT 0,
    total_apps_disabled INTEGER DEFAULT 0,
    nickname            TEXT
);

CREATE TABLE IF NOT EXISTS optimization_runs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    serial           TEXT,
    run_date         TEXT,
    run_type         TEXT,
    score_before     INTEGER DEFAULT 0,
    score_after      INTEGER DEFAULT 0,
    ram_before_mb    INTEGER DEFAULT 0,
    ram_after_mb     INTEGER DEFAULT 0,
    apps_disabled    INTEGER DEFAULT 0,
    apps_compiled    INTEGER DEFAULT 0,
    battery_pct      INTEGER DEFAULT 0,
    temp_celsius     REAL    DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    notes            TEXT,
    FOREIGN KEY(serial) REFERENCES devices(serial)
);

CREATE TABLE IF NOT EXISTS app_state (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    serial       TEXT,
    package_name TEXT,
    app_name     TEXT,
    action       TEXT,
    action_date  TEXT,
    run_id       INTEGER,
    FOREIGN KEY(serial) REFERENCES devices(serial)
);

CREATE TABLE IF NOT EXISTS metrics_history (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    serial             TEXT,
    recorded_at        TEXT,
    ram_used_pct       INTEGER DEFAULT 0,
    cpu_load_pct       INTEGER DEFAULT 0,
    temp_celsius       REAL    DEFAULT 0,
    battery_pct        INTEGER DEFAULT 0,
    disabled_apps_count INTEGER DEFAULT 0,
    storage_used_pct   INTEGER DEFAULT 0
);
SQL
}

# ─── Verificar disponibilidad antes de cada operación ───
_db_check() {
    [ "${DB_AVAILABLE:-0}" -eq 1 ] && return 0
    return 1
}

# ─── Insertar o actualizar el dispositivo actual ───
db_register_device() {
    _db_check || return 0
    local now; now=$(date '+%Y-%m-%d %H:%M:%S')
    sqlite3 "$DB_FILE" <<SQL
INSERT INTO devices (serial, model, manufacturer, android_version, hyperos_version,
                     ram_gb, storage_gb, first_seen, last_seen, run_count,
                     total_ram_freed_mb, total_apps_disabled)
VALUES ('$DEVICE_SERIAL', '${DEVICE_MODEL:-?}', '${DEVICE_MFR:-?}',
        '${DEVICE_ANDROID:-?}', '${DEVICE_HYPEROS:-?}',
        ${DEVICE_RAM_GB:-0}, ${DEVICE_STORAGE_GB:-0},
        '$now', '$now', 0, 0, 0)
ON CONFLICT(serial) DO UPDATE SET
    model            = excluded.model,
    manufacturer     = excluded.manufacturer,
    android_version  = excluded.android_version,
    hyperos_version  = excluded.hyperos_version,
    ram_gb           = excluded.ram_gb,
    storage_gb       = excluded.storage_gb,
    last_seen        = '$now';
SQL
}

# ─── Iniciar un run — devuelve el ID generado ───
db_start_run() {
    _db_check || { echo 0; return; }
    local run_type="${1:-full}"
    local score_before="${2:-0}"
    local ram_before="${3:-0}"
    local battery="${4:-0}"
    local temp="${5:-0}"
    local now; now=$(date '+%Y-%m-%d %H:%M:%S')

    sqlite3 "$DB_FILE" <<SQL
INSERT INTO optimization_runs (serial, run_date, run_type, score_before,
                                ram_before_mb, battery_pct, temp_celsius)
VALUES ('$DEVICE_SERIAL', '$now', '$run_type', $score_before,
        $ram_before, $battery, $temp);
SQL
    sqlite3 "$DB_FILE" "SELECT last_insert_rowid();"
}

# ─── Finalizar un run con los resultados obtenidos ───
db_end_run() {
    _db_check || return 0
    local run_id="$1"
    local score_after="${2:-0}"
    local ram_after="${3:-0}"
    local apps_disabled="${4:-0}"
    local apps_compiled="${5:-0}"
    local duration_seconds="${6:-0}"
    local notes="${7:-}"

    sqlite3 "$DB_FILE" <<SQL
UPDATE optimization_runs
SET score_after      = $score_after,
    ram_after_mb     = $ram_after,
    apps_disabled    = $apps_disabled,
    apps_compiled    = $apps_compiled,
    duration_seconds = $duration_seconds,
    notes            = '${notes//\'/\'\'}'
WHERE id = $run_id;

UPDATE devices
SET run_count           = run_count + 1,
    total_ram_freed_mb  = total_ram_freed_mb + ($ram_after - ram_before_mb),
    total_apps_disabled = total_apps_disabled + $apps_disabled,
    last_seen           = datetime('now')
WHERE serial = '$DEVICE_SERIAL';
SQL
}

# ─── Registrar acción sobre un paquete ───
db_log_app_action() {
    _db_check || return 0
    local pkg="$1"
    local app_name="$2"
    local action="$3"
    local run_id="${4:-0}"
    local now; now=$(date '+%Y-%m-%d %H:%M:%S')

    sqlite3 "$DB_FILE" \
        "INSERT INTO app_state (serial, package_name, app_name, action, action_date, run_id)
         VALUES ('$DEVICE_SERIAL', '$pkg', '${app_name//\'/\'\'}', '$action', '$now', $run_id);"
}

# ─── Guardar snapshot de métricas del sistema ───
db_record_metrics() {
    _db_check || return 0
    local ram_pct="${1:-0}"
    local cpu_pct="${2:-0}"
    local temp="${3:-0}"
    local battery="${4:-0}"
    local disabled_count="${5:-0}"
    local storage_pct="${6:-0}"
    local now; now=$(date '+%Y-%m-%d %H:%M:%S')

    sqlite3 "$DB_FILE" \
        "INSERT INTO metrics_history
         (serial, recorded_at, ram_used_pct, cpu_load_pct, temp_celsius,
          battery_pct, disabled_apps_count, storage_used_pct)
         VALUES ('$DEVICE_SERIAL', '$now', $ram_pct, $cpu_pct, $temp,
                 $battery, $disabled_count, $storage_pct);"
}

# ─── Fecha y datos del último run para este dispositivo ───
db_get_last_run() {
    _db_check || { echo "nunca"; return; }
    sqlite3 "$DB_FILE" \
        "SELECT run_date FROM optimization_runs
         WHERE serial = '$DEVICE_SERIAL'
         ORDER BY id DESC LIMIT 1;" 2>/dev/null || echo "nunca"
}

# ─── Mostrar historial completo del dispositivo ───
db_get_device_history() {
    _db_check || return 0
    echo ""
    echo "  Historial de $DEVICE_SERIAL:"
    sqlite3 -column -header "$DB_FILE" \
        "SELECT run_date, run_type, score_before, score_after,
                apps_disabled, duration_seconds
         FROM optimization_runs
         WHERE serial = '$DEVICE_SERIAL'
         ORDER BY id DESC LIMIT 10;" 2>/dev/null
}

# ─── Retorna 0 si han pasado 7+ días desde el último run ───
db_check_maintenance_due() {
    _db_check || { return 1; }
    local last
    last=$(sqlite3 "$DB_FILE" \
        "SELECT run_date FROM optimization_runs
         WHERE serial = '$DEVICE_SERIAL'
         ORDER BY id DESC LIMIT 1;" 2>/dev/null)
    [ -z "$last" ] && return 0
    local days_since
    days_since=$(( ( $(date +%s) - $(date -d "$last" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$last" +%s 2>/dev/null || echo 0) ) / 86400 ))
    [ "$days_since" -ge "${MAINTENANCE_INTERVAL_DAYS:-7}" ] && return 0
    return 1
}

# ─── Resumen estadístico para el dashboard ───
db_get_stats_summary() {
    _db_check || { echo "0|0|0|0"; return; }
    sqlite3 "$DB_FILE" \
        "SELECT
            COALESCE(run_count, 0),
            COALESCE(total_ram_freed_mb, 0),
            COALESCE(total_apps_disabled, 0),
            COALESCE((SELECT score_after FROM optimization_runs
                      WHERE serial = devices.serial
                      ORDER BY id DESC LIMIT 1), 0)
         FROM devices WHERE serial = '$DEVICE_SERIAL';" 2>/dev/null || echo "0|0|0|0"
}

# ─── Detectar apps que volvieron a activarse después de una OTA ───
db_detect_ota_regressions() {
    _db_check || { echo ""; return; }
    # Obtener lista de paquetes desactivados en el último run
    local last_run_id
    last_run_id=$(sqlite3 "$DB_FILE" \
        "SELECT id FROM optimization_runs
         WHERE serial = '$DEVICE_SERIAL'
         ORDER BY id DESC LIMIT 1;" 2>/dev/null)
    [ -z "$last_run_id" ] && return 0

    # Paquetes que se desactivaron en el último run
    local disabled_then
    disabled_then=$(sqlite3 "$DB_FILE" \
        "SELECT package_name FROM app_state
         WHERE serial = '$DEVICE_SERIAL'
           AND run_id = $last_run_id
           AND action = 'disabled';" 2>/dev/null)

    # Comparar con el estado actual del dispositivo
    local currently_disabled
    currently_disabled=$(adb -s "$DEVICE_SERIAL" shell pm list packages -d 2>/dev/null \
        | sed 's/package://' | tr -d '\r')

    local regressions=()
    for pkg in $disabled_then; do
        if ! echo "$currently_disabled" | grep -qF "$pkg"; then
            regressions+=("$pkg")
        fi
    done

    printf '%s\n' "${regressions[@]}"
}

# ─── Obtener apodo del dispositivo, asignarlo si no tiene ───
db_get_nickname() {
    _db_check || { echo "Redmi-1"; return; }
    local nick
    nick=$(sqlite3 "$DB_FILE" \
        "SELECT nickname FROM devices WHERE serial = '$DEVICE_SERIAL';" 2>/dev/null)
    if [ -z "$nick" ] || [ "$nick" = "NULL" ]; then
        local n
        n=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM devices;" 2>/dev/null || echo 1)
        nick="Redmi-${n}"
        sqlite3 "$DB_FILE" \
            "UPDATE devices SET nickname = '$nick' WHERE serial = '$DEVICE_SERIAL';" 2>/dev/null
    fi
    echo "$nick"
}
