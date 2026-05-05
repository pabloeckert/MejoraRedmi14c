@echo off
title MejoraOK Optimizer Suite
color 0A

:: ============================================================
::  MEJORAOK OPTIMIZER SUITE — Instalador / Lanzador
::  Backup + Optimizer + Restore + Logs
::  Autor: Pablo + Copilot
:: ============================================================

:: Crear carpeta logs si no existe
if not exist logs (
    mkdir logs
)

:MENU
cls
echo ============================================================
echo        MEJORAOK OPTIMIZER SUITE — HYPEROS / ANDROID
echo ============================================================
echo.
echo  1) Crear BACKUP COMPLETO (snapshot)
echo  2) Ejecutar ULTRA MEGA OPTIMIZER seguro
echo  3) Restaurar desde snapshot
echo  4) Salir
echo.
set /p opc=Selecciona una opcion:

if "%opc%"=="1" goto BACKUP
if "%opc%"=="2" goto OPTIMIZER
if "%opc%"=="3" goto RESTORE
if "%opc%"=="4" exit
goto MENU

:CHECK_ADB
echo Verificando ADB...
adb devices >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: ADB no está instalado o no está en el PATH.
    echo Instala Minimal ADB & Fastboot o agrega ADB al PATH.
    pause
    goto MENU
)
for /f "skip=1 tokens=1" %%A in ('adb devices') do (
    if "%%A"=="" (
        echo ❌ No hay dispositivos conectados.
        pause
        goto MENU
    ) else (
        echo ✔ Dispositivo detectado: %%A
        goto :EOF
    )
)
goto MENU

:BACKUP
cls
call :CHECK_ADB
echo ============================================================
echo 📦 INICIANDO BACKUP COMPLETO...
echo ============================================================
echo.

bash backup.sh

echo.
echo ✔ Backup finalizado. Revisa la carpeta snapshot_XXXX y logs.
pause
goto MENU

:OPTIMIZER
cls
call :CHECK_ADB
echo ============================================================
echo 🚀 INICIANDO ULTRA MEGA OPTIMIZER...
echo ============================================================
echo.

bash optimizer.sh

echo.
echo ✔ Optimización completada. Revisa logs para detalles.
pause
goto MENU

:RESTORE
cls
call :CHECK_ADB
echo ============================================================
echo ♻ RESTAURACIÓN COMPLETA
echo ============================================================
echo.
echo Ingresa el nombre de la carpeta snapshot (ej: snapshot_20260505_1930)
set /p snap=Snapshot:

if not exist "%snap%" (
    echo ❌ ERROR: No existe la carpeta %snap%
    pause
    goto MENU
)

bash restore.sh "%snap%"

echo.
echo ✔ Restauración completada. Revisa logs para detalles.
pause
goto MENU
