"""
Parser de output de src/cli/run.sh → mensajes en lenguaje de usuaria.

Reglas (según spec Sprint 2):
  - Línea con 'uninstall' o 'disable-user' → MsgKind.HUMAN "Quitando [nombre]"
  - Línea con 'settings put'               → MsgKind.HUMAN "Ajustando velocidad del sistema"
  - Línea con patrones de error            → MsgKind.ERROR  (va a Detalles técnicos)
  - Decoración / líneas vacías             → MsgKind.SKIP
  - Todo lo demás                          → MsgKind.TECH   (va a Detalles técnicos)
"""

import re
from dataclasses import dataclass
from enum import Enum, auto


class MsgKind(Enum):
    HUMAN = auto()   # mensaje traducido → feed principal
    PHASE = auto()   # transición de fase → actualiza pills y label  (message = clave de fase)
    ERROR = auto()   # error técnico → log crudo
    TECH  = auto()   # output técnico sin traducción → log crudo
    SKIP  = auto()   # ignorar completamente


@dataclass
class ParsedLine:
    kind: MsgKind
    message: str   # para HUMAN: mensaje legible. Para el resto: línea limpia.
    raw: str       # línea original, sin modificar


# ─── ANSI stripping ──────────────────────────────────────────────────────────

_ANSI_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")

def strip_ansi(text: str) -> str:
    return _ANSI_RE.sub("", text)


# ─── Nombres legibles de packages ────────────────────────────────────────────

APP_NAMES: dict[str, str] = {
    # Facebook / Meta
    "com.facebook.katana":              "Facebook",
    "com.facebook.orca":                "Messenger",
    "com.facebook.lite":                "Facebook Lite",
    "com.facebook.services":            "Servicios de Facebook",
    "com.facebook.system":              "Sistema de Facebook",
    "com.instagram.android":            "Instagram",
    "com.whatsapp":                     "WhatsApp",
    "com.whatsapp.w4b":                 "WhatsApp Business",
    # Google
    "com.google.android.youtube":       "YouTube",
    "com.google.android.apps.photos":   "Google Fotos",
    "com.google.android.gm":            "Gmail",
    "com.google.android.apps.maps":     "Google Maps",
    "com.google.android.videos":        "Google Videos",
    "com.google.android.apps.youtube.music": "YouTube Music",
    "com.google.android.apps.tachyon":  "Google Meet",
    "com.google.android.talk":          "Google Chat",
    "com.google.android.apps.subscriptions.red": "Google One",
    "com.google.android.marvin.talkback": "TalkBack (accesibilidad)",
    "com.google.android.apps.chromecast.app": "Google Home",
    "com.google.android.inputmethod.latin": "Teclado Gboard",
    # Xiaomi / HyperOS
    "com.miui.analytics":               "Analíticas de Xiaomi",
    "com.miui.msa.global":              "Anuncios MIUI",
    "com.miui.systemAdSolution":        "Sistema de anuncios MIUI",
    "com.miui.daemon":                  "Telemetría MIUI",
    "com.miui.AnalyticsCore":           "Core de análisis MIUI",
    "com.miui.hybrid":                  "WebView MIUI",
    "com.miui.cloudservice":            "Nube Xiaomi",
    "com.miui.cloudbackup":             "Backup nube Xiaomi",
    "com.miui.weather":                 "Clima Xiaomi",
    "com.miui.videoplayer":             "Reproductor de video Xiaomi",
    "com.miui.player":                  "Música Xiaomi",
    "com.miui.notes":                   "Notas Xiaomi",
    "com.miui.calculator":              "Calculadora Xiaomi",
    "com.miui.compass":                 "Brújula Xiaomi",
    "com.xiaomi.mipicks":               "GetApps (tienda Xiaomi)",
    "com.xiaomi.gamecenter":            "Game Center Xiaomi",
    "com.xiaomi.payment":               "Mi Pay",
    "com.xiaomi.drivemode":             "Modo conductor Xiaomi",
    "com.xiaomi.android.gmbot":         "Bot Xiaomi",
    "com.xiaomi.joyose":                "JOYOSE — NO TOCAR",  # guardrail visual
    # Microsoft
    "com.microsoft.office.word":        "Word",
    "com.microsoft.office.excel":       "Excel",
    "com.microsoft.office.powerpoint":  "PowerPoint",
    "com.microsoft.office.outlook":     "Outlook",
    "com.microsoft.skydrive":           "OneDrive",
    "com.microsoft.teams":              "Teams",
    "com.microsoft.bing":               "Bing",
    "com.linkedin.android":             "LinkedIn",
    # Entretenimiento / redes
    "com.netflix.mediaclient":          "Netflix",
    "com.spotify.music":                "Spotify",
    "com.amazon.mShop.android.shopping":"Amazon Shopping",
    "com.twitter.android":              "X (Twitter)",
    "com.snapchat.android":             "Snapchat",
    "com.zhiliaoapp.musically":         "TikTok",
    "com.ss.android.ugc.trill":         "TikTok",
    "tv.twitch.android.app":            "Twitch",
    "com.discord":                      "Discord",
    "com.telegram.messenger":           "Telegram",
    # Sistema (bloat)
    "com.android.printspooler":         "Servicio de impresión",
    "com.android.dreams.basic":         "Salvapantallas (inactivo)",
    "com.android.wallpaperbackup":      "Backup de fondos de pantalla",
}

