"""
OTA check autónomo — sin Qt, sin UI.

Registrado en Windows Task Scheduler (cada 1 hora).
El chequeo real contra los servidores se hace cada 14 días; el resto de las
ejecuciones solo intentan drenar la cola de notificación ADB si hay un
dispositivo conectado.

Flujo (por cada dispositivo monitoreado):
  1. Si pasaron >= 14 días → consulta RSS/HTML por build nueva
     - Build nueva → notificación PC (plyer) + flag pending_adb_notify
     - Sin update   → solo actualiza last_check_iso
  2. Siempre → si pending_adb_notify y el serial está conectado → notifica ADB y limpia flag

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

from forge.core.ota_watcher import OTAState, _STATE_DIR, should_check, check_for_update

# ─── Dispositivos monitoreados ────────────────────────────────────────────────
# Agregar un entry por cada dispositivo. state_file es relativo a _STATE_DIR.

_DEVICES = [
    {
        "serial":     "NB5XWCLZSGB6J74D",
        "name":       "Pablo",
        "codename":   "lake",
        "variant":    "WGTMIXM",
        "known_build": "OS3.0.20.0.WGTMIXM",
        "state_file": "ota_state_pablo.json",
    },
    {
        "serial":     "VOSWQCOVJVQWT8LR",
        "name":       "Sindy",
        "codename":   "pond",
        "variant":    "WGTMIXM",
        "known_build": "OS3.0.20.0.WGTMIXM",
        "state_file": "ota_state_sindy.json",
    },
]

# ─── Notificación PC (plyer → Windows toast) ──────────────────────────────────

def _notify_pc(name: str) -> None:
    msg = (
        f"Nueva versión de HyperOS disponible para {name}. "
        "Conectá el dispositivo para proteger las optimizaciones."
    )
    try:
        from plyer import notification
        notification.notify(
            title="Redmi Forge",
            message=msg,
            app_name="Redmi Forge",
            timeout=10,
        )
    except Exception:
        pass


# ─── Notificación ADB (dispositivo) ──────────────────────────────────────────

_MSG_ADB = "Nueva version HyperOS disponible"
_ADB_TAG = "redmi_forge_ota"


def _adb_connected() -> set[str]:
    """Retorna el conjunto de serials ADB autorizados conectados."""
    try:
        res = subprocess.run(
            ["adb", "devices"],
            capture_output=True, text=True, timeout=10,
        )
        serials = set()
        for line in res.stdout.splitlines()[1:]:
            parts = line.split()
            if len(parts) == 2 and parts[1] == "device":
                serials.add(parts[0])
        return serials
    except Exception:
        return set()


def _notify_device(serial: str) -> bool:
    try:
        cmd = f'cmd notification post {_ADB_TAG} "{_MSG_ADB}"'
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
        state_path = _STATE_DIR / dev["state_file"]
        state = OTAState.load(state_path)
        if state.known_build == state.__class__.__dataclass_fields__["known_build"].default:
            state.known_build = dev["known_build"]

        # 1. OTA check — solo si pasaron >= 14 días
        if should_check(state):
            new_build = check_for_update(
                state.known_build,
                codename=dev["codename"],
                variant=dev["variant"],
            )
            state.last_check_iso = datetime.now().isoformat()

            if new_build:
                state.ota_detected       = True
                state.ota_build          = new_build
                state.ota_detected_at    = datetime.now().isoformat()
                state.post_ota_scan_done = False
                state.pending_adb_notify = True
                state.save(state_path)
                _notify_pc(dev["name"])
            else:
                state.save(state_path)

        # 2. Drenar cola ADB — si el dispositivo está conectado
        if state.pending_adb_notify and dev["serial"] in connected:
            if _notify_device(dev["serial"]):
                state.pending_adb_notify = False
                state.save(state_path)

    return 0


if __name__ == "__main__":
    sys.exit(main())
