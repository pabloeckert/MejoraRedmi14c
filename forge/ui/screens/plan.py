from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QFrame, QScrollArea,
)
from PySide6.QtCore import Qt, Signal
from forge.ui.theme import COLORS

# Las 4 fases del CLI — en el orden correcto del spec
PHASES = [
    {
        "key":   "--full",
        "icon":  "①",
        "title": "Suelo",
        "desc":  "Debloat + privacidad. Sin esto, todo lo demás se degrada.",
        "items": [
            "~80 apps de bloatware desactivadas",
            "DNS privado configurado a nivel sistema",
            "Permisos peligrosos revocados",
        ],
    },
    {
        "key":   "--full",
        "icon":  "②",
        "title": "Fluidez",
        "desc":  "Sistema, RAM, kernel, animaciones.",
        "items": [
            "Animaciones a 0.3x (mínimo HyperOS 3)",
            "Swappiness 20 + LMK agresivo",
            "Dalvik + HWUI heap XL",
        ],
    },
    {
        "key":   "--full",
        "icon":  "③",
        "title": "WhatsApp ultra-rápido",
        "desc":  "Sobre suelo y fluidez ya optimizados.",
        "items": [
            "WhatsApp protegido en background",
            "Descarga automática de medios desactivada",
            "Caché de medios duplicados limpiada",
        ],
    },
    {
        "key":   "--full",
        "icon":  "④",
        "title": "Cámara instantánea",
        "desc":  "Mejora realista ~40%. Depende de las tres anteriores.",
        "items": [
            "Apertura instantánea vía doble-tap power",
            "Compilación en speed mode",
            "Buffer y pre-captura optimizados",
        ],
    },
]


class PlanScreen(QWidget):
    confirmed = Signal(str, str)   # (serial, mode_flag)
    cancelled = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self._serial = ""
        self._setup_ui()

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(56, 48, 56, 48)
        root.setSpacing(24)

        title = QLabel("Plan de optimización")
        title.setObjectName("h1")
        root.addWidget(title)

        subtitle = QLabel(
            "Las fases se ejecutan en orden secuencial. "
            "Cada una valida la anterior antes de continuar."
        )
        subtitle.setObjectName("muted")
        subtitle.setWordWrap(True)
        root.addWidget(subtitle)

        # Lista de fases en scroll
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.NoFrame)

        container = QWidget()
        phases_layout = QVBoxLayout(container)
        phases_layout.setContentsMargins(0, 0, 0, 0)
        phases_layout.setSpacing(12)

        for phase in PHASES:
            phases_layout.addWidget(self._make_phase_card(phase))

        phases_layout.addStretch()
        scroll.setWidget(container)
        root.addWidget(scroll, stretch=1)

        # Acciones
        actions = QHBoxLayout()
        actions.setSpacing(12)

        cancel_btn = QPushButton("Cancelar")
        cancel_btn.setObjectName("secondary_btn")
        cancel_btn.clicked.connect(self.cancelled.emit)
        actions.addWidget(cancel_btn)

        actions.addStretch()

        confirm_btn = QPushButton("Confirmar y optimizar")
        confirm_btn.setObjectName("primary_btn")
        confirm_btn.clicked.connect(self._on_confirm)
        actions.addLayout(actions)
        root.addLayout(actions)
        self._confirm_btn = confirm_btn
        actions.addWidget(confirm_btn)

    def _make_phase_card(self, phase: dict) -> QFrame:
        card = QFrame()
        card.setObjectName("phase_item")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(6)

        header = QHBoxLayout()
        num = QLabel(phase["icon"])
        num.setStyleSheet(f"font-size: 20px; color: {COLORS['blue']}; font-weight: 700;")
        header.addWidget(num)

        title_lbl = QLabel(phase["title"])
        title_lbl.setObjectName("h3")
        title_lbl.setStyleSheet(f"font-size: 16px; font-weight: 600; color: {COLORS['text']};")
        header.addWidget(title_lbl)
        header.addStretch()
        layout.addLayout(header)

        desc = QLabel(phase["desc"])
        desc.setObjectName("muted")
        desc.setWordWrap(True)
        layout.addWidget(desc)

        for item in phase["items"]:
            row = QHBoxLayout()
            dot = QLabel("·")
            dot.setStyleSheet(f"color: {COLORS['blue']}; font-weight: 700;")
            dot.setFixedWidth(12)
            row.addWidget(dot)
            item_lbl = QLabel(item)
            item_lbl.setObjectName("body")
            row.addWidget(item_lbl)
            row.addStretch()
            layout.addLayout(row)

        return card

    def set_serial(self, serial: str):
        self._serial = serial
        if hasattr(self, "_confirm_btn"):
            self._confirm_btn.setEnabled(bool(serial))

    def _on_confirm(self):
        if self._serial:
            self.confirmed.emit(self._serial, "--full")
