#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Sistema de Rescue Points — MejoraRedmi14c
#  Inspirado en: BloatwareHatao
#
#  Guarda snapshots del estado del dispositivo ANTES de optimizar
#  para poder restaurar si algo sale mal.
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESCUE_DIR="$SCRIPT_DIR/rescue-points"

# Crear directorio si no existe
mkdir -p "$RESCUE_DIR"

# ─── CREAR RESCUE POINT ───
create_rescue_point() {
    local NAME="${1:-$(date +%Y%m%d_%H%M%S)}"
    local DIR="$RESCUE_DIR/$NAME"
    mkdir -p "$DIR"

    echo ""
    echo "💾 Creando rescue point: $NAME"
    echo "─────────────────────────────────────"

    # 1. Info del dispositivo
    echo "  📱 Guardando info del dispositivo..."
    {
        echo "model=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')"
        echo "manufacturer=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')"
        echo "android=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')"
        echo "sdk=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')"
        echo "build=$(adb shell getprop ro.build.display.id 2>/dev/null | tr -d '\r')"
        echo "hyperos=$(adb shell getprop ro.mi.os.version.name 2>/dev/null | tr -d '\r')"
        echo "timestamp=$(date -Iseconds)"
    } > "$DIR/device_info.txt"

    # 2. Lista de TODOS los paquetes instalados
    echo "  📦 Guardando lista de paquetes..."
    adb shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$DIR/all_packages.txt"
    adb shell pm list packages -s 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$DIR/system_packages.txt"
    adb shell pm list packages -3 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$DIR/user_packages.txt"

    # 3. Paquetes desactivados
    echo "  🔒 Guardando paquetes desactivados..."
    adb shell pm list packages -d 2>/dev/null | sed 's/package://' | tr -d '\r' | sort > "$DIR/disabled_packages.txt"

    # 4. Configuración de animaciones
    echo "  🎬 Guardando configuración de animaciones..."
    {
        echo "window_animation=$(adb shell settings get global window_animation_scale 2>/dev/null | tr -d '\r')"
        echo "transition_animation=$(adb shell settings get global transition_animation_scale 2>/dev/null | tr -d '\r')"
        echo "animator_duration=$(adb shell settings get global animator_duration_scale 2>/dev/null | tr -d '\r')"
    } > "$DIR/animation_settings.txt"

    # 5. Configuración de GPU
    echo "  🎨 Guardando configuración GPU..."
    {
        echo "force_gpu=$(adb shell settings get global force_gpu_rendering 2>/dev/null | tr -d '\r')"
        echo "force_msaa=$(adb shell settings get global force_msaa 2>/dev/null | tr -d '\r')"
    } > "$DIR/gpu_settings.txt"

    # 6. Configuración de pantalla (resolución/DPI)
    echo "  🖥️  Guardando configuración de pantalla..."
    {
        echo "size=$(adb shell wm size 2>/dev/null | tr -d '\r')"
        echo "density=$(adb shell wm density 2>/dev/null | tr -d '\r')"
    } > "$DIR/display_settings.txt"

    # 7. Estado de batería
    echo "  🔋 Guardando estado de batería..."
    adb shell dumpsys battery 2>/dev/null > "$DIR/battery_state.txt"

    # 8. Propiedades del sistema modificables
    echo "  ⚙️  Guardando props del sistema..."
    {
        echo "# Renderizado"
        echo "hwui=$(adb shell getprop ro.hwui.texture_cache_size 2>/dev/null | tr -d '\r')"
        echo "renderthread=$(adb shell getprop ro.hwui.render_thread 2>/dev/null | tr -d '\r')"
        echo ""
        echo "# Memoria"
        echo "dalvik_heap=$(adb shell getprop dalvik.vm.heapsize 2>/dev/null | tr -d '\r')"
        echo "dalvik_growth=$(adb shell getprop dalvik.vm.heapgrowthlimit 2>/dev/null | tr -d '\r')"
    } > "$DIR/system_props.txt"

    # Contar archivos
    local FILE_COUNT=$(ls -1 "$DIR" | wc -l)
    echo ""
    echo "  ✅ Rescue point creado: $DIR"
    echo "     $FILE_COUNT archivos guardados"
    echo ""

    echo "$NAME"
}

