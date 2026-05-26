from __future__ import annotations

from datetime import datetime

from PySide6.QtCore import Qt, QTimer, Signal, QThread
from PySide6.QtGui import QTextCursor
from PySide6.QtWidgets import (
    QFrame, QHBoxLayout, QLabel, QMessageBox, QProgressBar,
    QPushButton, QSizePolicy, QTextEdit, QVBoxLayout, QWidget,
)

from forge.core.adb_bridge import run_cli_script, shell_available
from forge.core.log_parser import MsgKind, parse_line
from forge.db.database import finish_run, start_run
from forge.ui.theme import COLORS

# ─── Constantes de diseño ─────────────────────────────────────────────────────

ESTIMATED_TOTAL = 80   # operaciones humanas esperadas en una optimización completa

PHASE_KEYS   = ["suelo",              "fluidez",                    "whatsapp",        "camara"]
PHASE_LABELS = ["① Suelo",            "② Fluidez",                  "③ WhatsApp",       "④ Cámara"]
PHASE_NAMES  = ["Limpiando lo que pesa", "Ajustando el motor del sistema", "Configurando WhatsApp", "Optimizando la cámara"]

_PILL_BASE = """
    QLabel {{
        border-radius: 16px;
        padding: 6px 18px;
        font-size: 13px;
        font-weight: {weight};
        color: {fg};
        background: {bg};
        border: {border};
    }}
"""
_PILL_INACTIVE = _PILL_BASE.format(
    weight=500, fg=COLORS["text_muted"],
    bg="transparent", border=f"1.5px solid {COLORS['border']}",
)
_PILL_ACTIVE = _PILL_BASE.format(
    weight=700, fg="white",
    bg=COLORS["blue"], border="none",
)


# ─── Worker ───────────────────────────────────────────────────────────────────

class _ScriptWorker(QThread):
    line_received = Signal(str)
    finished      = Signal(int)

    def __init__(self, serial: str, mode_flag: str, parent=None):
        super().__init__(parent)
        self._serial    = serial
        self._mode_flag = mode_flag
        self._proc_ref: list = []

    def run(self):
        exit_code = 0
        try:
            gen = run_cli_script(self._mode_flag, self._serial, proc_ref=self._proc_ref)
            try:
                while True:
                    line = next(gen)
                    self.line_received.emit(line)
            except StopIteration as e:
                exit_code = e.value or 0
        except FileNotFoundError as e:
            self.line_received.emit(f"ERROR: {e}")
            exit_code = 1
        except Exception as e:
            self.line_received.emit(f"ERROR inesperado: {e}")
            exit_code = 1
        self.finished.emit(exit_code)

    def stop_process(self):
        """Termina el proceso bash hijo de forma limpia antes de parar el thread."""
        if self._proc_ref:
            self._proc_ref[0].terminate()


# ─── Fila del feed ────────────────────────────────────────────────────────────

class _ActivityRow(QWidget):
    """Fila: ● Quitando Facebook  [×3]"""

    def __init__(self, message: str, parent=None):
        super().__init__(parent)
        self._count = 1

        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 6, 0, 6)
        layout.setSpacing(10)

        dot = QLabel("●")
        dot.setFixedWidth(14)
        dot.setStyleSheet(f"color: {COLORS['success']}; font-size: 11px;")
        layout.addWidget(dot)

        self._msg = QLabel(message)
        self._msg.setStyleSheet(
            f"font-size: 14px; color: {COLORS['text']}; font-weight: 450;"
        )
        layout.addWidget(self._msg)
        layout.addStretch()

        self._count_lbl = QLabel("")
        self._count_lbl.setStyleSheet(
            f"font-size: 12px; color: {COLORS['text_muted']};"
        )
        self._count_lbl.setVisible(False)
        layout.addWidget(self._count_lbl)

    @property
    def message(self) -> str:
        return self._msg.text()

    def increment(self):
        self._count += 1
        self._count_lbl.setText(f"×{self._count}")
        self._count_lbl.setVisible(True)


# ─── Feed de actividad (máx 4 ítems, más nuevo arriba) ───────────────────────

