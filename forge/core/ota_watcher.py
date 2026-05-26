"""
Motor OTA Watcher para Redmi Forge.

Chequea cada 14 días si hay una build de HyperOS más nueva que la conocida,
usando dos fuentes en cascada:
  1. RSS de XiaomiFirmwareUpdater/miui-updates-tracker (GitHub)
  2. xmfirmwareupdater.com/hyperos/lake/ (scraping HTML)

Cuando detecta una build más nueva emite ota_available(build: str).
Cuando el dispositivo se conecta después de un OTA detectado, TweakScanWorker
verifica qué tweaks se resetearon y emite scan_done(list[TweakStatus]).
"""
from __future__ import annotations

import json
import re
import subprocess
import time
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from PySide6.QtCore import QThread, Signal

# ─── Constantes ───────────────────────────────────────────────────────────────

CODENAME            = "lake"
VARIANT             = "WGTMIXM"
FALLBACK_BUILD      = "OS3.0.20.0.WGTMIXM"
CHECK_INTERVAL_DAYS = 14
_HTTP_TIMEOUT       = 10  # segundos

_RSS_GITHUB = (
    "https://raw.githubusercontent.com/XiaomiFirmwareUpdater/"
    "miui-updates-tracker/master/rss/lake.xml"
)
_XMFIRMWARE_URL = "https://xmfirmwareupdater.com/hyperos/lake/"

_BUILD_RE = re.compile(r"OS(\d+\.\d+\.\d+\.\d+)\." + VARIANT)

_STATE_PATH = Path.home() / "AppData" / "Local" / "RedmiForge" / "ota_state.json"

# ─── Estado persistido ────────────────────────────────────────────────────────


