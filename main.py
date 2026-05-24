import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt
from forge.db.database import init_db
from forge.ui.app import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    app.setApplicationName("Redmi Forge")
    app.setApplicationVersion("0.1.0")

    init_db()

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
