COLORS = {
    "bg":           "#FFFFFF",
    "surface":      "#F8F9FA",
    "border":       "#E8E8E8",
    "text":         "#0A0A0A",
    "text_muted":   "#666666",
    "blue":         "#0066FF",
    "blue_light":   "#EEF4FF",
    "red":          "#E63946",
    "yellow":       "#FFD60A",
    "success":      "#22C55E",
    "sidebar":      "#F5F5F5",
    "terminal_bg":  "#0A0A0A",
    "terminal_fg":  "#22C55E",
}

FONT_SIZES = {
    "xs":  11,
    "sm":  13,
    "base": 14,
    "lg":  16,
    "xl":  20,
    "2xl": 24,
    "3xl": 32,
}

STYLESHEET = f"""
* {{
    font-family: 'Segoe UI Variable', 'Inter', 'Segoe UI', sans-serif;
    box-sizing: border-box;
}}

QMainWindow, QWidget#main_widget {{
    background-color: {COLORS["bg"]};
}}

/* ─── Sidebar ─── */
QWidget#sidebar {{
    background-color: {COLORS["sidebar"]};
    border-right: 1px solid {COLORS["border"]};
}}

QPushButton#nav_btn {{
    text-align: left;
    padding: 10px 14px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: {COLORS["text_muted"]};
    font-size: {FONT_SIZES["base"]}px;
    font-weight: 500;
}}

QPushButton#nav_btn:hover {{
    background-color: #EBEBEB;
    color: {COLORS["text"]};
}}

QPushButton#nav_btn[active="true"] {{
    background-color: {COLORS["blue_light"]};
    color: {COLORS["blue"]};
    font-weight: 600;
}}

/* ─── Primary action ─── */
QPushButton#primary_btn {{
    background-color: {COLORS["blue"]};
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 40px;
    font-size: {FONT_SIZES["lg"]}px;
    font-weight: 600;
    min-height: 52px;
}}

QPushButton#primary_btn:hover {{
    background-color: #0052CC;
}}

QPushButton#primary_btn:pressed {{
    background-color: #003D99;
}}

QPushButton#primary_btn:disabled {{
    background-color: {COLORS["border"]};
    color: {COLORS["text_muted"]};
}}

/* ─── Secondary action ─── */
QPushButton#secondary_btn {{
    background-color: transparent;
    color: {COLORS["blue"]};
    border: 1.5px solid {COLORS["blue"]};
    border-radius: 8px;
    padding: 10px 24px;
    font-size: {FONT_SIZES["base"]}px;
    font-weight: 500;
}}

QPushButton#secondary_btn:hover {{
    background-color: {COLORS["blue_light"]};
}}

QPushButton#danger_btn {{
    background-color: transparent;
    color: {COLORS["red"]};
    border: 1.5px solid {COLORS["red"]};
    border-radius: 8px;
    padding: 10px 24px;
    font-size: {FONT_SIZES["base"]}px;
    font-weight: 500;
}}

QPushButton#danger_btn:hover {{
    background-color: #FFF0F0;
}}

/* ─── Typography ─── */
QLabel#h1 {{
    font-size: {FONT_SIZES["3xl"]}px;
    font-weight: 700;
    color: {COLORS["text"]};
}}

QLabel#h2 {{
    font-size: {FONT_SIZES["2xl"]}px;
    font-weight: 700;
    color: {COLORS["text"]};
}}

QLabel#h3 {{
    font-size: {FONT_SIZES["xl"]}px;
    font-weight: 600;
    color: {COLORS["text"]};
}}

QLabel#body {{
    font-size: {FONT_SIZES["base"]}px;
    color: {COLORS["text"]};
    line-height: 1.5;
}}

QLabel#muted {{
    font-size: {FONT_SIZES["sm"]}px;
    color: {COLORS["text_muted"]};
}}

QLabel#caption {{
    font-size: {FONT_SIZES["xs"]}px;
    color: {COLORS["text_muted"]};
}}

/* ─── Card ─── */
QFrame#card {{
    background-color: {COLORS["bg"]};
    border: 1.5px solid {COLORS["border"]};
    border-radius: 16px;
}}

/* ─── Status bar ─── */
QWidget#statusbar_widget {{
    background-color: {COLORS["surface"]};
    border-top: 1px solid {COLORS["border"]};
    min-height: 34px;
    max-height: 34px;
}}

QLabel#status_idle {{
    font-size: {FONT_SIZES["xs"]}px;
    color: {COLORS["text_muted"]};
    padding: 0 16px;
}}

QLabel#status_connected {{
    font-size: {FONT_SIZES["xs"]}px;
    color: {COLORS["success"]};
    padding: 0 16px;
    font-weight: 600;
}}

QLabel#status_error {{
    font-size: {FONT_SIZES["xs"]}px;
    color: {COLORS["red"]};
    padding: 0 16px;
}}

QLabel#status_warning {{
    font-size: {FONT_SIZES["xs"]}px;
    color: {COLORS["yellow"]};
    padding: 0 16px;
    font-weight: 600;
}}

/* ─── Terminal output ─── */
QTextEdit#terminal {{
    background-color: {COLORS["terminal_bg"]};
    color: {COLORS["terminal_fg"]};
    font-family: 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
    font-size: 13px;
    border-radius: 8px;
    padding: 16px;
    border: none;
}}

/* ─── Phase item ─── */
QFrame#phase_item {{
    background-color: {COLORS["surface"]};
    border: 1px solid {COLORS["border"]};
    border-radius: 10px;
}}

QFrame#phase_item_active {{
    background-color: {COLORS["blue_light"]};
    border: 1.5px solid {COLORS["blue"]};
    border-radius: 10px;
}}
"""
