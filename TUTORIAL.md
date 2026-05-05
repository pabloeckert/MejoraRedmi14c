# Tutorial — MejoraRedmi14c v3.0

Guía paso a paso para optimizar tu Redmi 14C desde cero.

---

## Paso 1: Instalar ADB

### Windows

1. Descargá [platform-tools](https://dl.google.com/android/repository/platform-tools-latest-windows.zip)
2. Descomprimilo en `C:\platform-tools`
3. Agregalo al PATH:
   - Presioná `Win + R`, escribí `sysdm.cpl`, Enter
   - Pestaña **Opciones avanzadas** → **Variables de entorno**
   - En **Variables del sistema**, buscá `Path`, click en **Editar**
   - Click en **Nuevo** → escribí `C:\platform-tools`
   - Aceptar en todas las ventanas
4. Abrí una **nueva** terminal (Git Bash o CMD) y verificá:
   ```bash
   adb version
   ```
   Si muestra algo como `Android Debug Bridge version 1.0.xx` → ¡listo!

### Mac

```bash
brew install android-platform-tools
adb version
```

### Linux

```bash
# Debian/Ubuntu
sudo apt install android-sdk-platform-tools

# Arch
sudo pacman -S android-tools

# Fedora
sudo dnf install android-tools
```

---

## Paso 2: Preparar el teléfono

### Activar opciones de desarrollador

1. Abrí **Ajustes** → **Acerca del teléfono**
2. Tocá **Versión de HyperOS** (o **Número de compilación**) **7 veces**
3. Vas a ver un mensaje: "Ya sos desarrollador"

### Activar depuración USB

1. Abrí **Ajustes** → **Ajustes adicionales** → **Opciones de desarrollador**
2. Activá **Depuración USB**
3. (Opcional) Activá **Instalar vía USB** si aparece

### Desvincular cuenta de Xiaomi (IMPORTANTE)

> ⚠️ Si vas a desactivar apps de Xiaomi, **desvinculá tu cuenta de Mi** antes.
> Si desactivás el paquete de cuenta estando logueado, el teléfono puede pedir
> verificación en la pantalla de bloqueo.

1. **Ajustes** → **Cuentas y sincronización** → tu cuenta de Mi
2. Tocá **Cerrar sesión**

---

## Paso 3: Conectar el teléfono

1. Conectá el teléfono por USB (usá un cable que transfiera datos, no solo carga)
2. En el teléfono va a aparecer un popup: **"¿Permitir depuración USB?"**
3. Marcá **"Siempre permitir desde esta computadora"** → **Aceptar**

### Verificar conexión

```bash
adb devices
```

Deberías ver algo así:
```
List of devices attached
XXXXXXXX    device
```

Si dice `unauthorized` → revisá el teléfono, falta autorizar.
Si no aparece nada → verificá el cable y que la depuración USB esté activada.

---

## Paso 4: Clonar el repo

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh
```

---

## Paso 5: Ejecutar el optimizador

```bash
./optimizer.sh
```

### ¿Qué pasa al ejecutarlo?

El script tiene un **flujo guiado**:

```
┌─────────────────────────────────────────┐
│  PASO 1: Conectar teléfono              │
│  → Busca dispositivos automáticamente   │
│  → Espera hasta que conectés            │
│  → Verifica autorización USB            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PASO 2: Verificar conexión             │
│  → Muestra info del dispositivo         │
│  → Estado rápido (batería, RAM, apps)   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PASO 3: Benchmark ANTES                │
│  → CPU benchmark (10k iteraciones)      │
│  → RAM (uso, disponibles, swap)         │
│  → Almacenamiento                       │
│  → Batería y temperatura                │
│  → Apps instaladas y desactivadas       │
│  → Servicios en segundo plano           │
│  → Red y conectividad                   │
│  → Diagnóstico: QUÉ RALENTIZA           │
│  → Auto-fix de problemas detectados     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  MENÚ PRINCIPAL                         │
│  → Todas las opciones de optimización   │
│  → Benchmark DESPUÉS para comparar      │
└─────────────────────────────────────────┘
```

---

## El Benchmark en detalle

El benchmark ejecuta **10 secciones** y genera un reporte:

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

### ¿Qué detecta como problema?

| Problema | Auto-fix |
|---|---|
| Bloatware activo | Sugiere ejecutar perfil |
| RAM alta (>80%) | Cierra apps pesadas automáticamente |
| Temperatura alta (>40°C) | Sugiere dejar enfriar |
| Almacenamiento lleno (>85%) | Limpia cache automáticamente |
| WiFi scanning activo | Lo desactiva automáticamente |
| Animaciones por defecto (1x) | Las ajusta a 0.5x automáticamente |
| GPU no forzada | La fuerza automáticamente |
| Cache grande (>2GB) | Limpia parcialmente |
| Muchos procesos (>400) | Cierra apps en segundo plano |
| Sin reiniciar hace >7 días | Sugiere reiniciar |

---

## Orden recomendado

### Primera vez

```bash
./optimizer.sh
# 1. Conectar teléfono (automático)
# 2. Verificar conexión (automático)
# 3. Benchmark ANTES → elegí "S"
# 4. Ver el diagnóstico y los auto-fixes
# 5. Menú → opción 10 (Rescue Points) → crear backup
# 6. Menú → opción 4 (Equilibrado) → aplicar
# 7. Menú → opción 2 (Benchmark DESPUÉS) → comparar
# 8. Menú → opción 13 (Test verificación) → confirmar
```

### Después de optimizar

```bash
./optimizer.sh
# 1. Conectar (automático)
# 2. Benchmark DESPUÉS → comparar con el ANTES
# 3. Si querés más rendimiento: perfil Rendimiento o Gaming
# 4. Test de verificación → ver score
```

---

## Menú completo

```
📊 Benchmark:
  1) 🔍 Benchmark ANTES (diagnóstico)
  2) 🔍 Benchmark DESPUÉS (verificar)

