"""
OTA check autónomo — sin Qt, sin UI.

Registrado en Windows Task Scheduler (cada 1 hora).
El chequeo real contra los servidores se hace cada 14 días; el resto de las
ejecuciones solo intentan drenar la cola de notificación ADB si hay un
dispositivo conectado.

Flujo:
  1. Si pasaron >= 14 días → consulta RSS/HTML por build nueva
     - Build nueva → notificación PC (plyer) + flag pending_adb_notify
     - Sin update   → solo actualiza last_check_iso
  2. Siempre → si pending_adb_notify y hay device conectado → notifica ADB y limpia flag

Registro Task Scheduler (ejecutar una vez, como admin no requerido):
  schtasks /create /tn "RedmiForge-OTA" ^
    /tr "\"<pythonw>\" \"<repo>\\forge\\services\\ota_check.py\"" ^
    /sc hourly /mo 1 /st 09:00 /f
"""
from __future__ import annotations

import subprocess
import sys
from datetime import datetime
from pathlib import Path

_ROOT = Path(__file__).parents[2]
sys.path.insert(0, str(_ROOT))

from forge.core.ota_watcher import OTAState, should_check, check_for_update

# ─── Notificación PC (plyer → Windows toast) ──────────────────────────────────

_MSG_PC = (
    "Nueva versión de HyperOS disponible. "
    "Conectá el dispositivo para proteger tus optimizaciones."
)

def _notify_pc() -> None:
    try:
        from plyer import notification
        notification.notify(
            title="Redmi Forge",
            message=_MSG_PC,
            app_name="Redmi Forge",
            timeout=10,
        )
    except Exception:
        pass  # nunca crashear el servicio por un error de notificación


# ─── Notificación ADB (dispositivo) ──────────────────────────────────────────

_MSG_ADB_TITLE = "HyperOS Update"
_MSG_ADB_BODY  = "Nueva version disponible. Actualiza para proteger tus optimizaciones."
_ADB_TAG       = "redmi_forge_ota"


def _adb_devices() -> list[str]:
    """Retorna serials de dispositivos ADB autorizados conectados."""
    try:
        res = subprocess.run(
            ["adb", "devices"],
            capture_output=True, text=True, timeout=10,
        )
        serials = []
        for line in res.stdout.splitlines()[1:]:
            parts = line.split()
            if len(parts) == 2 and parts[1] == "device":
                serials.append(parts[0])
        return serials
    except Exception:
        return []


def _notify_device(serial: str) -> bool:
    """
    Muestra una notificación visible en el dispositivo vía ADB.
    Usa cmd notification post (Android 8+, sin root).
    Retorna True si el comando tuvo exit code 0.
    """
    try:
        res = subprocess.run(
            [
                "adb", "-s", serial, "shell",
                "cmd", "notification", "post",
                "-S", "bigtext",
                _ADB_TAG,
                _MSG_ADB_TITLE,
                _MSG_ADB_BODY,
            ],
            capture_output=True, text=True, timeout=15,
        )
        return res.returncode == 0
    except Exception:
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    state = OTAState.load()

    # 1. OTA check — solo si pasaron >= 14 días
    if should_check(state):
        new_build = check_for_update(state.known_build)
        state.last_check_iso = datetime.now().isoformat()

        if new_build:
            state.ota_detected      = True
            state.ota_build         = new_build
            state.ota_detected_at   = datetime.now().isoformat()
            state.post_ota_scan_done = False
            state.pending_adb_notify = True
            state.save()
            _notify_pc()
        else:
            state.save()

    # 2. Drenar cola ADB — en cada ejecución, si hay algo pendiente
    if state.pending_adb_notify:
        serials = _adb_devices()
        if serials:
            if _notify_device(serials[0]):
                state.pending_adb_notify = False
                state.save()

    return 0


if __name__ == "__main__":
    sys.exit(main())
