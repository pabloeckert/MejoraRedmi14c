Optimizador Android por ADB — Redmi 14C / HyperOS (v5.0)

Dos formas de usar: scripts locales (recomendado) o app web.

## ⚠️ Seguridad

Este proyecto prioriza la seguridad de tu dispositivo:

- **Thermal management**: ya NO se desactiva por default. Solo se desactiva con el flag `--no-thermal` y requiere escribir `SI_ESTOY_SEGURO` explícitamente. Esto evita sobrecalentamientos peligrosos.
- **Validación de modelo**: antes de ejecutar cualquier optimización, se verifica que el dispositivo sea Xiaomi/Redmi/POCO. Si no lo es, se advierte y se pide confirmación.
- **Check de temperatura**: si el dispositivo está a más de 40°C, el script aborta automáticamente para evitar daños.
- **Modo dry-run**: podés probar qué haría el mega-optimizer sin aplicar nada real con `./mega-optimizer.sh --dry-run`.

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para el historial completo de cambios.

# 1. Clonar
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh

# 2. Ejecutar (guía todo el proceso)
./optimizer.sh

El script:

- Conecta el teléfono automáticamente

- Verifica la conexión

- Ejecuta el benchmark ANTES (diagnóstico completo)

- Muestra el menú con todas las opciones

- ADB instalado (platform-tools) — ver [TUTORIAL.md](TUTORIAL.md)

- Cable USB con datos

- Depurión USB activada en el teléfono

# 🔥 Mega Optimizer (TODO EN UNO)

La forma más rápida de optimizar el teléfono. Ejecuta 12 pasos automáticamente:

./mega-optimizer.sh

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

### Verificar que todo se aplicó:

./mega-verificar.sh

### Restaurar todo a fábrica:

./emergencia.sh

# Menú interactivo (flujo guiado)
./optimizer.sh

# Benchmark directo
./benchmark.sh antes # Benchmark ANTES de optimizar
./benchmark.sh despues # Benchmark DESPUÉS (para comparar)

# Perfiles:
./perfil-rendimiento.sh # 🚀 Máxima velocidad
./perfil-equilibrado.sh # 📱 Uso diario
./perfil-bateria.sh # 🔋 Ahorro de batería
./perfil-gaming.sh # 🎮 Máximo rendimiento para gaming

# Fix apps específicas:
./fix-cam-whatsapp.sh # 📸💬 Fix cámara lenta + WhatsApp lento

# Optimización avanzada:
./tweaks-smooth.sh # 🧈 Baseline profiles + dexopt
./tweaks-red.sh # 🌐 DNS, TCP, WiFi
./tweaks-memoria.sh # 💾 RAM, Dalvik, HWUI

# Herramientas:
./diagnostico.sh # 🔍 Estado completo del dispositivo
./mantenimiento.sh # 🔧 Limpieza periódica
./rescue.sh # 💾 Sistema de rescue points
./test-verificacion.sh # 🧪 Verificar que todo se aplicó bien
./emergencia.sh # 🚨 Restaurar TODO

El benchmark ejecuta 10 secciones y genera un reporte detallado:

Sección
Qué mide

1. Dispositivo
Modelo, Android, HyperOS, SoC, uptime

2. CPU
Load average, frecuencia, benchmark (10k iteraciones), top procesos

3. RAM
Total, usado, disponible, libre, cached, swap, top apps por RAM

4. Almacenamiento
Usado, disponible, tamaño de cache

5. Batería
Nivel, temperatura, voltaje, salud

6. Apps
Total, sistema, terceros, desactivadas, wakelocks

7. Servicios
Procesos activos, servicios en segundo plano, receivers

8. Red
WiFi, señal, scanning, roaming, DNS

9. Configuración
Animaciones, GPU, resolución, DPI, SELinux

10. Diagnóstico
Identifica qué ralentiza y sugiere soluciones

El benchmark detecta problemas y sugiere soluciones (sin modificar el sistema):

