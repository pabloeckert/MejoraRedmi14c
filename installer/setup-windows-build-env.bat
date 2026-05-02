@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Phone Optimizer — Autonomous Windows Build Environment Setup
::  Instala VS Build Tools 2022, compila y genera el .exe
::  Re-ejecutable, idempotente, sin intervención del usuario
:: ============================================================

title Phone Optimizer - Build Environment Setup
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  Phone Optimizer - Setup Windows Build Environment      ║
echo  ║  v1.0.0 - Pablo ^& Sindy                                ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Detectar directorio del proyecto ──
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "INSTALLER_DIR=%SCRIPT_DIR%"

:: Verificar que estamos en el lugar correcto
if not exist "%PROJECT_DIR%\package.json" (
    echo  [ERROR] No se encontro package.json en %PROJECT_DIR%
    echo  Asegurate de ejecutar este script desde la carpeta /installer
    echo.
    pause
    exit /b 1
)

echo  [OK] Proyecto detectado en: %PROJECT_DIR%
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 1: Detectar si MSVC ya esta instalado
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 1: Verificando Visual Studio Build Tools ──
echo.

:: Buscar vswhere.exe (viene con VS 2017+)
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "MSVC_FOUND=0"

if exist "%VSWHERE%" (
    for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
        set "VS_PATH=%%i"
        set "MSVC_FOUND=1"
    )
)

:: Verificacion alternativa: buscar cl.exe directamente
if "%MSVC_FOUND%"=="0" (
    where cl.exe >nul 2>&1
    if !errorlevel! equ 0 (
        set "MSVC_FOUND=1"
    )
)

:: Verificacion adicional: buscar en rutas comunes
if "%MSVC_FOUND%"=="0" (
    for /d %%d in ("%ProgramFiles(x86)%\Microsoft Visual Studio\20*" "%ProgramFiles%\Microsoft Visual Studio\20*") do (
        if exist "%%d\BuildTools\VC\Tools\MSVC" set "MSVC_FOUND=1"
        if exist "%%d\Community\VC\Tools\MSVC" set "MSVC_FOUND=1"
        if exist "%%d\Professional\VC\Tools\MSVC" set "MSVC_FOUND=1"
        if exist "%%d\Enterprise\VC\Tools\MSVC" set "MSVC_FOUND=1"
    )
)

if "%MSVC_FOUND%"=="1" (
    echo  [OK] Visual Studio Build Tools ya esta instalado.
    if defined VS_PATH echo  [OK] Ruta: !VS_PATH!
    echo.
    goto :SKIP_VS_INSTALL
)

:: ══════════════════════════════════════════════════════════════
::  PASO 2: Instalar Visual Studio Build Tools 2022
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 2: Instalando Visual Studio Build Tools 2022 ──
echo.
echo  [INFO] Esto puede tardar 10-30 minutos segun tu conexion.
echo  [INFO] Se instalaran solo los componentes necesarios para compilar.
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ADVERTENCIA] Se requieren permisos de Administrador para instalar VS Build Tools.
    echo  [INFO] Intentando elevar permisos...
    echo.

    :: Re-ejecutar con permisos de admin
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b 0
)

:: Crear directorio temporal
set "TEMP_DIR=%TEMP%\phone-optimizer-setup"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Descargar vs_BuildTools.exe
set "VS_INSTALLER=%TEMP_DIR%\vs_BuildTools.exe"
set "VS_URL=https://aka.ms/vs/17/release/vs_BuildTools.exe"

echo  [1/3] Descargando Visual Studio Build Tools...
echo  URL: %VS_URL%
echo.

if exist "%VS_INSTALLER%" (
    echo  [INFO] Instalador ya descargado, reutilizando...
) else (
    powershell -Command ^
        "$ProgressPreference = 'SilentlyContinue'; " ^
        "try { " ^
        "    Invoke-WebRequest -Uri '%VS_URL%' -OutFile '%VS_INSTALLER%' -UseBasicParsing; " ^
        "    Write-Host '  [OK] Descarga completada.' " ^
        "} catch { " ^
        "    Write-Host '  [ERROR] Fallo la descarga: ' + $_.Exception.Message; " ^
        "    exit 1 " ^
        "}"

    if not exist "%VS_INSTALLER%" (
        echo  [ERROR] No se pudo descargar el instalador.
        echo  Descargalo manualmente desde: %VS_URL%
        echo  Guardalo como: %VS_INSTALLER%
        echo.
        pause
        exit /b 1
    )
)

:: Instalar componentes en modo silencioso
echo  [2/3] Instalando componentes (silencioso)...
echo  Esto puede tardar varios minutos. No cierres esta ventana.
echo.

