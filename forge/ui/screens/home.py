from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QFrame, QSizePolicy,
)
from PySide6.QtCore import Qt, Signal
from forge.core.adb_bridge import DeviceInfo
from forge.db.database import get_device, get_display_name, get_last_run
from forge.ui.theme import COLORS


class HomeScreen(QWidget):
    optimize_requested = Signal(str)  # serial

    def __init__(self, parent=None):
        super().__init__(parent)
        self._device: DeviceInfo | None = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(56, 48, 56, 48)
        layout.setSpacing(0)

        # Título de sección
        title = QLabel("Inicio")
        title.setObjectName("h1")
        layout.addWidget(title)

        layout.addSpacing(40)

        # Área central
        self._center = QVBoxLayout()
        self._center.setAlignment(Qt.AlignCenter)
        layout.addLayout(self._center, stretch=1)

        self._render_no_device()

    def _clear(self):
        while self._center.count():
            item = self._center.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()

    # ─── Estado: sin dispositivo ──────────────────────────────────────────────

    def _render_no_device(self):
        self._clear()

        icon = QLabel("⬡")
        icon.setAlignment(Qt.AlignCenter)
        icon.setStyleSheet(f"font-size: 72px; color: {COLORS['border']};")
        self._center.addWidget(icon)

        self._center.addSpacing(20)

        msg = QLabel("Conectá el cable USB")
        msg.setObjectName("h3")
        msg.setAlignment(Qt.AlignCenter)
        self._center.addWidget(msg)

        sub = QLabel("El dispositivo aparecerá automáticamente")
        sub.setObjectName("muted")
        sub.setAlignment(Qt.AlignCenter)
        self._center.addWidget(sub)

    # ─── Estado: dispositivo conectado ────────────────────────────────────────

    def _render_device(self, device: DeviceInfo):
        self._clear()

        card = QFrame()
        card.setObjectName("card")
        card.setFixedWidth(500)
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(36, 32, 36, 32)
        card_layout.setSpacing(0)

        # Header: nombre de persona + modelo + serial
        header = QHBoxLayout()
        header.setSpacing(16)

        icon_label = QLabel("📱")
        icon_label.setStyleSheet("font-size: 36px;")
        icon_label.setAlignment(Qt.AlignTop)
        header.addWidget(icon_label)

        device_col = QVBoxLayout()
        device_col.setSpacing(4)

        name = get_display_name(device.serial)
        if name:
            greeting = QLabel(f"Hola, {name}")
            greeting.setObjectName("h3")
            device_col.addWidget(greeting)

        model = QLabel(device.model or "Redmi 14C")
        model.setObjectName("body" if name else "h3")
        serial_lbl = QLabel(device.serial)
        serial_lbl.setObjectName("muted")
        device_col.addWidget(model)
        device_col.addWidget(serial_lbl)
        header.addLayout(device_col)
        header.addStretch()
        card_layout.addLayout(header)

        card_layout.addSpacing(24)

        # Separador
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet(f"background: {COLORS['border']}; max-height: 1px;")
        card_layout.addWidget(sep)

        card_layout.addSpacing(20)

        # Info rows
        def info_row(label: str, value: str):
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setObjectName("muted")
            val = QLabel(value)
            val.setObjectName("body")
            row.addWidget(lbl)
            row.addStretch()
            row.addWidget(val)
            card_layout.addLayout(row)
            card_layout.addSpacing(8)

        if device.android_version:
            info_row("Android", device.android_version)
        if device.hyperos_version:
            info_row("HyperOS", device.hyperos_version)

        # Última optimización
        last = get_last_run(device.serial)
        if last:
            from datetime import datetime
            dt = datetime.fromisoformat(last["started_at"])
            info_row("Última optimización", dt.strftime("%d/%m/%Y %H:%M"))

        card_layout.addSpacing(28)

        # Botón principal
        btn = QPushButton("Optimizar ahora")
        btn.setObjectName("primary_btn")
        btn.clicked.connect(lambda: self.optimize_requested.emit(device.serial))
        card_layout.addWidget(btn)

        if last:
            card_layout.addSpacing(12)
            note = QLabel("El plan se adaptará al estado actual del dispositivo")
            note.setObjectName("caption")
            note.setAlignment(Qt.AlignCenter)
            card_layout.addWidget(note)

        self._center.addWidget(card, alignment=Qt.AlignCenter)

    # ─── Slots ────────────────────────────────────────────────────────────────

    def on_device_connected(self, device: DeviceInfo):
        self._device = device
        self._render_device(device)

    def on_device_disconnected(self, serial: str):
        if self._device and self._device.serial == serial:
            self._device = None
            self._render_no_device()

    def on_profile_saved(self, name: str):
        if self._device:
            self._render_device(self._device)
