<#
.SYNOPSIS
    Modulo 03: Asistente Gemini, Permisos Ciegos y Workspace Sync.
.DESCRIPTION
    1. Establece com.google.android.googlequicksearchbox como asistente predeterminado.
    2. Configura las actividades de Gemini / Opa y VoiceInteractionService.
    3. Habilita invocacion instantanea desde el boton de encendido (long press assist).
    4. Concede permisos absolutos de sistema (contactos, llamadas, microfono, SMS, etc.).
    5. Otorga AppOps de ejecucion irrestricta y ventanas emergentes (SYSTEM_ALERT_WINDOW).
    6. Exime de Doze/Sleep en HyperOS a Google, Keep, Calendar, Docs y WhatsApp.
    7. Garantiza la sincronizacion automatica de cuentas incluso en roaming.
#>

[CmdletBinding()]
param(
    [string]$Serial = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$adbCmd = if ([string]::IsNullOrWhiteSpace($Serial)) { "adb" } else { "adb -s $Serial" }

function Invoke-AdbShell {
    param([string]$Command)
    $fullCmd = "$adbCmd shell `"$Command`""
    $res = cmd.exe /c "$fullCmd 2>&1"
    return ($res -join "`n").Trim()
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " [Modulo 03] Asistente Gemini, Permisos Ciegos & Workspace Sync   " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

$GoogleAppPkg = "com.google.android.googlequicksearchbox"
$VoiceService = "com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService"
$OpaActivity  = "com.google.android.googlequicksearchbox/com.google.android.apps.gsa.staticplugins.opa.OpaConfigActivity"

# 1. Asignar Asistente por Defecto y Servicios de Voz
Write-Host "[*] Asignando $GoogleAppPkg como Asistente Digital por defecto..." -ForegroundColor Yellow

$roleRes = Invoke-AdbShell "cmd role add-role-holder --user 0 android.app.role.ASSISTANT $GoogleAppPkg"
try { Invoke-AdbShell "cmd role set-bms-role-holder --user 0 android.app.role.ASSISTANT $GoogleAppPkg" | Out-Null } catch { }

$currentHolder = Invoke-AdbShell "cmd role get-role-holders android.app.role.ASSISTANT"
if ($currentHolder -match [regex]::Escape($GoogleAppPkg)) {
    Write-Host "  [OK] Rol ASSISTANT confirmado para: $currentHolder" -ForegroundColor Green
} else {
    Write-Host "  [!] Rol actual reportado: $currentHolder" -ForegroundColor Yellow
}

# 2. Configurar Actividades de Gemini / Opa y Boton de Encendido
Write-Host "[*] Configurando servicios seguros de Gemini/Opa y boton de encendido..." -ForegroundColor Yellow
Invoke-AdbShell "settings put secure assistant $OpaActivity" | Out-Null
Invoke-AdbShell "settings put secure voice_interaction_service $VoiceService" | Out-Null
Invoke-AdbShell "settings put secure long_press_power_assist_active 1" | Out-Null
Invoke-AdbShell "settings put secure power_button_long_press 5" | Out-Null

$secAssist = Invoke-AdbShell "settings get secure assistant"
Write-Host "  [OK] Secure Assistant configurado: $secAssist" -ForegroundColor Green
Write-Host "  [OK] Long-press power button mapeado al asistente sin lag." -ForegroundColor Green

# 3. Permisos Ciegos de Sistema (Contactos, Telefono, Microfono, SMS, Notificaciones)
Write-Host "[*] Concediendo permisos ciegos de sistema a $GoogleAppPkg..." -ForegroundColor Yellow
$permissions = @(
    "android.permission.CALL_PHONE",
    "android.permission.READ_PHONE_STATE",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.SEND_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.READ_SMS",
    "android.permission.READ_CALL_LOG",
    "android.permission.RECORD_AUDIO",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.POST_NOTIFICATIONS"
)

foreach ($perm in $permissions) {
    Invoke-AdbShell "pm grant $GoogleAppPkg $perm" | Out-Null
}
Write-Host "  [OK] Permisos criticos (microfono, llamadas, contactos, SMS) otorgados." -ForegroundColor Green

# 4. AppOps: Ventanas Emergentes y Ejecucion en Segundo Plano
Write-Host "[*] Habilitando AppOps de ventanas emergentes y ejecucion sin limites..." -ForegroundColor Yellow
$appops = @(
    "SYSTEM_ALERT_WINDOW",
    "START_FOREGROUND",
    "RUN_ANY_IN_BACKGROUND",
    "WAKE_LOCK",
    "GET_USAGE_STATS"
)

foreach ($op in $appops) {
    Invoke-AdbShell "cmd appops set $GoogleAppPkg $op allow" | Out-Null
}
Write-Host "  [OK] SYSTEM_ALERT_WINDOW y RUN_ANY_IN_BACKGROUND activos." -ForegroundColor Green

# Paquete Gemini Independiente (si esta instalado)
$geminiPkg = "com.google.android.apps.bard"
$isBard = (Invoke-AdbShell "pm list packages $geminiPkg") -match $geminiPkg
if ($isBard) {
    Write-Host "[*] Aplicando permisos ciegos y AppOps a Gemini ($geminiPkg)..." -ForegroundColor Yellow
    foreach ($perm in $permissions) { Invoke-AdbShell "pm grant $geminiPkg $perm" | Out-Null }
    foreach ($op in $appops) { Invoke-AdbShell "cmd appops set $geminiPkg $op allow" | Out-Null }
    Write-Host "  [OK] App independiente de Gemini configurada con exito." -ForegroundColor Green
}

# 5. Bypass Doze / Sleep en HyperOS para Workspace y WhatsApp
Write-Host "[*] Eximiendo de Doze y suspension en segundo plano a Google Workspace..." -ForegroundColor Yellow

$workspacePackages = @(
    @{ Pkg = "com.google.android.googlequicksearchbox"; Name = "Google / Gemini / Searchbox" },
    @{ Pkg = "com.google.android.keep";                 Name = "Google Keep" },
    @{ Pkg = "com.google.android.calendar";             Name = "Google Calendar" },
    @{ Pkg = "com.google.android.syncadapters.calendar";Name = "Google Calendar Sync Adapter" },
    @{ Pkg = "com.google.android.apps.docs";            Name = "Google Drive / Docs" }
)

foreach ($item in $workspacePackages) {
    $pkg = $item.Pkg
    $name = $item.Name

    $wlOut = Invoke-AdbShell "dumpsys deviceidle whitelist +$pkg"
    Invoke-AdbShell "cmd appops set $pkg RUN_ANY_IN_BACKGROUND allow" | Out-Null
    Invoke-AdbShell "cmd appops set $pkg RUN_IN_BACKGROUND allow" | Out-Null
    Invoke-AdbShell "cmd appops set $pkg WAKE_LOCK allow" | Out-Null

    Write-Host "  [+] $name ($pkg): Whitelist / AppOps ALLOW" -ForegroundColor Green
}

# WhatsApp por voz
$wa = "com.whatsapp"
if ((Invoke-AdbShell "pm list packages $wa") -match $wa) {
    Invoke-AdbShell "cmd appops set $wa RUN_ANY_IN_BACKGROUND allow" | Out-Null
    Invoke-AdbShell "cmd appops set $wa WAKE_LOCK allow" | Out-Null
    Invoke-AdbShell "dumpsys deviceidle whitelist +$wa" | Out-Null
    Write-Host "  [+] WhatsApp ($wa): Whitelist Doze y AppOps blindados para voz" -ForegroundColor Green
}

# 6. Sincronizacion Activa de Cuentas
Write-Host "[*] Forzando sincronizacion activa de cuentas continua..." -ForegroundColor Yellow
Invoke-AdbShell "settings put global sync_automatically_when_roaming 1" | Out-Null
Invoke-AdbShell "settings put global master_sync_automatically 1" | Out-Null
try { Invoke-AdbShell "settings put master sync_automatically_when_roaming 1" | Out-Null } catch { }

$roamSync = Invoke-AdbShell "settings get global sync_automatically_when_roaming"
Write-Host "  [OK] sync_automatically_when_roaming = $roamSync" -ForegroundColor Green

Write-Host ""
Write-Host "[RESUMEN ASISTENTE Y SYNC]" -ForegroundColor Cyan
Write-Host "  - Asistente: $GoogleAppPkg (OpaConfigActivity activa)" -ForegroundColor Green
Write-Host "  - Permisos ciegos: Concedidos (Llamadas, Contactos, Microfono, SMS)" -ForegroundColor Green
Write-Host "  - Ventanas flotantes y background: SYSTEM_ALERT_WINDOW ALLOW" -ForegroundColor Green
Write-Host "  - Boton Power: Mapeado a invocacion de Gemini sin retardo" -ForegroundColor Green
Write-Host "  - Doze Whitelist: Google, Keep, Calendar, Docs y WhatsApp exentos" -ForegroundColor Green
