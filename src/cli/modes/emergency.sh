#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PhoneOptimizer Pro — Modo emergencia (restauración total)
#  Basado en: emergencia.sh original
#  Restaura absolutamente todo a estado de fábrica.
# ═══════════════════════════════════════════════════════════════

mode_emergency() {
    local run_id=0
    run_id=$(db_start_run "emergency" 0 0 "$DEVICE_BATTERY_PCT" "$DEVICE_TEMP_C")

    echo ""
    echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║  🚨 MODO EMERGENCIA — Restauración total             ║${NC}"
    echo -e "${RED}${BOLD}║  Esto revierte TODOS los cambios de PhoneOptimizer   ║${NC}"
    echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""

    # ── 1: Reactivar TODOS los paquetes desactivados ──
    log_step "Paso 1/8 — Reactivando todas las apps..."
    local restored; restored=$(bloatware_restore_all)
    log_ok "$restored app(s) reactivadas."

    # ── 2: Restaurar animaciones ──
    log_step "Paso 2/8 — Restaurando animaciones..."
    performance_restore_defaults
    log_ok "Animaciones y GPU: defaults"

    # ── 3: Restaurar resolución ──
    log_step "Paso 3/8 — Restaurando resolución..."
    adb -s "$DEVICE_SERIAL" shell wm size reset    2>/dev/null
    adb -s "$DEVICE_SERIAL" shell wm density reset 2>/dev/null
    log_ok "Resolución: nativa restaurada"

    # ── 4: Restaurar red ──
    log_step "Paso 4/8 — Restaurando red..."
    network_restore_defaults
    log_ok "Red: defaults"

    # ── 5: Restaurar memoria ──
    log_step "Paso 5/8 — Restaurando memoria..."
    memory_restore_defaults
    log_ok "Memoria: defaults"

    # ── 6: Restaurar thermal y performance mode ──
    log_step "Paso 6/8 — Restaurando thermal..."
    thermal_restore
    log_ok "Performance mode: desactivado"

    # ── 7: Restaurar pantalla y notificaciones ──
    log_step "Paso 7/8 — Restaurando pantalla..."
    adb_setting_put_system screen_off_timeout 300000
    adb_setting_put_system stay_on_while_plugged_in 0
    adb_setting_put        heads_up_notifications_enabled 1
    adb_setting_put_system screen_brightness_mode 1
    adb_setting_put        bluetooth_always_scanning 1
    adb_setting_put        nfc_enabled               1
    adb_setting_put        wifi_scan_always_enabled  1
    adb_setting_put        captive_portal_mode       1
    adb_setting_put        auto_time                 1
    adb_setting_put        auto_time_zone            1
    log_ok "Pantalla y notificaciones: restauradas"

    # ── 8: Reparar permisos SystemUI ──
    log_step "Paso 8/8 — Reparando permisos del sistema..."
    adb_shell pm grant com.android.systemui android.permission.SYSTEM_ALERT_WINDOW 2>/dev/null
    adb_shell pm grant com.android.systemui android.permission.READ_PHONE_STATE     2>/dev/null
    log_ok "Permisos: reparados"

    # Registrar en DB
    db_end_run "$run_id" 0 0 "$restored" 0 0 "Restauración de emergencia"
    db_log_app_action "ALL" "Restauración completa" "restored" "$run_id"

    echo ""
    echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║  ✅ SISTEMA RESTAURADO                               ║${NC}"
    echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
    printf  "${GREEN}${BOLD}║  Apps reactivadas:  %-4d                              ║${NC}\n" "${restored:-0}"
    echo -e "${GREEN}${BOLD}║  Animaciones:       1x (normal)                      ║${NC}"
    echo -e "${GREEN}${BOLD}║  GPU:               defaults                          ║${NC}"
    echo -e "${GREEN}${BOLD}║  Resolución:        nativa                           ║${NC}"
    echo -e "${GREEN}${BOLD}║  Red / Memoria:     defaults                          ║${NC}"
    echo -e "${GREEN}${BOLD}║  Permisos:          reparados                        ║${NC}"
    echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}${BOLD}║  Si algo sigue mal: reiniciá el teléfono.            ║${NC}"
    echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
}
