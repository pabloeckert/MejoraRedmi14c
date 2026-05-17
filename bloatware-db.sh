#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Base de datos de bloatware — Redmi 14C / HyperOS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
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
XIAOMI_ANALYTICS="com.miui.analytics|Anuncios|🟢|Analytics y telemetría de Xiaomi"
XIAOMI_MSA="com.miui.msa.global|Anuncios|🟢|MSA — Servicio de anuncios de MIUI"
XIAOMI_AD="com.miui.ad|Anuncios|🟢|Framework de anuncios MIUI"
XIAOMI_DAEMON="com.miui.daemon|Sistema|🟢|Demonio del sistema MIUI"
XIAOMI_BUGREPORT="com.miui.bugreport|Sistema|🟢|Comentarios / Reporte de errores"
XIAOMI_HYBRID="com.miui.hybrid|Sistema|🟢|Apps híbridas/WebView MIUI"
XIAOMI_MSIHTSERVICE="com.miui.msightservice|Sistema|🟢|Monitoreo de calidad del sistema"
XIAOMI_THIRDAPPASSISTANT="com.miui.thirdappassistant|Apps|🟢|Asistente de aplicaciones inteligentes"
XIAOMI_MISERVICE="com.miui.miservice|Apps|🟢|Servicios y comentarios"

# Apps preinstaladas Xiaomi
XIAOMI_COMPASS="com.miui.compass|Apps|🟢|Brújula"
XIAOMI_FM="com.miui.fm|Apps|🟢|Radio FM"
XIAOMI_CLEANMASTER="com.miui.cleanmaster|Apps|🟢|Limpieza (redundante)"
XIAOMI_QRSCANNER="com.miui.qrscanner|Apps|🟢|Escáner QR (redundante)"
XIAOMI_GAME="com.xiaomi.glgm|Apps|🟢|Centro de juegos Xiaomi"
XIAOMI_GALLERY_EDITOR="com.miui.gallery.editor|Apps|🟡|Editor de galería MIUI"
XIAOMI_THEMES="com.android.thememanager|Apps|🟡|Gestor de temas"
XIAOMI_NOTES="com.miui.notes|Apps|🟡|Notas MIUI"
XIAOMI_RECORDER="com.miui.screenrecorder|Apps|🟡|Grabadora de pantalla"
XIAOMI_CALCULATOR="com.miui.calculator|Apps|🟡|Calculadora MIUI"
XIAOMI_WEATHER="com.miui.weather2|Apps|🟡|Clima MIUI"
XIAOMI_SCAN="com.xiaomi.scanner|Apps|🟢|Xiaomi Scanner"
XIAOMI_PAY="com.mipay.wallet|Apps|🟡|Mi Pay (si no lo usás)"
XIAOMI_MI_COIN="com.xiaomi.payment|Apps|🟢|Mi Coin / Mi Pay"
XIAOMI_CLOUD="com.miui.cloudservice|Sistema|🟡|Servicios en la nube Xiaomi"
XIAOMI_CLOUDSYNC="com.miui.micloudsync|Sistema|🟡|Sincronización nube"
XIAOMI_BACKUP="com.miui.cloudbackup|Sistema|🟡|Backup en la nube"
XIAOMI_FIND="com.xiaomi.finddevice|Sistema|🟡|Buscar dispositivo"
XIAOMI_VOICEASSIST="com.miui.voiceassist|Apps|🟢|Asistente de voz Xiaomi"
XIAOMI_BROWSER="com.mi.globalbrowser|Apps|🟡|Mi Browser (si usás otro)"
XIAOMI_MUSIC="com.miui.player|Apps|🟡|Mi Music"
XIAOMI_VIDEO="com.miui.video|Apps|🟡|Mi Video"
XIAOMI_MINUSCREEN="com.miui.globalminuscreen|Apps|🟢|App Vault (pantalla -1)"
XIAOMI_YELLOWPAGE="com.miui.yellowpage|Apps|🟢|Páginas Amarillas"
XIAOMI_AIAST="com.xiaomi.aiasst.vision|Apps|🟢|Subtítulos con IA"
XIAOMI_GETAPPS="com.xiaomi.mispicks|Apps|🟢|GetApps (tienda Xiaomi)"
XIAOMI_PLAYAUTO="android.autoinstalls.config.Xiaomi.model|Apps|🟢|PlayAutoInstalls"
XIAOMI_GUARD="com.miui.guardprovider|Seguridad|🟡|Escaneo de seguridad (consume recursos)"
XIAOMI_EXTRAPHOTO="com.miui.extraphoto|Apps|🟢|Funciones extra de fotos"
XIAOMI_MAINTENANCE="com.miui.maintenancemode|Sistema|🟢|Modo mantenimiento"
XIAOMI_MIFRONT="com.mi.mf.front|Sistema|🟢|Servicio de frente de Xiaomi"
XIAOMI_SMARTREPLY="com.miui.smartreply|Apps|🟢|Respuesta inteligente MIUI"
XIAOMI_SADS="com.miui.systemAdSolution|Anuncios|🟢|System Ad Solution"
XIAOMI_AB="com.xiaomi.ab|Sistema|🟢|Xiaomi AB (tracking)"
XIAOMI_JOYOSE="com.xiaomi.joyose|Sistema|🟡|Joyose (gestión de rendimiento/limite)"
XIAOMI_TDS="com.miui.touchassistant|Apps|🟢|Quick Ball / Asistente táctil"

