"""
Wrapper sobre ADB e invocador de src/cli/run.sh.

Regla: nunca reescribir la lógica de los scripts Bash.
Este módulo los invoca; no los reemplaza.
"""
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator

# Rutas relativas a la raíz del proyecto
_ROOT = Path(__file__).parents[2]
_ADB_VENDOR = _ROOT / "vendor" / "adb" / "adb.exe"
_CLI_RUN = _ROOT / "src" / "cli" / "run.sh"


@dataclass
class DeviceInfo:
    serial: str
    model: str = ""
    android_version: str = ""
    hyperos_version: str = ""


@dataclass
class ScanResult:
    serial: str
    ram_total_mb: int
    ram_avail_mb: int
    ram_free_pct: int
    tweaks: dict
    installed_packages: frozenset
    disabled_packages: frozenset


# ─── Localizar ADB ───────────────────────────────────────────────────────────

def find_adb() -> str:
    if _ADB_VENDOR.exists():
        return str(_ADB_VENDOR)
    adb = shutil.which("adb")
    if adb:
        return adb
    raise FileNotFoundError(
        "ADB no encontrado. Instalá android-platform-tools "
        "o copiá adb.exe a vendor/adb/adb.exe"
    )


# ─── Localizar shell Bash en Windows ─────────────────────────────────────────

def find_shell() -> tuple[str, list[str]]:
    """
    Devuelve (ejecutable, args_prefix) para correr scripts Bash en Windows.
    Orden de preferencia: Git Bash > WSL (WSL con systemd roto causa fallos).
    """
    candidates = [
        Path("C:/Program Files/Git/bin/bash.exe"),
        Path("C:/Program Files (x86)/Git/bin/bash.exe"),
    ]
    for path in candidates:
        if path.exists():
            return str(path), []

    wsl = shutil.which("wsl")
    if wsl:
        return wsl, ["bash"]

    raise FileNotFoundError(
        "Se necesita Git for Windows o WSL para ejecutar los scripts del CLI. "
        "Instalá Git desde https://git-scm.com"
    )


def shell_available() -> bool:
    try:
        find_shell()
        return True
    except FileNotFoundError:
        return False


def _to_posix_path(windows_path: Path, shell_exe: str) -> str:
    """Convierte ruta Windows a formato compatible con el shell detectado."""
    if "wsl" in shell_exe.lower():
        drive = windows_path.drive[0].lower()          # "C" → "c"
        rest = str(windows_path).replace("\\", "/")[2:]  # "\Github\..." → "/Github/..."
        return f"/mnt/{drive}{rest}"
    # Git Bash acepta rutas con / sin conversión de drive
    return str(windows_path).replace("\\", "/")


# ─── Operaciones ADB básicas ──────────────────────────────────────────────────

def _adb(*args: str, serial: str = "", timeout: int = 10) -> tuple[int, str, str]:
    cmd = [find_adb()]
    if serial:
        cmd += ["-s", serial]
    cmd += list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def list_devices() -> list[str]:
    """Devuelve serials de dispositivos autorizados conectados."""
    _, stdout, _ = _adb("devices")
    serials = []
    for line in stdout.splitlines()[1:]:
        parts = line.split()
        if len(parts) == 2 and parts[1] == "device":
            serials.append(parts[0])
    return serials


def get_device_info(serial: str) -> DeviceInfo:
    info = DeviceInfo(serial=serial)
    props = [
        ("ro.product.model",        "model"),
        ("ro.build.version.release","android_version"),
        ("ro.miui.ui.version.name", "hyperos_version"),
    ]
    for prop, attr in props:
        _, val, _ = _adb("shell", "getprop", prop, serial=serial)
        if val:
            setattr(info, attr, val)
    return info


def adb_available() -> bool:
    try:
        find_adb()
        return True
    except FileNotFoundError:
        return False


# ─── Scan del estado real del dispositivo ────────────────────────────────────

def scan_device(serial: str) -> ScanResult:
    """
    Lee el estado real del dispositivo sin modificar nada.
    Devuelve RAM, paquetes instalados/desactivados y tweaks de performance.
    Usá el resultado para evitar optimizar lo que ya está hecho o tocar
    lo que no existe en este dispositivo.
    """
    # RAM
    _, meminfo, _ = _adb("shell", "cat", "/proc/meminfo", serial=serial, timeout=15)
    mem_total = mem_avail = 0
    for line in meminfo.splitlines():
        parts = line.split()
        if line.startswith("MemTotal:") and len(parts) > 1:
            mem_total = int(parts[1])
        elif line.startswith("MemAvailable:") and len(parts) > 1:
            mem_avail = int(parts[1])
    ram_total_mb = mem_total // 1024
    ram_avail_mb = mem_avail // 1024
    ram_free_pct = (mem_avail * 100 // mem_total) if mem_total else 0

    # Paquetes instalados y desactivados
    _, pkgs_raw, _     = _adb("shell", "pm", "list", "packages",       serial=serial, timeout=30)
    _, disabled_raw, _ = _adb("shell", "pm", "list", "packages", "-d", serial=serial, timeout=30)
    installed = frozenset(
        line.removeprefix("package:").strip()
        for line in pkgs_raw.splitlines()
        if line.startswith("package:")
    )
    disabled = frozenset(
        line.removeprefix("package:").strip()
        for line in disabled_raw.splitlines()
        if line.startswith("package:")
    )

    # Tweaks de performance actuales
    def _get(namespace: str, key: str) -> str:
        _, val, _ = _adb("shell", "settings", "get", namespace, key, serial=serial)
        return val.strip()

    _, wm_size_raw, _ = _adb("shell", "wm", "size",    serial=serial)
    _, wm_dpi_raw,  _ = _adb("shell", "wm", "density", serial=serial)
    tweaks = {
        "animations":    _get("global", "window_animation_scale"),
        "gpu_forced":    _get("global", "force_gpu_rendering") == "1",
        "refresh_rate":  _get("system", "peak_refresh_rate"),
        "blur_disabled": _get("global", "disable_window_blurs") == "1",
        "resolution":    wm_size_raw.strip(),
        "dpi":           wm_dpi_raw.strip(),
    }

    return ScanResult(
        serial=serial,
        ram_total_mb=ram_total_mb,
        ram_avail_mb=ram_avail_mb,
        ram_free_pct=ram_free_pct,
        tweaks=tweaks,
        installed_packages=installed,
        disabled_packages=disabled,
    )


# ─── Invocar src/cli/run.sh ───────────────────────────────────────────────────

_RUNTIME_PROFILE = _ROOT / "src" / "cli" / "data" / "profile_runtime.sh"


def run_cli_script(mode_flag: str, serial: str) -> Generator[str, None, int]:
    """
    Generator que ejecuta src/cli/run.sh y hace yield de cada línea de output.
    Al terminar devuelve el exit code vía StopIteration.value.

    Si mode_flag == "--full" y el dispositivo tiene un perfil guardado,
    genera automáticamente profile_runtime.sh y usa --profile en su lugar.
    """
    actual_flag = mode_flag
    if mode_flag == "--full":
        from forge.core.debloat_engine import has_profile, write_runtime_profile
        if has_profile(serial):
            write_runtime_profile(serial, _RUNTIME_PROFILE)
            actual_flag = "--profile"

    shell_exe, prefix = find_shell()
    script_path = _to_posix_path(_CLI_RUN, shell_exe)

    cmd = [shell_exe] + prefix + [script_path, actual_flag]
    env = {**os.environ, "ANDROID_SERIAL": serial}

    with subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        env=env,
    ) as proc:
        for line in proc.stdout:
            yield line.rstrip()
    return proc.returncode
