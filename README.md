# MejoraRedmi14c — Ecosistema de Automatización, Mantenimiento y Sincronización Workspace

Suite de optimización, automatización continua y sincronización de Google Workspace diseñada específicamente para el **Xiaomi Redmi 14C** (*codename `pond` / modelo `2409BRN2CL`*, procesador MediaTek Helio G81 Ultra, HyperOS basado en Android 16).

---

## 📋 Tabla de Contenidos
1. [Arquitectura del Repositorio](#arquitectura-del-repositorio)
2. [Requisitos Previos](#requisitos-previos)
3. [Guía Rápida de Uso](#guía-rápida-de-uso)
4. [Módulos Técnicos](#módulos-técnicos)
   - [01: Debloat Seguro HyperOS](#01-debloat-seguro-hyperos)
   - [02: Optimizaciones y Fluidez 90Hz](#02-optimizaciones-y-fluidez-90hz)
   - [03: Asistente Gemini y Workspace Sync](#03-asistente-gemini-y-workspace-sync)
5. [Demonio en Segundo Plano y Programador de Tareas](#demonio-en-segundo-plano-y-programador-de-tareas)
6. [Seguridad Crítica (Regla Joyose)](#seguridad-crítica-regla-joyose)
7. [Reversión de Cambios](#reversión-de-cambios)

---

## 🏛️ Arquitectura del Repositorio

```text
C:\Personales\MejoraRedmi14c\
├── modules\
│   ├── 01-debloat.ps1           # Desactivación segura de bloatware HyperOS/MIUI que satura o compite con Workspace
│   ├── 02-optimizaciones.ps1     # Tweaks de animaciones (0.5x), refresh rate (90Hz) y rendimiento
│   └── 03-asistente-sync.ps1    # Gemini como asistente por defecto, bypass Doze (Keep/Calendar/Docs) y auto-sync
├── listener.ps1                 # Demonio resiliente en bucle continuo (adb wait-for-device y anti-repetición)
├── register-task.ps1            # Registrador de tarea programada en Windows (arranque oculto al iniciar sesión)
├── main.ps1                     # Orquestador maestro para uso interactivo o por lotes
├── audit-repo.ps1               # Script utilitario de auditoría técnica y diagnóstico del repositorio
└── README.md                    # Documentación técnica completa
```

---

## ⚙️ Requisitos Previos

### 1. En la PC (Windows)
- **PowerShell 5.1 o PowerShell 7+**.
- **Android Platform Tools (ADB)** en el `PATH` del sistema (verificable con `adb devices`).
- Habilitar la ejecución de scripts en la sesión de PowerShell si fuera necesario:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  ```

### 2. En el Xiaomi Redmi 14C (HyperOS)
1. Ir a **Ajustes** > **Sobre el teléfono** > pulsar 7 veces sobre **Versión del SO (HyperOS)** para desbloquear las Opciones de Desarrollador.
2. Ir a **Ajustes adicionales** > **Opciones de desarrollador**:
   - Activar **Depuración USB**.
   - Activar **Depuración USB (Ajustes de seguridad)** (permite a ADB cambiar permisos y ajustes de pantalla).
   - *(Opcional pero recomendado)* Desactivar **Optimización del sistema / MIUI** solo si HyperOS bloquea comandos de depuración específicos.
3. Conectar el cable USB a la PC y en el diálogo emergente del teléfono marcar **"Permitir siempre desde este equipo"** y presionar **Aceptar**.

---

## 🚀 Guía Rápida de Uso

### Modo Interactivo (Recomendado)
Ejecuta el orquestador principal:
```powershell
.\main.ps1
```
Desplegará un menú interactivo con opciones numéricas para ejecutar el pipeline completo, módulos individuales, diagnóstico de estado o reversión.

### Modo por Lotes / Directo
```powershell
# Ejecutar todo el pipeline (Debloat + Optimizaciones + Asistente Workspace)
.\main.ps1 -All

# Ejecutar un módulo específico
.\main.ps1 -Debloat
.\main.ps1 -Optimize
.\main.ps1 -Sync

# Ver diagnóstico completo del dispositivo conectado
.\main.ps1 -Status

# Revertir bloatware y volver animaciones a 1.0x de fábrica
.\main.ps1 -Revert
```

---

## 📦 Módulos Técnicos

### 01: Debloat Seguro HyperOS (`modules\01-debloat.ps1`)
Desactiva de forma **no destructiva y reversible** (`pm disable-user --user 0`) los servicios de publicidad, analíticas y tiendas secundarias que saturan el procesador Helio G81 Ultra:
- **Tiendas y Publicidad**: `com.xiaomi.mipicks` (GetApps), `com.miui.cleanmaster`, `com.miui.hybrid` (Quick Apps), `com.mi.globalminusscreen` (App Vault), `com.xiaomi.payment`, `com.xiaomi.gamecenter`, `com.xiaomi.glgm`, `com.xiaomi.scanner`, `com.xiaomi.drivemode`.
- **Telemetría y Rastreo**: `com.miui.msa.global`, `com.miui.analytics`, `com.miui.AnalyticsCore`, `com.miui.daemon`, `com.miui.systemAdSolution`, `com.miui.bugreport`, `com.miui.miservice`.
- **Servicios Mi Cloud redundantes**: `com.miui.cloudservice`, `com.miui.cloudbackup`, `com.miui.micloudsync`, `com.miui.cloudservice.sysbase`.
- **Tracking Meta/Facebook**: `com.facebook.services`, `com.facebook.system`, `com.facebook.appmanager`.

### 02: Optimizaciones y Fluidez 90Hz (`modules\02-optimizaciones.ps1`)
- **Escala de Animaciones 0.5x**:
  - `window_animation_scale = 0.5`
  - `transition_animation_scale = 0.5`
  - `animator_duration_scale = 0.5`
- **Frecuencia de Actualización a 90Hz**: Fija `peak_refresh_rate` y `user_refresh_rate` en 90Hz para aprovechar la tasa máxima del panel IPS del Redmi 14C.
- **Respuesta Táctil y Reducción de Carga GPU**:
  - `pointer_speed = 5`
  - Desactivación de filtros blur pesados (`disable_window_blurs = 1`).
- **Límites de Procesos**: `max_cached_processes=32` y `background_settle_time=60000`.
- **Ahorro de Batería en Reposo**: Desactiva escaneos continuos de WiFi y Bluetooth en segundo plano (`wifi_scan_always_enabled = 0`, `bluetooth_always_scanning = 0`).
- **Compilación AOT DEXOPT**: Aplica perfil de compilación optimizado (`speed-profile`) a los componentes de Google Workspace y Gemini.

### 03: Asistente Gemini y Workspace Sync (`modules\03-asistente-sync.ps1`)
- **Asistente Digital Predeterminado**:
  Asigna `com.google.android.googlequicksearchbox` con `cmd role add-role-holder android.app.role.ASSISTANT`.
- **Configuración de Gemini / Opa**:
  Enlaza el servicio de voz `GsaVoiceInteractionService` en los parámetros seguros de Android (`settings put secure assistant`).
- **Bypass de Doze y Ahorro Agresivo de Batería en HyperOS**:
  Exime totalmente de la hibernación y suspensión de HyperOS a:
  - `com.google.android.googlequicksearchbox` (Google / Gemini)
  - `com.google.android.keep` (Google Keep)
  - `com.google.android.calendar` (Google Calendar)
  - `com.google.android.apps.docs` (Google Drive / Docs)
  Mediante `dumpsys deviceidle whitelist +<pkg>` y permisos de AppOps `RUN_ANY_IN_BACKGROUND` y `WAKE_LOCK`.
- **Sincronización Maestra Continua**:
  Garantiza sincronización permanente aún bajo condiciones de roaming de datos (`settings put global sync_automatically_when_roaming 1`).

---

## 🔄 Demonio en Segundo Plano y Programador de Tareas

El script `listener.ps1` actúa como un **demonio permanente**:
1. Se suspende de forma eficiente en `adb wait-for-device`.
2. Al conectar un dispositivo por cable USB, valida que el modelo coincida con `2409BRN2C*` (Redmi 14C / `pond`).
3. Ejecuta de forma automática los módulos `01`, `02` y `03` informando los progresos en consola con colores.
4. Entra en un bucle de espera hasta que el cable USB es desconectado, **evitando ejecuciones repetitivas en falso** mientras el teléfono permanece conectado.

### Integración con Windows Task Scheduler (`register-task.ps1`)

Para que el demonio se ejecute de manera transparente cada vez que inicies sesión en Windows:

```powershell
# 1. Registrar tarea programada (ejecuta listener.ps1 oculto al iniciar sesión)
.\register-task.ps1

# 2. Consultar el estado de la tarea
.\register-task.ps1 -Status

# 3. Disparar la tarea inmediatamente
.\register-task.ps1 -RunNow

# 4. Eliminar la tarea programada
.\register-task.ps1 -Unregister
```

---

## 🛡️ Seguridad Crítica (Regla Joyose)

> [!CAUTION]
> **NUNCA DESACTIVAR `com.xiaomi.joyose`**:
> En los dispositivos Xiaomi con procesadores MediaTek Helio G81 Ultra, el paquete `com.xiaomi.joyose` es el controlador térmico del SoC. Desactivarlo o desinstalarlo provoca descalibración térmica y riesgo de brick térmico irreversible.
> Todos los módulos de este repositorio protegen explícitamente a `com.xiaomi.joyose`, así como a los servicios de telefonía (`com.android.phone`) y Google Play Services.

---

## ↩️ Reversión de Cambios

Si necesitas restaurar los valores de fábrica o reactivar todas las aplicaciones de Xiaomi:
```powershell
.\main.ps1 -Revert
```
Esto reactivará todas las aplicaciones catalogadas mediante `pm enable` y restablecerá las animaciones y tasa de refresco a valores predeterminados (1.0x / 60Hz).
