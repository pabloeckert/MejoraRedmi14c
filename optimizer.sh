#!/bin/bash
# ═══════════════════════════════════════════
#  MejoraRedmi14c v3.0 — Menú principal
#  Optimizador Android por ADB
#  Redmi 14C / HyperOS
# ═══════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_menu() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     📱 MejoraRedmi14c v3.0                ║"
    echo "║     Optimizador Android por ADB            ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    echo "║   Perfiles:                               ║"
    echo "║     1) 🚀 Rendimiento (agresivo)          ║"
    echo "║     2) 📱 Equilibrado (recomendado)       ║"
    echo "║     3) 🔋 Batería (ahorro)                ║"
    echo "║     4) 🎮 Gaming (máximo rendimiento)     ║"
    echo "║                                           ║"
    echo "║   Optimización avanzada:                  ║"
    echo "║     5) 🧈 Fluidez (baseline profiles)     ║"
    echo "║     6) 🌐 Tweaks de red                   ║"
    echo "║     7) 💾 Tweaks de memoria               ║"
    echo "║                                           ║"
    echo "║   Herramientas:                           ║"
    echo "║     8) 🔧 Mantenimiento                   ║"
    echo "║     9) 🔍 Diagnóstico                     ║"
    echo "║    10) 💾 Rescue Points                   ║"
    echo "║                                           ║"
    echo "║   Emergencia:                             ║"
    echo "║    11) 🚨 Restaurar todo                  ║"
    echo "║                                           ║"
    echo "║     0) Salir                              ║"
    echo "║                                           ║"
    echo "╚═══════════════════════════════════════════╝"
    echo ""
}

while true; do
    show_menu
    read -p "  Elegí una opción: " CHOICE
    echo ""

    case $CHOICE in
        1) bash "$SCRIPT_DIR/perfil-rendimiento.sh" ;;
        2) bash "$SCRIPT_DIR/perfil-equilibrado.sh" ;;
        3) bash "$SCRIPT_DIR/perfil-bateria.sh" ;;
        4) bash "$SCRIPT_DIR/perfil-gaming.sh" ;;
        5) bash "$SCRIPT_DIR/tweaks-smooth.sh" ;;
        6) bash "$SCRIPT_DIR/tweaks-red.sh" ;;
        7) bash "$SCRIPT_DIR/tweaks-memoria.sh" ;;
        8) bash "$SCRIPT_DIR/mantenimiento.sh" ;;
        9) bash "$SCRIPT_DIR/diagnostico.sh" ;;
       10) bash "$SCRIPT_DIR/rescue.sh" ;;
       11) bash "$SCRIPT_DIR/emergencia.sh" ;;
        0) echo "  ¡Chau! 👋"; exit 0 ;;
        *) echo "  ❌ Opción no válida" ;;
    esac

    echo ""
    read -p "  Presioná Enter para continuar..."
done
