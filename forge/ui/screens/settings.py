from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QFrame, QPushButton, QLineEdit,
)
from PySide6.QtCore import Qt
from forge.core.adb_bridge import find_adb, shell_available, adb_available
from forge.db.database import DB_PATH
from forge.ui.theme import COLORS


class SettingsScreen(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(56, 48, 56, 48)
        root.setSpacing(24)

        title = QLabel("Configuración")
        title.setObjectName("h1")
        root.addWidget(title)

        # Sección: diagnóstico del entorno
        root.addWidget(self._section("Estado del entorno"))
        root.addWidget(self._env_card())

        # Sección: base de datos
        root.addWidget(self._section("Datos locales"))
        root.addWidget(self._db_card())

        root.addStretch()

    def _section(self, text: str) -> QLabel:
        lbl = QLabel(text.upper())
        lbl.setStyleSheet(
            f"font-size: 11px; font-weight: 700; color: {COLORS['text_muted']}; "
            "letter-spacing: 1px; margin-top: 8px;"
        )
        return lbl

    def _env_card(self) -> QFrame:
        card = QFrame()
        card.setObjectName("card")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(12)

        def status_row(label: str, ok: bool, detail: str = ""):
            row = QHBoxLayout()
            dot = QLabel("●")
            color = COLORS["success"] if ok else COLORS["red"]
            dot.setStyleSheet(f"color: {color}; font-size: 14px;")
            row.addWidget(dot)
            lbl = QLabel(label)
            lbl.setObjectName("body")
            row.addWidget(lbl)
            if detail:
                det = QLabel(detail)
                det.setObjectName("muted")
                row.addWidget(det)
            row.addStretch()
            val = QLabel("OK" if ok else "No disponible")
            val.setStyleSheet(f"color: {color}; font-size: 13px; font-weight: 600;")
            row.addWidget(val)
            layout.addLayout(row)

        adb_ok = adb_available()
        adb_path = ""
        if adb_ok:
            try:
                adb_path = find_adb()
            except Exception:
                pass
        status_row("ADB", adb_ok, adb_path)

        shell_ok = shell_available()
        status_row("Shell Bash (WSL / Git Bash)", shell_ok)

        return card

    def _db_card(self) -> QFrame:
        card = QFrame()
        card.setObjectName("card")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(8)

        path_row = QHBoxLayout()
        path_lbl = QLabel("Base de datos")
        path_lbl.setObjectName("muted")
        path_row.addWidget(path_lbl)
        path_row.addStretch()
        path_val = QLabel(str(DB_PATH))
        path_val.setObjectName("muted")
        path_val.setStyleSheet("font-size: 12px;")
        path_row.addWidget(path_val)
        layout.addLayout(path_row)

        return card
