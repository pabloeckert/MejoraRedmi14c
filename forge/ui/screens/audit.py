"""
Pantalla de auditoría de apps — lista completa del dispositivo,
clasificada por categoría, con acciones por app y consulta a Haiku.
"""

import os
from collections import defaultdict

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QFrame, QMessageBox, QSizePolicy,
)
from PySide6.QtCore import Qt, Signal, QThread

from forge.ui.theme import COLORS
from forge.core.app_scanner import (
    AppInfo, scan_packages, classify_batch_with_haiku,
    disable_package, CATEGORY_ORDER,
)


# ─── Workers ─────────────────────────────────────────────────────────────────

class ScanWorker(QThread):
    finished = Signal(list)
    error = Signal(str)

    def __init__(self, serial: str, parent=None):
        super().__init__(parent)
        self._serial = serial

    def run(self):
        try:
            self.finished.emit(scan_packages(self._serial))
        except Exception as exc:
            self.error.emit(str(exc))


class HaikuWorker(QThread):
    chunk_done = Signal(dict)   # {pkg: description}
    finished = Signal()
    error = Signal(str)

    def __init__(self, apps: list, api_key: str, parent=None):
        super().__init__(parent)
        self._apps = apps
        self._api_key = api_key

    def run(self):
        pkgs = [a.package for a in self._apps]
        for i in range(0, len(pkgs), 20):
            batch = pkgs[i : i + 20]
            try:
                results = classify_batch_with_haiku(batch, self._api_key)
                if results:
                    self.chunk_done.emit(results)
            except Exception as exc:
                self.error.emit(str(exc))
                return
        self.finished.emit()


class ExecuteWorker(QThread):
    progress = Signal(str, bool)   # pkg, success
    finished = Signal(int, int)    # ok_count, fail_count

    def __init__(self, serial: str, apps: list, parent=None):
        super().__init__(parent)
        self._serial = serial
        self._apps = apps

    def run(self):
        ok = fail = 0
        for app in self._apps:
            success, _ = disable_package(self._serial, app.package)
            self.progress.emit(app.package, success)
            if success:
                ok += 1
            else:
                fail += 1
        self.finished.emit(ok, fail)


# ─── AppRow ───────────────────────────────────────────────────────────────────

