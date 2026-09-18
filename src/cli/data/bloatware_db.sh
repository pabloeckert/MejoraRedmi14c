#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  bloatware_db.sh — Catálogo canónico de perfiles de debloat
#  Fuente de verdad Bash para los arrays que usa bloatware.sh
#
#  IMPORTANTE: esta lista es el espejo de forge/core/apps_catalog.py
#  Si agregás una app acá, agregala allá también (y viceversa).
#
#  Reglas:
#    - NUNCA incluir com.xiaomi.joyose (brick térmico garantizado)
#    - NUNCA incluir apps de CRITICAL_SYSTEM_APPS de config.sh
#    - Siempre usar safe_disable_pkg() — no pm uninstall directo
# ═══════════════════════════════════════════════════════════════

# ─── Perfil base: Poco Mode (optimización completa) ──────────────────────────
# Apps sociales / entretenimiento pesadas que corren en background.
# El usuario puede proteger cualquiera de estas desde el wizard de perfil.
# Sprint 3: run.sh lee apps_keep del profile_json y excluye dinámicamente.

PROFILE_POCO_MODE=(
    # Facebook / Meta
    "com.facebook.katana"           # Facebook (nombre viejo)
    "com.facebook.stella"           # Facebook (nombre nuevo, 2024+)
    "com.facebook.orca"             # Messenger
    "com.facebook.lite"             # Facebook Lite
    "com.facebook.services"         # Servicios Facebook (telemetría)
    "com.facebook.system"           # Sistema Facebook (telemetría)

    # Redes sociales
    "com.instagram.android"         # Instagram
    "com.zhiliaoapp.musically"      # TikTok (global)
    "com.ss.android.ugc.trill"      # TikTok (regional, mismo package distinto)
    "com.twitter.android"           # X / Twitter
    "com.snapchat.android"          # Snapchat
    "com.pinterest"                 # Pinterest
    "com.reddit.frontpage"          # Reddit
    "com.linkedin.android"          # LinkedIn

    # Google pesado
    "com.google.android.youtube"    # YouTube
    "com.google.android.apps.maps"  # Google Maps
    "com.google.android.gm"         # Gmail
    "com.android.chrome"            # Chrome
    "com.google.android.videos"     # Google Videos
    "com.google.android.apps.youtube.music"  # YouTube Music
    "com.google.android.apps.tachyon"        # Google Meet
    "com.google.android.talk"                # Google Chat
    "com.google.android.apps.subscriptions.red" # Google One
    "com.google.android.apps.chromecast.app"    # Google Home

    # Entretenimiento
    "com.spotify.music"             # Spotify
    "com.netflix.mediaclient"       # Netflix
    "tv.twitch.android.app"         # Twitch
    "com.amazon.mShop.android.shopping" # Amazon Shopping

    # Microsoft preinstalado
    "com.microsoft.office.word"
    "com.microsoft.office.excel"
    "com.microsoft.office.powerpoint"
    "com.microsoft.office.outlook"
    "com.microsoft.skydrive"        # OneDrive
    "com.microsoft.teams"
    "com.microsoft.bing"
)

# ─── Perfil de Producción: Debloat Silencioso ────────────────────────────────
# Desactiva GetApps, telemetría (MSA, Analytics, Daemon), Xiaomi Cloud,
# herramientas de publicidad y servicios invasivos sin romper notificaciones.
# NUNCA toca: com.xiaomi.joyose, com.xiaomi.xmsf, com.miui.securitycenter,
# ni apps de la lista blanca estricta (dialer, contactos, SIM, WA, Google).

PROFILE_SILENT_DEBLOAT=(
    # GetApps (tienda secundaria Xiaomi con notificaciones agresivas)
    "com.xiaomi.mipicks"

    # Telemetría y publicidad Xiaomi / HyperOS
    "com.miui.msa.global"               # MIUI Ad Solution
    "com.miui.analytics"                # Analíticas y telemetría
    "com.miui.AnalyticsCore"            # Core de análisis
    "com.miui.daemon"                   # Daemon de reporte en background
    "com.miui.systemAdSolution"         # Inyector de anuncios
    "com.miui.bugreport"                # Crash report / telemetría
    "com.miui.miservice"                # Servicios y comentarios con telemetría

    # Xiaomi Cloud y sincronización
    "com.miui.cloudservice"             # Servicio base Mi Cloud
    "com.miui.cloudbackup"              # Copia de seguridad Mi Cloud
    "com.miui.micloudsync"              # Sincronización continua Mi Cloud
    "com.miui.cloudservice.sysbase"     # Servicio de sistema Mi Cloud

    # Módulos de publicidad y bloatware asociados a Security Center / Sistema
    "com.miui.cleanmaster"              # Limpiador con SDK publicitario Cheetah
    "com.miui.hybrid"                   # Quick Apps / WebView con anuncios
    "com.miui.hybrid.accessory"         # Accesorio Quick Apps
    "com.mi.globalminusscreen"          # Pantalla -1 / App Vault con publicidad
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

# ─── Telemetría Xiaomi / MIUI — se elimina siempre en full y profile ─────────
PROFILE_XIAOMI_TELEMETRY=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.systemAdSolution"
    "com.miui.daemon"
    "com.miui.AnalyticsCore"
    "com.miui.bugreport"
    "com.miui.miservice"
    "com.miui.hybrid"
    "com.miui.hybrid.accessory"
    "com.miui.cleanmaster"
    "com.miui.cloudservice"
    "com.miui.cloudbackup"
    "com.miui.micloudsync"
    "com.miui.cloudservice.sysbase"
    "com.mi.globalminusscreen"
    "com.xiaomi.mipicks"
    "com.xiaomi.payment"
    "com.xiaomi.gamecenter"
    "com.xiaomi.glgm"
    "com.xiaomi.drivemode"
    "com.xiaomi.scanner"
)

