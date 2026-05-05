# Changelog — MejoraRedmi14c

## v4.0 — 2026-05-05

### 🔥 NUEVO: Mega Optimizer (todo en uno)

Script `mega-optimizer.sh` que ejecuta 12 pasos de optimización completa en secuencia:

| Paso | Descripción | Impacto |
|------|-------------|---------|
| 0 | Rescue point automático de seguridad | 🛡️ |
| 1 | ~50 apps de bloatware eliminadas (Xiaomi, Google, Facebook, Amazon, Netflix, Opera) | 🔥🔥🔥 |
| 2 | Animaciones a 0.1x (casi instantáneas) | 🔥🔥🔥 |
| 3 | GPU forzada + Vulkan + MSAA + draw defer/reorder desactivado (menos input lag) | 🔥🔥🔥 |
| 4 | Resolución reducida a 640x1422 con DPI 240 (+15-20% FPS sin pérdida visual notable) | 🔥🔥🔥 |
| 5 | Swappiness 30, Dalvik heap 512MB, max cached processes 64, HWUI cache ampliado | 🔥🔥 |
| 6 | TCP window 10, DNS validity 600s, WiFi scan off, network scoring off | 🔥🔥 |
| 7 | Thermal throttling desactivado, performance mode, 90Hz forzado | 🔥🔥🔥 |
| 8 | Window blur desactivado, touch speed máximo, font scale 0.95, brillo fijo 70% | 🔥🔥 |
| 9 | Cache 2GB+ limpiado (apps, thumbnails, temp, logs) | 🔥 |
| 10 | 15 apps pesadas cerradas (redes sociales, streaming) | 🔥 |
| 11 | Dexopt speed-profile para apps del sistema y de terceros | 🔥🔥🔥 |
| 12 | Bluetooth scanning y NFC desactivados | 🔥 |

### 📸💬 NUEVO: Fix Cámara + WhatsApp

Script `fix-cam-whatsapp.sh` que soluciona la lentitud de cámara y WhatsApp:

**Cámara:**
- Compilación `speed` mode (no `speed-profile`) — arranque instantáneo
- Limpieza de thumbnails acumulados
- AI scene detection desactivada (elimina procesamiento en background)
- Media providers compilados (preview más rápido)

**WhatsApp:**
- Compilación `speed` mode — búsqueda de contactos y share sheet instantáneos
- Cache limpiada
- Pre-carga en memoria (evita recargas al cambiar de app)
- Share sheet del sistema compilado (`com.android.intentresolver`, `com.android.chooser`)
- Contactos del sistema compilados

**Memoria para 4GB RAM:**
- Max cached processes aumentado a 96
- Swappiness reducido a 20 (apps quedan en RAM real)
- LMK con thresholds más altos (menos kills de apps)
- HWUI cache ampliado a 128 (scrolling suave)

### 📊 NUEVO: Verificador de optimizaciones

Script `mega-verificar.sh` que verifica cada optimización aplicada y genera un score de 0-100%:

- Verifica animaciones, GPU, resolución, DPI
- Verifica memoria, red, thermal, refresh rate
- Cuenta apps desactivadas
- Muestra estado de RAM y batería
- Score final con nivel de optimización

### 🚨 NUEVO: Restaurador de emergencia

Script `mega-restaurar.sh` que restaura TODO a valores de fábrica:

- Reactiva TODAS las apps desactivadas
- Restaura animaciones a 1x
- Restaura GPU a defaults
- Restaura resolución y DPI
- Restaura memoria, red, thermal
- Restaura refresh rate y visual

### 📝 ACTUALIZADO: optimizer.sh v4.0

Menú principal reorganizado con los nuevos scripts integrados:

