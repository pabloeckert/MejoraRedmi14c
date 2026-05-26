from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QPushButton, QLabel, QStackedWidget, QSizePolicy,
)
from PySide6.QtCore import Qt
from forge.ui.theme import STYLESHEET, COLORS
from forge.ui.screens.home      import HomeScreen
from forge.ui.screens.profile   import ProfileScreen
from forge.ui.screens.plan      import PlanScreen
from forge.ui.screens.execution import ExecutionScreen
from forge.ui.screens.history   import HistoryScreen
from forge.ui.screens.settings  import SettingsScreen
from forge.ui.screens.audit     import AuditScreen
from forge.core.device_watcher  import DeviceWatcher
from forge.core.ota_watcher     import OTAWorker, TweakScanWorker, TweakStatus
from forge.db.database          import upsert_device, get_display_name

NAV = [
    ("Inicio",     "⌂",  HomeScreen),
    ("Perfil",     "◉",  ProfileScreen),
    ("Plan",       "▤",  PlanScreen),
    ("Ejecución",  "▶",  ExecutionScreen),
    ("Histórico",  "◈",  HistoryScreen),
    ("Auditoría",  "⊛",  AuditScreen),
    ("Config",     "⚙",  SettingsScreen),
]

# índices de pantalla
IDX_HOME      = 0
IDX_PROFILE   = 1
IDX_PLAN      = 2
IDX_EXECUTION = 3
IDX_HISTORY   = 4
IDX_AUDIT     = 5
IDX_SETTINGS  = 6


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Redmi Forge")
        self.setMinimumSize(1060, 680)
        self.resize(1200, 760)
        self.setStyleSheet(STYLESHEET)

        self._build_ui()
        self._wire_signals()
        self._start_watcher()
        self._nav_to(IDX_HOME)

    # ─── Construcción de UI ───────────────────────────────────────────────────

    def _build_ui(self):
        central = QWidget()
        central.setObjectName("main_widget")
        self.setCentralWidget(central)

        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        body = QHBoxLayout()
        body.setContentsMargins(0, 0, 0, 0)
        body.setSpacing(0)
        root.addLayout(body, stretch=1)

        # Sidebar
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(210)
        sb_layout = QVBoxLayout(sidebar)
        sb_layout.setContentsMargins(10, 20, 10, 20)
        sb_layout.setSpacing(2)

        brand = QLabel("Redmi Forge")
        brand.setStyleSheet(
            f"font-size: 15px; font-weight: 700; color: {COLORS['text']};"
            "padding: 4px 8px 20px 8px;"
        )
        sb_layout.addWidget(brand)

        self._nav_btns: list[QPushButton] = []
        self._stack = QStackedWidget()
        self._screens: list[QWidget] = []

        for label, icon, Cls in NAV:
            btn = QPushButton(f"  {icon}   {label}")
            btn.setObjectName("nav_btn")
            btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
            btn.setFixedHeight(42)
            idx = len(self._nav_btns)
            btn.clicked.connect(lambda _, i=idx: self._nav_to(i))
            sb_layout.addWidget(btn)
            self._nav_btns.append(btn)

            screen = Cls()
            self._screens.append(screen)
            self._stack.addWidget(screen)

        sb_layout.addStretch()

        ver = QLabel("v0.1.0")
        ver.setStyleSheet(
            f"font-size: 11px; color: {COLORS['text_muted']}; padding: 0 8px;"
        )
        sb_layout.addWidget(ver)

        body.addWidget(sidebar)
        body.addWidget(self._stack, stretch=1)

        # Status bar
        self._status_bar = QWidget()
        self._status_bar.setObjectName("statusbar_widget")
        sb_row = QHBoxLayout(self._status_bar)
        sb_row.setContentsMargins(0, 0, 0, 0)
        self._status_lbl = QLabel("Esperando dispositivo...")
        self._status_lbl.setObjectName("status_idle")
        sb_row.addWidget(self._status_lbl)
        sb_row.addStretch()
        root.addWidget(self._status_bar)

    # ─── Conexión de señales ──────────────────────────────────────────────────

    def _wire_signals(self):
        home:    HomeScreen      = self._screens[IDX_HOME]
        profile: ProfileScreen   = self._screens[IDX_PROFILE]
        plan:    PlanScreen      = self._screens[IDX_PLAN]
        exec_:   ExecutionScreen = self._screens[IDX_EXECUTION]

        # Home → Plan
        home.optimize_requested.connect(self._on_optimize_requested)

        # Perfil guardado → Home
        profile.profile_saved.connect(self._on_profile_saved)

        # Plan → Ejecución / cancelar
        plan.confirmed.connect(self._on_plan_confirmed)
        plan.cancelled.connect(lambda: self._nav_to(IDX_HOME))

        # Ejecución → terminó
        exec_.done.connect(self._on_execution_done)

    # ─── Device watcher ───────────────────────────────────────────────────────

    def _start_watcher(self):
        self._watcher = DeviceWatcher(self)

        home:    HomeScreen    = self._screens[IDX_HOME]
        history: HistoryScreen = self._screens[IDX_HISTORY]
        audit:   AuditScreen   = self._screens[IDX_AUDIT]

        self._watcher.device_connected.connect(home.on_device_connected)
        self._watcher.device_connected.connect(history.on_device_connected)
        self._watcher.device_connected.connect(audit.on_device_connected)
        self._watcher.device_connected.connect(self._on_device_connected)

        self._watcher.device_disconnected.connect(home.on_device_disconnected)
        self._watcher.device_disconnected.connect(history.on_device_disconnected)
        self._watcher.device_disconnected.connect(audit.on_device_disconnected)
        self._watcher.device_disconnected.connect(self._on_device_disconnected)

        self._watcher.adb_unavailable.connect(self._on_adb_error)
        self._watcher.start()

        self._ota_worker = OTAWorker(self)
        self._ota_worker.ota_available.connect(self._on_ota_available)
        self._ota_worker.start()

        self._tweak_scan: TweakScanWorker | None = None

    # ─── Handlers ────────────────────────────────────────────────────────────

    def _nav_to(self, idx: int):
        self._stack.setCurrentIndex(idx)
        for i, btn in enumerate(self._nav_btns):
            btn.setProperty("active", i == idx)
            btn.style().unpolish(btn)
            btn.style().polish(btn)

    def _on_device_connected(self, device):
        upsert_device(
            device.serial,
            device.model,
            device.android_version,
            device.hyperos_version,
        )
        self._set_status(
            f"● {device.model or 'Redmi 14C'}  ·  {device.serial}",
            "status_connected",
        )
        if not get_display_name(device.serial):
            profile: ProfileScreen = self._screens[IDX_PROFILE]
            profile.start(device.serial)
            self._nav_to(IDX_PROFILE)

        ota_state = self._ota_worker.state()
        if ota_state.ota_detected and not ota_state.post_ota_scan_done:
            self._set_status("Escaneando tweaks reseteados por la actualización...", "status_warning")
            self._launch_tweak_scan(device.serial)

    def _on_ota_available(self, build: str):
        self._set_status(
            "Hay una actualización de HyperOS disponible. "
            "Conectá el dispositivo para proteger tus optimizaciones.",
            "status_warning",
        )

    def _launch_tweak_scan(self, serial: str):
        self._tweak_scan = TweakScanWorker(serial, self)
        self._tweak_scan.scan_done.connect(self._on_tweaks_scanned)
        self._tweak_scan.start()

    def _on_tweaks_scanned(self, tweaks: list):
        reset = [t for t in tweaks if not t.ok and not t.readonly]
        pkg_tweak = next((t for t in tweaks if "Packages" in t.name), None)
        try:
            disabled_now = int(pkg_tweak.current_value) if pkg_tweak else 0
        except (ValueError, TypeError):
            disabled_now = 0
        self._ota_worker.mark_scan_done(disabled_baseline=disabled_now)

        if reset:
            names = " · ".join(t.name for t in reset)
            self._set_status(f"⚠ Tweaks reseteados: {names} — reaplicar desde Inicio", "status_warning")
        else:
            self._set_status("✓ Todos los tweaks activos después del OTA", "status_connected")

    def _on_device_disconnected(self, serial: str):
        self._set_status("Esperando dispositivo...", "status_idle")

    def _on_adb_error(self, msg: str):
        self._set_status(f"⚠ {msg}", "status_error")

    def _on_profile_saved(self, serial: str, name: str):
        home: HomeScreen = self._screens[IDX_HOME]
        home.on_profile_saved(name)
        self._nav_to(IDX_HOME)

    def _on_optimize_requested(self, serial: str):
        plan: PlanScreen = self._screens[IDX_PLAN]
        plan.set_serial(serial)
        self._nav_to(IDX_PLAN)

    def _on_plan_confirmed(self, serial: str, mode_flag: str):
        name = get_display_name(serial)
        exec_: ExecutionScreen = self._screens[IDX_EXECUTION]
        self._nav_to(IDX_EXECUTION)
        exec_.start_execution(serial, mode_flag, name)

    def _on_execution_done(self, exit_code: int):
        if exit_code == 0:
            # Refrescar histórico
            history: HistoryScreen = self._screens[IDX_HISTORY]
            history.refresh(self._screens[IDX_EXECUTION]._serial)

    def _set_status(self, text: str, obj_name: str):
        self._status_lbl.setObjectName(obj_name)
        self._status_lbl.setText(text)
        self._status_lbl.style().unpolish(self._status_lbl)
        self._status_lbl.style().polish(self._status_lbl)

    # ─── Cleanup ──────────────────────────────────────────────────────────────

    def closeEvent(self, event):
        self._watcher.stop()
        self._watcher.wait(3000)
        self._ota_worker.stop()
        self._ota_worker.wait(3000)
        super().closeEvent(event)
