#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Base de datos de bloatware
#  HyperOS 3.0 / Android 16 — Actualizado 2026
#
#  Niveles de riesgo:
#    SAFE     — Siempre seguro desactivar
#    ADVANCED — Puede afectar algunas funciones
#    DANGER   — Solo expertos, puede romper cosas
#
#  ADVERTENCIA: com.xiaomi.joyose NO está en ningún array.
#  Es el gestor térmico/rendimiento del Helio G81 Ultra.
#  Desactivarlo causa sobrecalentamiento severo en juegos.
#  Fuente: XDA Forums + comunidad HyperOS 2025-2026.
# ═══════════════════════════════════════════════════════════════

# ─── Telemetría / Analytics / Publicidad (siempre desactivar) ───
BLOAT_ANALYTICS=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.miui.systemAdSolution"
    "com.xiaomi.ab"
    "com.miui.daemon"
    "com.miui.msightservice"
    "com.miui.miservice"
    "com.miui.thirdappassistant"
    "com.miui.sads"
    "com.xiaomi.gamecenter.sdk.service"
    "com.miui.bugreport"
    "com.miui.hybrid"
    "com.miui.hybrid.accessory"
    "com.miui.audiomonitor"
)

# ─── Apps Xiaomi que la mayoría no usa ───
BLOAT_XIAOMI_APPS=(
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.notes"
    "com.miui.weather2"
    "com.miui.calculator"
    "com.miui.screenrecorder"
    "com.miui.gallery.editor"
    "com.miui.player"
    "com.miui.video"
    "com.miui.videoplayer"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.miui.personalassistant"
    "com.mi.globalminusscreen"
    "com.mi.globalbrowser"
    "com.mi.health"
    "com.miui.yellowpage"
    "com.miui.voiceassist"
    "com.miui.voicetrigger"
    "com.miui.touchassistant"
    "com.miui.userguide"
    "com.miui.android.fashiongallery"
    "com.miui.contentcatcher"
    "com.miui.phrase"
    "com.miui.smsextra"
    "com.miui.wmsvc"
    "com.miui.vsimcore"
    "com.miui.translation.kingsoft"
    "com.miui.translation.xmcloud"
    "com.miui.translation.youdao"
    "com.miui.translationservice"
    "com.miui.accessibility"
    "com.xiaomi.scanner"
    "com.xiaomi.mipicks"
    "com.xiaomi.payment"
    "com.xiaomi.aiasst.vision"
    "com.xiaomi.aicr"
    "com.xiaomi.midrop"
    "com.xiaomi.calendar"
    "com.xiaomi.mircs"
    "com.xiaomi.glgm"
    "cn.wps.xiaomi.abroad.lite"
    "com.android.thememanager"
    "com.miui.mishare.connectivity"
    "com.mi.webkit.core"
    "com.miui.nextpay"
)

# ─── Servicios Xiaomi cloud / sync (ADVANCED — evaluar caso a caso) ───
BLOAT_XIAOMI_SERVICES=(
    "com.miui.cloudbackup"
    "com.miui.cloudservice"
    "com.miui.micloudsync"
    "com.xiaomi.micloud.sdk"
    # com.xiaomi.finddevice — ADVANCED, no incluir si el usuario usa Find My Device
)

# ─── Apps Google que la mayoría no usa ───
BLOAT_GOOGLE=(
    "com.google.android.apps.tachyon"
    "com.google.android.videos"
    "com.google.android.apps.photos"
    "com.google.android.apps.wellbeing"
    "com.google.android.feedback"
    "com.google.android.marvin.talkback"
    "com.google.android.printservice.recommendation"
    "com.google.ar.lens"
    "com.android.printspooler"
    "com.android.bips"
    "com.android.bookmarkprovider"
    "com.android.statementservice"
    "com.android.wallpaper.livepicker"
    "com.google.android.apps.subscriptions.red"
    "com.google.android.apps.turbo"
    "com.google.android.onetimeinitializer"
    "com.google.android.gms.supervision"
    "com.google.android.adservices.api"
    "com.android.ondevicepersonalization.services"
    "com.android.providers.partnerbookmarks"
    "com.google.android.apps.docs"
    "com.google.android.apps.youtube.music"
    # com.android.chrome — ADVANCED: solo desactivar si tenés otro browser
)

# ─── Redes sociales y apps preinstaladas de terceros ───
BLOAT_SOCIAL=(
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
    "com.microsoft.appmanager"
)

