"""
Snapshot de uso real de apps vía dumpsys usagestats — sin root.

Pensado para que forge/services/maintenance_check.py lo llame cada vez que
detecta el dispositivo de Sindy conectado, y persista el resultado en la
tabla metrics (forge/db/database.py:record_metric) para decidir el perfil
de debloat con evidencia real en vez de suposiciones.
"""
from __future__ import annotations

import re
import subprocess

_TIME_RE = re.compile(r"totalTimeUsed=(\d+)")
_PKG_RE = re.compile(r"package=([\w.]+)")
_LAST_USED_RE = re.compile(r"lastTimeUsed=([\-\d]+)")


def _adb_shell(serial: str, cmd: str, timeout: int = 20) -> str:
    try:
        res = subprocess.run(
            ["adb", "-s", serial, "shell", cmd],
            capture_output=True, text=True, timeout=timeout,
        )
        return (res.stdout + res.stderr).strip()
    except Exception:
        return ""


def collect_usage_snapshot(serial: str) -> dict:
    """
    Retorna {pkg: {"total_time_foreground_ms": int, "last_time_used": int}}.

    El formato exacto de `dumpsys usagestats` varía entre versiones de
    Android — este parser se basa en el bloque "package usage" que trae
    `totalTimeUsed=`/`lastTimeUsed=` por paquete. Si el output real del
    dispositivo no matchea, revisar el formato con
    `adb -s <serial> shell dumpsys usagestats` a mano antes de asumir que
    la función está rota.
    """
    raw = _adb_shell(serial, "dumpsys usagestats")
    snapshot: dict[str, dict] = {}

    current_pkg = None
    for line in raw.splitlines():
        pkg_match = _PKG_RE.search(line)
        if pkg_match:
            current_pkg = pkg_match.group(1)

        time_match = _TIME_RE.search(line)
        if time_match and current_pkg:
            total_ms = int(time_match.group(1))
            entry = snapshot.setdefault(
                current_pkg, {"total_time_foreground_ms": 0, "last_time_used": 0}
            )
            entry["total_time_foreground_ms"] = max(
                entry["total_time_foreground_ms"], total_ms
            )

        last_used_match = _LAST_USED_RE.search(line)
        if last_used_match and current_pkg:
            entry = snapshot.setdefault(
                current_pkg, {"total_time_foreground_ms": 0, "last_time_used": 0}
            )
            entry["last_time_used"] = max(
                entry["last_time_used"], int(last_used_match.group(1))
            )

    return snapshot
