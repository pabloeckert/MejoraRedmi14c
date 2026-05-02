@echo off
REM ─────────────────────────────────────────
REM Phone Optimizer - Instalador Windows
REM ─────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════╗
echo ║  📱 Phone Optimizer - Instalador Windows ║
echo ╚══════════════════════════════════════════╝
echo.

set SCRIPT_DIR=%~dp0
set VERSION=1.0.0

REM Leer VERSION si existe
if exist "%SCRIPT_DIR%VERSION" (
    set /p VERSION=<"%SCRIPT_DIR%VERSION"
)

echo Version: %VERSION%
echo.

REM Buscar instalador
set INSTALLER=
for %%f in ("%SCRIPT_DIR%*.exe") do (
    set INSTALLER=%%f
)

if "%INSTALLER%"=="" (
    echo ❌ Error: No se encontro el instalador .exe en %SCRIPT_DIR%
    echo    Descargalo desde: https://github.com/pabloeckert/MejoraRedmi14c/releases
    pause
    exit /b 1
)

echo Instalador: %INSTALLER%
echo.

REM Verificar integridad SHA512
if exist "%SCRIPT_DIR%SHA512SUMS.txt" (
    echo 🔐 Verificando integridad...
    for /f "tokens=1" %%h in ('findstr /i ".exe" "%SCRIPT_DIR%SHA512SUMS.txt"') do set EXPECTED=%%h

    REM Calcular hash actual
    certutil -hashfile "%INSTALLER%" SHA512 | findstr /v ":" > "%TEMP%\hash.tmp"
    set /p ACTUAL=<"%TEMP%\hash.tmp"
    del "%TEMP%\hash.tmp" 2>nul

    if "%EXPECTED%"=="%ACTUAL%" (
        echo ✅ Integridad verificada ^(SHA512 coincide^)
    ) else (
        echo ❌ Error: El hash SHA512 no coincide.
        echo    El archivo puede estar corrupto. Descargalo nuevamente.
        pause
        exit /b 1
    )
) else (
    echo ⚠️  SHA512SUMS.txt no encontrado, saltando verificacion
)

echo.
echo ⚙️ Ejecutando instalador...
echo.

REM Ejecutar el instalador NSIS
start "" "%INSTALLER%"

echo ╔══════════════════════════════════════════╗
echo ║         ✅ Instalador iniciado           ║
echo ╚══════════════════════════════════════════╝
echo.
echo Seguí las instrucciones del asistente de instalación.
echo.
pause