class AppRow(QFrame):
    action_changed = Signal(str, str)   # pkg, action

    _BTN_ACTIVE_KEEP = (
        f"background:{COLORS['success']}; color:white; border:none;"
        "border-radius:4px; font-size:12px; font-weight:600; padding:0 8px;"
    )
    _BTN_ACTIVE_REMOVE = (
        f"background:{COLORS['red']}; color:white; border:none;"
        "border-radius:4px; font-size:12px; font-weight:600; padding:0 8px;"
    )
    _BTN_ACTIVE_ASK = (
        f"background:{COLORS['yellow']}; color:#333; border:none;"
        "border-radius:4px; font-size:12px; font-weight:600; padding:0 8px;"
    )
    _BTN_IDLE = (
        f"background:{COLORS['surface']}; color:{COLORS['text_muted']};"
        f"border:1px solid {COLORS['border']}; border-radius:4px; font-size:12px; padding:0 8px;"
    )

    def __init__(self, app: AppInfo, parent=None):
        super().__init__(parent)
        self.setObjectName("app_row")
        self._app = app
        self._btns: dict[str, QPushButton] = {}
        self._setup_ui()

    def _setup_ui(self):
        self.setStyleSheet(
            f"QFrame#app_row {{ border-bottom: 1px solid {COLORS['border']}; background: white; }}"
            f"QFrame#app_row:hover {{ background: {COLORS['surface']}; }}"
        )

        row = QHBoxLayout(self)
        row.setContentsMargins(12, 8, 12, 8)
        row.setSpacing(10)

        # Info column
        info = QVBoxLayout()
        info.setSpacing(1)

        name_lbl = QLabel(self._app.name)
        name_lbl.setStyleSheet(f"font-size:13px; font-weight:600; color:{COLORS['text']};")
        info.addWidget(name_lbl)

        pkg_lbl = QLabel(self._app.package)
        pkg_lbl.setStyleSheet(f"font-size:11px; color:{COLORS['text_muted']};")
        pkg_lbl.setTextInteractionFlags(Qt.TextSelectableByMouse)
        info.addWidget(pkg_lbl)

        self._desc_lbl = QLabel("")
        self._desc_lbl.setStyleSheet(
            f"font-size:11px; color:{COLORS['text_muted']}; font-style:italic;"
        )
        self._desc_lbl.setWordWrap(True)
        self._desc_lbl.hide()
        info.addWidget(self._desc_lbl)

        if self._app.haiku_description:
            self._desc_lbl.setText(self._app.haiku_description)
            self._desc_lbl.show()

        row.addLayout(info, stretch=1)

        # Status badge
        if self._app.is_protected:
            b = QLabel("protegida")
            b.setStyleSheet(
                f"font-size:10px; color:{COLORS['blue']}; padding:2px 6px;"
                f"border:1px solid {COLORS['blue']}; border-radius:3px;"
            )
            row.addWidget(b)
        elif self._app.is_disabled:
            b = QLabel("desactivada")
            b.setStyleSheet(
                "font-size:10px; color:#888; padding:2px 6px;"
                "border:1px solid #ccc; border-radius:3px;"
            )
            row.addWidget(b)

        # Action buttons
        if not self._app.is_protected:
            for action, label in [("keep", "Conservar"), ("remove", "Quitar"), ("ask", "?")]:
                btn = QPushButton(label)
                btn.setFixedHeight(28)
                btn.setMinimumWidth(72 if action != "ask" else 32)
                btn.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Fixed)
                btn.clicked.connect(lambda _, a=action: self._set_action(a))
                self._btns[action] = btn
                row.addWidget(btn)
            self._refresh_styles()

    def _set_action(self, action: str):
        self._app.action = action
        self._refresh_styles()
        self.action_changed.emit(self._app.package, action)

    def _refresh_styles(self):
        style_map = {
            "keep":   self._BTN_ACTIVE_KEEP,
            "remove": self._BTN_ACTIVE_REMOVE,
            "ask":    self._BTN_ACTIVE_ASK,
        }
        for action, btn in self._btns.items():
            btn.setStyleSheet(
                style_map[action] if action == self._app.action else self._BTN_IDLE
            )

    def update_description(self, desc: str):
        self._desc_lbl.setText(desc)
        self._desc_lbl.show()

    def set_executed(self, success: bool):
        for btn in self._btns.values():
            btn.setEnabled(False)
        if success:
            self._desc_lbl.setText("✓ Desactivada correctamente")
            self._desc_lbl.setStyleSheet(f"font-size:11px; color:{COLORS['success']}; font-weight:600;")
        else:
            self._desc_lbl.setText("✗ Error al desactivar")
            self._desc_lbl.setStyleSheet(f"font-size:11px; color:{COLORS['red']}; font-weight:600;")
        self._desc_lbl.show()


# ─── AuditScreen ──────────────────────────────────────────────────────────────

