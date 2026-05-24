from __future__ import annotations

import json

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QButtonGroup, QComboBox, QFrame, QHBoxLayout, QLabel,
    QLineEdit, QListWidget, QListWidgetItem, QPushButton,
    QRadioButton, QSlider, QStackedWidget, QVBoxLayout, QWidget,
)

from forge.core.apps_catalog import HEAVY_APPS_SET, WIZARD_APPS
from forge.db.database import get_device, save_profile
from forge.ui.theme import COLORS

BANK_NAMES: list[str] = [
    "Banco Nación", "BBVA", "Santander", "Galicia", "ICBC",
    "Macro", "Supervielle", "Patagonia", "Ciudad",
    "Brubank", "Ualá", "Naranja X", "Mercado Pago", "Otro",
]

# (clave, etiqueta, descripción)
PHOTO_OPTIONS: list[tuple[str, str, str]] = [
    ("personas",   "Personas",   "Selfies, familia y amigos"),
    ("documentos", "Documentos", "DNI, facturas, formularios"),
    ("pantallas",  "Pantallas",  "Capturas y referencias"),
    ("todo",       "De todo",    "Un poco de cada cosa"),
]

_INPUT_STYLE = f"""
    QLineEdit {{
        font-size: 15px;
        border: 1.5px solid {COLORS['border']};
        border-radius: 10px;
        padding: 4px 16px;
        color: {COLORS['text']};
        background: white;
    }}
    QLineEdit:focus {{ border-color: {COLORS['blue']}; }}
"""

_RADIO_STYLE = f"""
    QRadioButton {{
        font-size: 16px;
        color: {COLORS['text']};
        spacing: 10px;
    }}
    QRadioButton::indicator {{
        width: 20px; height: 20px;
        border-radius: 10px;
        border: 2px solid {COLORS['border']};
        background: white;
    }}
    QRadioButton::indicator:checked {{
        background: {COLORS['blue']};
        border-color: {COLORS['blue']};
    }}
"""


def _photo_card_style(active: bool) -> str:
    if active:
        return f"""
            QPushButton {{
                background: {COLORS['blue']};
                color: white;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                padding: 10px 6px;
                border: none;
                text-align: center;
            }}
        """
    return f"""
        QPushButton {{
            background: white;
            color: {COLORS['text']};
            border-radius: 10px;
            font-size: 13px;
            border: 1.5px solid {COLORS['border']};
            padding: 10px 6px;
            text-align: center;
        }}
        QPushButton:hover {{ border-color: {COLORS['blue']}; }}
    """


