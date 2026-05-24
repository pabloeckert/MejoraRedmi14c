import json
import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path.home() / "AppData" / "Local" / "RedmiForge" / "redmiforge.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS devices (
                serial       TEXT PRIMARY KEY,
                model        TEXT,
                nickname     TEXT,
                android_ver  TEXT,
                hyperos_ver  TEXT,
                first_seen   TEXT NOT NULL,
                last_seen    TEXT NOT NULL,
                profile_json TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS optimization_runs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                serial      TEXT NOT NULL,
                phase       TEXT NOT NULL,
                mode_flag   TEXT NOT NULL,
                started_at  TEXT NOT NULL,
                ended_at    TEXT,
                status      TEXT DEFAULT 'running',
                exit_code   INTEGER,
                output      TEXT,
                FOREIGN KEY (serial) REFERENCES devices(serial)
            );

            CREATE TABLE IF NOT EXISTS metrics (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                serial      TEXT NOT NULL,
                run_id      INTEGER,
                measured_at TEXT NOT NULL,
                kind        TEXT NOT NULL,
                value_json  TEXT NOT NULL,
                FOREIGN KEY (serial) REFERENCES devices(serial),
                FOREIGN KEY (run_id) REFERENCES optimization_runs(id)
            );
        """)


def upsert_device(serial: str, model: str, android_ver: str = "", hyperos_ver: str = "") -> None:
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO devices (serial, model, android_ver, hyperos_ver, first_seen, last_seen)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(serial) DO UPDATE SET
                model       = excluded.model,
                android_ver = excluded.android_ver,
                hyperos_ver = excluded.hyperos_ver,
                last_seen   = excluded.last_seen
        """, (serial, model, android_ver, hyperos_ver, now, now))


def get_device(serial: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM devices WHERE serial = ?", (serial,)
        ).fetchone()
        return dict(row) if row else None


def get_display_name(serial: str) -> str:
    """Devuelve el nombre de la persona dueña de este dispositivo, o '' si no está configurado."""
    device = get_device(serial)
    if not device:
        return ""
    try:
        profile = json.loads(device.get("profile_json") or "{}")
        return profile.get("name", "")
    except (json.JSONDecodeError, TypeError):
        return ""


def set_display_name(serial: str, name: str) -> None:
    """Guarda el nombre en profile_json del dispositivo."""
    device = get_device(serial)
    try:
        profile = json.loads((device or {}).get("profile_json") or "{}")
    except (json.JSONDecodeError, TypeError):
        profile = {}
    profile["name"] = name
    with get_connection() as conn:
        conn.execute(
            "UPDATE devices SET profile_json = ? WHERE serial = ?",
            (json.dumps(profile), serial)
        )


def save_profile(serial: str, profile: dict) -> None:
    """Reemplaza el profile_json del dispositivo con el dict dado."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE devices SET profile_json = ? WHERE serial = ?",
            (json.dumps(profile), serial),
        )


def get_last_run(serial: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            """SELECT * FROM optimization_runs
               WHERE serial = ? AND status = 'completed'
               ORDER BY started_at DESC LIMIT 1""",
            (serial,)
        ).fetchone()
        return dict(row) if row else None


def start_run(serial: str, phase: str, mode_flag: str) -> int:
    now = datetime.now().isoformat()
    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO optimization_runs (serial, phase, mode_flag, started_at)
               VALUES (?, ?, ?, ?)""",
            (serial, phase, mode_flag, now)
        )
        return cur.lastrowid


def finish_run(run_id: int, exit_code: int, output: str, status: str = "completed") -> None:
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute(
            """UPDATE optimization_runs
               SET ended_at = ?, exit_code = ?, output = ?, status = ?
               WHERE id = ?""",
            (now, exit_code, output, status, run_id)
        )


def list_runs(serial: str, limit: int = 20) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT * FROM optimization_runs
               WHERE serial = ?
               ORDER BY started_at DESC LIMIT ?""",
            (serial, limit)
        ).fetchall()
        return [dict(r) for r in rows]
