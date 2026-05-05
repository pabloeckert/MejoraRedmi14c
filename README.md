# MejoraRedmi14c v3.0

Optimizador Android por ADB — **Redmi 14C / HyperOS**

Dos formas de usar: **scripts locales** (recomendado) o **app web**.

---

## 🖥️ Scripts locales (ADB en la PC)

### Requisitos
- ADB instalado (`platform-tools`)
- Cable USB con datos
- Depuración USB activada en el teléfono

### Uso rápido

```bash
# Menú interactivo con todas las opciones
./optimizer.sh

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

## ¿Qué hace cada perfil?

| Perfil | Animaciones | GPU | Bloatware | Red | Memoria | Cache |
|---|---|---|---|---|---|---|
| 🚀 Rendimiento | 0.3x | Forzada + Vulkan | 28 apps | ✅ | ✅ | Profunda |
| 📱 Equilibrado | 0.5x | Forzada | 10 apps | WiFi scan | — | Ligera |
| 🔋 Batería | 0.5x | Sin cambios | 13 apps | WiFi scan | — | Segura |
| 🎮 Gaming | 0.3x | Forzada + Vulkan | 31 apps | ✅ | ✅ | Profunda |

### Detalle de optimizaciones

**🚀 Rendimiento**
- Animaciones 0.3x (ultra rápidas)
- GPU forzada + Vulkan
- 28 apps de bloatware desactivadas
- DNS optimizado, TCP buffer ampliado
- WiFi scanning desactivado
- Memoria: swappiness reducido, más apps en RAM
- Cache profunda

**📱 Equilibrado**
- Animaciones 0.5x
- GPU forzada
- Solo 10 apps 100% seguras desactivadas
- WiFi scanning desactivado
- Cache ligera

**🔋 Batería**
- Animaciones 0.5x
- Sin cambios de GPU (ahorra batería)
- 13 apps que drenan batería desactivadas
- WiFi scanning desactivado
- Sync automática desactivada
- Cache segura

**🎮 Gaming**
- Animaciones 0.3x
- GPU forzada + Vulkan + sin efectos visuales
- **Resolución reducida a 1280x576** (30-40% más FPS)
- DPI reducido a 280
- 31 apps desactivadas
- Memoria optimizada al máximo (sin swap)
- Todas las apps cerradas
- Cache profunda
- **⚠️ Los iconos pueden verse más grandes (normal)**

---

## 🧈 Optimización avanzada

### Fluidez (tweaks-smooth.sh)
- Baseline profiles compilados para apps del sistema
- Dexopt completo (speed-profile)
- Animaciones 0.5x + GPU forzada + Vulkan
- ⚠️ El dexopt tarda ~30 min y calienta el teléfono

### Red (tweaks-red.sh)
- DNS optimizado (muestreo reducido)
- TCP buffer ampliado para mejor throughput
- WiFi scanning desactivado (ahorra batería)
- WiFi siempre activo en suspensión

### Memoria (tweaks-memoria.sh)
- Swappiness reducido (menos swap, más RAM)
- Hasta 32 apps en memoria caché
- Dalvik VM heap ampliado (512MB)
- Low Memory Killer ajustado
- HWUI texture cache ampliada

---

## 💾 Sistema de Rescue Points

Antes de cada optimización se crea automáticamente un **rescue point** que guarda:
- Lista de todos los paquetes
- Paquetes desactivados
- Configuración de animaciones
- Configuración de GPU
- Resolución y DPI
- Estado de batería
- Props del sistema

```bash
./rescue.sh
# 1) Listar rescue points
# 2) Crear rescue point manual
# 3) Restaurar desde rescue point
# 4) Eliminar rescue point
```

---

## 🔍 Diagnóstico

El diagnóstico ahora muestra:
- Info completa del dispositivo (HyperOS, SoC, Security patch)
- Estado de animaciones, GPU, Vulkan
- Resolución original vs override
- Batería (nivel, temperatura, voltaje, salud)
- RAM (total, usado, disponible)
- CPU (load, cores)
- Almacenamiento (usado, disponible)
- Apps desactivadas / de terceros / del sistema
- SELinux status
- WiFi scanning status
- Rescue points disponibles
- Top apps por consumo de batería

---

## 🧹 Base de datos de bloatware

Inspirada en [Universal Android Debloater](https://github.com/0x192/universal-android-debloater) y [BloatwareHatao](https://github.com/ImKKingshuk/BloatwareHatao).

Categorías de seguridad:
- 🟢 **RECOMMENDED** — Seguro de desactivar, sin dependencias
- 🟡 **ADVANCED** — Puede afectar algunas funciones
- 🔴 **DANGER** — Solo para expertos, puede romper cosas

Paquetes documentados en `bloatware-db.sh` con:
- Nombre del paquete
- Categoría (Sistema, Anuncios, Social, Apps, etc.)
- Nivel de seguridad
- Descripción

---

## Modo Emergencia

Si algo anda mal después de optimizar:

```bash
./emergencia.sh
```

El script:
1. Verifica si hay rescue points y ofrece restaurar desde uno
2. Si no, restaura manualmente:
   - Apps del sistema
   - Animaciones (1x)
   - GPU (por defecto)
   - Resolución (original)
   - Red y memoria (por defecto)
   - Permisos de SystemUI

---

## 🌐 App Web (WebUSB)

Alternativa sin ADB en la PC. Abrí `index.html` en Chrome.

### Requisitos
- Chrome, Edge u Opera (WebUSB no funciona en Firefox/Safari)
- `adb kill-server` antes de abrir (libera el USB para el navegador)

```bash
adb kill-server
python3 -m http.server 8000
# Abrir http://localhost:8000
```

---

## Archivos

```
optimizer.sh              ← Menú principal (empezar acá)
perfil-rendimiento.sh     ← Perfil agresivo
perfil-equilibrado.sh     ← Perfil balanceado
perfil-bateria.sh         ← Perfil ahorro
perfil-gaming.sh          ← Perfil gaming (nuevo!)
tweaks-smooth.sh          ← Fluidez + baseline profiles (nuevo!)
tweaks-red.sh             ← Optimización de red (nuevo!)
tweaks-memoria.sh         ← Optimización de memoria (nuevo!)
bloatware-db.sh           ← Base de datos de bloatware (nuevo!)
rescue.sh                 ← Sistema de rescue points (nuevo!)
test-verificacion.sh      ← Test post-optimización (nuevo!)
mantenimiento.sh          ← Limpieza mensual
diagnostico.sh            ← Estado del sistema
emergencia.sh             ← Restaurar todo

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