class _ActivityFeed(QWidget):
    MAX_ITEMS = 4

    def __init__(self, parent=None):
        super().__init__(parent)
        self._layout = QVBoxLayout(self)
        self._layout.setContentsMargins(0, 0, 0, 0)
        self._layout.setSpacing(0)
        self._layout.addStretch()   # empuja los ítems hacia arriba
        self._rows: list[_ActivityRow] = []

    def add_message(self, message: str):
        # Deduplicar consecutivos
        if self._rows and self._rows[0].message == message:
            self._rows[0].increment()
            return

        row = _ActivityRow(message, self)
        self._rows.insert(0, row)
        # Insertar ANTES del stretch (índice 0 → aparece arriba)
        self._layout.insertWidget(0, row)

        # Sacar el más viejo si superamos el límite
        while len(self._rows) > self.MAX_ITEMS:
            old = self._rows.pop()
            self._layout.removeWidget(old)
            old.deleteLater()

    def clear(self):
        for row in self._rows:
            self._layout.removeWidget(row)
            row.deleteLater()
        self._rows = []


# ─── Pastillas de fase ────────────────────────────────────────────────────────

class _PhasePills(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)

        self._pills: dict[str, QLabel] = {}
        for key, label in zip(PHASE_KEYS, PHASE_LABELS):
            pill = QLabel(label)
            pill.setAlignment(Qt.AlignCenter)
            pill.setStyleSheet(_PILL_INACTIVE)
            layout.addWidget(pill)
            self._pills[key] = pill

        layout.addStretch()

    def set_active(self, phase_key: str):
        for key, pill in self._pills.items():
            pill.setStyleSheet(_PILL_ACTIVE if key == phase_key else _PILL_INACTIVE)

    def reset(self):
        for pill in self._pills.values():
            pill.setStyleSheet(_PILL_INACTIVE)


# ─── Log colapsable ───────────────────────────────────────────────────────────