# ─── GOOGLE — BLOATWARE ───

GOOGLE_MUSIC="com.google.android.music|Apps|🟢|Google Play Music (descontinuado)"
GOOGLE_VIDEOS="com.google.android.videos|Apps|🟢|Google TV / Películas"
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
GOOGLE_CHROME="com.android.chrome|Apps|🟢|Chrome"
GOOGLE_GMAIL="com.google.android.gm|Apps|🔴|Gmail (¡cuidado!)"
GOOGLE_MAPS="com.google.android.apps.maps|Apps|🔴|Google Maps (¡cuidado!)"
GOOGLE_PHOTOS="com.google.android.apps.photos|Apps|🟢|Google Fotos"
GOOGLE_PLAYSTORE="com.android.vending|Sistema|🔴|Play Store (¡NUNCA desactivar!)"
GOOGLE_PLAY_SERVICES="com.google.android.gms|Sistema|🔴|Google Play Services (¡NUNCA!)"
GOOGLE_SEARCH="com.google.android.googlequicksearchbox|Apps|🟡|Google Search/Búsqueda"
GOOGLE_MESSAGES="com.google.android.apps.messaging|Apps|🟢|Google Messages"
GOOGLE_CLOCK="com.google.android.deskclock|Apps|🟡|Google Reloj"
GOOGLE_CALENDAR="com.google.android.calendar|Apps|🟡|Google Calendario"
GOOGLE_CONTACTS="com.google.android.contacts|Apps|🟡|Google Contactos"
GOOGLE_DIALER="com.google.android.dialer|Apps|🟡|Google Dialer"
GOOGLE_FILES="com.google.android.apps.nbu.files|Apps|🟡|Google Files"
GOOGLE_TALKBACK="com.google.android.marvin.talkback|Accesibilidad|🟢|Suite de Accesibilidad (TalkBack)"
GOOGLE_ADSERVICES="com.google.android.adservices.api|Privacidad|🟢|Privacidad de anuncios"
GOOGLE_ONDEVICE="com.android.ondevicepersonalization.services|Privacidad|🟢|Personalización en dispositivo"
GOOGLE_PARTNERBM="com.android.providers.partnerbookmarks|Apps|🟢|Marcadores del socio"
GOOGLE_ONETIMEINIT="com.google.android.onetimeinitializer|Apps|🟢|Google One Time Init"
GOOGLE_FEEDBACK="com.google.android.feedback|Apps|🟢|Agente de comentarios"
GOOGLE_TACHYON="com.google.android.apps.tachyon|Apps|🟢|Google Meet"
GOOGLE_SUPERVISION="com.google.android.gms.supervision|Familia|🟢|Controles parentales del sistema"
GOOGLE_YOUTUBE="com.google.android.youtube|Apps|🟡|YouTube"

# ─── FACEBOOK / META — BLOATWARE ───

FACEBOOK="com.facebook.katana|Social|🟢|Facebook app"
FACEBOOK_SYSTEM="com.facebook.system|Social|🟢|Instalador de aplicaciones de Meta"
FACEBOOK_APPMGR="com.facebook.appmanager|Social|🟢|Administrador de aplicaciones de Meta"
FACEBOOK_SERVICES="com.facebook.services|Social|🟢|Servicios de Meta"
INSTAGRAM="com.instagram.android|Social|🟡|Instagram"
WHATSAPP="com.whatsapp|Social|🔴|WhatsApp (¡cuidado!)"

