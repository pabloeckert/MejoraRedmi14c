"""
OTA check autónomo — sin Qt, sin UI.

Corre via Windows Task Scheduler cada 14 días:
  pythonw.exe forge/services/ota_check.py

Si detecta una build nueva de HyperOS:
  - Persiste el flag en ota_state.json
  - Muestra una notificación nativa de Windows (bandeja del sistema)

La próxima vez que se abra la UI, lee el flag y muestra el banner.
"""
import subprocess
import sys
from pathlib import Path

# Añadir raíz del proyecto al path para importar forge.*
_ROOT = Path(__file__).parents[2]
sys.path.insert(0, str(_ROOT))

from forge.core.ota_watcher import OTAState, should_check, check_for_update


def _notify(title: str, message: str) -> None:
    """Notificación nativa de Windows via PowerShell + System.Windows.Forms."""
    ps = f"""
Add-Type -AssemblyName System.Windows.Forms
$n = New-Object System.Windows.Forms.NotifyIcon
$n.Icon = [System.Drawing.SystemIcons]::Information
$n.BalloonTipTitle = "{title}"
$n.BalloonTipText  = "{message}"
$n.Visible = $true
$n.ShowBalloonTip(8000)
Start-Sleep -Seconds 9
$n.Dispose()
"""
    subprocess.Popen(
        ["powershell", "-WindowStyle", "Hidden", "-NonInteractive", "-Command", ps],
        creationflags=0x08000000,  # CREATE_NO_WINDOW
    )


def main() -> int:
    state = OTAState.load()

    if not should_check(state):
        return 0

    new_build = check_for_update(state.known_build)

    from datetime import datetime
    state.last_check_iso = datetime.now().isoformat()

    if new_build:
        state.ota_detected    = True
        state.ota_build       = new_build
        state.ota_detected_at = datetime.now().isoformat()
        state.post_ota_scan_done = False
        state.save()
        _notify(
            "Redmi Forge — HyperOS Update",
            "Hay una actualización de HyperOS disponible. "
            "Conectá el dispositivo para proteger tus optimizaciones.",
        )
    else:
        state.save()

    return 0


if __name__ == "__main__":
    sys.exit(main())
