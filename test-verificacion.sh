#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  TEST DE VERIFICACIÓN — MejoraRedmi14c v5.0

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"
#  Ejecutá esto DESPUÉS de optimizar para verificar que todo
#  se aplicó correctamente y el teléfono está al máximo.
#
#  Uso: ./test-verificacion.sh
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PASS=0
FAIL=0
WARN=0

pass() { PASS=$((PASS + 1)); echo "  ✅ PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  ❌ FAIL: $1"; }
warn() { WARN=$((WARN + 1)); echo "  ⚠️  WARN: $1"; }

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  🧪 TEST DE VERIFICACIÓN                  ║"
echo "║  MejoraRedmi14c v$VERSION                      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ─── VERIFICAR CONEXIÓN ───
if ! adb get-state >/dev/null 2>&1; then
    echo "❌ No se detectó ningún dispositivo."
    echo "   Conectá tu teléfono por USB y activá la depuración USB."
    exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
echo "📱 Dispositivo: $DEVICE (Android $ANDROID)"
echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 1: ANIMACIONES
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  1. ANIMACIONES                            ║"
echo "╚═══════════════════════════════════════════╝"

WIN=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')
TRANS=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')
ANIM=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')

# Verificar que las 3 escalas son iguales
if [ "$WIN" = "$TRANS" ] && [ "$TRANS" = "$ANIM" ]; then
    pass "Las 3 escalas de animación son consistentes ($WIN)"
else
    warn "Las escalas difieren: window=$WIN, transition=$TRANS, animator=$ANIM"
fi

# Verificar valor según perfil
if [ "$WIN" = "0.3" ]; then
    pass "Animaciones en 0.3x (Rendimiento/Gaming)"
elif [ "$WIN" = "0.5" ]; then
    pass "Animaciones en 0.5x (Equilibrado/Batería)"
elif [ "$WIN" = "1" ] || [ "$WIN" = "null" ]; then
    warn "Animaciones en valor por defecto (1x) — ¿optimizaste?"
else
    pass "Animaciones en $WIN (custom)"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 2: GPU
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  2. GPU / RENDERIZADO                      ║"
echo "╚═══════════════════════════════════════════╝"

GPU=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')
MSAA=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')
VULKAN=$(adb shell settings get global debug.hwui.renderer 2>/dev/null | tr -d '\r')

if [ "$GPU" = "1" ]; then
    pass "GPU rendering forzado"
else
    fail "GPU rendering NO está forzado (valor: $GPU)"
fi

if [ "$MSAA" = "1" ]; then
    pass "MSAA activado"
else
    warn "MSAA no activado"
fi

if [ "$VULKAN" = "skiavk" ]; then
    pass "Renderer Vulkan activado"
else
    warn "Renderer Vulkan no activado (usa $VULKAN)"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 2.5: RESOLUCIÓN
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  2.5 RESOLUCIÓN / DPI                      ║"
echo "╚═══════════════════════════════════════════╝"

OVERRIDE_SIZE=$(adb shell wm size 2>/dev/null | grep "Override size:" | grep -o '[0-9]*x[0-9]*')
OVERRIDE_DPI=$(adb shell wm density 2>/dev/null | grep "Override density:" | grep -o '[0-9]*')

if [ -n "$OVERRIDE_SIZE" ]; then
    fail "Resolución alterada: override $OVERRIDE_SIZE (puede causar pantalla en rectángulo)"
else
    PHYSICAL_SIZE=$(adb shell wm size 2>/dev/null | grep "Physical size:" | grep -o '[0-9]*x[0-9]*')
    pass "Resolución nativa: $PHYSICAL_SIZE (sin override)"
fi

if [ -n "$OVERRIDE_DPI" ]; then
    fail "DPI alterado: override $OVERRIDE_DPI (puede causar iconos gigantes)"
else
    PHYSICAL_DPI=$(adb shell wm density 2>/dev/null | grep "Physical density:" | grep -o '[0-9]*')
    pass "DPI nativo: ${PHYSICAL_DPI} (sin override)"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 3: BLOATWARE
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  3. BLOATWARE                              ║"
echo "╚═══════════════════════════════════════════╝"

