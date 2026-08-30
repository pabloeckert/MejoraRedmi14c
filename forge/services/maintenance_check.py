"""
Monitor de mantenimiento autónomo — sin Qt, sin UI.

Para cada dispositivo monitoreado que esté conectado:
  1. Revisa tres señales de salud (almacenamiento, temperatura, backup local
     de WhatsApp) y dispara una notificación nativa en el propio dispositivo
     (adb shell cmd notification) si alguna cruza el umbral.
  2. Limpieza de caché liviana (pm trim-caches + thumbnails, sin abrir apps),
     throttleada a 1 vez cada _CACHE_CLEAN_INTERVAL_H horas.
  3. Mantenimiento completo (./run.sh --maintenance: regresiones OTA +
     recompilar cámara/WhatsApp) 1 vez cada MAINTENANCE_INTERVAL_DAYS días —
     esto sí abre apps visiblemente, por eso va con cadencia baja.
  4. Snapshot de uso real (dumpsys usagestats) persistido en la tabla
     `metrics` de la DB, para decidir el perfil de debloat con evidencia.

No limpia caché "en el celular de forma autónoma" — actúa oportunísticamente
desde la PC de Pablo cuando el dispositivo es visible por ADB (mismo límite
que ota_check.py: sin root no hay forma de programar ejecución periódica
dentro del propio dispositivo).

Pensado para correr manualmente o registrado en Task Scheduler (intervalo
corto, ej. cada 60 min, ya que la ventana de oportunidad —USB conectado— es
corta e impredecible).

Uso manual:
    python -m forge.services.maintenance_check
"""
from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

_ROOT = Path(__file__).parents[2]
sys.path.insert(0, str(_ROOT))

from forge.core.adb_bridge import list_devices, run_cli_script
from forge.core.usage_stats import collect_usage_snapshot
from forge.db.database import record_metric

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

# Cadencias de las acciones oportunistas (throttling)
_CACHE_CLEAN_INTERVAL_H  = 24  # limpieza liviana de caché
_MAINTENANCE_INTERVAL_D  = 7   # mantenimiento completo (--maintenance), igual al CLI

_STATE_DIR = Path.home() / "AppData" / "Local" / "RedmiForge"


# ─── Estado persistido por dispositivo — mismo patrón que OTAState ────────────


@dataclass
class MaintenanceState:
    last_cache_clean_iso: Optional[str] = None
    last_full_maintenance_iso: Optional[str] = None

    @classmethod
    def load(cls, path: Path) -> "MaintenanceState":
        try:
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
                return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except Exception:
            pass
        return cls()

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(asdict(self), indent=2, ensure_ascii=False), encoding="utf-8")


def _due(last_iso: Optional[str], interval: timedelta) -> bool:
    if last_iso is None:
        return True
    try:
        return datetime.now() - datetime.fromisoformat(last_iso) >= interval
    except ValueError:
        return True


def _adb_shell(serial: str, cmd: str, timeout: int = 15) -> str:
    try:
        res = subprocess.run(
            ["adb", "-s", serial, "shell", cmd],
            capture_output=True, text=True, timeout=timeout,
        )
        return (res.stdout + res.stderr).strip()
    except Exception:
        return ""


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


# ─── Limpieza de caché liviana — sin am start, sin despertar pantalla ─────────


def _clean_cache_light(serial: str) -> None:
    _adb_shell(serial, "pm trim-caches 2G")
    _adb_shell(serial, "rm -rf /sdcard/DCIM/.thumbnails/*")
    _adb_shell(serial, "rm -rf /sdcard/Pictures/.thumbnails/*")


def _run_full_maintenance(serial: str) -> None:
    """Corre ./run.sh --maintenance vía el bridge existente y drena su output."""
    try:
        for _line in run_cli_script("--maintenance", serial):
            pass  # el output ya queda en los logs propios de run.sh
    except Exception as exc:
        print(f"  mantenimiento completo falló: {exc}")


def _record_usage_snapshot(serial: str) -> None:
    try:
        snapshot = collect_usage_snapshot(serial)
        if snapshot:
            record_metric(serial, "usage_stats_snapshot", snapshot)
    except Exception as exc:
        print(f"  snapshot de uso falló: {exc}")


# ─── Main ─────────────────────────────────────────────────────────────────────


def main() -> int:
    connected = set(list_devices())

    for dev in _DEVICES:
        serial, name = dev["serial"], dev["name"]
        if serial not in connected:
            print(f"[{name}] no conectado — omitido")
            continue

        state_path = _STATE_DIR / f"maintenance_state_{name.lower()}.json"
        state = MaintenanceState.load(state_path)

        if _due(state.last_cache_clean_iso, timedelta(hours=_CACHE_CLEAN_INTERVAL_H)):
            _clean_cache_light(serial)
            state.last_cache_clean_iso = datetime.now().isoformat()
            print(f"[{name}] caché liviana limpiada")

        if _due(state.last_full_maintenance_iso, timedelta(days=_MAINTENANCE_INTERVAL_D)):
            print(f"[{name}] corriendo mantenimiento completo (--maintenance)...")
            _run_full_maintenance(serial)
            state.last_full_maintenance_iso = datetime.now().isoformat()

        _record_usage_snapshot(serial)
        state.save(state_path)

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
