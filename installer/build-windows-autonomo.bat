@echo off
setlocal enabledelayedexpansion

title Phone Optimizer - Build Windows
color 0A

echo.
echo  Phone Optimizer - Build Windows Autonomo
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "INSTALLER_DIR=%SCRIPT_DIR%"

if not exist "%PROJECT_DIR%\package.json" (
    echo  [ERROR] No se encontro package.json
    pause
    exit /b 1
)

echo  [OK] Proyecto detectado en: %PROJECT_DIR%

:: PASO 1: Desactivar firma digital
set "CSC_IDENTITY_AUTO_DISCOVERY=false"
set "CSC_LINK="
set "CSC_KEY_PASSWORD="
set "WIN_CSC_LINK="
set "WIN_CSC_KEY_PASSWORD="
set "SIGNTOOL_PATH="
set "SIGN=null"
echo  [OK] Firma digital desactivada.

:: PASO 2: Limpiar cache electron-builder
set "EB_CACHE=%LocalAppData%\electron-builder\Cache"
if exist "%EB_CACHE%" rmdir /s /q "%EB_CACHE%" 2>nul
set "EB_LOCAL=%PROJECT_DIR%\node_modules\.cache\electron-builder"
if exist "%EB_LOCAL%" rmdir /s /q "%EB_LOCAL%" 2>nul
echo  [OK] Cache limpiada.

:: PASO 3: Detectar MSVC
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "MSVC_FOUND=0"
if exist "%VSWHERE%" (
    for /f "usebackq tokens=*" %%i in ("%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath) do set "MSVC_FOUND=1"
)
if "%MSVC_FOUND%"=="0" (
    where cl.exe >nul 2>&1 && set "MSVC_FOUND=1"
)
if "%MSVC_FOUND%"=="1" (
    echo  [OK] MSVC ya instalado.
    goto :SKIP_VS
)

:: PASO 4: Instalar VS Build Tools
echo  [INFO] Instalando VS Build Tools 2022...
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b 0
)
set "TEMP_DIR=%TEMP%\phone-optimizer-build"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"
set "VS_URL=https://aka.ms/vs/17/release/vs_BuildTools.exe"
powershell -Command "Invoke-WebRequest -Uri '%VS_URL%' -OutFile '%TEMP_DIR%\vs_BuildTools.exe' -UseBasicParsing"

"%TEMP_DIR%\vs_BuildTools.exe" --add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows10SDK.19041 --add Microsoft.VisualStudio.Component.VC.CMake.Project --quiet --wait --norestart
echo  [OK] VS Build Tools instalado.

:SKIP_VS

:: PASO 5: Configurar MSVC
set "VCVARSALL="
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set "VCVARSALL=%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
)
if not defined VCVARSALL (
    for /d %%d in ("%ProgramFiles%\Microsoft Visual Studio\20*") do if exist "%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" set "VCVARSALL=%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    for /d %%d in ("%ProgramFiles(x86)%\Microsoft Visual Studio\20*") do if exist "%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" set "VCVARSALL=%%d\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
)
if not defined VCVARSALL (
    echo  [ERROR] vcvarsall.bat no encontrado. Reinicia y ejecuta de nuevo.
    pause
    exit /b 1
)
call "!VCVARSALL!" x64 >nul 2>&1
echo  [OK] MSVC configurado.

:: PASO 6: Verificar Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no encontrado. Instalo desde https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js OK.

:: PASO 7: npm install
cd /d "%PROJECT_DIR%"
if not exist "node_modules" call npm install
echo  [OK] Dependencias instaladas.

:: PASO 8: build:win
set "CSC_IDENTITY_AUTO_DISCOVERY=false"
set "SIGNTOOL_PATH="
echo  [INFO] Compilando sin firma digital...
call npm run build:win
if %errorlevel% neq 0 (
    echo  [ERROR] Build falo.
    pause
    exit /b 1
)
echo  [OK] Build completado.

:: PASO 9: Copiar .exe
for %%d in ("%PROJECT_DIR%\dist-release" "%PROJECT_DIR%\dist") do (
    if exist "%%d" for %%f in ("%%d\*.exe") do (
        copy /y "%%f" "%INSTALLER_DIR%" >nul
        echo  [OK] Copiado: %%~nxf
        set "EXE_FILE=%%~nxf"
    )
)

:: PASO 10: SHA512
set "SHA_FILE=%INSTALLER_DIR%SHA512SUMS.txt"
echo # SHA512 - Phone Optimizer > "%SHA_FILE%"
echo # Fecha: %date% %time% >> "%SHA_FILE%"
for %%f in ("%INSTALLER_DIR%*.exe") do (
    for /f "skip=1 tokens=*" %%h in ('certutil -hashfile "%%f" SHA512') do (
        if not "%%h"=="" echo %%h  %%~nxf >> "%SHA_FILE%"
    )
)
echo  [OK] SHA512 generado.

echo.
echo  BUILD COMPLETADO - .exe en: %INSTALLER_DIR%
pause