class _CollapsibleLog(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._expanded    = False
        self._error_count = 0
        self._btn_color   = COLORS["text_muted"]

        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        self._toggle_btn = QPushButton("▶  Ver detalles técnicos")
        self._toggle_btn.clicked.connect(self._toggle)
        root.addWidget(self._toggle_btn)

        self._log = QTextEdit()
        self._log.setReadOnly(True)
        self._log.setVisible(False)
        self._log.setMaximumHeight(220)
        self._log.setStyleSheet(f"""
            QTextEdit {{
                background-color: {COLORS['terminal_bg']};
                color: #AAAAAA;
                font-family: 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
                font-size: 12px;
                border-radius: 8px;
                padding: 12px 14px;
                border: none;
            }}
        """)
        root.addWidget(self._log)

    def append(self, raw_line: str, is_error: bool = False):
        if is_error:
            self._error_count += 1
        self._log.append(raw_line)
        self._log.moveCursor(QTextCursor.End)
        self._update_label()

    def _update_label(self):
        arrow = "▼" if self._expanded else "▶"
        if self._error_count == 0:
            label = f"{arrow}  Ver detalles técnicos"
            self._btn_color = COLORS["text_muted"]
        elif self._error_count == 1:
            label = f"{arrow}  Ver detalles técnicos  ·  1 error"
            self._btn_color = COLORS["red"]
        else:
            label = f"{arrow}  Ver detalles técnicos  ·  {self._error_count} errores"
            self._btn_color = COLORS["red"]

        self._toggle_btn.setText(label)
        self._toggle_btn.setStyleSheet(f"""
            QPushButton {{
                text-align: left;
                padding: 10px 4px;
                border: none;
                background: transparent;
                color: {self._btn_color};
                font-size: 13px;
                font-weight: 500;
            }}
            QPushButton:hover {{ color: {COLORS['text']}; }}
        """)

    def _toggle(self):
        self._expanded = not self._expanded
        self._log.setVisible(self._expanded)
        self._update_label()

    def clear(self):
        self._expanded    = False
        self._error_count = 0
        self._log.clear()
        self._log.setVisible(False)
        self._update_label()


# ─── Pantalla de ejecución ────────────────────────────────────────────────────

class ExecutionScreen(QWidget):
    done = Signal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._run_id: int | None = None
        self._serial             = ""
        self._name               = ""
        self._worker: _ScriptWorker | None = None
        self._raw_lines: list[str] = []
        self._human_count          = 0
        self._current_phase        = ""
        self._start_time: datetime | None = None

        self._timer = QTimer(self)
        self._timer.setInterval(1000)
        self._timer.timeout.connect(self._tick)

        self._setup_ui()

    # ─── Layout ──────────────────────────────────────────────────────────────

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(56, 36, 56, 28)
        root.setSpacing(14)

        # 1 ── Header: nombre + tiempo
        hdr = QHBoxLayout()
        self._title_lbl = QLabel("Optimizando tu teléfono")
        self._title_lbl.setObjectName("h1")
        hdr.addWidget(self._title_lbl)
        hdr.addStretch()
        self._elapsed_lbl = QLabel("")
        self._elapsed_lbl.setStyleSheet(
            f"font-size: 13px; color: {COLORS['text_muted']}; font-weight: 500;"
        )
        hdr.addWidget(self._elapsed_lbl)
        root.addLayout(hdr)

        # 2 ── Nombre de fase (lenguaje humano)
        self._phase_lbl = QLabel("Preparando la optimización...")
        self._phase_lbl.setStyleSheet(
            f"font-size: 18px; font-weight: 600; color: {COLORS['text']};"
        )
        root.addWidget(self._phase_lbl)

        # 3 ── Barra de progreso + contador X de Y
        prog_row = QHBoxLayout()
        prog_row.setSpacing(12)

        self._progress = QProgressBar()
        self._progress.setRange(0, 100)
        self._progress.setValue(0)
        self._progress.setTextVisible(False)
        self._progress.setFixedHeight(8)
        self._progress.setStyleSheet(f"""
            QProgressBar {{
                background-color: {COLORS['border']};
                border-radius: 4px;
                border: none;
            }}
            QProgressBar::chunk {{
                background-color: {COLORS['blue']};
                border-radius: 4px;
            }}
        """)
        prog_row.addWidget(self._progress, stretch=1)

        self._progress_lbl = QLabel(f"0 de {ESTIMATED_TOTAL}")
        self._progress_lbl.setStyleSheet(
            f"font-size: 13px; color: {COLORS['text_muted']}; min-width: 80px;"
        )
        self._progress_lbl.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        prog_row.addWidget(self._progress_lbl)
        root.addLayout(prog_row)

        # 4 ── Feed de actividad (máx 4, más nuevo arriba)
        feed_frame = QFrame()
        feed_frame.setObjectName("card")
        feed_layout = QVBoxLayout(feed_frame)
        feed_layout.setContentsMargins(20, 16, 20, 16)
        feed_layout.setSpacing(0)
        self._feed = _ActivityFeed()
        self._feed.setMinimumHeight(4 * 44)   # exactamente 4 filas visibles
        self._feed.setMaximumHeight(4 * 44)
        feed_layout.addWidget(self._feed)
        root.addWidget(feed_frame, stretch=1)

        # 5 ── Pastillas de fase
        self._pills = _PhasePills()
        root.addWidget(self._pills)

        # 6 ── Log colapsable
        self._log = _CollapsibleLog()
        root.addWidget(self._log)

        # 7 ── Botón detener
        actions = QHBoxLayout()
        self._stop_btn = QPushButton("Detener")
        self._stop_btn.setObjectName("danger_btn")
        self._stop_btn.setEnabled(False)
        self._stop_btn.clicked.connect(self._on_stop)
        actions.addWidget(self._stop_btn)
        actions.addStretch()
        root.addLayout(actions)

    # ─── Control de ejecución ─────────────────────────────────────────────────

    def start_execution(self, serial: str, mode_flag: str, name: str = ""):
        if self._worker and self._worker.isRunning():
            return

        if not shell_available():
            self._log.append(
                "ERROR: Se necesita WSL o Git for Windows. "
                "Instalá Git desde https://git-scm.com",
                is_error=True,
            )
            self._phase_lbl.setText("No se puede conectar con el teléfono")
            return

        self._serial      = serial
        self._name        = name
        self._raw_lines   = []
        self._human_count = 0
        self._current_phase = ""

        # Reset UI
        self._feed.clear()
        self._log.clear()
        self._pills.reset()
        self._progress.setValue(0)
        self._progress_lbl.setText(f"0 de {ESTIMATED_TOTAL}")
        self._phase_lbl.setText("Preparando la optimización...")

        # Título con nombre (sin género)
        if name:
            self._title_lbl.setText(f"Optimizando para {name}")
        else:
            self._title_lbl.setText("Optimizando tu teléfono")

        # Timer
        self._start_time = datetime.now()
        self._elapsed_lbl.setText("00:00 transcurridos")
        self._timer.start()

        # DB
        self._run_id = start_run(serial, "full", mode_flag)

        self._stop_btn.setEnabled(True)

        self._worker = _ScriptWorker(serial, mode_flag, self)
        self._worker.line_received.connect(self._on_line)
        self._worker.finished.connect(self._on_finished)
        self._worker.start()

    def _on_stop(self):
        dlg = QMessageBox(self)
        dlg.setWindowTitle("Detener optimización")
        dlg.setText("¿Detener la optimización?")
        dlg.setInformativeText("Los cambios aplicados hasta ahora se mantienen.")
        continuar = dlg.addButton("Continuar", QMessageBox.RejectRole)
        detener   = dlg.addButton("Detener de todas formas", QMessageBox.DestructiveRole)
        dlg.setDefaultButton(continuar)
        dlg.exec()
        if dlg.clickedButton() is not detener:
            return
        if self._worker and self._worker.isRunning():
            self._worker.stop_process()   # termina bash hijo
            self._worker.wait(5000)       # espera que el thread limpie
            if self._worker.isRunning():  # solo si no terminó solo
                self._worker.terminate()
        self._timer.stop()
        self._stop_btn.setEnabled(False)
        self._phase_lbl.setText("Optimización detenida")
        if self._run_id is not None:
            finish_run(self._run_id, -1, "\n".join(self._raw_lines), "stopped")

    def _on_line(self, raw: str):
        self._raw_lines.append(raw)

        parsed = parse_line(raw)

        if parsed.kind == MsgKind.PHASE:
            self._set_phase(parsed.message)

        elif parsed.kind == MsgKind.HUMAN:
            self._human_count += 1
            self._feed.add_message(parsed.message)
            pct = min(int(self._human_count / ESTIMATED_TOTAL * 100), 99)
            self._progress.setValue(pct)
            self._progress_lbl.setText(
                f"{self._human_count} de {ESTIMATED_TOTAL}"
            )

        elif parsed.kind == MsgKind.ERROR:
            self._log.append(raw, is_error=True)

        elif parsed.kind == MsgKind.TECH:
            self._log.append(raw, is_error=False)

        # SKIP → no hace nada

    def _on_finished(self, exit_code: int):
        self._timer.stop()
        self._stop_btn.setEnabled(False)
        output = "\n".join(self._raw_lines)

        if exit_code == 0:
            self._progress.setValue(100)
            self._progress_lbl.setText(f"{self._human_count} de {self._human_count}")
            if self._name:
                self._phase_lbl.setText(
                    f"Listo, {self._name}. Tu teléfono está más limpio."
                )
            else:
                self._phase_lbl.setText("Listo. Tu teléfono está más limpio.")
            status = "completed"
        else:
            self._phase_lbl.setText(
                "Algo no salió bien. Abrí los detalles técnicos para ver qué pasó."
            )
            status = "failed"

        if self._run_id is not None:
            finish_run(self._run_id, exit_code, output, status)

        self.done.emit(exit_code)

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _set_phase(self, phase_key: str):
        if phase_key == self._current_phase:
            return
        self._current_phase = phase_key
        idx = PHASE_KEYS.index(phase_key) if phase_key in PHASE_KEYS else -1
        if idx >= 0:
            self._phase_lbl.setText(PHASE_NAMES[idx])
            self._pills.set_active(phase_key)

    def _tick(self):
        if self._start_time is None:
            return
        delta = datetime.now() - self._start_time
        total = int(delta.total_seconds())
        mins, secs = divmod(total, 60)
        self._elapsed_lbl.setText(f"{mins:02d}:{secs:02d} transcurridos")
