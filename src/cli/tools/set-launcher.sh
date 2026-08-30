#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🏠 SET-LAUNCHER — Reemplazar el launcher de HyperOS sin root
#
#  com.miui.home (System Launcher) es el punto de falla confirmado
#  de un bug de HyperOS 3 (crashes, flicker, Safe Mode — Xiaomi lo
#  reconoció públicamente, ligado al widget de clima). No se puede
#  desactivar sin root, pero SÍ se puede dejar de usarlo como
#  default: cmd package set-home-activity solo cambia qué app
#  responde al rol HOME — no toca instalación ni permisos, así que
#  es 100% reversible y no puede bloquear el arranque del teléfono
#  (el Selector de apps predeterminadas en Ajustes siempre funciona
#  como último recurso si algo sale mal).
#
#  USO:
#    ./set-launcher.sh <package_name>     — instala <pkg> como HOME
#    ./set-launcher.sh --status           — muestra el HOME activo
#    ./set-launcher.sh --reset            — vuelve a com.miui.home
#
#  Ej: ./set-launcher.sh app.lawnchair.play
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/config.sh" ]; then
    source "$SCRIPT_DIR/config.sh"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "  ${RED}❌ $1${NC}"; }
info() { echo -e "  ${CYAN}→  $1${NC}"; }

if ! adb get-state >/dev/null 2>&1; then
    fail "No se detectó ningún dispositivo."
    exit 1
fi

# ─── Resuelve el componente HOME (Activity) de un package instalado ───
resolve_home_activity() {
    local pkg="$1"
    local component
    component=$(adb shell cmd package resolve-activity --brief -c android.intent.category.HOME -a android.intent.action.MAIN "$pkg" 2>/dev/null \
        | tr -d '\r' | tail -n 1)
    if [[ "$component" != "$pkg/"* ]]; then
        return 1
    fi
    echo "$component"
}

show_status() {
    info "HOME activo actualmente:"
    adb shell cmd package resolve-activity --brief -c android.intent.category.HOME -a android.intent.action.MAIN 2>/dev/null \
        | tr -d '\r' | tail -n 1
}

echo ""
echo -e "${BOLD}🏠 SET-LAUNCHER${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

case "${1:-}" in
    "" )
        fail "Falta el package name. Uso: ./set-launcher.sh <package_name> | --status | --reset"
        exit 1
        ;;
    --status )
        show_status
        exit 0
        ;;
    --reset )
        TARGET_PKG="com.miui.home"
        ;;
    -* )
        fail "Opción desconocida: $1"
        exit 1
        ;;
    * )
        TARGET_PKG="$1"
        ;;
esac

# Verificar que el paquete esté instalado
if ! adb shell pm list packages "$TARGET_PKG" 2>/dev/null | tr -d '\r' | grep -q "^package:${TARGET_PKG}$"; then
    fail "No está instalado: $TARGET_PKG"
    [ "$TARGET_PKG" != "com.miui.home" ] && info "Instalalo desde Play Store primero."
    exit 1
fi
ok "Instalado: $TARGET_PKG"

COMPONENT=$(resolve_home_activity "$TARGET_PKG") || {
    fail "$TARGET_PKG no declara una Activity HOME (no es un launcher válido)."
    exit 1
}
info "Componente HOME resuelto: $COMPONENT"

OUT=$(adb shell cmd package set-home-activity --user 0 "$COMPONENT" 2>&1 | tr -d '\r')
if echo "$OUT" | grep -qi "error\|exception\|fail"; then
    fail "set-home-activity falló: $OUT"
    exit 1
fi

ok "HOME activo: $TARGET_PKG"
echo ""
info "Verificá con: ./set-launcher.sh --status"
[ "$TARGET_PKG" != "com.miui.home" ] && info "Para volver al launcher de Xiaomi: ./set-launcher.sh --reset"
echo ""
