#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Base de datos de bloatware — Redmi 14C / HyperOS
#  Inspirado en: UAD, BloatwareHatao, HyperOS-debloat
#
#  Categorías de seguridad:
#    🟢 RECOMMENDED  — Seguro de desactivar, sin dependencias
#    🟡 ADVANCED     — Puede afectar algunas funciones
#    🔴 DANGER       — Solo para expertos, puede romper cosas
#
#  Cada entrada: PAQUETE|CATEGORÍA|SEGURIDAD|DESCRIPCIÓN
# ═══════════════════════════════════════════════════════════════

# ─── XIAOMI / MIUI / HYPEROS — BLOATWARE ───

# Analytics y telemetry
XIAOMI_ANALYTICS="com.miui.analytics|Sistema|🟢|Analytics y telemetría de Xiaomi"
XIAOMI_MSA="com.miui.msa.global|Anuncios|🟢|Servicio de anuncios de MIUI"
XIAOMI_AD="com.miui.ad|Anuncios|🟢|Framework de anuncios MIUI"
XIAOMI_DAEMON="com.miui.daemon|Sistema|🟢|Daemon de servicios MIUI"
XIAOMI_BUGREPORT="com.miui.bugreport|Sistema|🟢|Reporte de errores MIUI"
XIAOMI_HYBRID="com.miui.hybrid|Sistema|🟢|Apps híbridas/WebView MIUI"

# Apps preinstaladas Xiaomi
XIAOMI_COMPASS="com.miui.compass|Apps|🟢|Brújula"
XIAOMI_FM="com.miui.fm|Apps|🟢|Radio FM"
XIAOMI_CLEANMASTER="com.miui.cleanmaster|Apps|🟢|Limpieza (redundante)"
XIAOMI_QRSCANNER="com.miui.qrscanner|Apps|🟢|Escáner QR (redundante)"
XIAOMI_GAME="com.xiaomi.glgm|Apps|🟢|Xiaomi Game Center"
XIAOMI_GALLERY_EDITOR="com.miui.gallery.editor|Apps|🟡|Editor de galería MIUI"
XIAOMI_THEMES="com.android.thememanager|Apps|🟡|Gestor de temas"
XIAOMI_NOTES="com.miui.notes|Apps|🟡|Notas MIUI"
XIAOMI_RECORDER="com.miui.screenrecorder|Apps|🟡|Grabadora de pantalla"
XIAOMI_CALCULATOR="com.miui.calculator|Apps|🟡|Calculadora MIUI"
XIAOMI_WEATHER="com.miui.weather2|Apps|🟡|Clima MIUI"
XIAOMI_SCAN="com.xiaomi.scanner|Apps|🟢|Xiaomi Scanner"
XIAOMI_PAY="com.mipay.wallet|Apps|🟡|Mi Pay (si no lo usás)"
XIAOMI_CLOUD="com.miui.cloudservice|Sistema|🟡|Servicios en la nube Xiaomi"
XIAOMI_CLOUDSYNC="com.miui.micloudsync|Sistema|🟡|Sincronización nube"
XIAOMI_BACKUP="com.miui.cloudbackup|Sistema|🟡|Backup en la nube"
XIAOMI_FIND="com.xiaomi.finddevice|Sistema|🟡|Buscar dispositivo"
XIAOMI_VOICEASSIST="com.miui.voiceassist|Apps|🟢|Asistente de voz Xiaomi"
XIAOMI_BROWSER="com.mi.globalbrowser|Apps|🟡|Mi Browser (si usás Chrome)"
XIAOMI_MUSIC="com.miui.player|Apps|🟡|Mi Music"
XIAOMI_VIDEO="com.miui.video|Apps|🟡|Mi Video"

# ─── GOOGLE — BLOATWARE ───

