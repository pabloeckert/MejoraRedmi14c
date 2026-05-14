# MejoraRedmi14c v5.1

Optimizador Android por ADB para Redmi 14C / HyperOS. Dos formas de usar: scripts locales (recomendado) o app web WebUSB.

## Requisitos

- ADB instalado (platform-tools) — ver [TUTORIAL.md](TUTORIAL.md)
- Cable USB con transferencia de datos
- Depuración USB activada en el teléfono
- PC con Windows, Mac o Linux

## Inicio rápido

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh
./optimizer.sh   # Menú interactivo — guía todo el proceso
```

## ⚠️ Seguridad

Este proyecto prioriza la seguridad de tu dispositivo:

- **Thermal management**: NO se desactiva por default. Solo con `--no-thermal` y confirmación explícita `SI_ESTOY_SEGURO`. Evita sobrecalentamientos.
- **Validación de modelo**: verifica que el dispositivo sea Xiaomi/Redmi/POCO antes de ejecutar. Si no lo es, pide confirmación.
- **Check de temperatura**: aborta automáticamente si el dispositivo supera 40°C.
- **Modo dry-run**: probá qué haría el optimizer sin aplicar nada: `./mega-optimizer.sh --dry-run`
- **Rescue points**: backup automático antes de cada optimización — restauración garantizada.

## Uso

### Todo en uno (recomendado)

Ejecuta mega-optimizer + turbo apps + verificación + log + reinicio:

```bash
./run-optimize.sh
```

Opciones:

| Flag | Efecto |
|------|--------|
| `--dry-run` | Ver qué haría sin aplicar |
| `--no-reboot` | No reiniciar al terminar |
| `--no-thermal` | Desactivar thermal management |
| `--no-turbo` | Saltar WhatsApp + cámara turbo |

Los logs se guardan en `./logs/`.

### WhatsApp + Cámara ultra rápidos

```bash
./turbo-apps.sh
```

- Compila WhatsApp y cámara en modo `speed` → arranque instantáneo
- Pre-calienta la cámara (clases ya cargadas en RAM)
- Pre-carga WhatsApp para que no se recargue al volver
- Optimiza base de datos de WhatsApp
- Limpia thumbnails masivos de cámara
- Desactiva AI scene detection y watermark

### Boot más rápido

```bash
./optimize-boot.sh       # Aplicar
./measure-boot.sh        # Medir ANTES y DESPUÉS
```

Desactiva ~30 apps con boot receivers innecesarios, limpia cache de arranque y dexopt de apps críticas del sistema.

## Mega Optimizer — 12 pasos automáticos

```bash
./mega-optimizer.sh
```

| Paso | Qué hace | Impacto |
|------|----------|---------|
| 0 | Rescue point de seguridad | 🛡️ |
| 1 | ~50 apps de bloatware eliminadas | 🔥🔥🔥 |
| 2 | Animaciones a 0.1x (casi instantáneas) | 🔥🔥🔥 |
| 3 | GPU forzada + Vulkan + MSAA + sin input lag | 🔥🔥🔥 |
| 4 | Resolución reducida (+15-20% FPS) | 🔥🔥🔥 |
| 5 | Swappiness 30, heap 512MB, HWUI cache ampliado | 🔥🔥 |
| 6 | TCP window x10, DNS optimizado, WiFi scan off | 🔥🔥 |
| 7 | Thermal desactivado, performance mode, 90Hz forzado | 🔥🔥🔥 |
| 8 | Blur off, touch más rápido, font más compacto | 🔥🔥 |
| 9 | Cache 2GB+ limpiado | 🔥 |
| 10 | Apps pesadas cerradas | 🔥 |
| 11 | Dexopt speed-profile (compila apps nativamente) | 🔥🔥🔥 |
| 12 | Bluetooth/NFC scanning off | 🔥 |

```bash
./mega-verificar.sh   # Verificar que todo se aplicó
./emergencia.sh       # Restaurar todo a fábrica
```

## Perfiles rápidos

```bash
./perfil-rendimiento.sh   # 🚀 Máxima velocidad
./perfil-equilibrado.sh   # 📱 Uso diario
./perfil-bateria.sh       # 🔋 Ahorro de batería
./perfil-gaming.sh        # 🎮 Gaming
```

| Perfil | Animaciones | GPU | Bloatware | Red | Memoria | Cache |
|--------|-------------|-----|-----------|-----|---------|-------|
| 🚀 Rendimiento | 0.3x | Forzada + Vulkan | 28 apps | ✅ | ✅ | Profunda |
| 📱 Equilibrado | 0.5x | Forzada | 10 apps | WiFi scan | — | Ligera |
| 🔋 Batería | 0.5x | Sin cambios | 13 apps | WiFi scan | — | Segura |
| 🎮 Gaming | 0.3x | Forzada + Vulkan | 31 apps | ✅ | ✅ | Profunda |

## Benchmark

```bash
./benchmark.sh antes    # Diagnóstico ANTES de optimizar
./benchmark.sh despues  # Comparar DESPUÉS
```

El benchmark ejecuta 10 secciones y genera un reporte en `./logs/`:

| Sección | Qué mide |
|---------|----------|
| 1. Dispositivo | Modelo, Android, HyperOS, SoC, uptime |
| 2. CPU | Load average, frecuencia, benchmark, top procesos |
| 3. RAM | Total, usado, disponible, cached, swap, top apps |
| 4. Almacenamiento | Usado, disponible, tamaño de cache |
| 5. Batería | Nivel, temperatura, voltaje, salud |
| 6. Apps | Total, sistema, terceros, desactivadas, wakelocks |
| 7. Servicios | Procesos activos, servicios en segundo plano |
| 8. Red | WiFi, señal, scanning, roaming, DNS |
| 9. Configuración | Animaciones, GPU, resolución, DPI, SELinux |
| 10. Diagnóstico | Identifica qué ralentiza y sugiere soluciones |

Problemas que detecta automáticamente:

| Problema | Sugerencia |
|----------|------------|
| RAM alta (>80%) | Ejecutá un perfil o cerrá apps |
| Almacenamiento lleno (>85%) | Limpiá cache con `./mantenimiento.sh` |
| WiFi scanning activo | Desactivalo con un perfil |
| Animaciones por defecto (1x) | Ajustá con un perfil |
| GPU no forzada | Forzá con un perfil |
| Cache grande (>2GB) | Limpiá con `./mantenimiento.sh` |
| Muchos procesos (>400) | Cerrá apps en segundo plano |

## Sistema de rescue points

Antes de cada optimización se crea automáticamente un rescue point con:
- Lista de paquetes activos y desactivados
- Configuración de animaciones, GPU, resolución, DPI
- Props del sistema y estado de batería

```bash
./rescue.sh   # Gestionar rescue points (listar, crear, restaurar, eliminar)
./emergencia.sh   # Restaurar TODO a fábrica (usa rescue point si existe)
```

## Herramientas adicionales

```bash
./benchmark.sh          # 📊 Benchmark completo (10 secciones)
./diagnostico.sh        # 🔍 Estado completo del dispositivo
./mantenimiento.sh      # 🔧 Limpieza periódica (mensual)
./test-verificacion.sh  # 🧪 Verificar que todo se aplicó bien
./rapido.sh             # ⚡ Reparación rápida
./fix-cam-whatsapp.sh   # 📸💬 Fix cámara lenta + WhatsApp lento
./tweaks-smooth.sh      # 🧈 Baseline profiles + dexopt
./tweaks-red.sh         # 🌐 DNS, TCP, WiFi
./tweaks-memoria.sh     # 💾 RAM, Dalvik, HWUI
```

## App web (sin ADB en la PC)

Alternativa al ADB por línea de comandos. Usa WebUSB directo desde el navegador:

```bash
python3 -m http.server 8000
# Abrir http://localhost:8000 en Chrome/Edge/Brave
```

O directamente: abrí `index.html` en Chrome con el teléfono conectado.

## Estructura del proyecto

```
config.sh               ← ⚙️  Configuración compartida (fuente de verdad)
bloatware-db.sh         ← 📋 Base de datos de bloatware
optimizer.sh            ← 🎛️  Menú principal (flujo guiado)
mega-optimizer.sh       ← 🔥 Mega optimizer (12 pasos)
run-optimize.sh         ← 🚀 TODO EN UNO + log + reinicio
turbo-apps.sh           ← 📱 WhatsApp + cámara ultra rápidos
optimize-boot.sh        ← ⚡ Boot más rápido
measure-boot.sh         ← ⏱️  Mide tiempo de arranque
benchmark.sh            ← 📊 Benchmark completo
mega-verificar.sh       ← 🔍 Verificar optimizaciones
rescue.sh               ← 💾 Sistema de rescue points
emergencia.sh           ← 🚨 Restaurar todo
index.html / app.js     ← 🌐 App web WebUSB
adb.js                  ← 🔌 Protocolo ADB sobre WebUSB
```

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para el historial completo de cambios.

## Créditos

- [Universal Android Debloater](https://github.com/0x192/universal-android-debloater) — base de datos de paquetes
- [BloatwareHatao](https://github.com/ImKKingshuk/BloatwareHatao) — rescue points, seguridad por niveles
- [HyperOS Debloat](https://github.com/leechuanfeng/hyperos-debloat) — lista de paquetes HyperOS
- [ADB Android Optimizer](https://github.com/SchneeSchmitt/ADB-Android-Optimizer) — tweaks de red, memoria, Dalvik
- [Smooth Android Script](https://github.com/polhdez/smooth_android_script) — baseline profiles, dexopt
- [Android Boost Performance](https://github.com/Naritsumi/Android-boost-performance) — reducción de resolución para gaming
