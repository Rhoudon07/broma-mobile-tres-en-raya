@echo off
setlocal
title BromaPhone - Expo Server

echo ========================================================
echo        INICIANDO SERVIDOR EXPO PARA ANDROID
echo ========================================================
echo.

cd /d "%~dp0"
npx expo start

pause

