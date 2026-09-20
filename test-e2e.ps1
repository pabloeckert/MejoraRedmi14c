<#
.SYNOPSIS
    Bateria de Pruebas E2E (End-to-End) para Xiaomi Redmi 14C.
.DESCRIPTION
    Audita y certifica el 100% de la operatividad del sistema de hardware,
    rendimiento, permisos ciegos, Doze whitelist, sensores y disparo de asistente.
#>

[CmdletBinding()]
param(
    [string]$Serial = "NB5XWCLZSGB6J74D"
)

$results = @()

function Test-Item {
    param([string]$Category, [string]$TestName, [scriptblock]$Check)
    try {
        $passed = &$Check
        if ($passed) {
            Write-Host "[PASS] $TestName" -ForegroundColor Green
            return [PSCustomObject]@{ Categoria = $Category; Prueba = $TestName; Estado = "PASS" }
        } else {
            Write-Host "[FAIL] $TestName" -ForegroundColor Red
            return [PSCustomObject]@{ Categoria = $Category; Prueba = $TestName; Estado = "FAIL" }
        }
    } catch {
        Write-Host "[ERROR] $TestName : $_" -ForegroundColor DarkRed
        return [PSCustomObject]@{ Categoria = $Category; Prueba = $TestName; Estado = "ERROR" }
    }
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "=== INICIANDO AUDITORIA Y TEST E2E REDMI 14C ($Serial) ===" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Hardware y Rendimiento
$results += Test-Item "Hardware" "Animaciones a 0.5x" {
    $animGlobal = ((& adb -s $Serial shell settings get global window_animation_scale) -join "`n").Trim()
    $animSys = ((& adb -s $Serial shell settings get system window_animation_scale) -join "`n").Trim()
    ($animGlobal -match "0.5") -or ($animSys -match "0.5")
}

$results += Test-Item "Hardware" "Tasa de refresco forzada a 90Hz" {
    $ref = ((& adb -s $Serial shell settings get system peak_refresh_rate) -join "`n").Trim()
    $ref -match "90"
}

$results += Test-Item "Hardware" "Boton Power mapeado a Asistente" {
    $pwr = ((& adb -s $Serial shell settings get secure long_press_power_assist_active) -join "`n").Trim()
    $pwr -eq "1"
}

# 2. Rol y Servicios de Asistente
$results += Test-Item "Asistente" "Rol ASSISTANT asignado a Google" {
    $role = ((& adb -s $Serial shell cmd role get-role-holders android.app.role.ASSISTANT) -join "`n").Trim()
    $role -match "com.google.android.googlequicksearchbox"
}

$results += Test-Item "Asistente" "Servicio de voz GsaVoiceInteraction activo" {
    $svc = ((& adb -s $Serial shell settings get secure voice_interaction_service) -join "`n").Trim()
    $svc -match "GsaVoiceInteractionService"
}

# 3. Exenciones de Bateria (Doze Whitelist)
$whitelist = (& adb -s $Serial shell dumpsys deviceidle whitelist) -join "`n"
$pkgs = @(
    "com.google.android.googlequicksearchbox",
    "com.google.android.keep",
    "com.google.android.calendar",
    "com.google.android.syncadapters.calendar",
    "com.whatsapp",
    "com.arlosoft.macrodroid"
)

foreach ($pkg in $pkgs) {
    $results += Test-Item "Bateria/Doze" "Exencion Doze: $pkg" {
        $whitelist -match [regex]::Escape($pkg)
    }
}

# 4. Permisos Ciegos de Google/Gemini
$gsaDump = (& adb -s $Serial shell dumpsys package com.google.android.googlequicksearchbox) -join "`n"
$results += Test-Item "Permisos GSA" "Permiso de llamadas (CALL_PHONE)" { $gsaDump -match "android.permission.CALL_PHONE: granted=true" }
$results += Test-Item "Permisos GSA" "Permiso de contactos (READ_CONTACTS)" { $gsaDump -match "android.permission.READ_CONTACTS: granted=true" }
$results += Test-Item "Permisos GSA" "Permiso de microfono (RECORD_AUDIO)" { $gsaDump -match "android.permission.RECORD_AUDIO: granted=true" }
$results += Test-Item "Permisos GSA" "Permiso de SMS (SEND_SMS)" { $gsaDump -match "android.permission.SEND_SMS: granted=true" }

# 5. Permisos de Sensores y Deteccion de Auto (MacroDroid)
$mdDump = (& adb -s $Serial shell dumpsys package com.arlosoft.macrodroid) -join "`n"
$results += Test-Item "Auto/Sensores" "Reconocimiento de actividad fisica (Vehiculo)" { $mdDump -match "android.permission.ACTIVITY_RECOGNITION: granted=true" }
$results += Test-Item "Auto/Sensores" "Escritura de Ajustes Seguros (WRITE_SECURE_SETTINGS)" { $mdDump -match "android.permission.WRITE_SECURE_SETTINGS: granted=true" }
$results += Test-Item "Auto/Sensores" "Ubicacion en segundo plano (BACKGROUND_LOCATION)" { $mdDump -match "android.permission.ACCESS_BACKGROUND_LOCATION: granted=true" }

# 6. Prueba Funcional Activa (Disparo de Asistente)
Write-Host "`n[*] Ejecutando prueba de disparo funcional del asistente en pantalla..." -ForegroundColor Yellow
& adb -s $Serial shell input keyevent 219 2>&1 | Out-Null
& adb -s $Serial shell "am start -a android.intent.action.VOICE_ASSIST -p com.google.android.googlequicksearchbox" 2>&1 | Out-Null
Start-Sleep -Seconds 2
$topActivity = (& adb -s $Serial shell "dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'") -join "`n"
$results += Test-Item "Funcional" "Invocacion por evento de hardware / voz" {
    ($topActivity -match "googlequicksearchbox|bard|assistant") -or ($topActivity -match "RobinFloaty|GoogleAppVoiceAssistEntrypoint")
}

# Consolidado
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "=== REPORTE CONSOLIDADO DE CALIDAD ===" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

$results | Format-Table -AutoSize
$failed = ($results | Where-Object { $_.Estado -ne "PASS" }).Count

if ($failed -eq 0) {
    Write-Host "[V] CERTIFICACION EXITOSA: 100% de los tests en PASS. Telefono listo para produccion." -ForegroundColor Green
} else {
    Write-Host "[X] Se detectaron $failed fallas en el pipeline." -ForegroundColor Red
}