```
 1) 🔥 Mega Optimizer (RECOMENDADO)
 2) 🔍 Verificar optimizaciones
 3) 🚨 Restaurar todo a fábrica
 4) 💾 Backup general local
 5) 🛤️  Ruta óptima automática
 6) 🔍 Benchmark ANTES
 7) 🔍 Benchmark DESPUÉS
 8) 🚀 Rendimiento
 9) 📱 Equilibrado
10) 🔋 Batería
11) 🎮 Gaming
12) 📸💬 Fix Cámara + WhatsApp
13) 🧈 Fluidez
14) 🌐 Tweaks de red
15) 💾 Tweaks de memoria
16) 🔧 Mantenimiento
17) 🔍 Diagnóstico
18) 💾 Rescue Points
19) 🧪 Test de verificación
20) 🔧 Reparación rápida
21) 🚨 Restaurar (emergencia)
```

Confirmación de seguridad antes de restaurar (opción 3).

### 📄 ACTUALIZADO: README.md

Documentación actualizada con:
- Sección del Mega Optimizer con tabla de 12 pasos
- Comandos de verificación y restauración
- Lista de archivos actualizada (21 scripts + app web)

---

## v3.0 — Versión anterior

- Menú interactivo con 17 opciones
- Benchmark de 10 secciones
- 4 perfiles de optimización (rendimiento, equilibrado, batería, gaming)
- Tweaks de red, memoria y fluidez
- Sistema de rescue points
- Modo emergencia
- App web alternativa (WebUSB)

---

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `optimizer.sh` | Menú principal v4.0 (flujo guiado) |
| `mega-optimizer.sh` | 🔥 Mega optimizer (12 pasos, todo en uno) |
| `mega-verificar.sh` | 🔍 Verificador de optimizaciones con score |
| `mega-restaurar.sh` | 🚨 Restaurador a fábrica |
| `fix-cam-whatsapp.sh` | 📸💬 Fix cámara lenta + WhatsApp lento |
| `benchmark.sh` | Benchmark completo (10 secciones) |
| `perfil-rendimiento.sh` | Perfil agresivo (0.3x, GPU, 28 apps) |
| `perfil-equilibrado.sh` | Perfil balanceado (0.5x, 10 apps) |
| `perfil-bateria.sh` | Perfil ahorro (0.5x, 13 apps) |
| `perfil-gaming.sh` | Perfil gaming (0.3x, GPU+Vulkan, 31 apps) |
| `tweaks-smooth.sh` | Fluidez + baseline profiles + dexopt |
| `tweaks-red.sh` | DNS, TCP, WiFi |
| `tweaks-memoria.sh` | RAM, Dalvik, HWUI |
| `bloatware-db.sh` | Base de datos de bloatware |
| `rescue.sh` | Sistema de rescue points |
| `mantenimiento.sh` | Limpieza periódica |
| `diagnostico.sh` | Estado completo del dispositivo |
| `test-verificacion.sh` | Test post-optimización |
| `emergencia.sh` | Restaurar todo (emergencia) |
| `backup.sh` | Backup general local |
| `rapido.sh` | Reparación rápida |
| `ruta-optima.sh` | Ruta óptima automática |
| `TUTORIAL.md` | Tutorial paso a paso |
| `CHANGELOG.md` | Este archivo |
| `index.html` | App web |
| `adb.js` | Protocolo ADB sobre WebUSB |
| `app.js` | Lógica de la app web |
| `styles.css` | Estilos |

---

## Flujo de uso recomendado

```
1. git clone → cd MejoraRedmi14c → chmod +x *.sh
2. ./optimizer.sh (menú principal)
3. Opción 1: Mega Optimizer
4. Reiniciar teléfono
5. Opción 12: Fix Cámara + WhatsApp
6. Reiniciar teléfono
7. Opción 2: Verificar optimizaciones (score)
8. Si algo sale mal: Opción 3 o ./mega-restaurar.sh
```

## Créditos y referencias

- [Universal Android Debloater](https://github.com/0x192/universal-android-debloater)
- [BloatwareHatao](https://github.com/ImKKingshuk/BloatwareHatao)
- [HyperOS Debloat](https://github.com/leechuanfeng/hyperos-debloat)
- [ADB Android Optimizer](https://github.com/SchneeSchmitt/ADB-Android-Optimizer)
- [Smooth Android Script](https://github.com/polhdez/smooth_android_script)
- [Android Boost Performance](https://github.com/Naritsumi/Android-boost-performance)
