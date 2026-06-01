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

# ─── Telemetría Xiaomi / MIUI — se elimina siempre, sin opción de proteger ───
# El usuario no elige mantener esto. No hay caso legítimo para querer analytics
# y anuncios de Xiaomi activos.

PROFILE_XIAOMI_TELEMETRY=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.systemAdSolution"
    "com.miui.daemon"
    "com.miui.AnalyticsCore"
    "com.miui.hybrid"
    "com.miui.cloudservice"
    "com.miui.cloudbackup"
    "com.xiaomi.mipicks"            # GetApps — tienda Xiaomi con ads
    "com.xiaomi.payment"            # Mi Pay (si no lo usa)
    "com.xiaomi.drivemode"          # Modo conductor
)

# ─── Perfil mantenimiento (más conservador) ───────────────────────────────────
# Solo apps que definitivamente nadie en Argentina usa activamente.

PROFILE_MAINTENANCE=(
    "com.facebook.services"
    "com.facebook.system"
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.systemAdSolution"
    "com.miui.daemon"
    "com.miui.AnalyticsCore"
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
        com.instagram.android)            echo "Instagram" ;;
        com.whatsapp)                     echo "WhatsApp" ;;
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
        com.miui.msa.global)              echo "Anuncios MIUI" ;;
        com.miui.systemAdSolution)        echo "Sistema de anuncios" ;;
        com.miui.daemon)                  echo "Telemetría MIUI" ;;
        com.miui.AnalyticsCore)           echo "Core análisis MIUI" ;;
        com.miui.hybrid)                  echo "WebView MIUI" ;;
        com.miui.cloudservice)            echo "Nube Xiaomi" ;;
        com.miui.cloudbackup)             echo "Backup nube Xiaomi" ;;
        com.xiaomi.mipicks)               echo "GetApps" ;;
        com.xiaomi.payment)               echo "Mi Pay" ;;
        com.xiaomi.drivemode)             echo "Modo conductor Xiaomi" ;;
        *)                                echo "$pkg" ;;
    esac
}
