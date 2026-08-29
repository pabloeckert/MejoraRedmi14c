"""
Catálogo canónico de apps debloateables para Redmi 14C / HyperOS 3.

Fuente de verdad para forge/core/app_scanner.py (auditoría de apps desde
terminal): nombres legibles, categorías, y las apps protegidas que nunca
deben tocarse (SafetyNet / negocio).

Estructura:
  DEBLOAT_CATALOG    — pkg_name → AppEntry con nombre, categoría y si está en la lista base
  SAFETYNET_PROTECTED — apps que rompen Play Integrity / banca si se desactivan
  BUSINESS_CRITICAL   — mínimo indispensable para uso laboral, intocable

Categorías:
  "social"    — redes sociales, mensajería
  "google"    — apps Google preinstaladas (algunas pesadas)
  "xiaomi"    — bloatware Xiaomi/MIUI/HyperOS — telemetría, anuncios
  "msft"      — Microsoft preinstalado
  "entret"    — entretenimiento (video, música, juegos)
  "util"      — utilidades preinstaladas que el usuario puede no querer
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class AppEntry:
    name:     str   # nombre legible para el usuario final
    category: str   # categoría para agrupar y priorizar
    in_engine: bool # True = está en HEAVY_APPS de config.sh actualmente


# ─── Catálogo maestro ────────────────────────────────────────────────────────

DEBLOAT_CATALOG: dict[str, AppEntry] = {

    # ── Redes sociales / mensajería ──────────────────────────────────────────
    "com.facebook.katana":                AppEntry("Facebook",           "social", True),
    "com.facebook.orca":                  AppEntry("Messenger",          "social", False),
    "com.facebook.lite":                  AppEntry("Facebook Lite",      "social", False),
    "com.facebook.services":              AppEntry("Servicios Facebook",  "social", False),
    "com.facebook.system":                AppEntry("Sistema Facebook",   "social", False),
    "com.instagram.android":              AppEntry("Instagram",           "social", True),
    "com.whatsapp":                       AppEntry("WhatsApp",            "social", False),
    "com.whatsapp.w4b":                   AppEntry("WhatsApp Business",  "social", False),
    "com.zhiliaoapp.musically":           AppEntry("TikTok",             "social", True),
    "com.ss.android.ugc.trill":           AppEntry("TikTok (regional)",  "social", False),
    "com.twitter.android":                AppEntry("X (Twitter)",        "social", True),
    "com.snapchat.android":               AppEntry("Snapchat",           "social", True),
    "org.telegram.messenger":             AppEntry("Telegram",           "social", True),
    "com.discord":                        AppEntry("Discord",            "social", True),
    "com.reddit.frontpage":               AppEntry("Reddit",             "social", True),
    "com.pinterest":                      AppEntry("Pinterest",          "social", True),
    "com.linkedin.android":               AppEntry("LinkedIn",           "social", False),

    # ── Google preinstalado ──────────────────────────────────────────────────
    "com.google.android.youtube":         AppEntry("YouTube",            "google", True),
    "com.google.android.apps.photos":     AppEntry("Google Fotos",       "google", False),
    "com.google.android.gm":             AppEntry("Gmail",              "google", True),
    "com.google.android.apps.maps":       AppEntry("Google Maps",        "google", True),
    "com.google.android.videos":          AppEntry("Google Videos",      "google", False),
    "com.google.android.apps.youtube.music": AppEntry("YouTube Music",   "google", False),
    "com.google.android.apps.tachyon":   AppEntry("Google Meet",        "google", False),
    "com.google.android.talk":           AppEntry("Google Chat",        "google", False),
    "com.google.android.apps.subscriptions.red": AppEntry("Google One", "google", False),
    "com.google.android.marvin.talkback": AppEntry("TalkBack",          "google", False),
    "com.google.android.apps.chromecast.app": AppEntry("Google Home",   "google", False),
    "com.google.android.inputmethod.latin": AppEntry("Teclado Gboard",  "google", False),
    "com.android.chrome":                 AppEntry("Chrome",            "google", True),

    # ── Xiaomi / HyperOS / MIUI — telemetría y anuncios ─────────────────────
    "com.miui.analytics":                AppEntry("Analíticas Xiaomi",      "xiaomi", False),
    "com.miui.msa.global":               AppEntry("Anuncios MIUI",          "xiaomi", False),
    "com.miui.systemAdSolution":         AppEntry("Sistema de anuncios",    "xiaomi", False),
    "com.miui.daemon":                   AppEntry("Telemetría MIUI",        "xiaomi", False),
    "com.miui.AnalyticsCore":            AppEntry("Core análisis MIUI",     "xiaomi", False),
    "com.miui.hybrid":                   AppEntry("WebView MIUI",           "xiaomi", False),
    "com.miui.cloudservice":             AppEntry("Nube Xiaomi",            "xiaomi", False),
    "com.miui.cloudbackup":              AppEntry("Backup nube Xiaomi",     "xiaomi", False),
    "com.miui.weather":                  AppEntry("Clima Xiaomi",           "xiaomi", False),
    "com.miui.videoplayer":              AppEntry("Reproductor Xiaomi",     "xiaomi", False),
    "com.miui.player":                   AppEntry("Música Xiaomi",          "xiaomi", False),
    "com.miui.notes":                    AppEntry("Notas Xiaomi",           "xiaomi", False),
    "com.miui.calculator":               AppEntry("Calculadora Xiaomi",     "xiaomi", False),
    "com.xiaomi.mipicks":                AppEntry("GetApps (tienda)",       "xiaomi", False),
    "com.xiaomi.gamecenter":             AppEntry("Game Center",            "xiaomi", False),
    "com.xiaomi.payment":                AppEntry("Mi Pay",                 "xiaomi", False),
    "com.xiaomi.drivemode":              AppEntry("Modo conductor Xiaomi",  "xiaomi", False),

    # ── Microsoft preinstalado ───────────────────────────────────────────────
    "com.microsoft.office.word":         AppEntry("Word",        "msft", False),
    "com.microsoft.office.excel":        AppEntry("Excel",       "msft", False),
    "com.microsoft.office.powerpoint":   AppEntry("PowerPoint",  "msft", False),
    "com.microsoft.office.outlook":      AppEntry("Outlook",     "msft", False),
    "com.microsoft.skydrive":            AppEntry("OneDrive",    "msft", False),
    "com.microsoft.teams":               AppEntry("Teams",       "msft", False),
    "com.microsoft.bing":                AppEntry("Bing",        "msft", False),

    # ── Entretenimiento ──────────────────────────────────────────────────────
    "com.netflix.mediaclient":           AppEntry("Netflix",     "entret", False),
    "com.spotify.music":                 AppEntry("Spotify",     "entret", True),
    "tv.twitch.android.app":             AppEntry("Twitch",      "entret", False),
    "com.amazon.mShop.android.shopping": AppEntry("Amazon",      "entret", False),

    # ── Utilidades / sistema bloat ───────────────────────────────────────────
    "com.android.printspooler":          AppEntry("Servicio de impresión",   "util", False),
    "com.android.dreams.basic":          AppEntry("Salvapantallas",          "util", False),
    "com.android.wallpaperbackup":       AppEntry("Backup de fondos",        "util", False),
}


# ─── Escudo SafetyNet — NUNCA tocar en apps bancarias ────────────────────────
# Estas apps son prerequisito de Play Integrity / SafetyNet. Desactivarlas
# rompe la verificación de integridad que usan las apps bancarias argentinas.

SAFETYNET_PROTECTED: frozenset[str] = frozenset({
    # Google core — base de SafetyNet / Play Integrity
    "com.google.android.gms",               # Google Play Services
    "com.google.android.gsf",               # Google Services Framework
    "com.android.vending",                  # Play Store
    # Bancos Argentina — package names verificados contra Play Store 2026
    "ar.com.bna.bancamovil",                # Banco Nación
    "com.bbva.nxt.android",                 # BBVA Argentina
    "com.santander.app",                    # Santander
    "com.galicia.android",                  # Galicia
    "ar.com.galicia.bancamovil",            # Galicia (alternativo)
    "ar.com.macro.bancamovil",              # Macro
    "com.icbc.android",                     # ICBC
    "ar.com.supervielle.bancamovil",        # Supervielle
    "ar.com.patagonia.bancamovil",          # Banco Patagonia
    "ar.com.bcd.android",                   # Banco Ciudad
    # Fintech / wallets Argentina
    "com.mercadopago.wallet",               # Mercado Pago
    "ar.com.ualamobile",                    # Ualá
    "com.brubank.android",                  # Brubank
    "com.naranjax.android",                 # Naranja X
    "ar.com.personal.pay",                  # Personal Pay
})


# ─── Apps críticas de negocio — intocables ───────────────────────────────────
# Mínimo indispensable para que el teléfono funcione como herramienta de
# trabajo o para acceder a servicios que requieren autenticación de segundo
# factor (email con tokens 2FA, navegador para banca web, maps para trabajo
# de campo).

BUSINESS_CRITICAL: frozenset[str] = frozenset({
    "com.google.android.gm",            # Gmail — email corporativo / tokens 2FA
    "com.android.chrome",               # Chrome — banca online / acceso web
    "com.google.android.apps.maps",     # Google Maps — navegación / trabajo de campo
    "com.google.android.calendar",      # Google Calendar — agenda laboral
})
