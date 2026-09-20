<#
.SYNOPSIS
    Registra la tarea programada en Windows para el Demonio MejoraRedmi14c.
.DESCRIPTION
    Crea, actualiza o remueve una tarea en el Programador de Tareas de Windows llamada
    'MejoraRedmi14c-Listener'. Se ejecuta de forma invisible (-WindowStyle Hidden)
    al iniciar sesion cualquier usuario en Windows.
.EXAMPLE
    .\register-task.ps1              # Registra o actualiza la tarea (solicita elevacion si es necesario)
    .\register-task.ps1 -Status      # Consulta el estado actual
    .\register-task.ps1 -Unregister  # Elimina la tarea
    .\register-task.ps1 -RunNow      # Inicia la tarea de inmediato
#>

[CmdletBinding()]
param(
    [string]$TaskName = "MejoraRedmi14c-Listener",
    [switch]$Unregister,
    [switch]$Status,
    [switch]$RunNow,
    [switch]$NoElevate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$ListenerScript = Join-Path $Root "listener.ps1"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " [Windows Task Scheduler] Gestor de Demonio: $TaskName            " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Consultar estado (no requiere admin)
if ($Status) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "[*] Tarea encontrada: $TaskName" -ForegroundColor Green
        Write-Host "    - Estado:       $($existing.State)" -ForegroundColor White
        Write-Host "    - Ejecutable:   $($existing.Actions.Execute) $($existing.Actions.Arguments)" -ForegroundColor Gray
        Write-Host "    - Oculta:       $($existing.Settings.Hidden)" -ForegroundColor White
    } else {
        Write-Host "[!] La tarea '$TaskName' NO se encuentra registrada en Windows." -ForegroundColor Yellow
    }
    return
}

# 2. Verificar permisos de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin -and -not $NoElevate) {
    Write-Host "[*] El Programador de Tareas de Windows requiere privilegios de Administrador." -ForegroundColor Yellow
    Write-Host "[*] Solicitando elevacion UAC..." -ForegroundColor Cyan

    $scriptPath = $PSCommandPath
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -NoElevate"
    if ($Unregister) { $argList += " -Unregister" }
    if ($RunNow)     { $argList += " -RunNow" }
    if ($TaskName -ne "MejoraRedmi14c-Listener") { $argList += " -TaskName `"$TaskName`"" }

    try {
        $p = Start-Process -FilePath "powershell.exe" -ArgumentList $argList -Verb RunAs -PassThru -Wait
        if ($p.ExitCode -eq 0) {
            Write-Host "[OK] Operacion completada con privilegios de Administrador." -ForegroundColor Green
        } else {
            Write-Host "[!] La operacion finalizo con codigo: $($p.ExitCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] No se pudo elevar la sesion: $_" -ForegroundColor Red
        Write-Host "Por favor, abre PowerShell como Administrador y vuelve a ejecutar: .\register-task.ps1" -ForegroundColor Yellow
    }
    return
}

# 3. Desregistrar tarea
if ($Unregister) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "[OK] Tarea '$TaskName' eliminada exitosamente del Programador de Tareas." -ForegroundColor Green
    } else {
        Write-Host "[!] La tarea '$TaskName' no existe, nada que remover." -ForegroundColor Yellow
    }
    return
}

# 4. Ejecutar tarea de inmediato
if ($RunNow) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $existing) {
        Write-Host "[!] La tarea '$TaskName' no esta registrada. Creandola primero..." -ForegroundColor Yellow
    } else {
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "[OK] Tarea '$TaskName' iniciada en segundo plano." -ForegroundColor Green
        return
    }
}

# 5. Registrar / Recrear la tarea
if (-not (Test-Path $ListenerScript)) {
    Write-Error "No se encontro el archivo $ListenerScript. Verifica la ruta."
    return
}

$pwshExe = (Get-Command "powershell.exe").Source
$taskArgs = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ListenerScript`""

# Eliminar version previa si ya existe
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[*] Tarea previa detectada. Actualizando configuracion..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction `
    -Execute $pwshExe `
    -Argument $taskArgs `
    -WorkingDirectory $Root

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([System.TimeSpan]::Zero) `
    -Priority 7

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Limited `
    -Description "Demonio ADB para mantenimiento automatico y optimizacion Workspace de Xiaomi Redmi 14C." | Out-Null

try {
    $registered = Get-ScheduledTask -TaskName $TaskName
    $registered.Settings.Hidden = $true
    Set-ScheduledTask -InputObject $registered | Out-Null
} catch {
}

Write-Host @"
[OK] Tarea '$TaskName' registrada exitosamente.
  - Disparador: Al iniciar sesion ($env:USERNAME)
  - Ejecutable: $pwshExe
  - Parametros: $taskArgs
  - Directorio: $Root
  - Modo:       Segundo plano (Hidden)
"@ -ForegroundColor Green