Problema
Sugerencia

RAM alta (>80%)
Ejecutá un perfil o cerrá apps

Almacenamiento lleno (>85%)
Limpiá cache con mantenimiento

WiFi scanning activo
Desactivalo con un perfil

Animaciones por defecto (1x)
Ajustá con un perfil

GPU no forzada
Forzá con un perfil

Cache grande (>2GB)
Limpiá con mantenimiento

Muchos procesos (>400)
Cerrá apps en segundo plano

Perfil
Animaciones
GPU
Bloatware
Red
Memoria
Cache

🚀 Rendimiento
0.3x
Forzada + Vulkan
28 apps
✅
✅
Profunda

📱 Equilibrado
0.5x
Forzada
10 apps
WiFi scan
—
Ligera

🔋 Batería
0.5x
Sin cambios
13 apps
WiFi scan
—
Segura

🎮 Gaming
0.3x
Forzada + Vulkan
31 apps
✅
✅
Profunda

Antes de cada optimización se crea automáticamente un rescue point que guarda:

- Lista de todos los paquetes

- Paquetes desactivados

- Configuración de animaciones, GPU, resolución, DPI

- Estado de batería y props del sistema

./rescue.sh
# 1) Listar rescue points
# 2) Crear rescue point manual
# 3) Restaurar desde rescue point
# 4) Eliminar rescue point

Si algo anda mal después de optimizar:

./emergencia.sh

El script:

- Verifica si hay rescue points y ofrece restaurar desde uno

- Si no, restaura manualmente todo

Alternativa sin ADB en la PC. Abrí index.html en Chrome.

adb kill-server
python3 -m http.server 8000
# Abrir http://localhost:8000

optimizer.sh ← Menú principal (flujo guiado)
mega-optimizer.sh ← 🔥 Mega optimizer (todo en uno)
mega-verificar.sh ← 🔍 Verificar optimizaciones
config.sh ← ⚙️ Configuración compartida
fix-cam-whatsapp.sh ← 📸💬 Fix cámara + WhatsApp
benchmark.sh ← Benchmark completo
test-verificacion.sh ← Test post-optimización
perfil-rendimiento.sh ← Perfil agresivo
perfil-equilibrado.sh ← Perfil balanceado
perfil-bateria.sh ← Perfil ahorro
perfil-gaming.sh ← Perfil gaming
tweaks-smooth.sh ← Fluidez + baseline profiles
tweaks-red.sh ← Optimización de red
tweaks-memoria.sh ← Optimización de memoria
bloatware-db.sh ← Base de datos de bloatware
rescue.sh ← Sistema de rescue points
mantenimiento.sh ← Limpieza mensual
diagnostico.sh ← Estado del sistema
emergencia.sh ← Restaurar todo
rapido.sh ← Reparación rápida
ruta-optima.sh ← Ruta óptima autónoma
log-apply.sh ← Log de perfiles aplicados
LICENSE ← Licencia MIT
TUTORIAL.md ← Tutorial paso a paso

index.html ← App web
adb.js ← Protocolo ADB sobre WebUSB
app.js ← Lógica de la app web
styles.css ← Estilos

- [Universal Android Debloater](https://github.com/0x192/universal-android-debloater) — Base de datos de paquetes

- [BloatwareHatao](https://github.com/ImKKingshuk/BloatwareHatao) — Sistema de rescue points, seguridad por niveles

- [HyperOS Debloat](https://github.com/leechuanfeng/hyperos-debloat) — Lista de paquetes HyperOS

- [ADB Android Optimizer](https://github.com/SchneeSchmitt/ADB-Android-Optimizer) — Tweaks de red, memoria, Dalvik

- [Smooth Android Script](https://github.com/polhdez/smooth_android_script) — Baseline profiles, dexopt

- [Android Boost Performance](https://github.com/Naritsumi/Android-boost-performance) — Reducción de resolución para gaming