# ─── Perfil mantenimiento (más conservador) ───────────────────────────────────
PROFILE_MAINTENANCE=(
    "com.facebook.services"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.systemAdSolution"
    "com.miui.daemon"
    "com.miui.AnalyticsCore"
    "com.xiaomi.mipicks"
    "com.miui.cleanmaster"
)

# ─── Helper: nombre legible desde package (para logging) ─────────────────────
pkg_name() {
    local pkg="$1"
    case "$pkg" in
        com.facebook.katana)              echo "Facebook" ;;
        com.facebook.stella)              echo "Facebook (nuevo paquete)" ;;
        com.facebook.orca)                echo "Messenger" ;;
        com.facebook.lite)                echo "Facebook Lite" ;;
        com.facebook.services)            echo "Servicios Facebook" ;;
        com.facebook.system)              echo "Sistema Facebook" ;;
        com.facebook.appmanager)          echo "Facebook App Manager" ;;
        com.instagram.android)            echo "Instagram" ;;
        com.whatsapp)                     echo "WhatsApp" ;;
        com.whatsapp.w4b)                 echo "WhatsApp Business" ;;
        com.zhiliaoapp.musically)         echo "TikTok" ;;
        com.ss.android.ugc.trill)         echo "TikTok (regional)" ;;
        com.twitter.android)              echo "X (Twitter)" ;;
        com.snapchat.android)             echo "Snapchat" ;;
        com.pinterest)                    echo "Pinterest" ;;
        com.reddit.frontpage)             echo "Reddit" ;;
        com.linkedin.android)             echo "LinkedIn" ;;
        com.google.android.youtube)       echo "YouTube" ;;
        com.google.android.apps.maps)     echo "Google Maps" ;;
        com.google.android.gm)            echo "Gmail" ;;
        com.android.chrome)               echo "Chrome" ;;
        com.google.android.videos)        echo "Google Videos" ;;
        com.google.android.apps.youtube.music) echo "YouTube Music" ;;
        com.google.android.apps.tachyon)  echo "Google Meet" ;;
        com.google.android.talk)          echo "Google Chat" ;;
        com.google.android.apps.subscriptions.red) echo "Google One" ;;
        com.google.android.apps.chromecast.app)    echo "Google Home" ;;
        com.spotify.music)                echo "Spotify" ;;
        com.netflix.mediaclient)          echo "Netflix" ;;
        tv.twitch.android.app)            echo "Twitch" ;;
        com.amazon.mShop.android.shopping) echo "Amazon" ;;
        com.microsoft.office.word)        echo "Word" ;;
        com.microsoft.office.excel)       echo "Excel" ;;
        com.microsoft.office.powerpoint)  echo "PowerPoint" ;;
        com.microsoft.office.outlook)     echo "Outlook" ;;
        com.microsoft.skydrive)           echo "OneDrive" ;;
        com.microsoft.teams)              echo "Teams" ;;
        com.microsoft.bing)               echo "Bing" ;;
        com.miui.analytics)               echo "Analíticas Xiaomi" ;;
        com.miui.msa.global)              echo "Anuncios MIUI (MSA)" ;;
        com.miui.systemAdSolution)        echo "Sistema de anuncios" ;;
        com.miui.daemon)                  echo "Telemetría MIUI Daemon" ;;
        com.miui.AnalyticsCore)           echo "Core análisis MIUI" ;;
        com.miui.bugreport)               echo "Reporte de bugs Xiaomi" ;;
        com.miui.miservice)               echo "Servicios y comentarios Xiaomi" ;;
        com.miui.cleanmaster)             echo "Limpiador Cheetah Ads" ;;
        com.miui.hybrid)                  echo "Quick Apps / WebView Ads" ;;
        com.miui.hybrid.accessory)        echo "Quick Apps Accessory" ;;
        com.mi.globalminusscreen)         echo "App Vault / Pantalla -1" ;;
        com.miui.cloudservice)            echo "Mi Cloud Service" ;;
        com.miui.cloudbackup)             echo "Mi Cloud Backup" ;;
        com.miui.micloudsync)             echo "Mi Cloud Sync" ;;
        com.miui.cloudservice.sysbase)    echo "Mi Cloud Sysbase" ;;
        com.xiaomi.mipicks)               echo "GetApps (tienda ads)" ;;
        com.xiaomi.payment)               echo "Mi Pay" ;;
        com.xiaomi.gamecenter)            echo "Game Center Xiaomi" ;;
        com.xiaomi.glgm)                  echo "Juegos Xiaomi" ;;
        com.xiaomi.drivemode)             echo "Modo conductor Xiaomi" ;;
        com.xiaomi.scanner)               echo "Escáner Xiaomi" ;;
        *)                                echo "$pkg" ;;
    esac
}