BLOAT_PREINSTALLED=(
    "com.amazon.appmanager"
    "com.netflix.partner.activation"
    "com.netflix.mediaclient"
    "com.opera.app.news"
    "com.opera.branding"
    "com.opera.branding.news"
    "com.opera.mini.native"
    "com.opera.preinstall"
    "com.tencent.soter.soterserver"
    "com.sohu.inputmethod.sogou.xiaomi"
    "com.mobiletools.systemhelper"
    "com.android.carrierdefaultinstaller"
)

# ─── Perfiles predefinidos ───

# Poco Mode: máximo rendimiento (sin tocar apps críticas ni joyose)
PROFILE_POCO_MODE=(
    "${BLOAT_ANALYTICS[@]}"
    "${BLOAT_XIAOMI_APPS[@]}"
    "${BLOAT_XIAOMI_SERVICES[@]}"
    "${BLOAT_GOOGLE[@]}"
    "${BLOAT_SOCIAL[@]}"
    "${BLOAT_PREINSTALLED[@]}"
)

# Equilibrado: telemetría + redes sociales + preinstaladas
PROFILE_BALANCED=(
    "${BLOAT_ANALYTICS[@]}"
    "com.miui.compass"
    "com.miui.fm"
    "com.miui.cleanmaster"
    "com.miui.qrscanner"
    "com.miui.voiceassist"
    "com.miui.voicetrigger"
    "com.miui.yellowpage"
    "com.xiaomi.scanner"
    "com.xiaomi.mipicks"
    "com.xiaomi.aiasst.vision"
    "com.miui.audiomonitor"
    "${BLOAT_SOCIAL[@]}"
    "${BLOAT_PREINSTALLED[@]}"
)

# Seguro: solo lo que jamás se usa y no tiene riesgo alguno
PROFILE_SAFE=(
    "${BLOAT_ANALYTICS[@]}"
    "${BLOAT_SOCIAL[@]}"
    "${BLOAT_PREINSTALLED[@]}"
)

