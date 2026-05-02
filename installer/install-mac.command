#!/bin/bash
# ─────────────────────────────────────────
# Phone Optimizer - Instalador macOS
# ─────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Phone Optimizer"
VERSION=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || echo "1.0.0")

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📱 Phone Optimizer - Instalador macOS  ║"
echo "║          Versión $VERSION                ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Detectar arquitectura
ARCH=$(uname -m)
echo "🔍 Sistema detectado: macOS ($ARCH)"

# Verificar que el instalador existe
INSTALLER=$(find "$SCRIPT_DIR" -name "*.dmg" -type f | head -1)
if [ -z "$INSTALLER" ]; then
    echo "❌ Error: No se encontró el instalador .dmg en $SCRIPT_DIR"
    echo "   Descargá el instalador desde: https://github.com/pabloeckert/MejoraRedmi14c/releases"
    exit 1
fi

INSTALLER_NAME=$(basename "$INSTALLER")
echo "📦 Instalador: $INSTALLER_NAME"

# Verificar integridad SHA512
if [ -f "$SCRIPT_DIR/SHA512SUMS.txt" ]; then
    echo "🔐 Verificando integridad..."
    EXPECTED=$(grep "$INSTALLER_NAME" "$SCRIPT_DIR/SHA512SUMS.txt" | awk '{print $1}')
    if [ -n "$EXPECTED" ]; then
        ACTUAL=$(shasum -a 512 "$INSTALLER" | awk '{print $1}')
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

# Montar DMG
echo "💿 Montando imagen de disco..."
MOUNT_DIR=$(hdiutil attach "$INSTALLER" -nobrowse -noautoopen 2>/dev/null | grep "/Volumes" | awk '{print $NF}')

if [ -z "$MOUNT_DIR" ]; then
    echo "❌ Error: No se pudo montar el DMG"
    exit 1
fi

echo "📁 Montado en: $MOUNT_DIR"

# Copiar a Applications
echo "⚙️  Instalando en /Applications..."
APP_PATH=$(find "$MOUNT_DIR" -name "*.app" -maxdepth 1 | head -1)

if [ -n "$APP_PATH" ]; then
    cp -R "$APP_PATH" /Applications/
    echo "✅ Aplicación copiada a /Applications"
else
    echo "❌ Error: No se encontró la aplicación dentro del DMG"
    hdiutil detach "$MOUNT_DIR" 2>/dev/null
    exit 1
fi

# Desmontar DMG
echo "⏏️  Desmontando imagen de disco..."
hdiutil detach "$MOUNT_DIR" 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          ✅ ¡Instalación completa!       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Para ejecutar:"
echo "  open /Applications/PhoneOptimizer.app"
echo ""
echo "O buscalo en Launchpad / Applications"
echo ""
