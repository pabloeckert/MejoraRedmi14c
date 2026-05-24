from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QScrollArea,
    QFrame, QHBoxLayout,
)
from PySide6.QtCore import Qt
from datetime import datetime
from forge.db.database import list_runs
from forge.ui.theme import COLORS

STATUS_COLORS = {
    "completed": COLORS["success"],
    "failed":    COLORS["red"],
    "stopped":   COLORS["yellow"],
    "running":   COLORS["blue"],
}

STATUS_LABELS = {
    "completed": "Completado",
    "failed":    "Error",
    "stopped":   "Detenido",
    "running":   "Ejecutando",
}


class HistoryScreen(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._serial = ""
        self._setup_ui()

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(56, 48, 56, 48)
        root.setSpacing(24)

        header = QHBoxLayout()
        title = QLabel("Histórico")
        title.setObjectName("h1")
        header.addWidget(title)
        header.addStretch()
        root.addLayout(header)

        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setFrameShape(QFrame.NoFrame)

        self._container = QWidget()
        self._list_layout = QVBoxLayout(self._container)
        self._list_layout.setContentsMargins(0, 0, 0, 0)
        self._list_layout.setSpacing(10)
        self._list_layout.addStretch()

        self._scroll.setWidget(self._container)
        root.addWidget(self._scroll, stretch=1)

        self._render_empty()

    def _render_empty(self):
        self._clear()
        msg = QLabel("Sin optimizaciones registradas")
        msg.setObjectName("muted")
        msg.setAlignment(Qt.AlignCenter)
        self._list_layout.insertWidget(0, msg)

    def _clear(self):
        while self._list_layout.count() > 1:  # conservar el stretch final
            item = self._list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

    def refresh(self, serial: str):
        self._serial = serial
        runs = list_runs(serial)

        self._clear()
        if not runs:
            self._render_empty()
            return

        for run in runs:
            self._list_layout.insertWidget(
                self._list_layout.count() - 1,
                self._make_run_card(run)
            )

    def _make_run_card(self, run: dict) -> QFrame:
        card = QFrame()
        card.setObjectName("card")
        layout = QHBoxLayout(card)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)

        # Indicador de estado
        status = run.get("status", "")
        color = STATUS_COLORS.get(status, COLORS["border"])
        dot = QLabel("●")
        dot.setStyleSheet(f"color: {color}; font-size: 18px;")
        dot.setFixedWidth(20)
        layout.addWidget(dot)

        # Info
        info = QVBoxLayout()
        info.setSpacing(2)

        phase_lbl = QLabel(f"Optimización completa")
        phase_lbl.setObjectName("body")
        info.addWidget(phase_lbl)

        try:
            dt = datetime.fromisoformat(run["started_at"])
            date_str = dt.strftime("%d/%m/%Y %H:%M")
        except Exception:
            date_str = run.get("started_at", "—")

        date_lbl = QLabel(date_str)
        date_lbl.setObjectName("muted")
        info.addWidget(date_lbl)

        layout.addLayout(info)
        layout.addStretch()

        # Badge de estado
        badge = QLabel(STATUS_LABELS.get(status, status))
        badge.setStyleSheet(
            f"color: {color}; font-size: 12px; font-weight: 600;"
        )
        layout.addWidget(badge)

        return card

    def on_device_connected(self, device):
        self.refresh(device.serial)

    def on_device_disconnected(self, serial: str):
        if serial == self._serial:
            self._render_empty()
