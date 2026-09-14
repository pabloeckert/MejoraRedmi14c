#Requires -RunAsAdministrator
#Requires -Version 5.1
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding              = [System.Text.UTF8Encoding]::new($false)

<#
.SYNOPSIS
    PhoneOptimizer Pro / Redmi Forge — instalación completa desde cero.
    Clona (o actualiza) el repo en C:\RedmiForge, instala dependencias,
    verifica ADB/Git Bash y registra el OTA watcher. Al terminar, el
    teléfono queda listo para conectar y optimizar.

.USO
    1. Abrí PowerShell como Administrador
    2. cd C:\
    3. .\install.ps1
       (si PowerShell se queja de política de ejecución, corré antes:
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$REPO_URL   = "https://github.com/pabloeckert/MejoraRedmi14c.git"
$INSTALL_DIR = "C:\RedmiForge"

function Write-Step { param($n, $msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg)      Write-Host "  OK   $msg" -ForegroundColor Green }
function Write-Warn { param($msg)      Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg)      Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

Write-Host @"

===================================================
 PhoneOptimizer Pro / Redmi Forge -- Instalación
 Destino: $INSTALL_DIR
===================================================
"@ -ForegroundColor White

# ─── 1. Verificar Git ──────────────────────────────────────────────────────────
Write-Step 1 "Verificando Git"

if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Warn "Git no encontrado. Instalando via winget..."
    winget install --id Git.Git --scope machine --silent --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "No se pudo instalar Git. Descargalo desde https://git-scm.com y volvé a correr este script."
    }
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","Machine")
    if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
        Write-Fail "Git instalado pero no disponible en PATH. Cerrá y volvé a abrir PowerShell como admin, y volvé a correr este script."
    }
}
Write-OK "Git: $((Get-Command git).Source)"

# ─── 2. Clonar o actualizar el repo ────────────────────────────────────────────
Write-Step 2 "Clonando/actualizando repositorio en $INSTALL_DIR"

if (Test-Path (Join-Path $INSTALL_DIR ".git")) {
    Write-Host "  Repo ya existe -- actualizando..." -ForegroundColor Gray
    Push-Location $INSTALL_DIR
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "git pull falló (¿cambios locales?). Usando versión local existente sin actualizar."
    } else {
        Write-OK "Repo actualizado"
    }
    Pop-Location
} else {
    git clone $REPO_URL $INSTALL_DIR
    if ($LASTEXITCODE -ne 0) { Write-Fail "git clone falló. Revisá tu conexión a internet." }
    Write-OK "Repo clonado en $INSTALL_DIR"
}

# ─── 3. Delegar el resto a setup.ps1 (deps Python, ADB, Git Bash, Task Scheduler) ──
Write-Step 3 "Ejecutando setup.ps1 (dependencias + ADB + OTA watcher)"

$setupScript = Join-Path $INSTALL_DIR "setup.ps1"
if (-not (Test-Path $setupScript)) { Write-Fail "No se encontró setup.ps1 en $INSTALL_DIR" }

& $setupScript
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Fail "setup.ps1 terminó con error. Revisá la salida de arriba."
}

# ─── Resumen final ──────────────────────────────────────────────────────────────
Write-Host @"

===================================================
 Instalación completa
===================================================

 Repo instalado en:  $INSTALL_DIR

 Ahora conectá el teléfono:
   1. Cable USB de datos al Redmi 14C
   2. En el teléfono: Ajustes > Opciones de desarrollador > Depuración USB (activar)
   3. Aceptá el diálogo "Permitir depuración USB" que aparece en pantalla

 Y corré la optimización completa (Poco Mode):

   cd $INSTALL_DIR\src\cli
   bash run.sh --full

 Otros modos disponibles:
   bash run.sh --maintenance   (mantenimiento semanal, < 5 min)
   bash run.sh --monitor       (monitoreo en tiempo real)
   bash run.sh --emergency     (restaurar todo a fábrica)

"@ -ForegroundColor White
