<#
.SYNOPSIS
    Orquestador principal interactivo y por lotes para Xiaomi Redmi 14C.
.DESCRIPTION
    Permite ejecutar de forma manual, modular o por lotes la suite de mantenimiento,
    debloat, optimizaciones y sincronizacion de Workspace en HyperOS.
.EXAMPLE
    .\main.ps1                     # Despliega el menu interactivo
    .\main.ps1 -All                # Ejecuta el pipeline completo de punta a punta
    .\main.ps1 -Debloat            # Ejecuta unicamente el debloat seguro
    .\main.ps1 -Optimize           # Ejecuta unicamente las optimizaciones de UI/90Hz
    .\main.ps1 -Sync               # Ejecuta configuracion de Gemini y sync Doze
    .\main.ps1 -Status             # Muestra informe de diagnostico del dispositivo
    .\main.ps1 -Revert             # Revierte el debloat y animaciones a fabrica
#>

[CmdletBinding()]
param(
    [switch]$All,
    [switch]$Debloat,
    [switch]$Optimize,
    [switch]$Sync,
    [switch]$Status,
    [switch]$Revert,
    [string]$Serial = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$Root = $PSScriptRoot
$ModulesDir = Join-Path $Root "modules"

function Show-Banner {
    Clear-Host
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "                  XIAOMI REDMI 14C (HyperOS 3)                    " -ForegroundColor Cyan
    Write-Host "       Ecosistema de Mantenimiento, Debloat y Workspace Sync      " -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan
}

function Test-AdbDevice {
    if (-not (Get-Command "adb" -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] El comando 'adb' no se encuentra en el PATH de Windows." -ForegroundColor Red
        return $null
    }

    $rawDevices = & adb devices -l
    $deviceLines = $rawDevices | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices" }
    
    if (-not $deviceLines) {
        Write-Host "[!] No hay ningun dispositivo Android conectado y autorizado con ADB." -ForegroundColor Yellow
        Write-Host "    Asegurate de conectar el cable USB y activar 'Depuracion USB'." -ForegroundColor Gray
        return $null
    }

    # Seleccionar dispositivo
    $targetSerial = $Serial
    if ([string]::IsNullOrWhiteSpace($targetSerial)) {
        $firstLine = ($deviceLines | Select-Object -First 1) -replace "\s+", " "
        $targetSerial = ($firstLine -split " ")[0]
    }

    $model = (& adb -s $targetSerial shell getprop ro.product.model 2>&1).Trim()
    $device = (& adb -s $targetSerial shell getprop ro.product.device 2>&1).Trim()

    return [PSCustomObject]@{
        Serial = $targetSerial
        Model  = $model
        Device = $device
    }
}

function Show-DeviceStatus {
    param($dev)
    Write-Host "`n==================================================================" -ForegroundColor Cyan
    Write-Host " DIAGNOSTICO DEL DISPOSITIVO: $($dev.Model) ($($dev.Device))" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan

    $s = $dev.Serial
    $android = (& adb -s $s shell getprop ro.build.version.release 2>&1).Trim()
    $security = (& adb -s $s shell getprop ro.build.version.security_patch 2>&1).Trim()
    $winAnim = (& adb -s $s shell settings get system window_animation_scale 2>&1).Trim()
    $peakHz = (& adb -s $s shell settings get system peak_refresh_rate 2>&1).Trim()
    $assist = (& adb -s $s shell settings get secure assistant 2>&1).Trim()
    $roleHolder = (& adb -s $s shell cmd role get-role-holders android.app.role.ASSISTANT 2>&1).Trim()
    $roamSync = (& adb -s $s shell settings get global sync_automatically_when_roaming 2>&1).Trim()
    $whitelist = (& adb -s $s shell dumpsys deviceidle whitelist 2>&1) -join "`n"

    Write-Host "  - Numero de Serie:       $s" -ForegroundColor Green
    Write-Host "  - Version de Android:    $android (Parche: $security)" -ForegroundColor White
    Write-Host "  - Escala de Animaciones: ${winAnim}x" -ForegroundColor Green
    Write-Host "  - Refresh Rate Maximo:   ${peakHz}Hz" -ForegroundColor Green
    Write-Host "  - Asistente Configurado: $assist" -ForegroundColor Green
    Write-Host "  - Titular de Rol Asist.: $roleHolder" -ForegroundColor Green
    Write-Host "  - Sync en Roaming:       $roamSync" -ForegroundColor Green
    Write-Host "`n  [Verificacion Whitelist Doze]:" -ForegroundColor Cyan
    
    $checkPkgs = @(
        @{ Pkg = "com.google.android.googlequicksearchbox"; Name = "Google / Gemini / Searchbox" },
        @{ Pkg = "com.google.android.keep";                 Name = "Google Keep" },
        @{ Pkg = "com.google.android.syncadapters.calendar";Name = "Google Calendar Sync Engine" },
        @{ Pkg = "com.google.android.calendar";             Name = "Google Calendar App (opcional)" },
        @{ Pkg = "com.google.android.apps.docs";            Name = "Google Drive / Docs" }
    )

    foreach ($item in $checkPkgs) {
        $p = $item.Pkg
        $name = $item.Name
        $isWhitelisted = $whitelist -match [regex]::Escape($p)
        if ($isWhitelisted) {
            Write-Host "    * $name ($p): [OK] EXENTO DE DOZE" -ForegroundColor Green
        } else {
            $isInst = (& adb -s $s shell pm list packages $p 2>&1) -match [regex]::Escape("package:$p")
            if ($isInst) {
                Write-Host "    * $name ($p): [!] NO EXENTO" -ForegroundColor Yellow
            } else {
                Write-Host "    * $name ($p): [-] NO INSTALADO (abierto en Play Store)" -ForegroundColor DarkGray
            }
        }
    }
}

# Ejecucion por flags de linea de comandos
$isCliMode = $All -or $Debloat -or $Optimize -or $Sync -or $Status -or $Revert

if ($isCliMode) {
    $dev = Test-AdbDevice
    if (-not $dev) { exit 1 }

    Write-Host "[*] Dispositivo activo: $($dev.Model) [Serial: $($dev.Serial)]" -ForegroundColor Green

    if ($Status) {
        Show-DeviceStatus -dev $dev
        exit 0
    }

    if ($Revert) {
        & "$ModulesDir\01-debloat.ps1" -Serial $dev.Serial -Revert
        & "$ModulesDir\02-optimizaciones.ps1" -Serial $dev.Serial -Revert
        exit 0
    }

    if ($All -or $Debloat) {
        & "$ModulesDir\01-debloat.ps1" -Serial $dev.Serial
    }
    if ($All -or $Optimize) {
        & "$ModulesDir\02-optimizaciones.ps1" -Serial $dev.Serial
    }
    if ($All -or $Sync) {
        & "$ModulesDir\03-asistente-sync.ps1" -Serial $dev.Serial
    }

    Write-Host "`n[OK] Ejecucion completada." -ForegroundColor Green
    exit 0
}

# Menu Interactivo
while ($true) {
    Show-Banner
    $dev = Test-AdbDevice

    if ($dev) {
        Write-Host "  Dispositivo Conectado: $($dev.Model) ($($dev.Device)) | Serial: $($dev.Serial)" -ForegroundColor Green
    } else {
        Write-Host "  Estado: Sin dispositivo ADB conectado." -ForegroundColor Yellow
    }

    Write-Host @"

  MENU DE OPCIONES:
  ------------------------------------------------------------------
  [1] Ejecutar Pipeline Completo (Debloat + Optimizaciones + Sync)
  [2] Modulo 01: Debloat Seguro HyperOS (Desactivar Telemetria/Ads)
  [3] Modulo 02: Optimizaciones UI y Rendimiento (0.5x, 90Hz, DEXOPT)
  [4] Modulo 03: Asistente Gemini y Bypass Doze (Keep/Calendar/Docs)
  [5] Diagnostico y Estado del Redmi 14C
  [6] Revertir Cambios (Reactivar bloatware y animaciones a fabrica)
  [7] Iniciar Demonio en Primer Plano (listener.ps1)
  [8] Salir
  ------------------------------------------------------------------
"@ -ForegroundColor White

    $opc = Read-Host " Selecciona una opcion (1-8)"

    switch ($opc) {
        "1" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            & "$ModulesDir\01-debloat.ps1" -Serial $dev.Serial
            & "$ModulesDir\02-optimizaciones.ps1" -Serial $dev.Serial
            & "$ModulesDir\03-asistente-sync.ps1" -Serial $dev.Serial
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "2" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            & "$ModulesDir\01-debloat.ps1" -Serial $dev.Serial
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "3" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            & "$ModulesDir\02-optimizaciones.ps1" -Serial $dev.Serial
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "4" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            & "$ModulesDir\03-asistente-sync.ps1" -Serial $dev.Serial
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "5" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            Show-DeviceStatus -dev $dev
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "6" {
            if (-not $dev) { Write-Host "[!] Conecta el telefono primero." -ForegroundColor Red; Start-Sleep 2; break }
            & "$ModulesDir\01-debloat.ps1" -Serial $dev.Serial -Revert
            & "$ModulesDir\02-optimizaciones.ps1" -Serial $dev.Serial -Revert
            Write-Host "`nPresiona Enter para volver al menu..." -ForegroundColor Gray
            Read-Host | Out-Null
        }
        "7" {
            & "$Root\listener.ps1"
            break
        }
        "8" {
            Write-Host "`nSaliendo..." -ForegroundColor Cyan
            return
        }
        default {
            Write-Host "Opcion no valida." -ForegroundColor Red
            Start-Sleep 1
        }
    }
}
