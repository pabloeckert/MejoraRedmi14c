import time
from PySide6.QtCore import QThread, Signal
from forge.core.adb_bridge import list_devices, get_device_info, DeviceInfo, adb_available


class DeviceWatcher(QThread):
    """Hilo que detecta conexión/desconexión de dispositivos ADB cada 2 segundos."""

    device_connected    = Signal(object)  # DeviceInfo
    device_disconnected = Signal(str)     # serial
    adb_unavailable     = Signal(str)     # mensaje de error

    POLL_INTERVAL = 2.0

    def __init__(self, parent=None):
        super().__init__(parent)
        self._running = True
        self._known: set[str] = set()

    def run(self):
        if not adb_available():
            self.adb_unavailable.emit(
                "ADB no encontrado. Instalá android-platform-tools."
            )
            return

        while self._running:
            try:
                current = set(list_devices())
            except Exception as e:
                self.adb_unavailable.emit(str(e))
                time.sleep(5)
                continue

            for serial in current - self._known:
                info = get_device_info(serial)
                self.device_connected.emit(info)

            for serial in self._known - current:
                self.device_disconnected.emit(serial)

            self._known = current
            time.sleep(self.POLL_INTERVAL)

    def stop(self):
        self._running = False
