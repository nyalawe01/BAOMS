@echo off
title Babawatoto Organization Management System (BAOMS) - Offline Launcher
color 0A
cls

echo ===============================================================================
echo   BABAWATOTO ORGANIZATION MANAGEMENT SYSTEM (BAOMS)
echo   OFFLINE LOCAL LAUNCHER
echo ===============================================================================
echo.
echo   [INFO] XAMPP is NOT needed for BAOMS.
echo   [INFO] BAOMS runs on Node.js and Vite with an integrated local offline engine.
echo   [INFO] No internet connection or Apache/MySQL required.
echo.
echo -------------------------------------------------------------------------------

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js to run BAOMS offline.
    echo.
    pause
    exit /b 1
)

echo [1/2] Starting BAOMS Offline Server on http://localhost:5173/ ...
echo [2/2] Opening your web browser...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173/"

cd /d "%~dp0"
call npm run dev

pause