DISABLED_LIST=$(adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r')
DISABLED_COUNT=$(echo "$DISABLED_LIST" | grep -c "." || echo "0")

echo "  📦 Total de apps desactivadas: $DISABLED_COUNT"

# Verificar bloatware específico
CRITICAL_BLOAT=(
    "com.miui.analytics"
    "com.miui.msa.global"
    "com.miui.ad"
    "com.facebook.katana"
    "com.facebook.system"
    "com.facebook.appmanager"
    "com.facebook.services"
)

BLOAT_DISABLED=0
for PKG in "${CRITICAL_BLOAT[@]}"; do
    if echo "$DISABLED_LIST" | grep -q "$PKG"; then
        BLOAT_DISABLED=$((BLOAT_DISABLED + 1))
    fi
done

if [ "$BLOAT_DISABLED" -ge 5 ]; then
    pass "Bloatware principal desactivado ($BLOAT_DISABLED/${#CRITICAL_BLOAT[@]})"
elif [ "$BLOAT_DISABLED" -ge 3 ]; then
    warn "Bloatware parcialmente desactivado ($BLOAT_DISABLED/${#CRITICAL_BLOAT[@]})"
else
    fail "Bloatware apenas desactivado ($BLOAT_DISABLED/${#CRITICAL_BLOAT[@]})"
fi

# Verificar que apps críticas NO fueron desactivadas
CRITICAL_SAFE=(
    "com.android.systemui"
    "com.android.settings"
    "com.android.phone"
    "com.miui.home"
    "com.android.vending"
    "com.google.android.gms"
)

SAFE_OK=0
for PKG in "${CRITICAL_SAFE[@]}"; do
    if ! echo "$DISABLED_LIST" | grep -q "$PKG"; then
        SAFE_OK=$((SAFE_OK + 1))
    else
        fail "¡CRÍTICO! $PKG está desactivado (¡puede romper el teléfono!)"
    fi
done

if [ "$SAFE_OK" -eq "${#CRITICAL_SAFE[@]}" ]; then
    pass "Apps críticas del sistema intactas ($SAFE_OK/${#CRITICAL_SAFE[@]})"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 4: RED
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  4. RED                                    ║"
echo "╚═══════════════════════════════════════════╝"

WIFI_SCAN=$(adb shell settings get global wifi_scan_always_enabled 2>/dev/null | tr -d '\r')
if [ "$WIFI_SCAN" = "0" ]; then
    pass "WiFi scanning desactivado (ahorra batería)"
else
    warn "WiFi scanning activado (consume batería en segundo plano)"
fi

DNS=$(adb shell settings get global dns_resolver_sample_validity_seconds 2>/dev/null | tr -d '\r')
if [ "$DNS" = "600" ]; then
    pass "DNS optimizado (muestreo: ${DNS}s)"
elif [ "$DNS" = "null" ] || [ -z "$DNS" ]; then
    warn "DNS en valor por defecto"
else
    pass "DNS configurado (muestreo: ${DNS}s)"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 5: MEMORIA
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  5. MEMORIA                                ║"
echo "╚═══════════════════════════════════════════╝"

MEM_TOTAL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemTotal:" | grep -o '[0-9]*')
MEM_AVAIL=$(adb shell cat /proc/meminfo 2>/dev/null | grep "MemAvailable:" | grep -o '[0-9]*')

if [ -n "$MEM_TOTAL" ] && [ -n "$MEM_AVAIL" ]; then
    MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    MEM_TOTAL_GB=$(echo "scale=1; $MEM_TOTAL / 1048576" | bc 2>/dev/null || echo "?")
    MEM_AVAIL_GB=$(echo "scale=1; $MEM_AVAIL / 1048576" | bc 2>/dev/null || echo "?")

    echo "  💾 RAM: ${MEM_AVAIL_GB} GB disponible de ${MEM_TOTAL_GB} GB (${MEM_PCT}% usado)"

    if [ "$MEM_PCT" -lt 60 ]; then
        pass "Uso de RAM saludable (< 60%)"
    elif [ "$MEM_PCT" -lt 80 ]; then
        warn "Uso de RAM moderado ($MEM_PCT%)"
    else
        fail "Uso de RAM alto ($MEM_PCT%) — considerá cerrar apps"
    fi
fi

SWAPPINESS=$(adb shell settings get global sys_swappiness 2>/dev/null | tr -d '\r')
if [ "$SWAPPINESS" = "60" ] || [ "$SWAPPINESS" = "30" ]; then
    pass "Swappiness optimizado ($SWAPPINESS)"
elif [ "$SWAPPINESS" = "null" ] || [ -z "$SWAPPINESS" ]; then
    warn "Swappiness en valor por defecto"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 6: BATERÍA
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  6. BATERÍA                                ║"
echo "╚═══════════════════════════════════════════╝"

BATTERY=$(adb shell dumpsys battery 2>/dev/null | grep "level:" | grep -o '[0-9]*')
TEMP=$(adb shell dumpsys battery 2>/dev/null | grep "temperature:" | grep -o '[0-9]*')
TEMP_C=$(echo "scale=1; $TEMP / 10" | bc 2>/dev/null || echo "?")
HEALTH=$(adb shell dumpsys battery 2>/dev/null | grep "health:" | grep -o '[0-9]*')

echo "  🔋 Nivel: ${BATTERY}%"
echo "  🌡️  Temperatura: ${TEMP_C}°C"

if [ "$TEMP" -lt 350 ]; then
    pass "Temperatura normal (< 35°C)"
elif [ "$TEMP" -lt 400 ]; then
    warn "Temperatura tibia ($TEMP_C°C)"
else
    fail "Temperatura alta ($TEMP_C°C) — dejá enfriar"
fi

case "$HEALTH" in
    2) pass "Salud de batería: buena" ;;
    3) warn "Salud de batería: sobrecalentada" ;;
    4) fail "Salud de batería: muerta" ;;
    *) warn "Salud de batería: desconocida ($HEALTH)" ;;