🚀 Perfiles:
  3) 🚀 Rendimiento (agresivo)
  4) 📱 Equilibrado (recomendado)
  5) 🔋 Batería (ahorro)
  6) 🎮 Gaming (máximo rendimiento)

⚡ Optimización avanzada:
  7) 🧈 Fluidez (baseline profiles)
  8) 🌐 Tweaks de red
  9) 💾 Tweaks de memoria

🔧 Herramientas:
 10) 🔧 Mantenimiento
 11) 🔍 Diagnóstico detallado
 12) 💾 Rescue Points
 13) 🧪 Test de verificación

🚨 Emergencia:
 14) 🚨 Restaurar todo

🔄 r) Reconectar dispositivo
```

---

## ¿Algo salió mal?

### Restaurar todo

```bash
./emergencia.sh
```

Esto:
1. Te ofrece restaurar desde un rescue point (si existe)
2. Si no, restaura todo manualmente

### Si el teléfono no arranca

Si después de optimizar el teléfono se queda en bootloop:
1. Esperá a que reinicie solo 5 veces
2. Va a entrar en modo recovery automático
3. Hacé **Factory Reset** desde ahí
4. **Por eso siempre hay que crear rescue points antes**

---

## Mantenimiento mensual

Una vez al mes, ejecutá:

```bash
./optimizer.sh
# Menú → opción 10 (Mantenimiento)
```

Esto:
- Limpia cache
- Cierra apps en segundo plano
- Te muestra el estado del sistema

---

## Preguntas frecuentes

### ¿Puedo seguir recibiendo actualizaciones OTA?
Sí. Los scripts usan `pm disable-user` (desactivar) en vez de `pm uninstall` (desinstalar). Las apps siguen ahí, solo desactivadas. Después de una actualización OTA, algunas pueden reactivarse — volvé a ejecutar el perfil.

### ¿Pierdo la garantía?
No. Todo se hace por ADB sin root. Si necesitás llevar el teléfono a service, ejecutá `./emergencia.sh` antes y queda todo como de fábrica.

### ¿El perfil Gaming es seguro?
Sí, pero:
- Los iconos se van a ver más grandes (por la resolución reducida)
- Después de jugar, reiniciá el teléfono para volver a la normalidad
- El rescue point se crea automáticamente antes de aplicar

### ¿Puedo usar varios perfiles?
Sí, pero no al mismo tiempo. Si aplicás Rendimiento y después querés Batería, ejecutá primero `./emergencia.sh` y después el nuevo perfil.

### ¿Funciona en otros teléfonos Xiaomi?
Los tweaks de animaciones, GPU, red y memoria funcionan en cualquier Android. El bloatware está optimizado para Redmi 14C / HyperOS — en otros modelos algunos paquetes pueden no existir (no pasa nada, simplemente los salta).

### ¿Qué hace el benchmark exactamente?
Ejecuta 10 secciones que miden CPU, RAM, almacenamiento, batería, apps, servicios, red y configuración. Identifica qué está ralentizando el teléfono y corrige automáticamente lo que puede (cierra apps, limpia cache, desactiva WiFi scanning, ajusta animaciones, fuerza GPU).

### ¿El benchmark consume batería?
Mínimo. Tarda ~30 segundos y usa operaciones de lectura. No afecta el rendimiento del teléfono.

---

## Resumen rápido

```
1. Instalar ADB
2. Activar depuración USB en el teléfono
3. Conectar por USB, autorizar
4. git clone + cd MejoraRedmi14c
5. ./optimizer.sh
6. El script guía: conectar → verificar → benchmark → menú
7. Crear rescue point → probar Equilibrado → verificar
8. Si algo mal: ./emergencia.sh
```
