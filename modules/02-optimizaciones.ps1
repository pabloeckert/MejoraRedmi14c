<#
.SYNOPSIS
    Modulo 02: Optimizaciones de Rendimiento y UI para Xiaomi Redmi 14C.
.DESCRIPTION
    Ajusta la escala de animaciones a 0.5x, bloquea la tasa de refresco a 90Hz,
    optimiza la latencia de respuesta tactil, reduce el uso de blur y limita los
    escaneos en segundo plano para maximizar la fluidez en HyperOS.
#>

[CmdletBinding()]
param(
    [string]$Serial = "",
    [switch]$Revert
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
Write-Host " [Modulo 02] Optimizaciones de Rendimiento y UI (HyperOS 90Hz)    " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

if ($Revert) {
    Write-Host "[!] REVERSION: Restaurando valores estandar de fabrica..." -ForegroundColor Magenta

    Invoke-AdbShell "settings put system window_animation_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put system transition_animation_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put system animator_duration_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put global window_animation_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put global transition_animation_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put global animator_duration_scale 1.0" | Out-Null
    Invoke-AdbShell "settings put system peak_refresh_rate 60" | Out-Null
    Invoke-AdbShell "settings put system min_refresh_rate 60" | Out-Null
    Invoke-AdbShell "settings put global disable_window_blurs 0" | Out-Null

    Write-Host "[OK] Ajustes restablecidos a valores estandar (1.0x / 60Hz)." -ForegroundColor Green
    return
}

# 1. Animaciones ultra-rapidas a 0.5x
Write-Host "[*] Ajustando escalas de animacion a 0.5x..." -ForegroundColor Yellow
Invoke-AdbShell "settings put system window_animation_scale 0.5" | Out-Null
Invoke-AdbShell "settings put system transition_animation_scale 0.5" | Out-Null
Invoke-AdbShell "settings put system animator_duration_scale 0.5" | Out-Null
Invoke-AdbShell "settings put global window_animation_scale 0.5" | Out-Null
Invoke-AdbShell "settings put global transition_animation_scale 0.5" | Out-Null
Invoke-AdbShell "settings put global animator_duration_scale 0.5" | Out-Null

$winAnim = Invoke-AdbShell "settings get system window_animation_scale"
Write-Host "  -> Animaciones de ventana/transicion: ${winAnim}x" -ForegroundColor Green

# 2. Refresh Rate (90Hz para Helio G81 Ultra en Redmi 14C)
Write-Host "[*] Optimizando tasa de refresco a 90Hz..." -ForegroundColor Yellow
Invoke-AdbShell "settings put system peak_refresh_rate 90" | Out-Null
Invoke-AdbShell "settings put system min_refresh_rate 60" | Out-Null
Invoke-AdbShell "settings put system user_refresh_rate 90" | Out-Null
$peakHz = Invoke-AdbShell "settings get system peak_refresh_rate"
Write-Host "  -> Tasa de refresco maxima: ${peakHz}Hz" -ForegroundColor Green

# 3. Touch y Responsividad de Pantalla
Write-Host "[*] Optimizando respuesta tactil y reduciendo carga grafica..." -ForegroundColor Yellow
Invoke-AdbShell "settings put system pointer_speed 5" | Out-Null
Invoke-AdbShell "settings put global disable_window_blurs 1" | Out-Null
Invoke-AdbShell "settings put system disable_window_blurs 1" | Out-Null
Invoke-AdbShell "settings put system haptic_feedback_intensity 1" | Out-Null
Write-Host "  -> Puntero ajustado a velocidad 5, desenfoques GPU desactivados." -ForegroundColor Green

# 4. Gestion de Procesos en Segundo Plano (Activity Manager)
Write-Host "[*] Configurando limites optimos de procesos en cache..." -ForegroundColor Yellow
Invoke-AdbShell "settings put global activity_manager_constants max_cached_processes=32,background_settle_time=60000" | Out-Null
Write-Host "  -> max_cached_processes=32, background_settle_time=60000 ms" -ForegroundColor Green

# 5. Eliminacion de escaneos parasitos (Ahorro de bateria y radio)
Write-Host "[*] Desactivando escaneos continuos en segundo plano (WiFi/BT)..." -ForegroundColor Yellow
Invoke-AdbShell "settings put global wifi_scan_always_enabled 0" | Out-Null
Invoke-AdbShell "settings put global bluetooth_always_scanning 0" | Out-Null
Write-Host "  -> Escaneo continuo de WiFi y Bluetooth en reposo: DESACTIVADO" -ForegroundColor Green

# 6. Optimizacion DEXOPT (AOT speed-profile) para apps criticas
Write-Host "[*] Aplicando compilacion ART/DEXOPT de alta prioridad a Workspace..." -ForegroundColor Yellow
$priorityPkgs = @(
    "com.google.android.googlequicksearchbox",
    "com.google.android.keep",
    "com.google.android.calendar",
    "com.google.android.apps.docs"
)

foreach ($pkg in $priorityPkgs) {
    # Verificar si esta instalado
    $isInst = Invoke-AdbShell "pm list packages $pkg"
    if ($isInst -match [regex]::Escape("package:$pkg")) {
        Write-Host "  -> Compilando $pkg (speed-profile)..." -ForegroundColor Gray
        Invoke-AdbShell "cmd package compile -m speed-profile -f $pkg" | Out-Null
    }
}
Write-Host "  -> Workspace optimizado con compilacion AOT." -ForegroundColor Green

Write-Host ""
Write-Host "[RESUMEN OPTIMIZACIONES]" -ForegroundColor Cyan
Write-Host "  - Animaciones: 0.5x instantaneas" -ForegroundColor Green
Write-Host "  - Pantalla: 90Hz activos" -ForegroundColor Green
Write-Host "  - UI Blurs y escaneos parasitos: Desactivados" -ForegroundColor Green
Write-Host "  - Workspace: Aceleracion DEXOPT completada" -ForegroundColor Green
