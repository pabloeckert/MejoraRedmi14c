<#
.SYNOPSIS
    Registra la persistencia en Windows para el Demonio MejoraRedmi14c.
.DESCRIPTION
    Configura el inicio automatico al iniciar sesion:
    1. Intenta en el Programador de Tareas de Windows ('MejoraRedmi14c-Listener').
    2. Si no hay permisos de Administrador, configura la persistencia garantizada
       de inicio de sesion en el registro de usuario (HKCU:\Software\Microsoft\Windows\CurrentVersion\Run).
.EXAMPLE
    .\register-task.ps1              # Registra la persistencia al iniciar sesion
    .\register-task.ps1 -Status      # Consulta el estado actual
    .\register-task.ps1 -Unregister  # Elimina la persistencia
    .\register-task.ps1 -RunNow      # Inicia el listener de inmediato
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
$ErrorActionPreference = "Continue"

$Root = $PSScriptRoot
$ListenerScript = Join-Path $Root "listener.ps1"
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$pwshExe = (Get-Command "powershell.exe").Source
$taskArgs = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ListenerScript`""
$fullCmd = "`"$pwshExe`" $taskArgs"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " [Windows Persistencia] Gestor de Demonio: $TaskName              " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Consultar estado
if ($Status) {
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    $existingReg = (Get-ItemProperty -Path $regPath -Name $TaskName -ErrorAction SilentlyContinue).$TaskName

    if ($existingTask) {
        Write-Host "[*] Tarea en Task Scheduler: $TaskName" -ForegroundColor Green
        Write-Host "    - Estado: $($existingTask.State)" -ForegroundColor White
    } else {
        Write-Host "[-] No registrada en Task Scheduler (requiere permisos de Administrador)." -ForegroundColor Gray
    }

    if ($existingReg) {
        Write-Host "[*] Clave en Inicio de Usuario (HKCU Run): ACTIVA" -ForegroundColor Green
        Write-Host "    - Comando: $existingReg" -ForegroundColor White
    } else {
        Write-Host "[-] No registrada en Inicio de Usuario (HKCU Run)." -ForegroundColor Gray
    }
    return
}

# 2. Desregistrar
if ($Unregister) {
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "[OK] Tarea '$TaskName' eliminada de Task Scheduler." -ForegroundColor Green
    }
    if ((Get-ItemProperty -Path $regPath -Name $TaskName -ErrorAction SilentlyContinue).$TaskName) {
        Remove-ItemProperty -Path $regPath -Name $TaskName -ErrorAction SilentlyContinue
        Write-Host "[OK] Entrada '$TaskName' eliminada de Inicio de Usuario (HKCU Run)." -ForegroundColor Green
    }
    return
}

# 3. Iniciar ahora
if ($RunNow) {
    Start-Process -FilePath $pwshExe -ArgumentList $taskArgs -WorkingDirectory $Root
    Write-Host "[OK] Demonio iniciado en segundo plano." -ForegroundColor Green
    return
}

# 4. Registrar persistencia
if (-not (Test-Path $ListenerScript)) {
    Write-Error "No se encontro el archivo $ListenerScript."
    return
}

# Intento en Scheduled Tasks si se dispone de privilegios
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$taskCreated = $false

if ($isAdmin) {
    try {
        $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($existing) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        }
        $action = New-ScheduledTaskAction -Execute $pwshExe -Argument $taskArgs -WorkingDirectory $Root
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([System.TimeSpan]::Zero)
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Demonio ADB MejoraRedmi14c" | Out-Null
        Write-Host "[OK] Registrado en el Programador de Tareas de Windows (Task Scheduler)." -ForegroundColor Green
        $taskCreated = $true
    } catch {
        Write-Host "[!] Error registrando en Task Scheduler: $_" -ForegroundColor Yellow
    }
}

# Garantizar inicio automatico mediante HKCU Run (100% funcional sin requerir admin)
Set-ItemProperty -Path $regPath -Name $TaskName -Value $fullCmd
Write-Host "[OK] Registrado en el Inicio de Sesion de Usuario (HKCU Run):" -ForegroundColor Green
Write-Host "  - Entrada:   $TaskName" -ForegroundColor White
Write-Host "  - Comando:   $fullCmd" -ForegroundColor White
Write-Host "  - Ejecucion: Invisible (-WindowStyle Hidden) al iniciar sesion de $env:USERNAME." -ForegroundColor Green