# ─── LISTAR RESCUE POINTS ───
list_rescue_points() {
    echo ""
    echo "📋 Rescue Points disponibles:"
    echo "─────────────────────────────────────"

    if [ ! -d "$RESCUE_DIR" ] || [ -z "$(ls -A "$RESCUE_DIR" 2>/dev/null)" ]; then
        echo "  (ninguno — se crea automáticamente al optimizar)"
        echo ""
        return
    fi

    for DIR in "$RESCUE_DIR"/*/; do
        if [ -d "$DIR" ]; then
            NAME=$(basename "$DIR")
            if [ -f "$DIR/device_info.txt" ]; then
                DEVICE=$(grep "model=" "$DIR/device_info.txt" | cut -d= -f2)
                DATE=$(grep "timestamp=" "$DIR/device_info.txt" | cut -d= -f2 | cut -dT -f1)
                DISABLED=$(wc -l < "$DIR/disabled_packages.txt" 2>/dev/null || echo "0")
                echo "  📁 $NAME"
                echo "     Dispositivo: $DEVICE | Fecha: $DATE | Desactivadas: $DISABLED"
            else
                echo "  📁 $NAME (info incompleta)"
            fi
        fi
    done
    echo ""
}

# ─── RESTAURAR DESDE RESCUE POINT ───
restore_rescue_point() {
    local NAME="$1"
    local DIR="$RESCUE_DIR/$NAME"

    if [ ! -d "$DIR" ]; then
        echo "❌ Rescue point '$NAME' no encontrado."
        return 1
    fi

    echo ""
    echo "🔄 Restaurando desde rescue point: $NAME"
    echo "─────────────────────────────────────"

    # 1. Restaurar animaciones
    if [ -f "$DIR/animation_settings.txt" ]; then
        echo "  🎬 Restaurando animaciones..."
        WIN=$(grep "window_animation=" "$DIR/animation_settings.txt" | cut -d= -f2)
        TRANS=$(grep "transition_animation=" "$DIR/animation_settings.txt" | cut -d= -f2)
        ANIM=$(grep "animator_duration=" "$DIR/animation_settings.txt" | cut -d= -f2)
        [ -n "$WIN" ] && [ "$WIN" != "null" ] && adb shell settings put global window_animation_scale "$WIN"
        [ -n "$TRANS" ] && [ "$TRANS" != "null" ] && adb shell settings put global transition_animation_scale "$TRANS"
        [ -n "$ANIM" ] && [ "$ANIM" != "null" ] && adb shell settings put global animator_duration_scale "$ANIM"
        echo "      ✅"
    fi

    # 2. Restaurar GPU
    if [ -f "$DIR/gpu_settings.txt" ]; then
        echo "  🎨 Restaurando GPU..."
        GPU=$(grep "force_gpu=" "$DIR/gpu_settings.txt" | cut -d= -f2)
        MSAA=$(grep "force_msaa=" "$DIR/gpu_settings.txt" | cut -d= -f2)
        if [ "$GPU" = "null" ] || [ -z "$GPU" ]; then
            adb shell settings delete global force_gpu_rendering 2>/dev/null
        else
            adb shell settings put global force_gpu_rendering "$GPU"
        fi
        if [ "$MSAA" = "null" ] || [ -z "$MSAA" ]; then
            adb shell settings delete global force_msaa 2>/dev/null
        else
            adb shell settings put global force_msaa "$MSAA"
        fi
        echo "      ✅"
    fi

    # 3. Restaurar resolución/DPI
    if [ -f "$DIR/display_settings.txt" ]; then
        echo "  🖥️  Restaurando pantalla..."
        SIZE=$(grep "size=" "$DIR/display_settings.txt" | cut -d= -f2)
        DENSITY=$(grep "density=" "$DIR/display_settings.txt" | cut -d= -f2)
        if echo "$SIZE" | grep -q "[0-9]x[0-9]"; then
            RES=$(echo "$SIZE" | grep -o '[0-9]*x[0-9]*')
            adb shell wm size "$RES" 2>/dev/null
        fi
        if echo "$DENSITY" | grep -q "[0-9]"; then
            DPI=$(echo "$DENSITY" | grep -o '[0-9]*')
            adb shell wm density "$DPI" 2>/dev/null
        fi
        echo "      ✅"
    fi

    # 4. Reactivar paquetes que fueron desactivados
    if [ -f "$DIR/disabled_packages.txt" ]; then
        echo "  📦 Reactivando paquetes..."
        RESTORED=0
        while IFS= read -r PKG; do
            [ -z "$PKG" ] && continue
            OUT=$(adb shell pm enable "$PKG" 2>&1)
            if echo "$OUT" | grep -q "enabled\|new state: enabled"; then
                RESTORED=$((RESTORED + 1))
            fi
        done < "$DIR/disabled_packages.txt"
        echo "      ✅ $RESTORED paquetes reactivados"
    fi

    # 5. Verificar paquetes actuales que no estaban antes
    echo "  🔍 Verificando integridad..."
    if [ -f "$DIR/all_packages.txt" ]; then
        CURRENT=$(adb shell pm list packages 2>/dev/null | sed 's/package://' | tr -d '\r' | sort)
        MISSING=$(comm -23 "$DIR/all_packages.txt" <(echo "$CURRENT"))
        if [ -n "$MISSING" ]; then
            MISSING_COUNT=$(echo "$MISSING" | wc -l)
            echo "      ⚠️  $MISSING_COUNT paquetes siguen faltando (puede ser normal tras actualización OTA)"
        else
            echo "      ✅ Todos los paquetes restaurados"
        fi
    fi

    echo ""
    echo "════════════════════════════════════════"
    echo "🔄 ¡RESTAURACIÓN COMPLETADA!"
    echo "════════════════════════════════════════"
    echo ""
}

# ─── ELIMINAR RESCUE POINT ───
delete_rescue_point() {
    local NAME="$1"
    local DIR="$RESCUE_DIR/$NAME"

    if [ ! -d "$DIR" ]; then
        echo "❌ Rescue point '$NAME' no encontrado."
        return 1
    fi

    rm -rf "$DIR"
    echo "🗑️  Rescue point '$NAME' eliminado."
}

# ─── INTERFAZ ───
show_rescue_menu() {
    echo ""
    echo "╔═══════════════════════════════════════════╗"
    echo "║     💾 Sistema de Rescue Points            ║"
    echo "╠═══════════════════════════════════════════╣"
    echo "║                                           ║"
    echo "║   1) 📋 Listar rescue points               ║"
    echo "║   2) ➕ Crear rescue point                 ║"
    echo "║   3) 🔄 Restaurar desde rescue point       ║"
    echo "║   4) 🗑️  Eliminar rescue point              ║"
    echo "║                                           ║"
    echo "║   0) Volver                               ║"
    echo "║                                           ║"
    echo "╚═══════════════════════════════════════════╝"
    echo ""
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    while true; do
        show_rescue_menu
        read -p "  Elegí una opción: " CHOICE
        case $CHOICE in
            1) list_rescue_points ;;
            2)
                read -p "  Nombre (Enter para automático): " NAME
                create_rescue_point "$NAME"
                ;;
            3)
                list_rescue_points
                read -p "  Nombre del rescue point a restaurar: " NAME
                [ -n "$NAME" ] && restore_rescue_point "$NAME"
                ;;
            4)
                list_rescue_points
                read -p "  Nombre del rescue point a eliminar: " NAME
                [ -n "$NAME" ] && delete_rescue_point "$NAME"
                ;;
            0) break ;;
            *) echo "  ❌ Opción no válida" ;;
        esac
        read -p "  Presioná Enter para continuar..."
    done
fi
