@echo off
setlocal EnableDelayedExpansion

echo.
echo ===================================================
echo  Redmi Forge -- Setup (PC nueva)
echo ===================================================
echo.

:: Detectar si ya estamos dentro del repo clonado
set "INSTALL_DIR=%~dp0"
if exist "%INSTALL_DIR%main.py" (
    echo [INFO] Repo detectado en: %INSTALL_DIR%
    goto :run_setup_ps1
)

:: 1. Verificar winget
echo [1/4] Verificando winget...
winget --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo   FAIL: winget no encontrado.
    echo   Requiere Windows 10 1809+ o Windows 11.
    echo   Instala "Instalador de aplicacion" desde Microsoft Store.
    echo.
    pause
    exit /b 1
)
echo   OK  winget disponible

:: 2. Git
echo.
echo [2/4] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo   Instalando Git via winget...
    winget install --id Git.Git --scope machine --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        winget install --id Git.Git --scope user --silent --accept-source-agreements --accept-package-agreements
    )
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "M_PATH=%%i"
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"User\")"') do set "U_PATH=%%i"
    set "PATH=!M_PATH!;!U_PATH!"
    git --version >nul 2>&1
    if errorlevel 1 (
        echo   FAIL: Git instalado pero no disponible. Cierra y vuelve a abrir la terminal.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('git --version 2^>nul') do echo   OK  %%v

:: 3. Python 3.11+
echo.
echo [3/4] Verificando Python 3.11+...
set "PY_OK=0"
set "PY_CMD=python"
for %%c in (python python3 py) do (
    if "!PY_OK!"=="0" (
        for /f "tokens=2 delims= " %%v in ('%%c --version 2^>nul') do (
            for /f "tokens=1,2 delims=." %%a in ("%%v") do (
                if %%a GEQ 3 if %%b GEQ 11 (
                    set "PY_CMD=%%c"
                    set "PY_OK=1"
                )
            )
        )
    )
)

if "!PY_OK!"=="0" (
    echo   Instalando Python 3.11 via winget...
    winget install --id Python.Python.3.11 --scope user --silent --accept-source-agreements --accept-package-agreements
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "M_PATH=%%i"
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"User\")"') do set "U_PATH=%%i"
    set "PATH=!M_PATH!;!U_PATH!"
    python --version >nul 2>&1
    if errorlevel 1 (
        echo   FAIL: Python instalado pero no disponible. Cierra y vuelve a abrir la terminal.
        pause
        exit /b 1
    )
    set "PY_CMD=python"
)
for /f "tokens=*" %%v in ('!PY_CMD! --version 2^>nul') do echo   OK  %%v

:: 4. Clonar repositorio
echo.
echo [4/4] Clonando repositorio...
set "INSTALL_DIR=%USERPROFILE%\RedmiForge"

if exist "%INSTALL_DIR%\.git" (
    echo   OK  Repo ya existe en %INSTALL_DIR% -- actualizando...
    cd /d "%INSTALL_DIR%"
    git pull --ff-only
    if errorlevel 1 (
        echo   WARN: git pull fallo. Usando version local existente.
    )
) else (
    git clone https://github.com/pabloeckert/MejoraRedmi14c.git "%INSTALL_DIR%"
    if errorlevel 1 (
        echo   FAIL: No se pudo clonar el repositorio.
        pause
        exit /b 1
    )
    echo   OK  Repo clonado en %INSTALL_DIR%
)
set "INSTALL_DIR=%INSTALL_DIR%\"

:: Delegar el resto a setup.ps1
:run_setup_ps1
echo.
echo Delegando a setup.ps1 (pip, ADB, Task Scheduler)...
echo -----------------------------------------------------------
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALL_DIR%setup.ps1"
if errorlevel 1 (
    echo.
    echo   FAIL: setup.ps1 termino con error.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo  Setup completo. El OTA watcher esta corriendo.
echo  Para arrancar la UI: python "%INSTALL_DIR%main.py"
echo ===================================================
echo.
pause