esac

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 7: ALMACENAMIENTO
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  7. ALMACENAMIENTO                         ║"
echo "╚═══════════════════════════════════════════╝"

STORAGE=$(adb shell df /data 2>/dev/null | tail -1)
if [ -n "$STORAGE" ]; then
    TOTAL_KB=$(echo "$STORAGE" | awk '{print $2}')
    USED_KB=$(echo "$STORAGE" | awk '{print $3}')
    AVAIL_KB=$(echo "$STORAGE" | awk '{print $4}')
    if [ -n "$TOTAL_KB" ] && [ "$TOTAL_KB" -gt 0 ] 2>/dev/null; then
        TOTAL_GB=$(echo "scale=1; $TOTAL_KB / 1048576" | bc 2>/dev/null || echo "?")
        USED_GB=$(echo "scale=1; $USED_KB / 1048576" | bc 2>/dev/null || echo "?")
        AVAIL_GB=$(echo "scale=1; $AVAIL_KB / 1048576" | bc 2>/dev/null || echo "?")
        STORAGE_PCT=$((USED_KB * 100 / TOTAL_KB))

        echo "  💿 Usado: ${USED_GB}/${TOTAL_GB} GB (${STORAGE_PCT}%)"
        echo "  💿 Disponible: ${AVAIL_GB} GB"

        if [ "$STORAGE_PCT" -lt 70 ]; then
            pass "Almacenamiento saludable (< 70%)"
        elif [ "$STORAGE_PCT" -lt 85 ]; then
            warn "Almacenamiento moderado ($STORAGE_PCT%)"
        else
            fail "Almacenamiento casi lleno ($STORAGE_PCT%) — liberá espacio"
        fi
    fi
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 8: RESCUE POINTS
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  8. RESCUE POINTS                          ║"
echo "╚═══════════════════════════════════════════╝"

RESCUE_DIR="$SCRIPT_DIR/rescue-points"
if [ -d "$RESCUE_DIR" ] && [ -n "$(ls -A "$RESCUE_DIR" 2>/dev/null)" ]; then
    RP_COUNT=$(ls -1d "$RESCUE_DIR"/*/ 2>/dev/null | wc -l)
    pass "Rescue points disponibles: $RP_COUNT"

    # Mostrar el más reciente
    LATEST=$(ls -1d "$RESCUE_DIR"/*/ 2>/dev/null | tail -1)
    if [ -n "$LATEST" ]; then
        LATEST_NAME=$(basename "$LATEST")
        echo "     Más reciente: $LATEST_NAME"
    fi
else
    warn "No hay rescue points — creá uno con ./rescue.sh"
fi

echo ""

# ═══════════════════════════════════════════════
#  SECCIÓN 9: SELINUX
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  9. SEGURIDAD                              ║"
echo "╚═══════════════════════════════════════════╝"

SELINUX=$(adb shell getenforce 2>/dev/null | tr -d '\r')
if [ "$SELINUX" = "Enforcing" ]; then
    pass "SELinux en Enforcing (seguro)"
elif [ "$SELINUX" = "Permissive" ]; then
    warn "SELinux en Permissive (menos seguro)"
else
    warn "SELinux: $SELINUX"
fi

echo ""

# ═══════════════════════════════════════════════
#  RESUMEN FINAL
# ═══════════════════════════════════════════════
echo "╔═══════════════════════════════════════════╗"
echo "║  📊 RESUMEN                                ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "  ✅ PASS:  $PASS"
echo "  ❌ FAIL:  $FAIL"
echo "  ⚠️  WARN:  $WARN"
echo ""

TOTAL=$((PASS + FAIL + WARN))
SCORE=$((PASS * 100 / TOTAL))

if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
    echo "  🏆 ¡PERFECTO! Tu teléfono está optimizado al máximo."
    echo "     Score: $SCORE% ($PASS/$TOTAL)"
elif [ "$FAIL" -eq 0 ]; then
    echo "  👍 ¡MUY BIEN! Tu teléfono está bien optimizado."
    echo "     Score: $SCORE% ($PASS/$TOTAL)"
    echo "     Algunos warnings menores — revisá arriba."
elif [ "$FAIL" -le 2 ]; then
    echo "  🔶 ACEPTABLE. Hay algunos problemas menores."
    echo "     Score: $SCORE% ($PASS/$TOTAL)"
    echo "     Revisá los FAIL arriba."
else
    echo "  🔴 NECESITA ATENCIÓN. Varios checks fallaron."
    echo "     Score: $SCORE% ($PASS/$TOTAL)"
    echo "     Ejecutá ./emergencia.sh y volvé a optimizar."
fi

echo ""
echo "════════════════════════════════════════════"
echo ""

# Guardar resultado
RESULT_FILE="$SCRIPT_DIR/test-resultados.txt"
{
    echo "Test de verificación — $(date -Iseconds)"
    echo "Dispositivo: $DEVICE (Android $ANDROID)"
    echo "PASS: $PASS | FAIL: $FAIL | WARN: $WARN"
    echo "Score: $SCORE%"
} > "$RESULT_FILE"
echo "  📄 Resultado guardado en: test-resultados.txt"
echo ""