GOOGLE_MUSIC="com.google.android.music|Apps|🟢|Google Play Music (descontinuado)"
GOOGLE_VIDEOS="com.google.android.videos|Apps|🟢|Google Play Películas"
GOOGLE_ASSISTANT="com.google.android.apps.googleassistant|Apps|🟢|Google Assistant (si no lo usás)"
GOOGLE_LENS="com.google.ar.lens|Apps|🟢|Google Lens"
GOOGLE_TURBO="com.google.android.apps.turbo|Apps|🟢|Google Turbo (VPN)"
GOOGLE_YOUTUBE_MUSIC="com.google.android.apps.youtube.music|Apps|🟡|YouTube Music"
GOOGLE_NEWS="com.google.android.apps.magazines|Apps|🟢|Google News"
GOOGLE_DOCS="com.google.android.apps.docs|Apps|🟡|Google Docs"
GOOGLE_SHEETS="com.google.android.apps.docs.editors.sheets|Apps|🟡|Google Sheets"
GOOGLE_SLIDES="com.google.android.apps.docs.editors.slides|Apps|🟡|Google Slides"
GOOGLE_DRIVE="com.google.android.apps.docs|Apps|🟡|Google Drive"
GOOGLE_KEEP="com.google.android.keep|Apps|🟡|Google Keep"
GOOGLE_CHROME="com.android.chrome|Apps|🔴|Chrome (¡cuidado!)"
GOOGLE_GMAIL="com.google.android.gm|Apps|🔴|Gmail (¡cuidado!)"
GOOGLE_MAPS="com.google.android.apps.maps|Apps|🔴|Google Maps (¡cuidado!)"
GOOGLE_PHOTOS="com.google.android.apps.photos|Apps|🔴|Google Photos (¡cuidado!)"
GOOGLE_PLAYSTORE="com.android.vending|Sistema|🔴|Play Store (¡NUNCA desactivar!)"
GOOGLE_PLAY_SERVICES="com.google.android.gms|Sistema|🔴|Google Play Services (¡NUNCA!)"
GOOGLE_SEARCH="com.google.android.googlequicksearchbox|Apps|🟡|Google Search/Búsqueda"
GOOGLE_MESSAGES="com.google.android.apps.messaging|Apps|🟡|Google Messages"
GOOGLE_CLOCK="com.google.android.deskclock|Apps|🟡|Google Reloj"
GOOGLE_CALENDAR="com.google.android.calendar|Apps|🟡|Google Calendario"
GOOGLE_CONTACTS="com.google.android.contacts|Apps|🟡|Google Contactos"
GOOGLE_DIALER="com.google.android.dialer|Apps|🟡|Google Dialer"
GOOGLE_FILES="com.google.android.apps.nbu.files|Apps|🟡|Google Files"

# ─── FACEBOOK / META — BLOATWARE ───

FACEBOOK="com.facebook.katana|Social|🟢|Facebook app"
FACEBOOK_SYSTEM="com.facebook.system|Social|🟢|Facebook System Services"
FACEBOOK_APPMGR="com.facebook.appmanager|Social|🟢|Facebook App Manager"
FACEBOOK_SERVICES="com.facebook.services|Social|🟢|Facebook Services"
INSTAGRAM="com.instagram.android|Social|🟡|Instagram"
WHATSAPP="com.whatsapp|Social|🔴|WhatsApp (¡cuidado!)"

# ─── AMAZON — BLOATWARE ───

AMAZON="com.amazon.appmanager|Apps|🟢|Amazon Shopping"
AMAZON_KINDLE="com.amazon.kindle|Apps|🟢|Kindle"
AMAZON_ALEXA="com.amazon.dee.app|Apps|🟢|Amazon Alexa"

# ─── NETFLIX — BLOATWARE ───

NETFLIX="com.netflix.partner.activation|Apps|🟢|Netflix (preinstalado)"

# ─── OTROS COMUNES ───

SPOTIFY="com.spotify.music|Apps|🟡|Spotify"
TIKTOK="com.zhiliaoapp.musically|Social|🟡|TikTok"
TWITTER="com.twitter.android|Social|🟡|Twitter/X"
SNAPCHAT="com.snapchat.android|Social|🟡|Snapchat"
YOUTUBE="com.google.android.youtube|Apps|🔴|YouTube (¡cuidado!)"

# ─── CARRIER / OPERADORA ───

CARRIER_SETUP="com.android.carrierdefaultinstaller|Carrier|🟢|Instalador de config de operadora"
CARRIER_CONFIG="com.android.carrierconfig|Carrier|🟡|Configuración de operadora"

