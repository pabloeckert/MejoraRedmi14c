#!/bin/bash
# ─────────────────────────────────────────
# Phone Optimizer - Instalador Linux
# ─────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Phone Optimizer"
VERSION=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || echo "1.0.0")

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📱 Phone Optimizer - Instalador Linux  ║"
echo "║          Versión $VERSION                ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Detectar arquitectura
ARCH=$(uname -m)
echo "🔍 Sistema detectado: Linux ($ARCH)"

# Verificar que el instalador existe
INSTALLER="$SCRIPT_DIR/PhoneOptimizer-${VERSION}.AppImage"
if [ ! -f "$INSTALLER" ]; then
    # Buscar cualquier AppImage
    INSTALLER=$(find "$SCRIPT_DIR" -name "*.AppImage" -type f | head -1)
    if [ -z "$INSTALLER" ]; then
        echo "❌ Error: No se encontró el instalador .AppImage en $SCRIPT_DIR"
        echo "   Descargá el instalador desde: https://github.com/pabloeckert/MejoraRedmi14c/releases"
        exit 1
    fi
fi

INSTALLER_NAME=$(basename "$INSTALLER")
echo "📦 Instalador: $INSTALLER_NAME"

# Verificar integridad SHA512
if [ -f "$SCRIPT_DIR/SHA512SUMS.txt" ]; then
    echo "🔐 Verificando integridad..."
    EXPECTED=$(grep "$INSTALLER_NAME" "$SCRIPT_DIR/SHA512SUMS.txt" | awk '{print $1}')
    if [ -n "$EXPECTED" ]; then
        ACTUAL=$(sha512sum "$INSTALLER" | awk '{print $1}')
        if [ "$EXPECTED" = "$ACTUAL" ]; then
            echo "✅ Integridad verificada (SHA512 coincide)"
        else
            echo "❌ Error: El hash SHA512 no coincide."
            echo "   Esperado: $EXPECTED"
            echo "   Obtenido: $ACTUAL"
            echo "   El archivo puede estar corrupto. Descargalo nuevamente."
            exit 1
        fi
    else
        echo "⚠️  Hash no encontrado en SHA512SUMS.txt, saltando verificación"
    fi
else
    echo "⚠️  SHA512SUMS.txt no encontrado, saltando verificación de integridad"
fi

# Dar permisos de ejecución
echo "⚙️  Configurando permisos..."
chmod +x "$INSTALLER"

# Instalar a /opt o directorio del usuario
INSTALL_DIR="$HOME/.local/opt/phone-optimizer"
mkdir -p "$INSTALL_DIR"

echo "📁 Instalando en: $INSTALL_DIR"
cp "$INSTALLER" "$INSTALL_DIR/"

# Crear symlink en ~/.local/bin
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/$INSTALLER_NAME" "$BIN_DIR/phone-optimizer"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          ✅ ¡Instalación completa!       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Para ejecutar:"
echo "  phone-optimizer"
echo ""
echo "O directamente:"
echo "  $INSTALL_DIR/$INSTALLER_NAME"
echo ""

# Verificar si ~/.local/bin está en PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "⚠️  Nota: ~/.local/bin no está en tu PATH."
    echo "   Agregalo con: export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo "   O agregalo a tu ~/.bashrc / ~/.zshrc"
fi
