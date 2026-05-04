@echo off
REM Hydroponic Assistant - Launcher (Windows)
REM Double-click to start the local server and open the browser.
REM
REM This file is intentionally written in ASCII to avoid encoding
REM issues on Japanese Windows (cmd reads .bat as cp932 by default).

chcp 65001 >nul 2>&1
title Hydroponic Assistant
setlocal enabledelayedexpansion

cd /d "%~dp0"
echo ============================================
echo   Hydroponic Assistant
echo ============================================
echo.

REM Locate project
set "PROJECT="
for %%D in ("hydroponic" "fire\hydroponic" "..\hydroponic" "..\fire\hydroponic" ".") do (
  if exist "%%~D\package.json" (
    findstr /c:"\"hydroponic-ai\"" "%%~D\package.json" >nul 2>&1
    if not errorlevel 1 (
      set "PROJECT=%%~D"
      goto :found
    )
  )
)

echo [ERROR] Project folder not found.
echo.
echo  Place this launcher next to (or one level above):
echo    fire\hydroponic\   or   hydroponic\
echo.
echo  Current location: %CD%
echo.
pause
exit /b 1

:found
cd /d "%PROJECT%"
echo [OK] Project: %CD%

REM Node.js check
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js is not installed.
  echo    Install the LTS version from https://nodejs.org/
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

REM Install deps on first run
if not exist node_modules (
  echo.
  echo First-time setup, this may take a few minutes...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

REM Env check
if not exist .env.local (
  echo.
  echo [WARNING] .env.local not found.
  echo    For AI features, create .env.local with ANTHROPIC_API_KEY=sk-ant-...
  echo    The app still works for recording without it.
)

echo.
echo ============================================
echo  Starting server...
echo  Press Ctrl+C to stop.
echo ============================================
echo.

REM Wait for port 3000, then open the browser (background, up to 120s)
start /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ^
  "for ($i=0; $i -lt 120; $i++) { try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('localhost', 3000); $c.Close(); Start-Sleep 1; Start-Process 'http://localhost:3000'; exit } catch { Start-Sleep 1 } }"

REM Run dev server, also bound to 0.0.0.0 for phone access on the same Wi-Fi
call npm run dev:lan

echo.
echo Server stopped.
pause
