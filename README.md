# MejoraRedmi14c v3.0

Optimizador Android por ADB — **Redmi 14C / HyperOS**

Dos formas de usar: **scripts locales** (recomendado) o **app web**.

---

## 🚀 Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh

# 2. Ejecutar (guía todo el proceso)
./optimizer.sh
```

El script:
1. **Conecta** el teléfono automáticamente
2. **Verifica** la conexión
3. Ejecuta el **benchmark ANTES** (diagnóstico completo)
4. Muestra el **menú** con todas las opciones

---

## 🖥️ Scripts locales (ADB en la PC)

### Requisitos
- ADB instalado (`platform-tools`) — ver [TUTORIAL.md](TUTORIAL.md)
- Cable USB con datos
- Depurión USB activada en el teléfono

### Uso rápido

```bash
# Menú interactivo (flujo guiado)
./optimizer.sh

# Benchmark directo
./benchmark.sh antes        # Benchmark ANTES de optimizar
./ benchmark.sh despues      # Benchmark DESPUÉS (para comparar)

# Perfiles:
./perfil-rendimiento.sh    # 🚀 Máxima velocidad
./perfil-equilibrado.sh    # 📱 Uso diario
./perfil-bateria.sh        # 🔋 Ahorro de batería
./perfil-gaming.sh         # 🎮 Máximo rendimiento para gaming

# Optimización avanzada:
./tweaks-smooth.sh         # 🧈 Baseline profiles + dexopt
./tweaks-red.sh            # 🌐 DNS, TCP, WiFi
./tweaks-memoria.sh        # 💾 RAM, Dalvik, HWUI

# Herramientas:
./diagnostico.sh           # 🔍 Estado completo del dispositivo
./mantenimiento.sh         # 🔧 Limpieza periódica
./rescue.sh                # 💾 Sistema de rescue points
./test-verificacion.sh     # 🧪 Verificar que todo se aplicó bien
./emergencia.sh            # 🚨 Restaurar TODO
```

---

## 📊 Benchmark

El benchmark ejecuta **10 secciones** y genera un reporte detallado:

| Sección | Qué mide |
|---|---|
| 1. Dispositivo | Modelo, Android, HyperOS, SoC, uptime |
| 2. CPU | Load average, frecuencia, benchmark (10k iteraciones), top procesos |
| 3. RAM | Total, usado, disponible, libre, cached, swap, top apps por RAM |
| 4. Almacenamiento | Usado, disponible, tamaño de cache |
| 5. Batería | Nivel, temperatura, voltaje, salud |
| 6. Apps | Total, sistema, terceros, desactivadas, wakelocks |
| 7. Servicios | Procesos activos, servicios en segundo plano, receivers |
| 8. Red | WiFi, señal, scanning, roaming, DNS |
| 9. Configuración | Animaciones, GPU, resolución, DPI, SELinux |
| 10. Diagnóstico | **Identifica qué ralentiza y lo corrige automáticamente** |

### Auto-fix de problemas

El benchmark detecta y corrige automáticamente:

| Problema | Auto-fix |
|---|---|
| RAM alta (>80%) | Cierra apps pesadas |
| Almacenamiento lleno (>85%) | Limpia cache |
| WiFi scanning activo | Lo desactiva |
| Animaciones por defecto (1x) | Ajusta a 0.5x |
| GPU no forzada | La fuerza |
| Cache grande (>2GB) | Limpia parcialmente |
| Muchos procesos (>400) | Cierra apps en segundo plano |

---

## ¿Qué hace cada perfil?

| Perfil | Animaciones | GPU | Bloatware | Red | Memoria | Cache |
|---|---|---|---|---|---|---|
| 🚀 Rendimiento | 0.3x | Forzada + Vulkan | 28 apps | ✅ | ✅ | Profunda |
| 📱 Equilibrado | 0.5x | Forzada | 10 apps | WiFi scan | — | Ligera |
| 🔋 Batería | 0.5x | Sin cambios | 13 apps | WiFi scan | — | Segura |
| 🎮 Gaming | 0.3x | Forzada + Vulkan | 31 apps | ✅ | ✅ | Profunda |

---

## 💾 Sistema de Rescue Points

Antes de cada optimización se crea automáticamente un **rescue point** que guarda:
- Lista de todos los paquetes
- Paquetes desactivados
- Configuración de animaciones, GPU, resolución, DPI
- Estado de batería y props del sistema

```bash
./rescue.sh
# 1) Listar rescue points
# 2) Crear rescue point manual
# 3) Restaurar desde rescue point
# 4) Eliminar rescue point
```

---

## Modo Emergencia

Si algo anda mal después de optimizar:

```bash
./emergencia.sh
```

El script:
1. Verifica si hay rescue points y ofrece restaurar desde uno
2. Si no, restaura manualmente todo

---

## 🌐 App Web (WebUSB)

Alternativa sin ADB en la PC. Abrí `index.html` en Chrome.

```bash
adb kill-server
python3 -m http.server 8000
# Abrir http://localhost:8000
```

---

## Archivos

```
optimizer.sh              ← Menú principal (flujo guiado)
benchmark.sh              ← Benchmark completo (nuevo!)
test-verificacion.sh      ← Test post-optimización
perfil-rendimiento.sh     ← Perfil agresivo
perfil-equilibrado.sh     ← Perfil balanceado
perfil-bateria.sh         ← Perfil ahorro
perfil-gaming.sh          ← Perfil gaming
tweaks-smooth.sh          ← Fluidez + baseline profiles
tweaks-red.sh             ← Optimización de red
tweaks-memoria.sh         ← Optimización de memoria
bloatware-db.sh           ← Base de datos de bloatware
rescue.sh                 ← Sistema de rescue points
mantenimiento.sh          ← Limpieza mensual
diagnostico.sh            ← Estado del sistema
emergencia.sh             ← Restaurar todo
TUTORIAL.md               ← Tutorial paso a paso

index.html                ← App web
adb.js                    ← Protocolo ADB sobre WebUSB
app.js                    ← Lógica de la app web
styles.css                ← Estilos
```

---

## Créditos e inspiración

- [Universal Android Debloater](https://github.com/0x192/universal-android-debloater) — Base de datos de paquetes
- [BloatwareHatao](https://github.com/ImKKingshuk/BloatwareHatao) — Sistema de rescue points, seguridad por niveles
- [HyperOS Debloat](https://github.com/leechuanfeng/hyperos-debloat) — Lista de paquetes HyperOS
- [ADB Android Optimizer](https://github.com/SchneeSchmitt/ADB-Android-Optimizer) — Tweaks de red, memoria, Dalvik
- [Smooth Android Script](https://github.com/polhdez/smooth_android_script) — Baseline profiles, dexopt
- [Android Boost Performance](https://github.com/Naritsumi/Android-boost-performance) — Reducción de resolución para gaming
