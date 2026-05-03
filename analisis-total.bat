@echo off
setlocal enabledelayedexpansion

REM === Configuración de log ===
set FECHA=%date:~-4%-%date:~3,2%-%date:~0,2%
set HORA=%time:~0,2%-%time:~3,2%-%time:~6,2%
set HORA=%HORA: =0%
set LOGDIR=diagnostics-logs
set LOGFILE=%LOGDIR%\analisis-total-%FECHA%_%HORA%.txt

REM === Ir a la raíz del proyecto ===
cd /d C:\Dev\MejoraRedmi14c

REM === Crear carpeta de logs ===
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo ============================================= > "%LOGFILE%"
echo   ANALISIS TOTAL - PHONE OPTIMIZER           >> "%LOGFILE%"
echo   Fecha: %FECHA%  Hora: %HORA%               >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo [INFO] Versiones base >> "%LOGFILE%"
echo node -v >> "%LOGFILE%"
node -v        >> "%LOGFILE%" 2>&1
echo npm -v  >> "%LOGFILE%"
npm -v         >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [INFO] Estructura src\ y archivos clave >> "%LOGFILE%"
echo DIR src >> "%LOGFILE%"
dir src       >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [INFO] Archivos en src\ui >> "%LOGFILE%"
if exist src\ui (
  dir src\ui  >> "%LOGFILE%" 2>&1
) else (
  echo (src\ui NO ENCONTRADO) >> "%LOGFILE%"
)
echo. >> "%LOGFILE%"

echo [INFO] package.json >> "%LOGFILE%"
if exist package.json (
  type package.json        >> "%LOGFILE%" 2>&1
) else (
  echo (package.json NO ENCONTRADO) >> "%LOGFILE%"
)
echo. >> "%LOGFILE%"

echo [INFO] electron-builder.yml >> "%LOGFILE%"
if exist electron-builder.yml (
  type electron-builder.yml      >> "%LOGFILE%" 2>&1
) else (
  echo (electron-builder.yml NO ENCONTRADO) >> "%LOGFILE%"
)
echo. >> "%LOGFILE%"

echo [INFO] npm install (solo log, no se detiene si falla) >> "%LOGFILE%"
echo npm install >> "%LOGFILE%"
npm install      >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [INFO] Build Vite (npm run build) >> "%LOGFILE%"
echo npm run build >> "%LOGFILE%"
npm run build    >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [INFO] Build Electron en modo directorio (sin NSIS) >> "%LOGFILE%"
echo npx electron-builder --config electron-builder.yml --dir >> "%LOGFILE%"
npx electron-builder --config electron-builder.yml --dir >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [INFO] Contenido de dist-release\win-unpacked\resources >> "%LOGFILE%"
if exist dist-release\win-unpacked\resources (
  dir dist-release\win-unpacked\resources >> "%LOGFILE%" 2>&1
) else (
  echo (dist-release\win-unpacked\resources NO ENCONTRADO) >> "%LOGFILE%"
)
echo. >> "%LOGFILE%"

echo ============================================= >> "%LOGFILE%"
echo   ANALISIS COMPLETADO                        >> "%LOGFILE%"
echo   Log: %LOGFILE%                             >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo.
echo ANALISIS COMPLETADO
echo LOG GENERADO EN: %LOGFILE%
echo.
pause
endlocal