# ─── SISTEMA — NO TOCAR ───

SYSTEMUI="com.android.systemui|Sistema|🔴|System UI (¡NUNCA!)"
LAUNCHER="com.miui.home|Sistema|🔴|Launcher MIUI (¡NUNCA!)"
SETTINGS="com.android.settings|Sistema|🔴|Ajustes (¡NUNCA!)"
PHONE="com.android.phone|Sistema|🔴|Teléfono (¡NUNCA!)"
DIALER="com.android.dialer|Sistema|🔴|Marcador (¡NUNCA!)"
CONTACTS="com.android.contacts|Sistema|🔴|Contactos (¡NUNCA!)"
MESSAGES="com.android.mms|Sistema|🔴|Mensajes (¡NUNCA!)"
CAMERA="com.android.camera|Sistema|🔴|Cámara (¡NUNCA!)"

# ═══════════════════════════════════════════════════════════════
#  LISTAS PREDEFINIDAS POR PERFIL
# ═══════════════════════════════════════════════════════════════

# Paquetes para desactivar en cada perfil (solo el nombre del paquete)
RENDIMIENTO_BLOAT=(
    # Analytics / Telemetry
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.miui.hybrid"
    # Apps Xiaomi
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.xiaomi.glgm"
    "com.xiaomi.scanner"
    "com.miui.voiceassist"
    "com.miui.weather2"
    # Google
    "com.google.android.music"
    "com.google.android.videos"
    "com.google.android.apps.googleassistant"
    "com.google.ar.lens"
    "com.google.android.apps.turbo"
    "com.google.android.apps.magazines"
    # Facebook / Meta
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    # Amazon
    "com.amazon.appmanager"
    "com.amazon.kindle"
    "com.amazon.dee.app"
    # Netflix
    "com.netflix.partner.activation"
    # Carrier
    "com.android.carrierdefaultinstaller"
)

EQUILIBRADO_BLOAT=(
    # Solo lo 100% seguro
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.xiaomi.glgm"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.amazon.appmanager"
    "com.netflix.partner.activation"
)

BATERIA_BLOAT=(
    # Apps que drenan batería en segundo plano
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.hybrid"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.amazon.appmanager"
    "com.netflix.partner.activation"
    "com.google.android.apps.googleassistant"
    "com.google.android.apps.turbo"
)

GAMING_BLOAT=(
    # Mínimo para liberar RAM + todo lo de rendimiento
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.miui.hybrid"
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.xiaomi.glgm"
    "com.xiaomi.scanner"
    "com.miui.voiceassist"
    "com.miui.weather2"
    "com.google.android.music"
    "com.google.android.videos"
    "com.google.android.apps.googleassistant"
    "com.google.ar.lens"
    "com.google.android.apps.turbo"
    "com.google.android.apps.magazines"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.amazon.appmanager"
    "com.amazon.kindle"
    "com.amazon.dee.app"
    "com.netflix.partner.activation"
    "com.android.carrierdefaultinstaller"
    # Apps adicionales para gaming
    "com.miui.cloudservice"
    "com.miui.micloudsync"
    "com.miui.cloudbackup"
    "com.xiaomi.finddevice"
    "com.mipay.wallet"
)

# ═══════════════════════════════════════════════════════════════
#  FUNCIONES AUXILIARES
# ═══════════════════════════════════════════════════════════════

# Desactivar una lista de paquetes con conteo
disable_packages() {
    local -n PKG_LIST=$1
    local DISABLED=0
    local NOTFOUND=0
    local ALREADY=0

    for PKG in "${PKG_LIST[@]}"; do
        OUT=$(adb shell pm disable-user --user 0 "$PKG" 2>&1)
        if echo "$OUT" | grep -q "disabled\|Success"; then
            DISABLED=$((DISABLED + 1))
        elif echo "$OUT" | grep -q "already disabled"; then
            ALREADY=$((ALREADY + 1))
        else
            NOTFOUND=$((NOTFOUND + 1))
        fi
    done

    echo "$DISABLED $ALREADY $NOTFOUND"
}

# Listar paquetes desactivados
list_disabled() {
    adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r'
}