# Descripción legible de cada paquete (para logs y DB)
declare -A PKG_NAMES=(
    ["com.miui.analytics"]="Analytics Xiaomi"
    ["com.miui.msa.global"]="MSA Ad Services"
    ["com.miui.ad"]="MIUI Ads"
    ["com.miui.systemAdSolution"]="System Ad Solution"
    ["com.xiaomi.ab"]="Xiaomi AB tracking"
    ["com.miui.daemon"]="MIUI Daemon"
    ["com.miui.msightservice"]="Monitoreo de calidad"
    ["com.miui.miservice"]="Services & Feedback"
    ["com.miui.thirdappassistant"]="App Asistente"
    ["com.miui.sads"]="MIUI SADS"
    ["com.xiaomi.gamecenter.sdk.service"]="Game Center SDK"
    ["com.miui.bugreport"]="Bug Report"
    ["com.miui.hybrid"]="Quick Apps"
    ["com.miui.hybrid.accessory"]="Quick Apps accessory"
    ["com.miui.audiomonitor"]="Audio Monitor"
    ["com.miui.compass"]="Brújula"
    ["com.miui.fm"]="Radio FM"
    ["com.miui.notes"]="Notas MIUI"
    ["com.miui.weather2"]="Clima MIUI"
    ["com.miui.calculator"]="Calculadora MIUI"
    ["com.miui.screenrecorder"]="Grabador de pantalla"
    ["com.miui.gallery.editor"]="Editor de galería"
    ["com.miui.player"]="Mi Music"
    ["com.miui.video"]="Mi Video"
    ["com.miui.videoplayer"]="Video Player"
    ["com.miui.cleanmaster"]="Clean Master"
    ["com.miui.qrscanner"]="QR Scanner"
    ["com.miui.personalassistant"]="App Vault"
    ["com.mi.globalminusscreen"]="App Vault Global (pantalla -1)"
    ["com.mi.globalbrowser"]="Mi Browser"
    ["com.mi.health"]="Mi Health"
    ["com.miui.yellowpage"]="Páginas Amarillas"
    ["com.miui.voiceassist"]="Asistente de voz"
    ["com.miui.voicetrigger"]="Voice Trigger"
    ["com.miui.touchassistant"]="Quick Ball"
    ["com.miui.userguide"]="Guía de usuario"
    ["com.miui.android.fashiongallery"]="Wallpaper Carousel"
    ["com.miui.contentcatcher"]="Content Catcher"
    ["com.miui.phrase"]="Phrase"
    ["com.miui.smsextra"]="SMS Extra"
    ["com.miui.wmsvc"]="WM Service"
    ["com.miui.vsimcore"]="VSIM Core"
    ["com.miui.translation.kingsoft"]="Traducción Kingsoft"
    ["com.miui.translation.xmcloud"]="Traducción Cloud"
    ["com.miui.translation.youdao"]="Traducción Youdao"
    ["com.miui.translationservice"]="Translation Service"
    ["com.miui.accessibility"]="Mi Ditto"
    ["com.xiaomi.scanner"]="Xiaomi Scanner"
    ["com.xiaomi.mipicks"]="GetApps (Tienda Xiaomi)"
    ["com.xiaomi.payment"]="Mi Pay"
    ["com.xiaomi.aiasst.vision"]="Subtítulos IA"
    ["com.xiaomi.aicr"]="Xiaomi AICR"
    ["com.xiaomi.midrop"]="Mi Drop"
    ["com.xiaomi.calendar"]="Mi Calendar"
    ["com.xiaomi.mircs"]="Message Service"
    ["com.xiaomi.glgm"]="Game Center"
    ["cn.wps.xiaomi.abroad.lite"]="WPS Lite"
    ["com.android.thememanager"]="Theme Manager"
    ["com.miui.mishare.connectivity"]="Mi Share"
    ["com.mi.webkit.core"]="Mi Webkit"
    ["com.miui.nextpay"]="Next Pay"
    ["com.miui.cloudbackup"]="Cloud Backup"
    ["com.miui.cloudservice"]="Cloud Service"
    ["com.miui.micloudsync"]="Cloud Sync"
    ["com.xiaomi.micloud.sdk"]="Cloud SDK"
    ["com.google.android.apps.tachyon"]="Google Meet"
    ["com.google.android.videos"]="Google TV"
    ["com.google.android.apps.photos"]="Google Photos"
    ["com.google.android.apps.wellbeing"]="Digital Wellbeing"
    ["com.google.android.feedback"]="Google Feedback"
    ["com.google.android.marvin.talkback"]="TalkBack"
    ["com.google.android.printservice.recommendation"]="Print Service"
    ["com.google.ar.lens"]="AR Lens"
    ["com.android.printspooler"]="Print Spooler"
    ["com.android.bips"]="Default Printing"
    ["com.android.bookmarkprovider"]="Bookmark Provider"
    ["com.android.statementservice"]="Statement Service"
    ["com.android.wallpaper.livepicker"]="Live Wallpaper"
    ["com.google.android.apps.subscriptions.red"]="Google One"
    ["com.google.android.apps.turbo"]="Device Health"
    ["com.google.android.onetimeinitializer"]="One Time Initializer"
    ["com.google.android.gms.supervision"]="Google Supervision"
    ["com.google.android.adservices.api"]="Ad Services API"
    ["com.android.ondevicepersonalization.services"]="On Device Personalization"
    ["com.android.providers.partnerbookmarks"]="Partner Bookmarks"
    ["com.google.android.apps.docs"]="Google Docs"
    ["com.google.android.apps.youtube.music"]="YouTube Music"
    ["com.facebook.katana"]="Facebook"
    ["com.facebook.system"]="Facebook System"
    ["com.facebook.appmanager"]="Facebook App Manager"
    ["com.facebook.services"]="Facebook Services"
    ["com.microsoft.appmanager"]="Microsoft App Manager"
    ["com.amazon.appmanager"]="Amazon App Manager"
    ["com.netflix.partner.activation"]="Netflix Partner"
    ["com.netflix.mediaclient"]="Netflix"
    ["com.opera.app.news"]="Opera News"
    ["com.opera.branding"]="Opera Branding"
    ["com.opera.branding.news"]="Opera Branding News"
    ["com.opera.mini.native"]="Opera Mini"
    ["com.opera.preinstall"]="Opera Preinstall"
    ["com.tencent.soter.soterserver"]="Tencent Soter"
    ["com.sohu.inputmethod.sogou.xiaomi"]="Sogou Input"
    ["com.mobiletools.systemhelper"]="System Helper"
    ["com.android.carrierdefaultinstaller"]="Carrier Installer"
)

# Obtener nombre legible de un paquete
pkg_name() {
    local pkg="$1"
    echo "${PKG_NAMES[$pkg]:-$pkg}"
}
