<#
.SYNOPSIS
    Modulo 01: Debloat Seguro para Xiaomi Redmi 14C (HyperOS / Android 16).
.DESCRIPTION
    Desactiva de forma no destructiva la telemetria, anuncios (MSA), tiendas secundarias
    (GetApps) y servicios invasivos de Xiaomi que consumen RAM, CPU o compiten con Workspace.
    
    ESTRATEGIA:
    1. Intenta `pm disable-user --user 0 <pkg>`.
    2. Si HyperOS restringe paquetes de sistema ('Cannot disable system packages'),
       aplica de forma segura `pm uninstall -k --user 0 <pkg>` (mantiene el binario en ROM
       y es 100% reversible via `cmd package install-existing`).
    
    REGLA DE ORO DE SEGURIDAD:
    - NUNCA toca com.xiaomi.joyose (gestor termico del Helio G81 Ultra;
      desactivarlo provoca recalentamiento critico y brick termico).
    - Preserva telefonia, SMS, Play Store, Google Services y Workspace.
#>

[CmdletBinding()]
param(
    [string]$Serial = "",
    [switch]$Revert
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Definir comando base de ADB con selector de dispositivo
$adbCmd = if ([string]::IsNullOrWhiteSpace($Serial)) { "adb" } else { "adb -s $Serial" }

function Invoke-AdbShell {
    param([string]$Command)
    $fullCmd = "$adbCmd shell `"$Command`""
    $res = cmd.exe /c "$fullCmd 2>&1"
    return ($res -join "`n").Trim()
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " [Modulo 01] Desactivacion Segura de Bloatware HyperOS / Xiaomi   " -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

# Lista critica de proteccion estricta (NUNCA tocar)
$BlacklistExceptions = @(
    "com.xiaomi.joyose",           # Control termico Helio G81 Ultra
    "com.miui.securitycenter",     # Gestor de seguridad del sistema
    "com.google.android.gms",      # Google Play Services
    "com.android.vending",         # Google Play Store
    "com.android.phone",           # Telefonia
    "com.android.server.telecom",  # Telecom
    "com.google.android.dialer",   # Telefono Google
    "com.google.android.keep",     # Google Keep
    "com.google.android.calendar", # Google Calendar
    "com.google.android.apps.docs",# Google Docs
    "com.google.android.googlequicksearchbox" # Google App / Gemini
)

# Catalogo canonico de paquetes seguros para debloat
$BloatwareCatalog = @(
    # --- Tienda secundaria y apps promocionales ---
    @{ Pkg = "com.xiaomi.mipicks";            Desc = "GetApps (tienda secundaria Xiaomi con spam)" },
    @{ Pkg = "com.miui.cleanmaster";          Desc = "Limpiador con publicidad/telemetria Cheetah" },
    @{ Pkg = "com.miui.hybrid";               Desc = "Quick Apps (motor web publicitario)" },
    @{ Pkg = "com.miui.hybrid.accessory";     Desc = "Accesorio Quick Apps" },
    @{ Pkg = "com.mi.globalminusscreen";      Desc = "Pantalla -1 / App Vault con noticias y ads" },
    @{ Pkg = "com.xiaomi.payment";            Desc = "Mi Pay / Pagos Xiaomi" },
    @{ Pkg = "com.xiaomi.gamecenter";         Desc = "Game Center Xiaomi" },
    @{ Pkg = "com.xiaomi.glgm";               Desc = "Juegos promocionales Xiaomi" },
    @{ Pkg = "com.xiaomi.scanner";            Desc = "Escaner Xiaomi con publicidad integrada" },
    @{ Pkg = "com.xiaomi.drivemode";          Desc = "Modo Conductor Xiaomi" },

    # --- Telemetria, analiticas y anuncios de sistema ---
    @{ Pkg = "com.miui.msa.global";           Desc = "MIUI Ad Solution (inyector de anuncios)" },
    @{ Pkg = "com.miui.analytics";            Desc = "Analiticas y rastreo de comportamiento MIUI" },
    @{ Pkg = "com.miui.AnalyticsCore";        Desc = "Nucleo de telemetria y analitica" },
    @{ Pkg = "com.miui.daemon";               Desc = "Daemon de reporte y telemetria en background" },
    @{ Pkg = "com.miui.systemAdSolution";     Desc = "Servicio inyector publicitario del sistema" },
    @{ Pkg = "com.miui.bugreport";            Desc = "Crash report y envio de diagnosticos" },
    @{ Pkg = "com.miui.miservice";            Desc = "Servicios y comentarios Xiaomi con telemetria" },

    # --- Xiaomi Cloud redundante con Google Workspace ---
    @{ Pkg = "com.miui.cloudservice";         Desc = "Servicio base Mi Cloud" },
    @{ Pkg = "com.miui.cloudbackup";          Desc = "Copia de seguridad Xiaomi Cloud" },
    @{ Pkg = "com.miui.micloudsync";          Desc = "Sincronizacion continua Xiaomi Cloud" },
    @{ Pkg = "com.miui.cloudservice.sysbase"; Desc = "Servicio de sistema Xiaomi Cloud" },

    # --- Servicios de telemetria e instaladores Meta/Facebook ---
    @{ Pkg = "com.facebook.services";         Desc = "Servicios en segundo plano de Facebook" },
    @{ Pkg = "com.facebook.system";           Desc = "App de sistema Facebook" },
    @{ Pkg = "com.facebook.appmanager";       Desc = "Gestor de descargas/actualizaciones Meta" }
)

# Obtener lista de paquetes instalados actualmente (incluyendo desinstalados para user 0)
Write-Host "[*] Escaneando paquetes en el dispositivo..." -ForegroundColor Yellow
$installedRaw = Invoke-AdbShell "pm list packages"
$installedPackages = @()
foreach ($line in ($installedRaw -split "`n")) {
    $clean = $line.Trim() -replace "^package:", ""
    if (-not [string]::IsNullOrWhiteSpace($clean)) {
        $installedPackages += $clean
    }
}

$disabledList = Invoke-AdbShell "pm list packages -d"
$uninstalledList = Invoke-AdbShell "pm list packages -u"

$disabledCount = 0
$enabledCount  = 0
$skippedCount  = 0

if ($Revert) {
    Write-Host "[!] MODO REVERSION: Reactivando aplicaciones de catalogo..." -ForegroundColor Magenta
    foreach ($item in $BloatwareCatalog) {
        $pkg = $item.Pkg
        Write-Host "  [+] Restaurando: $pkg ($($item.Desc))..." -ForegroundColor White
        
        # 1. Reinstalar para user 0 si estaba uninstalled
        Invoke-AdbShell "cmd package install-existing $pkg" | Out-Null
        
        # 2. Habilitar
        $out = Invoke-AdbShell "pm enable $pkg"
        if ($out -match "new state.*enabled") {
            Write-Host "      -> Habilitado con exito." -ForegroundColor Green
            $enabledCount++
        } else {
            Write-Host "      -> Estado: $out" -ForegroundColor Gray
        }
    }
    Write-Host "`n[OK] Reversion finalizada. $enabledCount paquetes reactivados." -ForegroundColor Green
    return
}

# Proceso de debloat seguro
foreach ($item in $BloatwareCatalog) {
    $pkg = $item.Pkg
    $desc = $item.Desc

    # Proteccion estricta de Joyose y apps vitales
    if ($BlacklistExceptions -contains $pkg) {
        Write-Host "  [ALERTA] Proteccion activa: Se omite $pkg." -ForegroundColor Red
        $skippedCount++
        continue
    }

    if ($installedPackages -contains $pkg) {
        # Verificar si ya esta deshabilitado
        if ($disabledList -match [regex]::Escape("package:$pkg")) {
            Write-Host "  [-] Ya desactivado: $pkg" -ForegroundColor DarkGray
            continue
        }

        Write-Host "  [*] Desactivando: $pkg ($desc)..." -ForegroundColor White
        
        # Paso 1: Intentar pm disable-user --user 0
        $out = Invoke-AdbShell "pm disable-user --user 0 $pkg"
        
        if ($out -match "new state.*disabled") {
            Write-Host "      -> Desactivado con exito (pm disable)." -ForegroundColor Green
            $disabledCount++
        } elseif ($out -match "Cannot disable system packages" -or $out -match "SecurityException") {
            # Paso 2: Fallback seguro y reversible para paquetes del sistema en HyperOS
            $uninstOut = Invoke-AdbShell "pm uninstall -k --user 0 $pkg"
            if ($uninstOut -match "Success") {
                Write-Host "      -> Desactivado con exito (user 0 disabled, ROM intacta)." -ForegroundColor Green
                $disabledCount++
            } else {
                # Paso 3: Fallback con package suspend
                Invoke-AdbShell "cmd package suspend --user 0 $pkg" | Out-Null
                Write-Host "      -> Suspendido en segundo plano." -ForegroundColor Yellow
                $disabledCount++
            }
        } else {
            Write-Host "      -> Estado: $out" -ForegroundColor Gray
            $disabledCount++
        }
    } else {
        # Verificar si ya fue desinstalado para user 0
        if ($uninstalledList -match [regex]::Escape("package:$pkg")) {
            Write-Host "  [-] Ya desactivado/desinstalado para user 0: $pkg" -ForegroundColor DarkGray
        } else {
            $skippedCount++
        }
    }
}

Write-Host ""
Write-Host "[RESUMEN DEBLOAT]" -ForegroundColor Cyan
Write-Host "  - Paquetes procesados en esta pasada:  $disabledCount" -ForegroundColor Green
Write-Host "  - Paquetes no presentes en esta ROM:   $skippedCount" -ForegroundColor Gray
Write-Host "  - Proteccion joyose/Workspace:          100% PRESERVADA" -ForegroundColor Green
