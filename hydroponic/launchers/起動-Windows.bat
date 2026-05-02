@echo off
chcp 65001 >nul
title 水耕栽培アシスタント
setlocal enabledelayedexpansion

REM 水耕栽培アシスタント — ランチャー (Windows)
REM ダブルクリックでローカルサーバーを起動し、ブラウザを自動で開きます。

cd /d "%~dp0"
echo ============================================
echo   水耕栽培アシスタント
echo ============================================
echo.

REM プロジェクトを探す
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

echo [エラー] プロジェクトが見つかりません
echo.
echo  このファイルと同じフォルダか親フォルダに
echo    fire\hydroponic\  または  hydroponic\
echo  を配置してください。
echo.
echo  現在の場所: %CD%
echo.
pause
exit /b 1

:found
cd /d "%PROJECT%"
echo [OK] プロジェクト: %CD%
echo.

REM Node.js チェック
where npm >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js がインストールされていません
  echo    https://nodejs.org/ から LTS 版をインストールしてください
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

REM 依存関係のインストール (初回のみ)
if not exist node_modules (
  echo.
  echo 初回セットアップ中... 数分かかります。
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [エラー] npm install に失敗しました
    pause
    exit /b 1
  )
)

REM 環境変数チェック
if not exist .env.local (
  echo.
  echo [警告] .env.local が見つかりません
  echo    AI 機能を使うには .env.local に ANTHROPIC_API_KEY を設定してください
  echo    記録機能だけなら未設定でも動きます
)

echo.
echo ============================================
echo  サーバーを起動します...
echo  停止するには Ctrl+C を押してください
echo ============================================
echo.

REM ポート 3000 が応答したら自動でブラウザを開く (バックグラウンド, 最大 120 秒)
start /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ^
  "for ($i=0; $i -lt 120; $i++) { try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('localhost', 3000); $c.Close(); Start-Sleep 1; Start-Process 'http://localhost:3000'; exit } catch { Start-Sleep 1 } }"

REM サーバー起動 (LAN にも公開)
call npm run dev:lan

REM npm が異常終了した場合は内容を確認できるように停止
echo.
echo サーバーが終了しました
pause
