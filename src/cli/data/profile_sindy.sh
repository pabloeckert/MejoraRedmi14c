#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  profile_sindy.sh — Perfil whitelist para el dispositivo de Sindy
#  Serial: VOSWQCOVJVQWT8LR
#
#  A DIFERENCIA de bloatware_db.sh (blacklist: "estas apps se eliminan"),
#  este perfil es WHITELIST: "estas apps se protegen, TODO el resto de
#  apps de terceros (pm list packages -3) se desactiva".
#
#  Mantenido a mano por Pablo — NO es profile_runtime.sh (ese es
#  auto-generado por la UI Python pausada, no editar ese a mano).
#
#  Usado por bloatware_run_whitelist() en engines/bloatware.sh, vía
#  modes/sindy_optimize.sh (run.sh --sindy).
# ═══════════════════════════════════════════════════════════════

PROFILE_SINDY_WHITELIST=(
    # ─── WhatsApp — CONFIRMADO por pm list packages -3: solo tiene Business ───
    "com.whatsapp.w4b"

    # ─── Cámara ya está protegida por CRITICAL_SYSTEM_APPS (com.android.camera) ───
    # No necesita estar acá — is_critical_pkg() la protege antes de llegar
    # a la whitelist. Se documenta igual por claridad.

    # ─── Finanzas / identidad / trabajo (Argentina) — NUNCA borrar sin OK ───
    "com.dolarapp"
    "com.tarjetanaranja.ncuenta"
    "ar.com.bancoprovincia.CuentaDNI"
    "com.takenos"
    "com.mosync.app_Banco_Galicia"
    "com.applemoncash"
    "com.astropaycard.android"
    "com.brubank"
    "com.supervielle"
    "air.PrexArgentina"
    "ar.com.bdsol.bds"
    "com.iol.brokerarg"
    "dibi.atmseguros"
    "ar.gob.afip.mobile.android.contribuyentes.monotributo"
    "ar.gob.afip.facturador"
    "com.isalud.app"
    "com.centraldepasajes"

    # ─── Ofimática / notas / calendario — solo consulta ───
    "com.microsoft.office.word"
    "com.microsoft.office.powerpoint"
    "com.microsoft.office.outlook"
    "com.microsoft.skydrive"
    "com.google.android.calendar"
    "com.google.android.keep"
    "com.miui.notes"

    # ─── Asistentes de IA — herramientas de trabajo ───
    "com.moonshot.kimichat"
    "com.deepseek.chat"
    "ai.x.grok"
    "com.openai.chatgpt"
    "com.anthropic.claude"
    "com.microsoft.copilot"

    # ─── Documentos / escaneo / diseño — "registro laboral", igual que Cámara ───
    "com.ocr.camscanner"
    "com.adobe.scan.android"
    "com.canva.editor"
    "com.adobe.spark.post"
    "com.miui.mediaeditor"

    # ─── Transporte ───
    "com.ubercab"
    "com.didiglobal.passenger"

    # ─── Utilidades del sistema (Xiaomi/Google) — bajo riesgo ───
    "com.xiaomi.midrop"
    "com.android.deskclock"
    "com.miui.calculator"
    "com.miui.compass"
    "com.miui.screenrecorder"
    "com.android.soundrecorder"
    "com.miui.weather2"
    "com.xiaomi.scanner"
    "life.widget.accurate.channel.local.weather.forecast"
    "aplicacion.tiempo"
    "org.altervista.netlab.liquidhourglass"
    "com.google.android.apps.nbu.files"
    "com.google.android.contactkeys"
    "com.google.android.apps.adm"
    "com.google.android.safetycore"

    # ─── Salud / bienestar ───
    "com.mentallabs.mentalhealth"
    "weightloss.weightlossforwomen.workoutforwomen.womenworkout"

    # ─── Noticias ───
    "com.tachanfil.diariosargentinos"

    # ██████████████████████████████████████████████████████████████████
    # ⚠️ BLOQUEANTE — pendiente de confirmación explícita de Pablo:
    #
    # Juegos (9 instalados):
    # "com.mintgames.wordtrip"
    # "com.nf.snake"
    # "com.blackout.word"
    # "com.ea.game.pvzfree_row"
    # "com.dreamgames.royalkingdom"
    # "com.easybrain.number.puzzle.game"
    # "com.friendlygames.gamecloner"
    # "com.Earthkwak.Platformer"
    # "com.unicostudio.braintest2new"
    #
    # Redes sociales / entretenimiento:
    # "com.facebook.katana"
    # "com.instagram.android"
    # "com.zhiliaoapp.musically"     # TikTok
    # "org.telegram.messenger"
    # "com.spotify.music"
    #
    # Sin identificar — confirmar con Sindy qué son:
    # "com.naturalsoft.personalweb"
    # "com.fiwind.app"
    # "io.eist.app"
    # ██████████████████████████████████████████████████████████████████
)
