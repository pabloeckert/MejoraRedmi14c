#Requires -Version 5.1
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding              = [System.Text.UTF8Encoding]::new($false)
<#
.SYNOPSIS
    Redmi Forge — setup en una PC nueva con un solo comando.
    Instala dependencias Python, verifica ADB y Git Bash, y registra
    el OTA watcher en el Programador de tareas de Windows.

.USAGE
    En PowerShell (como usuario normal, sin admin):
        Set-ExecutionPolicy -Scope CurrentUser Bypass -Force
        .\setup.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT   = $PSScriptRoot
$REPO   = Split-Path $ROOT -Leaf

function Write-Step  { param($n, $msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg)      Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg)      Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg)      Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Redmi Forge — Setup ===" -ForegroundColor White

# ─── 1. Python ────────────────────────────────────────────────────────────────
Write-Step 1 "Verificando Python 3.11+"

$py = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python (\d+)\.(\d+)") {
            $major = [int]$Matches[1]; $minor = [int]$Matches[2]
            if ($major -ge 3 -and $minor -ge 11) { $py = $cmd; break }
        }
    } catch { }
}

if (-not $py) {
    Write-Warn "Python 3.11+ no encontrado. Intentando instalar via winget..."
    winget install --id Python.Python.3.11 --scope user --silent --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "No se pudo instalar Python. Descargalo desde https://python.org/downloads y volvé a correr este script."
    }
    # Recargar PATH de la sesión actual
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","Machine")
    foreach ($cmd in @("python", "python3", "py")) {
        try {
            $ver = & $cmd --version 2>&1
            if ($ver -match "Python (\d+)\.(\d+)") {
                $major = [int]$Matches[1]; $minor = [int]$Matches[2]
                if ($major -ge 3 -and $minor -ge 11) { $py = $cmd; break }
            }
        } catch { }
    }
    if (-not $py) { Write-Fail "Python instalado pero no disponible en PATH. Cerrá y volvé a abrir la terminal." }
}

$pyPath = (Get-Command $py).Source
Write-OK "Python: $pyPath ($ver)"

# ─── 2. Dependencias Python ───────────────────────────────────────────────────
Write-Step 2 "Instalando dependencias Python"

$req = Join-Path $ROOT "requirements.txt"
if (-not (Test-Path $req)) { Write-Fail "requirements.txt no encontrado en $ROOT" }

& $py -m pip install --quiet --upgrade pip
& $py -m pip install --quiet -r $req

if ($LASTEXITCODE -ne 0) { Write-Fail "pip install falló. Revisá la salida de error." }
Write-OK "PySide6 + anthropic instalados"

# ─── 3. ADB ──────────────────────────────────────────────────────────────────
Write-Step 3 "Verificando ADB"

$vendorAdb = Join-Path $ROOT "vendor\adb\adb.exe"
$adbOk     = $false

if (Test-Path $vendorAdb) {
    Write-OK "ADB encontrado en vendor/adb/adb.exe"
    $adbOk = $true
} elseif (Get-Command "adb" -ErrorAction SilentlyContinue) {
    Write-OK "ADB encontrado en PATH: $((Get-Command adb).Source)"
    $adbOk = $true
} else {
    Write-Warn "ADB no encontrado. Opciones:"
    Write-Host "    a) Instalá android-platform-tools: winget install Google.PlatformTools" -ForegroundColor Yellow
    Write-Host "    b) Copiá adb.exe a: $vendorAdb" -ForegroundColor Yellow
}

# ─── 4. Git Bash ─────────────────────────────────────────────────────────────
Write-Step 4 "Verificando Git Bash (necesario para src/cli/run.sh)"

$gitBash = @(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files (x86)\Git\bin\bash.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($gitBash) {
    Write-OK "Git Bash: $gitBash"
} elseif (Get-Command "wsl" -ErrorAction SilentlyContinue) {
    Write-OK "WSL disponible como alternativa a Git Bash"
} else {
    Write-Warn "Git Bash no encontrado. Instalalo desde https://git-scm.com"
    Write-Host "    (necesario para ejecutar la optimización CLI)" -ForegroundColor Yellow
}

# ─── 5. OTA Watcher en Task Scheduler ────────────────────────────────────────
Write-Step 5 "Registrando OTA watcher en Programador de tareas"

$taskName   = "RedmiForge-OTA"
$scriptPath = Join-Path $ROOT "forge\services\ota_check.py"

# pythonw.exe = Python sin ventana de consola
$pythonw = $pyPath -replace "python\.exe$", "pythonw.exe"
if (-not (Test-Path $pythonw)) { $pythonw = $pyPath }

Write-Host "" -ForegroundColor Gray
Write-Host "  Comando equivalente manual:" -ForegroundColor Gray
Write-Host "  schtasks /create /tn `"RedmiForge-OTA`" /tr `"`"$pythonw`" `"$scriptPath`"`" /sc hourly /mo 1 /st 09:00 /f" -ForegroundColor DarkGray
Write-Host "" -ForegroundColor Gray

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "  Tarea anterior eliminada (se recrea con config actual)" -ForegroundColor Gray
}

$action = New-ScheduledTaskAction `
    -Execute          $pythonw `
    -Argument         "`"$scriptPath`"" `
    -WorkingDirectory $ROOT

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Hours 1)

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 3) `
    -StartWhenAvailable `
    -DontStopOnIdleEnd

Register-ScheduledTask `
    -TaskName    $taskName `
    -Action      $action `
    -Trigger     $trigger `
    -Settings    $settings `
    -Description "Redmi Forge: chequeo OTA cada 14 dias + notificacion ADB si device conectado" `
    -RunLevel    Limited | Out-Null

Write-OK "Tarea '$taskName' registrada — corre cada hora, chequeo OTA real cada 14 dias"

# ─── Resumen ──────────────────────────────────────────────────────────────────
Write-Host @"

=== Setup completado ===

  Arrancar UI:       python main.py
  CLI (optimizar):   cd src/cli && bash run.sh --full
  CLI (mantenimiento): cd src/cli && bash run.sh --maintenance
  OTA watcher:       corre automatico cada 14 dias (Task Scheduler)
                     o manualmente: python forge\services\ota_check.py

"@ -ForegroundColor White
