<#
.SYNOPSIS
    Herramienta de Auditoría Técnica del Repositorio MejoraRedmi14c.
.DESCRIPTION
    Inspecciona el estado de Git, estructura de archivos, módulos PowerShell y
    conectividad con dispositivos Android/HyperOS.
#>

[CmdletBinding()]
param(
    [string]$OutputPath = "AUDIT_REPORT.md"
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "[*] Iniciando auditoría técnica de MejoraRedmi14c..." -ForegroundColor Cyan

$gitBranch = (git branch --show-current 2>&1).Trim()
$gitRemote = (git remote -v 2>&1 | Out-String).Trim()
$gitStatus = (git status --short 2>&1 | Out-String).Trim()
$adbDevices = (adb devices -l 2>&1 | Out-String).Trim()

$modulesCount = (Get-ChildItem -Path ".\modules" -Filter *.ps1 -ErrorAction SilentlyContinue | Measure-Object).Count

$report = @"
# AUDITORÍA TÉCNICA: MejoraRedmi14c
**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Ruta:** $(Get-Location)

---

## 1. Estado de Git y Sincronización Remota
- **Rama actual:** $gitBranch
- **Remoto configurado:**
```text
$gitRemote
```
- **Estado del árbol de trabajo:**
```text
$gitStatus
```

## 2. Detección de Dispositivos ADB
```text
$adbDevices
```

## 3. Arquitectura Modular PowerShell
- **Módulos detectados:** $modulesCount
$(Get-ChildItem -Path ".\modules" -Filter *.ps1 -ErrorAction SilentlyContinue | Select-Object Name, Length | Out-String)

## 4. Scripts de Orquestación y Automatización
- `main.ps1`: $(Test-Path .\main.ps1)
- `listener.ps1`: $(Test-Path .\listener.ps1)
- `register-task.ps1`: $(Test-Path .\register-task.ps1)
- `README.md`: $(Test-Path .\README.md)
"@

$report | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "[OK] Informe de auditoría generado en $OutputPath" -ForegroundColor Green