#!/bin/bash
# 水耕栽培アシスタント — ランチャー (Linux)
# 実行例: bash 起動-Linux.sh   または   ./起動-Linux.sh

set -e
cd "$(dirname "$0")"

PROJECT=""
for cand in "hydroponic" "fire/hydroponic" "../hydroponic" "../fire/hydroponic" "."; do
  if [ -f "$cand/package.json" ] && grep -q '"hydroponic-ai"' "$cand/package.json" 2>/dev/null; then
    PROJECT="$cand"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  echo "❌ プロジェクトが見つかりません"
  echo "   このスクリプトと同じフォルダか親フォルダに fire/hydroponic/ を配置してください"
  read -p "Enter キーで終了..."
  exit 1
fi

cd "$PROJECT"
echo "📂 プロジェクト: $(pwd)"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js がインストールされていません (https://nodejs.org/)"
  read -p "Enter キーで終了..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 初回セットアップ中..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "⚠️  .env.local が未設定です (AI 機能を使うには ANTHROPIC_API_KEY が必要)"
fi

(
  sleep 3
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
  fi
) &

echo "🌱 起動中... http://localhost:3000"
npm run dev:lan