class ProfileScreen(QWidget):
    profile_saved = Signal(str, str)   # serial, name

    def __init__(self, parent=None):
        super().__init__(parent)
        self._serial:     str       = ""
        self._name:       str       = ""
        self._apps:       list[str] = []
        self._wa_hours:   int       = 2
        self._photo_type: str       = "todo"
        self._banking:    bool      = False
        self._bank_name:  str       = ""

        self._setup_ui()

    # ─── Public API ───────────────────────────────────────────────────────────

    def start(self, serial: str):
        """Arranca el wizard para el dispositivo dado, desde el paso 1."""
        self._serial = serial
        self._reset_state()
        self._stack.setCurrentIndex(0)
        self._name_edit.clear()
        self._name_edit.setFocus()

    # ─── UI ───────────────────────────────────────────────────────────────────

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        hdr = QWidget()
        hdr_layout = QVBoxLayout(hdr)
        hdr_layout.setContentsMargins(56, 48, 56, 0)
        title = QLabel("Perfil")
        title.setObjectName("h1")
        hdr_layout.addWidget(title)
        root.addWidget(hdr)

        self._stack = QStackedWidget()
        root.addWidget(self._stack, stretch=1)

        self._stack.addWidget(self._make_step1())
        self._stack.addWidget(self._make_step2())
        self._stack.addWidget(self._make_step3())
        self._stack.addWidget(self._make_step4())
        self._stack.addWidget(self._make_step5())

    # ─── Pasos ────────────────────────────────────────────────────────────────

    def _make_step1(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.setContentsMargins(120, 0, 120, 80)
        outer.setSpacing(0)
        outer.addStretch()

        q = QLabel("Hola, ¿cómo te llamás?")
        q.setObjectName("h2")
        outer.addWidget(q)
        outer.addSpacing(32)

        self._name_edit = QLineEdit()
        self._name_edit.setPlaceholderText("Tu nombre")
        self._name_edit.setFixedHeight(54)
        self._name_edit.setStyleSheet(f"""
            QLineEdit {{
                font-size: 22px;
                border: 2px solid {COLORS['border']};
                border-radius: 12px;
                padding: 4px 20px;
                color: {COLORS['text']};
                background: white;
            }}
            QLineEdit:focus {{ border-color: {COLORS['blue']}; }}
        """)
        self._name_edit.returnPressed.connect(self._step1_next)
        outer.addWidget(self._name_edit)
        outer.addSpacing(24)

        btn = QPushButton("Siguiente →")
        btn.setObjectName("primary_btn")
        btn.clicked.connect(self._step1_next)
        outer.addWidget(btn)
        outer.addStretch()

        return page

    def _make_step2(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(120, 32, 120, 48)
        layout.setSpacing(0)

        q = QLabel("¿Qué apps usás todos los días?")
        q.setObjectName("h2")
        layout.addWidget(q)
        layout.addSpacing(8)

        sub = QLabel("Seleccioná las que no pueden faltar.")
        sub.setObjectName("muted")
        layout.addWidget(sub)
        layout.addSpacing(20)

        self._apps_filter = QLineEdit()
        self._apps_filter.setPlaceholderText("Buscar app...")
        self._apps_filter.setFixedHeight(40)
        self._apps_filter.setStyleSheet(_INPUT_STYLE)
        self._apps_filter.textChanged.connect(self._filter_apps)
        layout.addWidget(self._apps_filter)
        layout.addSpacing(10)

        self._apps_list = QListWidget()
        self._apps_list.setStyleSheet(f"""
            QListWidget {{
                border: 1.5px solid {COLORS['border']};
                border-radius: 10px;
                background: white;
                font-size: 14px;
                color: {COLORS['text']};
                outline: none;
            }}
            QListWidget::item {{ padding: 7px 10px; }}
            QListWidget::item:selected {{
                background: {COLORS['blue_light']};
                color: {COLORS['text']};
            }}
        """)
        for pkg, human_name in WIZARD_APPS:
            item = QListWidgetItem(human_name)
            item.setData(Qt.UserRole, pkg)   # package name real
            # Apps que el engine toca hoy → marcar con "·" en el nombre
            if pkg in HEAVY_APPS_SET:
                item.setText(f"● {human_name}")
            item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
            item.setCheckState(Qt.Unchecked)
            self._apps_list.addItem(item)
        layout.addWidget(self._apps_list, stretch=1)
        layout.addSpacing(20)

        btn = QPushButton("Siguiente →")
        btn.setObjectName("primary_btn")
        btn.clicked.connect(self._step2_next)
        layout.addWidget(btn)

        return page

    def _make_step3(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.setContentsMargins(120, 0, 120, 80)
        outer.setSpacing(0)
        outer.addStretch()

        q = QLabel("¿Cuántas horas por día usás WhatsApp?")
        q.setObjectName("h2")
        outer.addWidget(q)
        outer.addSpacing(8)

        sub = QLabel("Esto ajusta cómo el sistema maneja los procesos en segundo plano.")
        sub.setObjectName("muted")
        sub.setWordWrap(True)
        outer.addWidget(sub)
        outer.addSpacing(40)

        self._wa_value_lbl = QLabel("2 horas")
        self._wa_value_lbl.setAlignment(Qt.AlignCenter)
        self._wa_value_lbl.setStyleSheet(
            f"font-size: 40px; font-weight: 700; color: {COLORS['blue']};"
        )
        outer.addWidget(self._wa_value_lbl)
        outer.addSpacing(20)

        self._wa_slider = QSlider(Qt.Horizontal)
        self._wa_slider.setRange(0, 8)
        self._wa_slider.setValue(2)
        self._wa_slider.setTickInterval(1)
        self._wa_slider.setTickPosition(QSlider.TicksBelow)
        self._wa_slider.setStyleSheet(f"""
            QSlider::groove:horizontal {{
                height: 6px;
                border-radius: 3px;
                background: {COLORS['border']};
            }}
            QSlider::handle:horizontal {{
                width: 24px; height: 24px;
                margin: -9px 0;
                border-radius: 12px;
                background: {COLORS['blue']};
            }}
            QSlider::sub-page:horizontal {{
                background: {COLORS['blue']};
                border-radius: 3px;
                height: 6px;
            }}
        """)
        self._wa_slider.valueChanged.connect(self._on_wa_changed)
        outer.addWidget(self._wa_slider)
        outer.addSpacing(8)

        range_row = QHBoxLayout()
        lbl_min = QLabel("0 h")
        lbl_min.setObjectName("muted")
        lbl_max = QLabel("8 h")
        lbl_max.setObjectName("muted")
        range_row.addWidget(lbl_min)
        range_row.addStretch()
        range_row.addWidget(lbl_max)
        outer.addLayout(range_row)
        outer.addSpacing(40)

        btn = QPushButton("Siguiente →")
        btn.setObjectName("primary_btn")
        btn.clicked.connect(self._step3_next)
        outer.addWidget(btn)
        outer.addStretch()

        return page

    def _make_step4(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.setContentsMargins(120, 0, 120, 80)
        outer.setSpacing(0)
        outer.addStretch()

        q = QLabel("¿Qué tipo de fotos sacás más seguido?")
        q.setObjectName("h2")
        outer.addWidget(q)
        outer.addSpacing(36)

        self._photo_btns: dict[str, QPushButton] = {}
        cards_row = QHBoxLayout()
        cards_row.setSpacing(12)

        for key, label, desc in PHOTO_OPTIONS:
            btn = QPushButton(f"{label}\n{desc}")
            btn.setFixedHeight(88)
            btn.setStyleSheet(_photo_card_style(active=(key == "todo")))
            btn.clicked.connect(lambda _, k=key: self._select_photo(k))
            cards_row.addWidget(btn)
            self._photo_btns[key] = btn

        outer.addLayout(cards_row)
        outer.addSpacing(36)

        btn_next = QPushButton("Siguiente →")
        btn_next.setObjectName("primary_btn")
        btn_next.clicked.connect(self._step4_next)
        outer.addWidget(btn_next)
        outer.addStretch()

        return page

    def _make_step5(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.setContentsMargins(120, 0, 120, 80)
        outer.setSpacing(0)
        outer.addStretch()

        q = QLabel("¿Usás banca móvil?")
        q.setObjectName("h2")
        outer.addWidget(q)
        outer.addSpacing(8)

        sub = QLabel("Ajusta la prioridad de procesos financieros en segundo plano.")
        sub.setObjectName("muted")
        sub.setWordWrap(True)
        outer.addWidget(sub)
        outer.addSpacing(32)

        self._bank_yes = QRadioButton("Sí")
        self._bank_no  = QRadioButton("No")
        self._bank_no.setChecked(True)
        self._bank_yes.setStyleSheet(_RADIO_STYLE)
        self._bank_no.setStyleSheet(_RADIO_STYLE)

        radios = QHBoxLayout()
        radios.setSpacing(32)
        radios.addWidget(self._bank_yes)
        radios.addWidget(self._bank_no)
        radios.addStretch()
        outer.addLayout(radios)
        outer.addSpacing(20)

        self._bank_combo = QComboBox()
        self._bank_combo.addItems(BANK_NAMES)
        self._bank_combo.setFixedHeight(42)
        self._bank_combo.setStyleSheet(f"""
            QComboBox {{
                font-size: 15px;
                border: 1.5px solid {COLORS['border']};
                border-radius: 8px;
                padding: 4px 12px;
                color: {COLORS['text']};
                background: white;
            }}
            QComboBox:focus {{ border-color: {COLORS['blue']}; }}
            QComboBox::drop-down {{ border: none; width: 28px; }}
            QComboBox QAbstractItemView {{
                border: 1px solid {COLORS['border']};
                selection-background-color: {COLORS['blue_light']};
            }}
        """)
        self._bank_combo.setVisible(False)
        self._bank_yes.toggled.connect(self._bank_combo.setVisible)
        outer.addWidget(self._bank_combo)
        outer.addSpacing(40)

        btn = QPushButton("Finalizar")
        btn.setObjectName("primary_btn")
        btn.clicked.connect(self._step5_finish)
        outer.addWidget(btn)
        outer.addStretch()

        return page

    # ─── Handlers de pasos ────────────────────────────────────────────────────

    def _step1_next(self):
        name = self._name_edit.text().strip()
        if not name:
            self._name_edit.setFocus()
            return
        self._name = name
        self._stack.setCurrentIndex(1)

    def _step2_next(self):
        # Guarda package names reales, no strings de display
        self._apps = []
        for i in range(self._apps_list.count()):
            item = self._apps_list.item(i)
            if item.checkState() == Qt.Checked:
                pkg = item.data(Qt.UserRole)
                if pkg:
                    self._apps.append(pkg)
        self._stack.setCurrentIndex(2)

    def _step3_next(self):
        self._wa_hours = self._wa_slider.value()
        self._stack.setCurrentIndex(3)

    def _step4_next(self):
        self._stack.setCurrentIndex(4)

    def _step5_finish(self):
        self._banking   = self._bank_yes.isChecked()
        self._bank_name = self._bank_combo.currentText() if self._banking else ""
        self._persist()

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _filter_apps(self, text: str):
        text = text.lower().strip()
        for i in range(self._apps_list.count()):
            item = self._apps_list.item(i)
            pkg  = item.data(Qt.UserRole) or ""
            # Buscar en nombre visible (sin "● ") y en package name
            display = item.text().lstrip("● ").lower()
            hidden  = bool(text) and text not in display and text not in pkg.lower()
            self._apps_list.setRowHidden(i, hidden)

    def _on_wa_changed(self, value: int):
        self._wa_value_lbl.setText(
            f"{value} hora{'s' if value != 1 else ''}"
        )

    def _select_photo(self, key: str):
        self._photo_type = key
        for k, btn in self._photo_btns.items():
            btn.setStyleSheet(_photo_card_style(active=(k == key)))

    def _reset_state(self):
        self._name       = ""
        self._apps       = []
        self._wa_hours   = 2
        self._photo_type = "todo"
        self._banking    = False
        self._bank_name  = ""
        self._wa_slider.setValue(2)
        self._bank_no.setChecked(True)
        for k, btn in self._photo_btns.items():
            btn.setStyleSheet(_photo_card_style(active=(k == "todo")))
        for i in range(self._apps_list.count()):
            self._apps_list.item(i).setCheckState(Qt.Unchecked)
        self._apps_filter.clear()

    def _persist(self):
        """Guarda el perfil en profile_json y emite profile_saved."""
        device = get_device(self._serial) or {}
        try:
            profile = json.loads(device.get("profile_json") or "{}")
        except (json.JSONDecodeError, TypeError):
            profile = {}

        profile.update({
            "name":       self._name,
            "apps":       self._apps,
            "wa_hours":   self._wa_hours,
            "photo_type": self._photo_type,
            "banking":    self._banking,
            "bank_name":  self._bank_name,
        })

        save_profile(self._serial, profile)
        self.profile_saved.emit(self._serial, self._name)
