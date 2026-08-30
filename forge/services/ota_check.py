"""
OTA check autónomo — sin Qt, sin UI.

Registrado en Windows Task Scheduler (cada 15 días a las 09:00, sin ventana).
La tarea usa pythonw.exe y está marcada como Hidden en el Programador.

Flujo (por cada dispositivo monitoreado):
  1. Si pasaron >= 14 días → consulta RSS/HTML por build nueva
     - Build nueva → notificación PC (plyer) + flag pending_adb_notify
     - Sin update   → solo actualiza last_check_iso
  2. Siempre → si pending_adb_notify y el serial está conectado → notifica ADB y limpia flag

Registro Task Scheduler (setup.ps1 lo hace automáticamente):
  New-ScheduledTaskTrigger -Daily -DaysInterval 15 -At "09:00"
  pythonw.exe + Settings.Hidden = $true
"""
from __future__ import annotations

import logging
import subprocess
import sys
from datetime import datetime
from pathlib import Path

_ROOT = Path(__file__).parents[2]
sys.path.insert(0, str(_ROOT))

from forge.core.ota_watcher import OTAState, _STATE_DIR, should_check, check_for_update

# ─── Logging — esta tarea corre sin supervisión vía Task Scheduler; sin esto
# no queda ningún rastro diagnosticable si falla o si una fuente deja de
# responder durante semanas. ────────────────────────────────────────────────
_LOG_PATH = _STATE_DIR / "ota_check.log"
_STATE_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    filename=str(_LOG_PATH),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("ota_check")

# ─── Dispositivos monitoreados ────────────────────────────────────────────────
# Agregar un entry por cada dispositivo. state_file es relativo a _STATE_DIR.

_DEVICES = [
    {
        "serial":     "NB5XWCLZSGB6J74D",
        "name":       "Pablo",
        "codename":   "pond",  # confirmado 30/08/2026: adb shell getprop ro.product.device
        "variant":    "WGTMIXM",
        "known_build": "OS3.0.20.0.WGTMIXM",
        "state_file": "ota_state_pablo.json",
    },
    {
        "serial":     "VOSWQCOVJVQWT8LR",
        "name":       "Sindy",
        # Sin confirmar en el dispositivo real -- inferido "pond" porque es el
        # mismo modelo (Redmi 14C) que el de Pablo, ya confirmado. Verificar con
        # `adb shell getprop ro.product.device` la próxima vez que se conecte.
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
    log.info("=== ota_check iniciado ===")
    try:
        connected = _adb_connected()
    except Exception:
        log.exception("Fallo obteniendo dispositivos ADB conectados")
        connected = set()
    log.info("Dispositivos ADB conectados: %s", connected or "ninguno")

    for dev in _DEVICES:
        try:
            state_path = _STATE_DIR / dev["state_file"]
            state = OTAState.load(state_path)
            if state.known_build == state.__class__.__dataclass_fields__["known_build"].default:
                state.known_build = dev["known_build"]

            # 1. OTA check — solo si pasaron >= 14 días
            if should_check(state):
                log.info("%s: chequeando update (known_build=%s)...", dev["name"], state.known_build)
                new_build = check_for_update(
                    state.known_build,
                    codename=dev["codename"],
                    variant=dev["variant"],
                )
                state.last_check_iso = datetime.now().isoformat()

                if new_build:
                    log.info("%s: build nueva detectada: %s", dev["name"], new_build)
                    state.ota_detected       = True
                    state.ota_build          = new_build
                    state.ota_detected_at    = datetime.now().isoformat()
                    state.post_ota_scan_done = False
                    state.pending_adb_notify = True
                    state.save(state_path)
                    _notify_pc(dev["name"])
                else:
                    log.info("%s: sin update (o ambas fuentes fallaron) — se reintenta en 14 días", dev["name"])
                    state.save(state_path)
            else:
                log.info("%s: aún no toca chequear (last_check=%s)", dev["name"], state.last_check_iso)

            # 2. Drenar cola ADB — si el dispositivo está conectado
            if state.pending_adb_notify:
                if dev["serial"] in connected:
                    if _notify_device(dev["serial"]):
                        log.info("%s: notificación ADB entregada", dev["name"])
                        state.pending_adb_notify = False
                        state.save(state_path)
                    else:
                        log.warning("%s: notificación ADB falló pese a estar conectado", dev["name"])
                else:
                    log.info("%s: notificación pendiente, dispositivo no conectado", dev["name"])
        except Exception:
            log.exception("Fallo procesando dispositivo %s", dev.get("name", "?"))

    log.info("=== ota_check finalizado ===")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        log.exception("ota_check terminó con una excepción no manejada")
        raise
