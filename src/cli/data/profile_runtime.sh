#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  profile_runtime.sh — Perfil Definitivo de Producción (Redmi 14C)
#  Target: HyperOS 3.0 / Android 16 / Helio G81 Ultra
#
#  Debloat Silencioso configurado:
#  - GetApps desactivado
#  - Telemetría Xiaomi (MSA, Analytics, Daemon, SystemAdSolution, BugReport)
#  - Mi Cloud (CloudService, CloudBackup, CloudSync, SysBase)
#  - Publicidad y bloatware de Security Center (CleanMaster SDK, Quick Apps, App Vault)
#  - Telemetría en background de Meta / Facebook
#
#  Lista Blanca Estricta (INTOCABLES):
#  - Telefonía (Dialer Google/AOSP, Contactos, SIM Toolkit, Telecom)
#  - Mensajería (WhatsApp estándar y Business, SMS)
#  - Servicios Google (GMS, Play Store, GSF, Sync, Keep, Calendar, Gboard)
#  - Reproducción multimedia (Galería, Fotos, Mi Video, Mi Player, Media Providers)
#  - Core OS y Notificaciones (SystemUI, Settings, MiuiHome, Joyose, XMSF)
# ═══════════════════════════════════════════════════════════════

PROFILE_RUNTIME=(
    # GetApps (tienda secundaria Xiaomi con notificaciones agresivas)
    "com.xiaomi.mipicks"

    # Telemetría y publicidad Xiaomi / HyperOS
    "com.miui.msa.global"               # MIUI Ad Solution (MSA)
    "com.miui.analytics"                # Analíticas y telemetría
    "com.miui.AnalyticsCore"            # Core de análisis
    "com.miui.daemon"                   # Daemon de reporte en background
    "com.miui.systemAdSolution"         # Inyector de anuncios del sistema
    "com.miui.bugreport"                # Telemetría de errores y logs
    "com.miui.miservice"                # Servicios y comentarios con telemetría

    # Xiaomi Cloud y sincronización no utilizada
    "com.miui.cloudservice"             # Servicio base Mi Cloud
    "com.miui.cloudbackup"              # Copia de seguridad en la nube Xiaomi
    "com.miui.micloudsync"              # Sincronización continua en background
    "com.miui.cloudservice.sysbase"     # Servicio de sistema Mi Cloud

    # Módulos de publicidad y bloatware asociados a Security Center / Sistema
    "com.miui.cleanmaster"              # Limpiador con SDK publicitario Cheetah
    "com.miui.hybrid"                   # Quick Apps / WebView con feeds publicitarios
    "com.miui.hybrid.accessory"         # Quick Apps Accessory
    "com.mi.globalminusscreen"          # App Vault / Pantalla -1 con publicidad
    "com.xiaomi.payment"                # Mi Pay
    "com.xiaomi.gamecenter"             # Game Center Xiaomi
    "com.xiaomi.glgm"                   # Juegos promocionales Xiaomi
    "com.xiaomi.drivemode"              # Modo conductor
    "com.xiaomi.scanner"                # Escáner Xiaomi con publicidad

    # Telemetría en background de Meta / Facebook
    "com.facebook.services"             # Servicios en segundo plano
    "com.facebook.system"               # App de sistema Facebook
    "com.facebook.appmanager"           # Gestor de instalación en segundo plano
)