class AuditScreen(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._serial: str | None = None
        self._apps: list[AppInfo] = []
        self._app_rows: dict[str, AppRow] = {}
        self._scan_worker: ScanWorker | None = None
        self._haiku_worker: HaikuWorker | None = None
        self._exec_worker: ExecuteWorker | None = None
        self._setup_ui()
        self._set_state("no_device")

    # ── Public slots ────────────────────────────────────────────────────────

    def on_device_connected(self, device):
        self._serial = device.serial
        if not self._apps:
            self._set_state("idle")

    def on_device_disconnected(self, serial: str):
        for worker in (self._scan_worker, self._haiku_worker, self._exec_worker):
            if worker and worker.isRunning():
                worker.quit()
                worker.wait(3000)
        self._serial = None
        self._apps = []
        self._app_rows = {}
        self._clear_list()
        self._set_state("no_device")

    # ── UI construction ─────────────────────────────────────────────────────

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 16)
        layout.setSpacing(12)

        # Title
        title = QLabel("Auditoría de Apps")
        title.setStyleSheet(f"font-size:20px; font-weight:700; color:{COLORS['text']};")
        layout.addWidget(title)

        # Status line
        self._status_lbl = QLabel("")
        self._status_lbl.setStyleSheet(f"font-size:13px; color:{COLORS['text_muted']};")
        layout.addWidget(self._status_lbl)

        # Buttons
        btn_row = QHBoxLayout()
        btn_row.setSpacing(8)

        self._scan_btn = QPushButton("Escanear apps")
        self._scan_btn.setObjectName("primary_btn")
        self._scan_btn.setFixedHeight(36)
        self._scan_btn.clicked.connect(self._start_scan)
        btn_row.addWidget(self._scan_btn)

        self._haiku_btn = QPushButton("Consultar con IA")
        self._haiku_btn.setObjectName("secondary_btn")
        self._haiku_btn.setFixedHeight(36)
        self._haiku_btn.clicked.connect(self._start_haiku)
        btn_row.addWidget(self._haiku_btn)

        self._exec_btn = QPushButton("Confirmar limpieza (0)")
        self._exec_btn.setObjectName("danger_btn")
        self._exec_btn.setFixedHeight(36)
        self._exec_btn.clicked.connect(self._start_execute)
        btn_row.addWidget(self._exec_btn)

        btn_row.addStretch()
        layout.addLayout(btn_row)

        # Scroll area
        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setFrameShape(QFrame.NoFrame)

        self._list_widget = QWidget()
        self._list_layout = QVBoxLayout(self._list_widget)
        self._list_layout.setContentsMargins(0, 0, 0, 0)
        self._list_layout.setSpacing(0)
        self._list_layout.addStretch()

        self._scroll.setWidget(self._list_widget)
        layout.addWidget(self._scroll, stretch=1)

    # ── State machine ───────────────────────────────────────────────────────

    def _set_state(self, state: str):
        has_device = state != "no_device"
        is_busy = state in ("scanning", "consulting", "executing")

        self._scan_btn.setEnabled(has_device and not is_busy)
        self._haiku_btn.setEnabled(False)
        self._exec_btn.setEnabled(False)

        if state == "no_device":
            self._scan_btn.setText("Escanear apps")
            self._status_lbl.setText("Conectá un dispositivo para empezar.")
        elif state == "idle":
            self._scan_btn.setText("Escanear apps")
            self._status_lbl.setText("Dispositivo listo — escaneá para ver las apps instaladas.")
        elif state == "scanning":
            self._scan_btn.setText("Escaneando...")
            self._status_lbl.setText("Leyendo apps del dispositivo...")
        elif state == "ready":
            self._scan_btn.setText("Re-escanear")
            self._update_haiku_btn()
            self._update_exec_btn()
        elif state == "consulting":
            self._haiku_btn.setText("Consultando IA...")
        elif state == "executing":
            self._exec_btn.setText("Ejecutando...")

    # ── Scan ────────────────────────────────────────────────────────────────

    def _start_scan(self):
        if not self._serial:
            return
        self._set_state("scanning")
        self._clear_list()
        self._apps = []
        self._app_rows = {}
        self._scan_worker = ScanWorker(self._serial, parent=self)
        self._scan_worker.finished.connect(self._on_scan_done)
        self._scan_worker.error.connect(self._on_scan_error)
        self._scan_worker.start()

    def _on_scan_done(self, apps: list):
        self._apps = apps
        self._render_list()
        total = len(apps)
        disabled = sum(1 for a in apps if a.is_disabled)
        unknown = sum(1 for a in apps if a.source == "unknown")
        self._status_lbl.setText(
            f"{total} apps encontradas · {disabled} desactivadas · {unknown} desconocidas"
        )
        self._set_state("ready")

    def _on_scan_error(self, msg: str):
        self._set_state("idle")
        self._status_lbl.setText(f"Error al escanear: {msg[:120]}")

    # ── Render ──────────────────────────────────────────────────────────────

    def _clear_list(self):
        while self._list_layout.count() > 0:
            item = self._list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._list_layout.addStretch()

    def _render_list(self):
        self._clear_list()
        self._app_rows.clear()

        groups: dict[str, list[AppInfo]] = defaultdict(list)
        for app in self._apps:
            groups[app.category].append(app)

        ordered_cats = [c for c in CATEGORY_ORDER if c in groups]
        for cat in groups:
            if cat not in ordered_cats:
                ordered_cats.append(cat)

        insert_idx = 0
        for cat in ordered_cats:
            apps_in_cat = sorted(groups[cat], key=lambda a: a.name.lower())

            header = QLabel(f"  {cat.upper()}  ({len(apps_in_cat)})")
            header.setStyleSheet(
                f"font-size:11px; font-weight:700; color:{COLORS['text_muted']};"
                f"background:{COLORS['surface']}; padding:8px 12px 6px 12px;"
                f"border-bottom:1px solid {COLORS['border']};"
            )
            self._list_layout.insertWidget(insert_idx, header)
            insert_idx += 1

            for app in apps_in_cat:
                row = AppRow(app)
                row.action_changed.connect(self._on_action_changed)
                self._app_rows[app.package] = row
                self._list_layout.insertWidget(insert_idx, row)
                insert_idx += 1

    # ── Action buttons state ─────────────────────────────────────────────────

    def _on_action_changed(self, _pkg: str, _action: str):
        self._update_exec_btn()

    def _update_exec_btn(self):
        count = sum(
            1 for a in self._apps if a.action == "remove" and not a.is_protected
        )
        self._exec_btn.setText(f"Confirmar limpieza ({count})")
        self._exec_btn.setEnabled(count > 0)

    def _update_haiku_btn(self):
        unknown = sum(
            1 for a in self._apps if a.source == "unknown" and not a.haiku_description
        )
        self._haiku_btn.setEnabled(unknown > 0)
        self._haiku_btn.setText(
            f"Consultar con IA ({unknown})" if unknown > 0 else "Consultar con IA"
        )

    # ── Haiku ────────────────────────────────────────────────────────────────

    def _start_haiku(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            QMessageBox.warning(
                self, "API Key no configurada",
                "Configurá la variable de entorno ANTHROPIC_API_KEY para usar esta función.\n\n"
                "En Windows: setx ANTHROPIC_API_KEY \"sk-ant-...\"",
            )
            return

        unknown = [
            a for a in self._apps if a.source == "unknown" and not a.haiku_description
        ]
        if not unknown:
            return

        self._set_state("consulting")
        self._haiku_worker = HaikuWorker(unknown, api_key, parent=self)
        self._haiku_worker.chunk_done.connect(self._on_haiku_chunk)
        self._haiku_worker.finished.connect(self._on_haiku_finished)
        self._haiku_worker.error.connect(self._on_haiku_error)
        self._haiku_worker.start()

    def _on_haiku_chunk(self, results: dict):
        for app in self._apps:
            if app.package in results:
                app.haiku_description = results[app.package]
                if app.package in self._app_rows:
                    self._app_rows[app.package].update_description(results[app.package])

    def _on_haiku_finished(self):
        self._set_state("ready")

    def _on_haiku_error(self, msg: str):
        self._set_state("ready")
        self._status_lbl.setText(f"Error IA: {msg[:100]}")

    # ── Execute ──────────────────────────────────────────────────────────────

    def _start_execute(self):
        to_remove = [
            a for a in self._apps if a.action == "remove" and not a.is_protected
        ]
        if not to_remove:
            return

        preview = "\n".join(f"  • {a.name}" for a in to_remove[:8])
        if len(to_remove) > 8:
            preview += f"\n  ... y {len(to_remove) - 8} más"

        reply = QMessageBox.question(
            self,
            "Confirmar limpieza",
            (
                f"¿Desactivar {len(to_remove)} apps?\n\n{preview}\n\n"
                "Esta acción es reversible:\n"
                "  adb shell pm install-existing --user 0 <package>"
            ),
            QMessageBox.Yes | QMessageBox.No,
        )
        if reply != QMessageBox.Yes:
            return

        self._set_state("executing")
        self._status_lbl.setText(f"Desactivando {len(to_remove)} apps...")

        self._exec_worker = ExecuteWorker(self._serial, to_remove, parent=self)
        self._exec_worker.progress.connect(self._on_exec_progress)
        self._exec_worker.finished.connect(self._on_exec_done)
        self._exec_worker.start()

    def _on_exec_progress(self, pkg: str, success: bool):
        if pkg in self._app_rows:
            self._app_rows[pkg].set_executed(success)

    def _on_exec_done(self, ok_count: int, fail_count: int):
        self._status_lbl.setText(
            f"Limpieza completada: {ok_count} desactivadas · {fail_count} errores."
        )
        self._set_state("ready")
