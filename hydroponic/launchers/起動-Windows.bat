@echo off
chcp 65001 >nul
title 水耕栽培アシスタント
setlocal enabledelayedexpansion

REM 水耕栽培アシスタント — ランチャー (Windows)
REM ダブルクリックでローカルサーバーを起動し、ブラウザを自動で開きます。
REM
REM 配置例:
REM   Documents\AI\起動-Windows.bat       ← このファイル
REM   Documents\AI\fire\hydroponic\       ← プロジェクト本体

cd /d "%~dp0"

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

echo.
echo [エラー] プロジェクトが見つかりません
echo   このファイルと同じフォルダか親フォルダに
echo     fire\hydroponic\  または  hydroponic\
echo   を配置してください。
echo.
echo   現在の場所: %CD%
echo.
pause
exit /b 1

:found
cd /d "%PROJECT%"
echo プロジェクト: %CD%
echo.

REM Node.js チェック
where npm >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js がインストールされていません
  echo    https://nodejs.org/ から LTS 版をインストールしてください
  pause
  exit /b 1
)

REM 依存関係のインストール (初回のみ)
if not exist node_modules (
  echo 初回セットアップ中（数分かかります）...
  call npm install
  echo.
)

REM 環境変数チェック
if not exist .env.local (
  echo [警告] .env.local が見つかりません
  echo    AI 機能を使うには .env.local に ANTHROPIC_API_KEY を設定してください
  echo    (記録機能だけなら未設定でも動きます)
  echo.
)

REM 3 秒後にブラウザを開く
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

echo サーバーを起動します...
echo   ブラウザが自動で開きます
echo   停止するには Ctrl+C を押すか、このウィンドウを閉じてください
echo.

REM LAN にも公開 (同じ Wi-Fi のスマホからもアクセス可能)
call npm run dev:lan
