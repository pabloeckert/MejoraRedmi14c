"""
Monitor de mantenimiento autónomo — sin Qt, sin UI.

Para cada dispositivo monitoreado que esté conectado, revisa tres señales de
salud (almacenamiento, temperatura, backup local de WhatsApp) y dispara una
notificación nativa en el propio dispositivo (adb shell cmd notification) si
alguna cruza el umbral. Pensado para correr manualmente o registrado en Task
Scheduler, con el mismo patrón que ota_check.py.

Uso manual:
    python -m forge.services.maintenance_check
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_ROOT = Path(__file__).parents[2]
sys.path.insert(0, str(_ROOT))

# ─── Dispositivos monitoreados ────────────────────────────────────────────────

_DEVICES = [
    {"serial": "NB5XWCLZSGB6J74D", "name": "Pablo"},
    {"serial": "VOSWQCOVJVQWT8LR", "name": "Sindy"},
]

_WHATSAPP_PACKAGES = ["com.whatsapp", "com.whatsapp.w4b"]

# Umbrales
_MIN_FREE_PCT     = 15  # % de almacenamiento libre mínimo
_MAX_TEMP_C       = 42  # igual al gate térmico del CLI (thermal_gate_check)
_MAX_BACKUP_AGE_H = 48  # horas desde el último backup local de WhatsApp


def _adb_shell(serial: str, cmd: str, timeout: int = 15) -> str:
    try:
        res = subprocess.run(
            ["adb", "-s", serial, "shell", cmd],
            capture_output=True, text=True, timeout=timeout,
        )
        return (res.stdout + res.stderr).strip()
    except Exception:
        return ""


def _adb_connected() -> set[str]:
    try:
        res = subprocess.run(
            ["adb", "devices"], capture_output=True, text=True, timeout=10,
        )
        serials = set()
        for line in res.stdout.splitlines()[1:]:
            parts = line.split()
            if len(parts) == 2 and parts[1] == "device":
                serials.add(parts[0])
        return serials
    except Exception:
        return set()


# ─── Checks individuales ──────────────────────────────────────────────────────


def _check_storage(serial: str) -> tuple[int, bool]:
    """Retorna (pct_libre, ok). ok=False si pct_libre < _MIN_FREE_PCT."""
    out = _adb_shell(serial, "df /data | tail -1")
    parts = out.split()
    if len(parts) < 5 or not parts[4].endswith("%"):
        return -1, True  # no se pudo leer, no bloquear por dato faltante
    used_pct = int(parts[4].rstrip("%"))
    free_pct = 100 - used_pct
    return free_pct, free_pct >= _MIN_FREE_PCT


def _check_temperature(serial: str) -> tuple[float, bool]:
    """Retorna (temp_c, ok). ok=False si temp_c > _MAX_TEMP_C."""
    out = _adb_shell(serial, "dumpsys battery | grep temperature")
    try:
        raw = int(out.split(":")[1].strip())
        temp_c = raw / 10.0
        return temp_c, temp_c <= _MAX_TEMP_C
    except (IndexError, ValueError):
        return -1.0, True


def _check_whatsapp_backup(serial: str) -> tuple[float | None, bool]:
    """
    Retorna (edad_horas del backup local más reciente, ok).
    ok=False si el backup más nuevo tiene más de _MAX_BACKUP_AGE_H horas,
    o si no se encontró ningún backup para un WhatsApp instalado.
    """
    now_raw = _adb_shell(serial, "date +%s")
    try:
        now = int(now_raw)
    except ValueError:
        return None, True

    newest_mtime = None
    for pkg in _WHATSAPP_PACKAGES:
        installed = _adb_shell(serial, f"pm list packages {pkg}")
        if pkg not in installed:
            continue
        folder = "WhatsApp Business" if pkg.endswith("w4b") else "WhatsApp"
        pattern = f'/sdcard/Android/media/{pkg}/"{folder}"/Databases/msgstore*.crypt14'
        out = _adb_shell(serial, f"stat -c %Y {pattern} 2>/dev/null | sort -n | tail -1")
        try:
            mtime = int(out)
            if newest_mtime is None or mtime > newest_mtime:
                newest_mtime = mtime
        except ValueError:
            continue

    if newest_mtime is None:
        return None, True  # ningún WhatsApp instalado o sin backups aún

    age_hours = (now - newest_mtime) / 3600
    return age_hours, age_hours <= _MAX_BACKUP_AGE_H


# ─── Notificación en el propio dispositivo (adb shell cmd notification) ───────

_ADB_TAG = "redmi_forge_maintenance"


def _notify_device(serial: str, reasons: list[str]) -> bool:
    msg = "; ".join(reasons)
    cmd = f'cmd notification post -t "Redmi Forge" {_ADB_TAG} "Necesita Mantenimiento: {msg}"'
    try:
        res = subprocess.run(
            ["adb", "-s", serial, "shell", cmd],
            capture_output=True, text=True, timeout=15,
        )
        return res.returncode == 0
    except Exception:
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────


def main() -> int:
    connected = _adb_connected()

    for dev in _DEVICES:
        serial, name = dev["serial"], dev["name"]
        if serial not in connected:
            print(f"[{name}] no conectado — omitido")
            continue

        reasons: list[str] = []

        free_pct, storage_ok = _check_storage(serial)
        if not storage_ok:
            reasons.append(f"almacenamiento libre {free_pct}% (< {_MIN_FREE_PCT}%)")

        temp_c, temp_ok = _check_temperature(serial)
        if not temp_ok:
            reasons.append(f"temperatura {temp_c}°C (> {_MAX_TEMP_C}°C)")

        backup_age_h, backup_ok = _check_whatsapp_backup(serial)
        if not backup_ok:
            reasons.append(
                f"backup local de WhatsApp desactualizado ({backup_age_h:.0f}h)"
            )

        status = f"storage={free_pct}% temp={temp_c}°C backup_age_h={backup_age_h}"
        if reasons:
            print(f"[{name}] NECESITA MANTENIMIENTO — {status} — motivos: {reasons}")
            _notify_device(serial, reasons)
        else:
            print(f"[{name}] OK — {status}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
