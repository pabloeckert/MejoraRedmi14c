<#
.SYNOPSIS
    Demonio / Listener en segundo plano para Xiaomi Redmi 14C (HyperOS).
.DESCRIPTION
    Monitorea de forma continua las conexiones ADB. Cuando se conecta un Redmi 14C
    (modelo 2409BRN2C* / codename 'pond'), valida su identidad y ejecuta automaticamente
    el pipeline completo de optimizacion y sincronizacion de Workspace:
      1. modules\01-debloat.ps1
      2. modules\02-optimizaciones.ps1
      3. modules\03-asistente-sync.ps1
    Luego entra en un bucle de espera de desconexion para no repetir la ejecucion
    mientras el cable USB siga conectado.
#>

[CmdletBinding()]
param(
    [switch]$Once
)

$Host.UI.RawUI.WindowTitle = "MejoraRedmi14c - ADB Listener Daemon"
$ErrorActionPreference = "Continue"

$Root = $PSScriptRoot
$ModulesDir = Join-Path $Root "modules"

# Verificar binario ADB
if (-not (Get-Command "adb" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] ADB no se encuentra disponible en el PATH del sistema." -ForegroundColor Red
    exit 1
}

Write-Host @"
==================================================================
             MEJORA REDMI 14C - ADB LISTENER DAEMON               
        Automatizacion de Mantenimiento y Workspace HyperOS       
==================================================================
"@ -ForegroundColor Cyan

Write-Host "[*] Directorio base: $Root" -ForegroundColor Gray
Write-Host "[*] Demonio activo. Conecta tu Xiaomi Redmi 14C por USB (Depuracion activada)..." -ForegroundColor Yellow

while ($true) {
    Write-Host "`n[LISTENER] Bloqueando en adb wait-for-device..." -ForegroundColor Cyan
    
    # Bloqueo eficiente en espera de hardware ADB
    & adb wait-for-device

    # Obtener serial y propiedades del dispositivo conectado
    $serial = (& adb get-serialno).Trim()
    if ([string]::IsNullOrWhiteSpace($serial) -or $serial -eq "unknown") {
        Start-Sleep -Seconds 2
        continue
    }

    $model = (& adb -s $serial shell getprop ro.product.model 2>&1).Trim()
    $device = (& adb -s $serial shell getprop ro.product.device 2>&1).Trim()
    $androidVer = (& adb -s $serial shell getprop ro.build.version.release 2>&1).Trim()

    Write-Host "`n[DISPOSITIVO DETECTADO] Serial: $serial | Modelo: $model | Device: $device | Android: $androidVer" -ForegroundColor Green

    # Validacion de compatibilidad contra Redmi 14C (2409BRN2C* o codename pond)
    $isValid = ($model -match "2409BRN2C|Redmi 14C") -or ($device -match "pond")

    if ($isValid) {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "==================================================================" -ForegroundColor Green
        Write-Host " INICIANDO PIPELINE DE MANTENIMIENTO: $model [$timestamp]" -ForegroundColor White
        Write-Host "==================================================================" -ForegroundColor Green

        # 1. Debloat
        $debloatScript = Join-Path $ModulesDir "01-debloat.ps1"
        if (Test-Path $debloatScript) {
            Write-Host "`n>> Ejecutando Modulo 01: Debloat..." -ForegroundColor Cyan
            & $debloatScript -Serial $serial
        }

        # 2. Optimizaciones
        $optScript = Join-Path $ModulesDir "02-optimizaciones.ps1"
        if (Test-Path $optScript) {
            Write-Host "`n>> Ejecutando Modulo 02: Optimizaciones..." -ForegroundColor Cyan
            & $optScript -Serial $serial
        }

        # 3. Asistente y Sincronizacion Workspace
        $syncScript = Join-Path $ModulesDir "03-asistente-sync.ps1"
        if (Test-Path $syncScript) {
            Write-Host "`n>> Ejecutando Modulo 03: Asistente y Sync Workspace..." -ForegroundColor Cyan
            & $syncScript -Serial $serial
        }

        Write-Host "`n==================================================================" -ForegroundColor Green
        Write-Host " [OK] PIPELINE COMPLETADO EXITOSAMENTE PARA: $model" -ForegroundColor Green
        Write-Host "==================================================================" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] El dispositivo conectado ($model / $device) no es un Redmi 14C compatible. Se omite el pipeline." -ForegroundColor Yellow
    }

    if ($Once) {
        Write-Host "[*] Modo -Once solicitado. Finalizando daemon." -ForegroundColor Gray
        break
    }

    # Bucle de espera de desconexion para no repetir en falso
    Write-Host "`n[*] Esperando desconexion fisica de $serial antes de reiniciar escucha..." -ForegroundColor DarkGray
    while ($true) {
        Start-Sleep -Seconds 3
        $devicesOutput = (& adb devices 2>&1) -join "`n"
        if ($devicesOutput -notmatch [regex]::Escape($serial) -or $devicesOutput -match "$serial\s+offline") {
            Write-Host "`n[DESCONEXION] Dispositivo $serial desconectado." -ForegroundColor Yellow
            Write-Host "[*] Restableciendo escucha para la proxima conexion..." -ForegroundColor Cyan
            break
        }
    }

    Start-Sleep -Seconds 2
}
