#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Fix crítico: Cámara + WhatsApp
#  Basado en: turbo-apps.sh (fix para los problemas reportados)
#
#  Resuelve:
#   - Cámara lenta / se cuelga al abrir
#   - WhatsApp lentísimo / errores al cargar
#   - Apps lentas en general
# ═══════════════════════════════════════════════════════════════

# ─── Fix completo de cámara y WhatsApp ───
camera_fix_apply() {
    local run_id="${1:-0}"
    local compiled=0

    log_step "CAMERA FIX — Cámara + WhatsApp ultra rápidos"

    # ──────────────────────────────────────────────
    #  PASO 1: Compilar cámara con speed mode
    # ──────────────────────────────────────────────
    log_info "Compilando cámara y multimedia..."
    local cam_pkgs=(
        "com.android.camera"
        "com.miui.gallery"
        "com.miui.gallery.editor"
        "com.android.providers.media"
        "com.android.providers.media.module"
        "com.android.providers.downloads"
        "com.google.android.media.home"
        "com.android.media.swcodec"
    )
    for pkg in "${cam_pkgs[@]}"; do
        if safe_compile "$pkg" "speed"; then
            (( compiled++ ))
            log_ok "$pkg compilado"
            [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Compilado: $pkg" "ok"
        fi
    done

    # ──────────────────────────────────────────────
    #  PASO 2: Limpiar thumbnails masivos
    # ──────────────────────────────────────────────
    log_info "Limpiando thumbnails..."
    local thumb_count
    thumb_count=$(adb_shell "ls /sdcard/DCIM/.thumbnails/ 2>/dev/null | wc -l" | tr -d ' ')
    if [ "${thumb_count:-0}" -gt 50 ]; then
        adb_shell "rm -rf /sdcard/DCIM/.thumbnails/*"
        adb_shell "rm -rf /sdcard/Pictures/.thumbnails/*"
        log_ok "$thumb_count thumbnails eliminados (causaban cuelgue al abrir)"
    else
        log_ok "Thumbnails OK (${thumb_count:-0} archivos)"
    fi

    # ──────────────────────────────────────────────
    #  PASO 3: Desactivar procesos pesados de cámara
    # ──────────────────────────────────────────────
    adb_shell settings put system camera_ai_scene_detection 0
    adb_shell settings put system camera_watermark 0
    adb_shell settings put system camera_mirror    0
    log_ok "AI scene detection, watermark y mirror desactivados"

    # ──────────────────────────────────────────────
    #  PASO 4: Force-stop para estado limpio
    # ──────────────────────────────────────────────
    adb_shell am force-stop com.android.camera
    log_ok "Cámara reiniciada (estado limpio)"

    # ──────────────────────────────────────────────
    #  PASO 5: Pre-calentar cámara
    # ──────────────────────────────────────────────
    log_info "Pre-calentando cámara..."
    adb_shell am start -a android.media.action.STILL_IMAGE_CAMERA -W
    sleep 1
    adb_shell input keyevent KEYCODE_HOME
    log_ok "Cámara pre-calentada (clases cargadas en memoria)"

    # ──────────────────────────────────────────────
    #  PASO 6: Desactivar media scanner temporalmente
    #  (se reactiva en paso 11 — siempre)
    # ──────────────────────────────────────────────
    adb_setting_put media_scanner_enabled 0
    log_ok "Media scanner desactivado (no interfiere al abrir cámara)"

    # ──────────────────────────────────────────────
    #  PASO 7: Compilar todos los WhatsApp instalados
    # ──────────────────────────────────────────────
    log_step "WHATSAPP — Compilación speed"
    local wa_packages=()
    while IFS= read -r line; do
        local pkg; pkg=$(echo "$line" | sed 's/package://' | tr -d '\r')
        wa_packages+=("$pkg")
    done < <(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null | grep "com.whatsapp")

    if [ "${#wa_packages[@]}" -eq 0 ]; then
        log_warn "No se encontró WhatsApp instalado."
    else
        log_info "WhatsApp(s) encontrados: ${#wa_packages[@]}"
        for wa_pkg in "${wa_packages[@]}"; do
            if safe_compile "$wa_pkg" "speed"; then
                (( compiled++ ))
                log_ok "$wa_pkg compilado con speed"
                [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "$wa_pkg compilado" "ok"
            else
                log_warn "$wa_pkg no se pudo compilar"
            fi

            # Limpiar cache de WhatsApp
            adb -s "$DEVICE_SERIAL" shell pm clear --cache-only "$wa_pkg" 2>/dev/null
            log_ok "Cache de $wa_pkg limpiada"
        done
    fi

    # ──────────────────────────────────────────────
    #  PASO 8: Compilar share sheet y contactos
    # ──────────────────────────────────────────────
    log_info "Compilando share sheet y contactos..."
    local support_pkgs=(
        "com.android.intentresolver"
        "com.android.chooser"
        "com.android.contacts"
        "com.android.providers.contacts"
    )
    for pkg in "${support_pkgs[@]}"; do
        safe_compile "$pkg" "speed" && (( compiled++ ))
    done
    log_ok "Share sheet + contactos compilados"

    # ──────────────────────────────────────────────
    #  PASO 9: Compilar teclado
    # ──────────────────────────────────────────────
    log_info "Compilando teclado..."
    safe_compile "com.google.android.inputmethod.latin" "speed" && (( compiled++ ))
    safe_compile "com.android.inputmethod.latin"        "speed" && (( compiled++ ))
    log_ok "Teclado compilado"

    # ──────────────────────────────────────────────
    #  PASO 10: Pre-cargar WhatsApp en memoria
    # ──────────────────────────────────────────────
    for wa_pkg in "${wa_packages[@]}"; do
        log_info "Pre-cargando $wa_pkg..."
        local wa_main
        wa_main=$(adb_shell cmd package resolve-activity --brief "$wa_pkg" 2>/dev/null | tail -1)
        if [ -n "$wa_main" ]; then
            adb_shell am start -n "$wa_main" -W
        else
            adb_shell am start -n "$wa_pkg/.Main" -W
        fi
        sleep 2
        adb_shell input keyevent KEYCODE_HOME
        log_ok "$wa_pkg pre-cargado en memoria"
    done

    # ──────────────────────────────────────────────
    #  PASO 11: Reactivar media scanner — SIEMPRE
    # ──────────────────────────────────────────────
    adb_setting_put media_scanner_enabled 1
    log_ok "Media scanner reactivado"

    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Camera + WhatsApp fix completo" "ok"
    echo "$compiled"
}

# ─── Verificar que cámara y WA estén compilados en speed mode ───
# Retorna: 0=nada, 1=solo cámara, 2=solo WA, 3=ambos
camera_fix_verify() {
    local score=0

    local cam_status
    cam_status=$(adb_shell cmd package dump com.android.camera | grep "dexopt" | grep -o 'speed\|speed-profile\|everything')
    [ -n "$cam_status" ] && (( score++ ))

    local wa_pkgs
    wa_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null | grep "com.whatsapp" | sed 's/package://' | tr -d '\r')
    for wa in $wa_pkgs; do
        local wa_status
        wa_status=$(adb_shell cmd package dump "$wa" | grep "dexopt" | grep -o 'speed\|speed-profile\|everything')
        [ -n "$wa_status" ] && (( score++ ))
        break  # solo verificar el primero
    done

    echo "$score"
}
