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

    log_step "CAMERA FIX — Cámara + WhatsApp optimizados (speed-profile)"

    # ──────────────────────────────────────────────
    #  PASO 1: Compilar cámara y multimedia (speed-profile)
    # ──────────────────────────────────────────────
    log_info "Compilando cámara y multimedia (speed-profile)..."
    local cam_pkgs=(
        "com.android.camera"
        "com.miui.gallery"
        "com.android.providers.media"
        "com.android.providers.downloads"
    )
    for pkg in "${cam_pkgs[@]}"; do
        if safe_compile "$pkg" "speed-profile"; then
            (( compiled++ ))
            log_ok "$pkg compilado (speed-profile)"
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
        adb_shell "rm -rf /sdcard/DCIM/.thumbnails/*" 2>/dev/null
        adb_shell "rm -rf /sdcard/Pictures/.thumbnails/*" 2>/dev/null
        log_ok "$thumb_count thumbnails eliminados (evita cuelgues al abrir galería/cámara)"
    else
        log_ok "Thumbnails OK (${thumb_count:-0} archivos)"
    fi

    # ──────────────────────────────────────────────
    #  PASO 3: Force-stop para estado limpio
    # ──────────────────────────────────────────────
    adb_shell am force-stop com.android.camera 2>/dev/null
    log_ok "Cámara reiniciada (estado limpio en memoria)"

    # ──────────────────────────────────────────────
    #  PASO 4: Compilar WhatsApps instalados (speed-profile)
    # ──────────────────────────────────────────────
    log_step "WHATSAPP — Compilación speed-profile"
    local wa_packages=()
    while IFS= read -r line; do
        local pkg; pkg=$(echo "$line" | sed 's/package://' | tr -d '\r')
        [ -n "$pkg" ] && wa_packages+=("$pkg")
    done < <(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null | grep "com.whatsapp")

    if [ "${#wa_packages[@]}" -eq 0 ]; then
        log_warn "No se encontró WhatsApp instalado."
    else
        log_info "WhatsApp(s) encontrados: ${#wa_packages[@]}"
        for wa_pkg in "${wa_packages[@]}"; do
            if safe_compile "$wa_pkg" "speed-profile"; then
                (( compiled++ ))
                log_ok "$wa_pkg compilado (speed-profile)"
                [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "$wa_pkg compilado" "ok"
            else
                log_warn "$wa_pkg no se pudo compilar"
            fi

            # Limpiar cache de WhatsApp
            adb -s "$DEVICE_SERIAL" shell pm clear --cache-only "$wa_pkg" 2>/dev/null
            log_ok "Caché de $wa_pkg limpiada"
        done
    fi

    # ──────────────────────────────────────────────
    #  PASO 5: Compilar share sheet y contactos (speed-profile)
    # ──────────────────────────────────────────────
    log_info "Compilando share sheet y contactos..."
    local support_pkgs=(
        "com.android.intentresolver"
        "com.android.chooser"
        "com.android.contacts"
        "com.android.providers.contacts"
    )
    for pkg in "${support_pkgs[@]}"; do
        safe_compile "$pkg" "speed-profile" && (( compiled++ ))
    done
    log_ok "Share sheet + contactos compilados"

    # ──────────────────────────────────────────────
    #  PASO 6: Compilar teclado (speed-profile)
    # ──────────────────────────────────────────────
    log_info "Compilando teclado..."
    safe_compile "com.google.android.inputmethod.latin" "speed-profile" && (( compiled++ ))
    safe_compile "com.android.inputmethod.latin"        "speed-profile" && (( compiled++ ))
    log_ok "Teclado compilado"

    [ "${DISPLAY_INITIALIZED:-0}" -eq 1 ] && display_add_log "Camera + WhatsApp fix completo" "ok"
    echo "$compiled"
}

# ─── Verificar que cámara y WA estén compilados ───
# Retorna: 0=nada, 1=solo cámara, 2=solo WA, 3=ambos
camera_fix_verify() {
    local score=0

    local cam_status
    cam_status=$(adb_shell cmd package dump com.android.camera 2>/dev/null | grep "dexopt" | grep -o 'speed\|speed-profile\|everything')
    [ -n "$cam_status" ] && (( score++ ))

    local wa_pkgs
    wa_pkgs=$(adb -s "$DEVICE_SERIAL" shell pm list packages 2>/dev/null | grep "com.whatsapp" | sed 's/package://' | tr -d '\r')
    for wa in $wa_pkgs; do
        local wa_status
        wa_status=$(adb_shell cmd package dump "$wa" 2>/dev/null | grep "dexopt" | grep -o 'speed\|speed-profile\|everything')
        [ -n "$wa_status" ] && (( score++ ))
        break  # solo verificar el primero
    done

    echo "$score"
}
