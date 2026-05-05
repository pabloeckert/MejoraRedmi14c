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

## Paso 5: Ejecutar

### Menú interactivo (recomendado para empezar)

```bash
./optimizer.sh
```

Vas a ver el menú con todas las opciones. Te recomiendo este orden:

1. **Primero**: Opción 10 (💾 Rescue Points) → Crear rescue point
2. **Segundo**: Opción 2 (📱 Equilibrado) → Probar el perfil más seguro
3. **Tercero**: Opción 9 (🔍 Diagnóstico) → Ver cómo quedó
4. **Cuarto**: Si todo está bien, probá Rendimiento o Gaming

### Ejecutar un perfil directamente

```bash
./perfil-equilibrado.sh    # Más seguro
./perfil-rendimiento.sh    # Más agresivo
./perfil-bateria.sh        # Para ahorrar batería
./perfil-gaming.sh         # Para jugar (reduce resolución)
```

---

## Paso 6: Verificar resultados

```bash
./diagnostico.sh
```

Te muestra:
- Estado de animaciones y GPU
- Resolución (si la cambiaste)
- Batería, RAM, CPU, almacenamiento
- Cuántas apps están desactivadas
- Rescue points disponibles

---

## ¿Algo salió mal?

### Restaurar todo

```bash
./emergencia.sh
```

Esto:
1. Te ofrece restaurar desde un rescue point (si existe)
2. Si no, restaura todo manualmente:
   - Apps del sistema
   - Animaciones a 1x
   - GPU por defecto
   - Resolución original
   - Red y memoria por defecto

### Restaurar solo un rescue point

```bash
./rescue.sh
# Elegí opción 3: Restaurar desde rescue point
```

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
./mantenimiento.sh
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

---

## Resumen rápido

```
1. Instalar ADB
2. Activar depuración USB en el teléfono
3. Conectar por USB, autorizar
4. git clone + cd MejoraRedmi14c
5. ./optimizer.sh
6. Crear rescue point → Probar Equilibrado → Verificar
7. Si algo mal: ./emergencia.sh
```