# ─── MICROSOFT — BLOATWARE ───

MICROSOFT_LINKTOWIN="com.microsoft.appmanager|Apps|🟢|Enlace a Windows"

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
MESSAGES_APP="com.android.mms|Sistema|🔴|Mensajes del sistema (¡NUNCA!)"
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
    "com.miui.msightservice"
    "com.miui.thirdappassistant"
    "com.miui.miservice"
    # Apps Xiaomi
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.xiaomi.glgm"
    "com.xiaomi.scanner"
    "com.miui.voiceassist"
    "com.miui.weather2"
    "com.miui.globalminuscreen"
    "com.miui.yellowpage"
    "com.xiaomi.aiasst.vision"
    "com.xiaomi.mispicks"
    "com.xiaomi.payment"
    # Google
    "com.google.android.music"
    "com.google.android.videos"
    "com.google.android.apps.googleassistant"
    "com.google.ar.lens"
    "com.google.android.apps.turbo"
    "com.google.android.apps.magazines"
    "com.google.android.marvin.talkback"
    "com.google.android.adservices.api"
    "com.android.ondevicepersonalization.services"
    "com.android.providers.partnerbookmarks"
    "com.google.android.onetimeinitializer"
    "com.google.android.feedback"
    "com.google.android.apps.tachyon"
    "com.google.android.gms.supervision"
    # Facebook / Meta
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    # Microsoft
    "com.microsoft.appmanager"
    # Amazon
    "com.amazon.appmanager"
    "com.amazon.kindle"
    "com.amazon.dee.app"
    # Netflix
    "com.netflix.partner.activation"
    # Carrier
    "com.android.carrierdefaultinstaller"
    # HyperOS extras
    "com.miui.guardprovider"
    "com.miui.extraphoto"
    "com.miui.maintenancemode"
    "com.mi.mf.front"
    "com.miui.smartreply"
    "com.miui.systemAdSolution"
    "com.xiaomi.ab"
    "com.xiaomi.joyose"
    "com.miui.touchassistant"
)

EQUILIBRADO_BLOAT=(
    # Solo lo 100% seguro
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.xiaomi.glgm"
    "com.miui.globalminuscreen"
    "com.miui.yellowpage"
    "com.xiaomi.aiasst.vision"
    "com.xiaomi.mispicks"
    "com.google.android.adservices.api"
    "com.google.android.marvin.talkback"
    "com.google.android.videos"
    "com.google.android.apps.tachyon"
    "com.google.android.feedback"
    "com.android.ondevicepersonalization.services"
    "com.android.providers.partnerbookmarks"
    "com.google.android.onetimeinitializer"
    "com.google.android.gms.supervision"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.microsoft.appmanager"
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
    "com.miui.msightservice"
    "com.miui.globalminuscreen"
    "com.xiaomi.aiasst.vision"
    "com.google.android.adservices.api"
    "com.google.android.marvin.talkback"
    "com.google.android.apps.googleassistant"
    "com.google.android.apps.turbo"
    "com.google.android.videos"
    "com.google.android.apps.tachyon"
    "com.google.android.feedback"
    "com.google.android.gms.supervision"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.microsoft.appmanager"
    "com.amazon.appmanager"
    "com.netflix.partner.activation"
)

GAMING_BLOAT=(
    # Mínimo para liberar RAM + todo lo de rendimiento
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.daemon"
    "com.miui.bugreport"
    "com.miui.hybrid"
    "com.miui.msightservice"
    "com.miui.thirdappassistant"
    "com.miui.miservice"
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.xiaomi.glgm"
    "com.xiaomi.scanner"
    "com.miui.voiceassist"
    "com.miui.weather2"
    "com.miui.globalminuscreen"
    "com.miui.yellowpage"
    "com.xiaomi.aiasst.vision"
    "com.xiaomi.mispicks"
    "com.xiaomi.payment"
    "com.google.android.music"
    "com.google.android.videos"
    "com.google.android.apps.googleassistant"
    "com.google.ar.lens"
    "com.google.android.apps.turbo"
    "com.google.android.apps.magazines"
    "com.google.android.marvin.talkback"
    "com.google.android.adservices.api"
    "com.android.ondevicepersonalization.services"
    "com.android.providers.partnerbookmarks"
    "com.google.android.onetimeinitializer"
    "com.google.android.feedback"
    "com.google.android.apps.tachyon"
    "com.google.android.gms.supervision"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.microsoft.appmanager"
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
