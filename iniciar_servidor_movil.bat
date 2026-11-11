@echo off
setlocal
title BromaPhone - Servidor para Celulares Android

echo ========================================================
echo        INICIANDO SERVIDOR DE BROMA PARA ANDROID
echo ========================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor web para dispositivos moviles...
echo.
node "%~dp0servidor_local.js"

pause

