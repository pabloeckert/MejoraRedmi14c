@echo off
setlocal enabledelayedexpansion

REM === Configuración de log ===
set LOGDIR=diagnostics-logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

set LOGFILE=%LOGDIR%\diagnostico-%date:~-4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%.txt
set LOGFILE=%LOGFILE: =0%

echo ============================================= > "%LOGFILE%"
echo   ANALISIS ULTRA - PHONE OPTIMIZER           >> "%LOGFILE%"
echo   Fecha/Hora: %date% %time%                  >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo. >> "%LOGFILE%"

call :log "=== Node y NPM ==="
call :run "node -v"
call :run "npm -v"

call :log "=== Directorio src ==="
call :run "dir src"

call :log "=== Directorio src\\ui ==="
call :run "dir src\\ui"

call :log "=== electron-builder.yml ==="
call :run "type electron-builder.yml"

call :log "=== package.json ==="
call :run "type package.json"

call :log "=== Build Vite (npm run build) ==="
call :run "npm run build"

call :log "=== Build Electron (modo directorio) ==="
call :run "npx electron-builder --dir"

call :log "=== Contenido de win-unpacked/resources ==="
call :run "dir dist-release\\win-unpacked\\resources"

echo ============================================= >> "%LOGFILE%"
echo   ANALISIS COMPLETADO                        >> "%LOGFILE%"
echo   Log: %LOGFILE%                             >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo.
echo ANALISIS COMPLETADO
echo LOG GENERADO EN:
echo %LOGFILE%
echo.
pause
exit /b

:run
echo ------------------------------------------------ >> "%LOGFILE%"
echo Ejecutando: %~1 >> "%LOGFILE%"
%~1 >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"
exit /b

:log
echo. >> "%LOGFILE%"
echo %~1 >> "%LOGFILE%"
echo. >> "%LOGFILE%"
exit /b
