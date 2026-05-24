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
    Orden de preferencia: WSL > Git Bash.
    """
    wsl = shutil.which("wsl")
    if wsl:
        return wsl, ["bash"]

    candidates = [
        Path("C:/Program Files/Git/bin/bash.exe"),
        Path("C:/Program Files (x86)/Git/bin/bash.exe"),
    ]
    for path in candidates:
        if path.exists():
            return str(path), []

    raise FileNotFoundError(
        "Se necesita WSL o Git for Windows para ejecutar los scripts del CLI. "
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
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
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
        bufsize=1,
        env=env,
    ) as proc:
        for line in proc.stdout:
            yield line.rstrip()
    return proc.returncode
