#!/bin/bash
# ═══════════════════════════════════════════
#  Phone Optimizer v2.1 — Menú principal
#  Ejecutá este script para empezar
# ═══════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_menu() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     📱 Phone Optimizer v2.1               ║"
    echo "║     Optimizador Android por ADB            ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    echo "║   Perfiles:                               ║"
    echo "║     1) 🚀 Rendimiento (agresivo)          ║"
    echo "║     2) 📱 Equilibrado (recomendado)       ║"
    echo "║     3) 🔋 Batería (ahorro)                ║"
    echo "║                                           ║"
    echo "║   Herramientas:                           ║"
    echo "║     4) 🔧 Mantenimiento                   ║"
    echo "║     5) 🔍 Diagnóstico                     ║"
    echo "║                                           ║"
    echo "║   Emergencia:                             ║"
    echo "║     6) 🚨 Restaurar todo                  ║"
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
        4) bash "$SCRIPT_DIR/mantenimiento.sh" ;;
        5) bash "$SCRIPT_DIR/diagnostico.sh" ;;
        6) bash "$SCRIPT_DIR/emergencia.sh" ;;
        0) echo "  ¡Chau! 👋"; exit 0 ;;
        *) echo "  ❌ Opción no válida" ;;
    esac

    echo ""
    read -p "  Presioná Enter para continuar..."
done