"%VS_INSTALLER%" ^
    --add Microsoft.VisualStudio.Workload.VCTools ^
    --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 ^
    --add Microsoft.VisualStudio.Component.Windows10SDK.19041 ^
    --add Microsoft.VisualStudio.Component.VC.CMake.Project ^
    --quiet --wait --norestart

if %errorlevel% neq 0 (
    echo.
    echo  [ADVERTENCIA] El instalador retorno codigo: %errorlevel%
    echo  Esto puede ser normal si se requirio reinicio.
    echo  Si la instalacion fue exitosa, el script continuara.
    echo.
)

:: Verificar instalacion
echo  [3/3] Verificando instalacion...

if exist "%VSWHERE%" (
    for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
        set "VS_PATH=%%i"
        set "MSVC_FOUND=1"
    )
)

if "%MSVC_FOUND%"=="0" (
    :: Buscar de nuevo en rutas comunes
    for /d %%d in ("%ProgramFiles(x86)%\Microsoft Visual Studio\20*" "%ProgramFiles%\Microsoft Visual Studio\20*") do (
        if exist "%%d\BuildTools\VC\Tools\MSVC" (
            set "MSVC_FOUND=1"
            set "VS_PATH=%%d"
        )
    )
)

if "%MSVC_FOUND%"=="1" (
    echo  [OK] Visual Studio Build Tools instalado correctamente.
    if defined VS_PATH echo  [OK] Ruta: !VS_PATH!
) else (
    echo  [ERROR] La instalacion parece haber fallado.
    echo  Intenta ejecutar el script como Administrador.
    echo  O instala manualmente desde: https://visualstudio.microsoft.com/downloads/
    echo.
    pause
    exit /b 1
)

:SKIP_VS_INSTALL

echo.
echo  ═══════════════════════════════════════════════════════════
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 3: Configurar entorno MSVC
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 3: Configurando entorno de compilacion ──
echo.

:: Buscar vcvarsall.bat
set "VCVARSALL="

:: Buscar en VS_PATH si esta definido
if defined VS_PATH (
    if exist "!VS_PATH!\VC\Auxiliary\Build\vcvarsall.bat" (
        set "VCVARSALL=!VS_PATH!\VC\Auxiliary\Build\vcvarsall.bat"
    )
    :: Buscar en subdirectorios de BuildTools
    if not defined VCVARSALL (
        for /r "!VS_PATH!\VC\Tools\MSVC" %%f in (vcvarsall.bat) do (
            if exist "%%f" set "VCVARSALL=%%f"
        )
    )
)

:: Buscar en rutas comunes si no se encontro
if not defined VCVARSALL (
    for /d %%d in ("%ProgramFiles(x86)%\Microsoft Visual Studio\20*" "%ProgramFiles%\Microsoft Visual Studio\20*") do (
        if exist "%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
            set "VCVARSALL=%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
        )
        if exist "%%d\Community\VC\Auxiliary\Build\vcvarsall.bat" (
            set "VCVARSALL=%%d\Community\VC\Auxiliary\Build\vcvarsall.bat"
        )
        if exist "%%d\Professional\VC\Auxiliary\Build\vcvarsall.bat" (
            set "VCVARSALL=%%d\Professional\VC\Auxiliary\Build\vcvarsall.bat"
        )
        if exist "%%d\Enterprise\VC\Auxiliary\Build\vcvarsall.bat" (
            set "VCVARSALL=%%d\Enterprise\VC\Auxiliary\Build\vcvarsall.bat"
        )
    )
)

if not defined VCVARSALL (
    echo  [ERROR] No se encontro vcvarsall.bat
    echo  Verifica que Visual Studio Build Tools este instalado correctamente.
    echo.
    pause
    exit /b 1
)

echo  [OK] vcvarsall.bat encontrado: !VCVARSALL!
echo  [INFO] Configurando variables de entorno para x64...
echo.

:: Configurar entorno MSVC para x64
call "!VCVARSALL!" x64 >nul 2>&1

:: Verificar que cl.exe funciona
where cl.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] cl.exe no esta disponible despues de configurar el entorno.
    echo  Intenta reiniciar tu computadora y ejecutar el script de nuevo.
    echo.
    pause
    exit /b 1
)

echo  [OK] Compilador MSVC configurado correctamente.
for /f "tokens=*" %%v in ('cl.exe 2^>^&1 ^| findstr "Version"') do echo  [OK] %%v
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 4: Verificar Node.js y npm
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 4: Verificando Node.js ──
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no esta instalado o no esta en PATH.
    echo  Descargalo desde: https://nodejs.org/
    echo  Version recomendada: 18 LTS o superior.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v
for /f "tokens=*" %%v in ('npm --version') do echo  [OK] npm %%v
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 5: npm install
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 5: Instalando dependencias del proyecto ──
echo.