@dataclass
class OTAState:
    last_check_iso: Optional[str] = None
    known_build: str = FALLBACK_BUILD
    ota_detected: bool = False
    ota_build: Optional[str] = None
    ota_detected_at: Optional[str] = None
    post_ota_scan_done: bool = False
    disabled_pkg_baseline: Optional[int] = None
    pending_adb_notify: bool = False  # True si hay update detectado pero el device no estaba conectado

    @classmethod
    def load(cls) -> "OTAState":
        try:
            if _STATE_PATH.exists():
                data = json.loads(_STATE_PATH.read_text(encoding="utf-8"))
                return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except Exception:
            pass
        return cls()

    def save(self) -> None:
        _STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _STATE_PATH.write_text(
            json.dumps(asdict(self), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )


# ─── Comparación de versiones ─────────────────────────────────────────────────


def _parse_version(build: str) -> Optional[tuple[int, ...]]:
    m = _BUILD_RE.search(build)
    if not m:
        return None
    return tuple(int(x) for x in m.group(1).split("."))


def _is_newer(candidate: str, current: str) -> bool:
    cv = _parse_version(candidate)
    kv = _parse_version(current)
    if cv is None or kv is None:
        return False
    return cv > kv


# ─── Fetching de fuentes ──────────────────────────────────────────────────────


def _fetch_github_rss() -> Optional[str]:
    """Parsea el RSS del tracker de GitHub y retorna la build WGTMIXM más reciente."""
    try:
        req = urllib.request.Request(
            _RSS_GITHUB,
            headers={"User-Agent": "RedmiForge/1.0"},
        )
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            raw = resp.read()
        root = ET.fromstring(raw)
        builds: list[str] = []
        for item in root.iter("item"):
            title = item.findtext("title") or ""
            m = _BUILD_RE.search(title)
            if m:
                builds.append(m.group(0))
        if not builds:
            return None
        # la más nueva según versión numérica
        return max(builds, key=lambda b: _parse_version(b) or (0,))
    except Exception:
        return None


def _fetch_xmfirmware() -> Optional[str]:
    """Scraping HTML de xmfirmwareupdater.com para builds WGTMIXM."""
    try:
        req = urllib.request.Request(
            _XMFIRMWARE_URL,
            headers={"User-Agent": "RedmiForge/1.0"},
        )
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        builds = _BUILD_RE.findall(html)
        if not builds:
            return None
        full_builds = [f"OS{v}.{VARIANT}" for v in builds]
        return max(full_builds, key=lambda b: _parse_version(b) or (0,))
    except Exception:
        return None


# ─── Lógica de chequeo ────────────────────────────────────────────────────────


def should_check(state: OTAState) -> bool:
    if state.last_check_iso is None:
        return True
    try:
        last = datetime.fromisoformat(state.last_check_iso)
        return datetime.now() - last >= timedelta(days=CHECK_INTERVAL_DAYS)
    except ValueError:
        return True


def check_for_update(known_build: str) -> Optional[str]:
    """
    Consulta ambas fuentes y retorna la build más nueva si supera known_build.
    Retorna None si no hay update o si no se pudo contactar ninguna fuente.
    """
    candidate = _fetch_github_rss() or _fetch_xmfirmware()
    if candidate and _is_newer(candidate, known_build):
        return candidate
    return None


# ─── Tweaks verificables sin root ────────────────────────────────────────────


@dataclass
class TweakStatus:
    name: str
    ok: bool
    current_value: str
    expected_value: str
    readonly: bool = False
    fix_cmds: list[str] = field(default_factory=list)


_TWEAKS_SPEC: list[dict] = [
    {
        "name": "Animaciones 0.3x",
        "readonly": False,
        "checks": [
            ("settings get global window_animation_scale", "0.3"),
            ("settings get global transition_animation_scale", "0.3"),
            ("settings get global animator_duration_scale", "0.3"),
        ],
        "fixes": [
            "settings put global window_animation_scale 0.3",
            "settings put global transition_animation_scale 0.3",
            "settings put global animator_duration_scale 0.3",
        ],
    },
    {
        "name": "Refresh rate 90Hz",
        "readonly": False,
        "checks": [
            ("settings get system peak_refresh_rate", "90"),
        ],
        "fixes": [
            "settings put system peak_refresh_rate 90",
            "settings put system min_refresh_rate 90",
        ],
    },
    {
        "name": "swappiness 20",
        "readonly": True,
        "checks": [
            ("cat /proc/sys/vm/swappiness", "20"),
        ],
        "fixes": [],
    },
]


def _adb_shell(serial: str, cmd: str) -> str:
    try:
        res = subprocess.run(
            ["adb", "-s", serial, "shell", cmd],
            capture_output=True, text=True, timeout=10,
        )
        return (res.stdout + res.stderr).strip()
    except Exception:
        return ""


def scan_tweaks(serial: str) -> list[TweakStatus]:
    """
    Verifica el estado de cada tweak en el dispositivo.
    Para tweaks con múltiples checks (animaciones), todos deben pasar.
    """
    results: list[TweakStatus] = []
    for spec in _TWEAKS_SPEC:
        all_ok = True
        current_vals: list[str] = []
        for cmd, expected in spec["checks"]:
            val = _adb_shell(serial, cmd)
            current_vals.append(val)
            if val != expected:
                all_ok = False
        results.append(TweakStatus(
            name=spec["name"],
            ok=all_ok,
            current_value=", ".join(current_vals),
            expected_value=spec["checks"][0][1],
            readonly=spec["readonly"],
            fix_cmds=spec["fixes"],
        ))

    # Check de packages deshabilitados: conteo actual
    pkg_list = _adb_shell(serial, "pm list packages -d")
    disabled_count = pkg_list.count("package:")
    results.append(TweakStatus(
        name=f"Packages deshabilitados ({disabled_count} activos)",
        ok=True,  # se evalúa en UI comparando contra baseline
        current_value=str(disabled_count),
        expected_value="baseline",
        readonly=True,
        fix_cmds=[],
    ))
    return results


def reapply_tweaks(serial: str, tweaks: list[TweakStatus]) -> list[TweakStatus]:
    """Reaplicar los tweaks reseteados que no sean readonly."""
    updated: list[TweakStatus] = []
    for tweak in tweaks:
        if tweak.ok or tweak.readonly or not tweak.fix_cmds:
            updated.append(tweak)
            continue
        for cmd in tweak.fix_cmds:
            _adb_shell(serial, cmd)
        # re-verificar
        rescanned = scan_tweaks(serial)
        fixed = next((t for t in rescanned if t.name == tweak.name), tweak)
        updated.append(fixed)
    return updated


# ─── QThreads ─────────────────────────────────────────────────────────────────


class OTAWorker(QThread):
    """
    Hilo que chequea actualizaciones de HyperOS cada 14 días.
    No bloquea la UI — hace polling liviano cada 60 segundos para saber
    si llegó la hora del chequeo real.
    """

    ota_available = Signal(str)   # nueva build detectada
    check_done    = Signal(bool, str)  # (hay_update, build_o_vacio)

    _POLL_S = 60  # cada cuántos segundos verifica si toca chequear

    def __init__(self, parent=None):
        super().__init__(parent)
        self._running = True
        self._state   = OTAState.load()

    def run(self):
        # Chequeo inmediato al arrancar si corresponde
        if should_check(self._state):
            self._do_check()

        while self._running:
            time.sleep(self._POLL_S)
            if not self._running:
                break
            if should_check(self._state):
                self._do_check()

    def _do_check(self):
        new_build = check_for_update(self._state.known_build)
        self._state.last_check_iso = datetime.now().isoformat()

        if new_build:
            self._state.ota_detected    = True
            self._state.ota_build       = new_build
            self._state.ota_detected_at = datetime.now().isoformat()
            self._state.post_ota_scan_done = False
            self._state.save()
            self.ota_available.emit(new_build)
            self.check_done.emit(True, new_build)
        else:
            self._state.save()
            self.check_done.emit(False, "")

    def force_check(self):
        """Fuerza un chequeo inmediato ignorando el intervalo."""
        self._state.last_check_iso = None
        self._state.save()

    def mark_scan_done(self, disabled_baseline: int):
        """Llamar tras un scan post-OTA exitoso para marcar el estado."""
        self._state.post_ota_scan_done  = True
        self._state.disabled_pkg_baseline = disabled_baseline
        self._state.save()

    def state(self) -> OTAState:
        return self._state

    def stop(self):
        self._running = False


class TweakScanWorker(QThread):
    """Escanea en background qué tweaks se resetearon post-OTA."""

    scan_done = Signal(list)  # list[TweakStatus]

    def __init__(self, serial: str, parent=None):
        super().__init__(parent)
        self._serial = serial

    def run(self):
        tweaks = scan_tweaks(self._serial)
        self.scan_done.emit(tweaks)