# ─── Etiquetas de settings ───────────────────────────────────────────────────
# Solo para uso interno futuro — Sprint 2 muestra "velocidad del sistema" siempre.

_SETTING_LABELS: dict[str, str] = {
    "window_animation_scale":    "animaciones del sistema",
    "transition_animation_scale":"transiciones",
    "animator_duration_scale":   "duración de animaciones",
    "vm.swappiness":             "memoria virtual",
    "swappiness":                "memoria virtual",
    "dalvik.vm.heapsize":        "memoria para aplicaciones",
    "dalvik.vm.heapgrowthlimit": "límite de memoria para apps",
    "hwui.texture_cache_size":   "caché de gráficos",
}

# ─── Regex ───────────────────────────────────────────────────────────────────

_REMOVE_RE   = re.compile(r"uninstall|disable[\-\s]user", re.IGNORECASE)
_SETTINGS_RE = re.compile(r"settings\s+put", re.IGNORECASE)
_ERROR_RE    = re.compile(
    r"Exception|FAILED|Error:|error:|✗|\[ERROR\]|fatal|traceback",
    re.IGNORECASE,
)
_PKG_RE = re.compile(r"(?:com|org|net|io|android)(?:\.[a-zA-Z][a-zA-Z0-9_]*){2,}")

# Línea decorativa pura (sin texto de contenido)
_DECO_RE = re.compile(r"^[\s═─┌┐└┘│╔╗╚╝╠╣╦╩╬╟╞╡╢║•·\-=\*]{3,}$")

# Línea que contiene caracteres de borde de caja (puede tener texto dentro)
_BOX_RE = re.compile(r"[═─┌┐└┘│╔╗╚╝╠╣╦╩╬╟╞╡╢║]")

# ─── Detección de fases ───────────────────────────────────────────────────────
# Clave → lista de keywords que identifican esa fase en los encabezados del script

_PHASE_KEYWORDS: dict[str, list[str]] = {
    "suelo":    ["bloatware", "debloat", "privacidad", "suelo",
                 "fase 1", "phase 1", "disable", "desactivar"],
    "fluidez":  ["performance", "fluidez", "animaci", "kernel",
                 "memoria", "heap", "swappiness", "fase 2", "phase 2"],
    "whatsapp": ["whatsapp", "fase 3", "phase 3"],
    "camara":   ["camara", "cámara", "camera", "gcam",
                 "fase 4", "phase 4"],
}


def _detect_phase(clean: str) -> str | None:
    lower = clean.lower()
    for key, keywords in _PHASE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return key
    return None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _extract_package(line: str) -> str | None:
    """Devuelve el nombre de package más largo/específico encontrado en la línea."""
    matches = _PKG_RE.findall(line)
    if not matches:
        return None
    # Excluir joyose como guardrail extra (jamás se debe manipular)
    safe = [m for m in matches if "joyose" not in m.lower()]
    if not safe:
        return None
    # El más largo suele ser el más específico
    return max(safe, key=len)


def _friendly_name(pkg: str | None) -> str:
    """Devuelve nombre legible de un package, o lo deriva del nombre."""
    if not pkg:
        return "aplicación"
    if pkg in APP_NAMES:
        return APP_NAMES[pkg]
    # Derivar del último segmento del package
    parts = pkg.split(".")
    name = parts[-1] if len(parts) >= 3 else pkg
    name = re.sub(r"[_\-]", " ", name)
    name = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    return name.strip().capitalize() or "aplicación"


# ─── Parser principal ─────────────────────────────────────────────────────────

def parse_line(raw: str) -> ParsedLine:
    clean = strip_ansi(raw).strip()

    if not clean:
        return ParsedLine(MsgKind.SKIP, "", raw)

    # Líneas con bordes de caja o puramente decorativas → buscar transición de fase
    if _BOX_RE.search(clean) or _DECO_RE.match(clean):
        phase = _detect_phase(clean)
        if phase:
            return ParsedLine(MsgKind.PHASE, phase, raw)
        return ParsedLine(MsgKind.SKIP, "", raw)

    # Errores — prioridad antes de intentar traducir
    if _ERROR_RE.search(clean):
        return ParsedLine(MsgKind.ERROR, clean, raw)

    # Remoción de apps (uninstall o disable-user)
    if _REMOVE_RE.search(clean):
        pkg  = _extract_package(clean)
        name = _friendly_name(pkg)
        return ParsedLine(MsgKind.HUMAN, f"Quitando {name}", raw)

    # Ajustes de sistema
    if _SETTINGS_RE.search(clean):
        return ParsedLine(MsgKind.HUMAN, "Ajustando velocidad del sistema", raw)

    return ParsedLine(MsgKind.TECH, clean, raw)