cd /d "%PROJECT_DIR%"

if exist "node_modules" (
    echo  [INFO] node_modules ya existe, verificando...
    call npm ls --depth=0 >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] Dependencias ya instaladas, saltando npm install.
        goto :SKIP_NPM_INSTALL
    )
    echo  [INFO] Dependencias incompletas, reinstalando...
)

call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install fallo.
    echo  Revisa los errores arriba e intenta de nuevo.
    echo.
    pause
    exit /b 1
)

:SKIP_NPM_INSTALL
echo.
echo  [OK] Dependencias instaladas.
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 6: npm run build:win
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 6: Compilando instalador Windows (.exe) ──
echo  Esto puede tardar varios minutos...
echo.

call npm run build:win
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] El build fallo.
    echo  Revisa los errores arriba.
    echo  Posibles soluciones:
    echo    - Ejecuta "npm install" manualmente
    echo    - Verifica que no haya errores en el codigo
    echo    - Asegurate de tener espacio en disco
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Build completado.
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 7: Copiar .exe a /installer
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 7: Copiando instalador a /installer ──
echo.

set "EXE_FOUND=0"

:: Buscar .exe en /dist-release y /dist
for %%d in ("%PROJECT_DIR%\dist-release" "%PROJECT_DIR%\dist") do (
    if exist "%%d" (
        for %%f in ("%%d\*.exe") do (
            if exist "%%f" (
                copy /y "%%f" "%INSTALLER_DIR%" >nul
                echo  [OK] Copiado: %%~nxf
                set "EXE_FOUND=1"
                set "EXE_FILE=%%~nxf"
                set "EXE_PATH=%INSTALLER_DIR%%%~nxf"
            )
        )
    )
)

if "%EXE_FOUND%"=="0" (
    echo  [ADVERTENCIA] No se encontro ningun .exe en /dist-release o /dist
    echo  Verifica que el build haya generado el instalador correctamente.
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Instalador copiado a: %INSTALLER_DIR%%EXE_FILE%
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 8: Regenerar SHA512SUMS.txt
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 8: Generando hashes SHA512 ──
echo.

set "SHA_FILE=%INSTALLER_DIR%SHA512SUMS.txt"

:: Limpiar archivo anterior
echo # SHA512 - Phone Optimizer > "%SHA_FILE%"
echo # Generado automaticamente por setup-windows-build-env.bat >> "%SHA_FILE%"
echo # Fecha: %date% %time% >> "%SHA_FILE%"
echo. >> "%SHA_FILE%"

:: Generar hash para cada archivo en /installer
set "HASH_COUNT=0"
for %%f in ("%INSTALLER_DIR%*.exe" "%INSTALLER_DIR%*.AppImage" "%INSTALLER_DIR%*.dmg") do (
    if exist "%%f" (
        echo  Calculando SHA512: %%~nxf ...
        for /f "skip=1 tokens=*" %%h in ('certutil -hashfile "%%f" SHA512') do (
            if not "%%h"=="CertUtil: -hashfile command completed successfully." (
                if not "%%h"=="" (
                    echo %%h  %%~nxf >> "%SHA_FILE%"
                    set /a HASH_COUNT+=1
                )
            )
        )
    )
)

echo.
echo  [OK] %HASH_COUNT% hash(es) generado(s) en SHA512SUMS.txt
echo.

:: ══════════════════════════════════════════════════════════════
::  PASO 9: Actualizar VERSION
:: ══════════════════════════════════════════════════════════════

echo  ── PASO 9: Actualizando VERSION ──
echo.

for /f "tokens=2 delims=:, " %%v in ('findstr /C:"\"version\"" "%PROJECT_DIR%\package.json"') do (
    set "PKG_VER=%%~v"
)

if defined PKG_VER (
    echo %PKG_VER%> "%INSTALLER_DIR%VERSION"
    echo  [OK] VERSION actualizado a: %PKG_VER%
) else (
    echo  [ADVERTENCIA] No se pudo leer la version de package.json
)

echo.

:: ══════════════════════════════════════════════════════════════
::  RESUMEN FINAL
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                  ✅ BUILD COMPLETADO                    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  Archivos generados en: %INSTALLER_DIR%
echo.
echo  Contenido de /installer:
echo  ─────────────────────────

for %%f in ("%INSTALLER_DIR%*") do (
    if exist "%%f" (
        echo    %%~nxf  (%%~zf bytes)
    )
)

echo.
echo  ─────────────────────────
echo.
echo  Proximo paso:
echo    Ejecuta install-windows.bat para instalar la app.
echo.
echo  O distribui la carpeta /installer completa.
echo.

pause
exit /b 0
