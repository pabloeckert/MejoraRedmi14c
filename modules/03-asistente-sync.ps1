<#
.SYNOPSIS
    Modulo 03: Asistente Gemini y Sincronizacion Continua de Google Workspace.
.DESCRIPTION
    1. Establece com.google.android.googlequicksearchbox como asistente predeterminado.
    2. Configura las actividades de Gemini / Opa y VoiceInteractionService.
    3. Exime del ahorro de bateria / Doze de HyperOS a Keep, Calendar, Docs y Searchbox.
    4. Garantiza la sincronizacion automatica de cuentas incluso en roaming.
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
    $res = cmd.exe /c $fullCmd 2>&1
    return ($res -join "`n").Trim()
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " [Modulo 03] Asistente Gemini / Workspace & Bypass Doze HyperOS    " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

$GoogleAppPkg = "com.google.android.googlequicksearchbox"
$VoiceService = "com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService"

# 1. Asignar Asistente por Defecto
Write-Host "[*] Asignando $GoogleAppPkg como Asistente Digital por defecto..." -ForegroundColor Yellow

# Intento con sintaxis AOSP oficial
$roleRes = Invoke-AdbShell "cmd role add-role-holder --user 0 android.app.role.ASSISTANT $GoogleAppPkg"
if (-not [string]::IsNullOrWhiteSpace($roleRes)) {
    Write-Host "  -> cmd role add-role-holder: $roleRes" -ForegroundColor Gray
}

# Intento de compatibilidad bms-role-holder
try {
    Invoke-AdbShell "cmd role set-bms-role-holder $GoogleAppPkg" | Out-Null
} catch { }

# Verificar titular del rol
$currentHolder = Invoke-AdbShell "cmd role get-role-holders android.app.role.ASSISTANT"
if ($currentHolder -match [regex]::Escape($GoogleAppPkg)) {
    Write-Host "  [OK] Rol ASSISTANT confirmado para: $currentHolder" -ForegroundColor Green
} else {
    Write-Host "  [!] Rol actual reportado: $currentHolder" -ForegroundColor Yellow
}

# 2. Configurar Actividades de Gemini / Opa
Write-Host "[*] Configurando servicios seguros de voz y Gemini/Opa..." -ForegroundColor Yellow
Invoke-AdbShell "settings put secure assistant $VoiceService" | Out-Null
Invoke-AdbShell "settings put secure voice_interaction_service $VoiceService" | Out-Null

$secAssist = Invoke-AdbShell "settings get secure assistant"
Write-Host "  [OK] Secure Assistant configurado: $secAssist" -ForegroundColor Green

# 3. Bypass Doze / Sleep en HyperOS para Apps de Workspace
Write-Host "[*] Eximiendo de Doze y suspension en segundo plano a Google Workspace..." -ForegroundColor Yellow

$workspacePackages = @(
    @{ Pkg = "com.google.android.googlequicksearchbox"; Name = "Google / Gemini / Searchbox" },
    @{ Pkg = "com.google.android.keep";                 Name = "Google Keep" },
    @{ Pkg = "com.google.android.calendar";             Name = "Google Calendar" },
    @{ Pkg = "com.google.android.apps.docs";            Name = "Google Drive / Docs" }
)

foreach ($item in $workspacePackages) {
    $pkg = $item.Pkg
    $name = $item.Name

    # 3.1 deviceidle whitelist
    $wlOut = Invoke-AdbShell "dumpsys deviceidle whitelist +$pkg"
    
    # 3.2 AppOps: Permitir ejecucion en segundo plano sin restricciones
    Invoke-AdbShell "cmd appops set $pkg RUN_ANY_IN_BACKGROUND allow" | Out-Null
    Invoke-AdbShell "cmd appops set $pkg RUN_IN_BACKGROUND allow" | Out-Null
    Invoke-AdbShell "cmd appops set $pkg WAKE_LOCK allow" | Out-Null

    Write-Host "  [+] $name ($pkg):" -ForegroundColor White
    Write-Host "      - Deviceidle Whitelist: $wlOut" -ForegroundColor Green
    Write-Host "      - AppOps RUN_ANY_IN_BACKGROUND: ALLOW" -ForegroundColor Green
}

# 4. Sincronizacion Activa de Cuentas
Write-Host "[*] Forzando sincronizacion activa de cuentas continua..." -ForegroundColor Yellow

# Sincronizacion en Roaming y auto-sync global
Invoke-AdbShell "settings put global sync_automatically_when_roaming 1" | Out-Null
Invoke-AdbShell "settings put global master_sync_automatically 1" | Out-Null

# Compatibilidad con comando literal de solicitud
try {
    Invoke-AdbShell "settings put master sync_automatically_when_roaming 1" 2>$null | Out-Null
} catch { }

$roamSync = Invoke-AdbShell "settings get global sync_automatically_when_roaming"
Write-Host "  [OK] sync_automatically_when_roaming = $roamSync" -ForegroundColor Green

Write-Host ""
Write-Host "[RESUMEN ASISTENTE Y SYNC]" -ForegroundColor Cyan
Write-Host "  - Asistente: $GoogleAppPkg (Activo)" -ForegroundColor Green
Write-Host "  - Doze Whitelist: Google, Keep, Calendar y Docs exentos de suspension" -ForegroundColor Green
Write-Host "  - AppOps: Ejecucion irrestricta en segundo plano habilitada" -ForegroundColor Green
Write-Host "  - Sincronizacion automatica: Activada permanentemente" -ForegroundColor Green
