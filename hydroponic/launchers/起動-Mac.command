#!/bin/bash
# 水耕栽培アシスタント — ランチャー (Mac)
# ダブルクリックでローカルサーバーを起動し、ブラウザを自動で開きます。

set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  水耕栽培アシスタント"
echo "============================================"
echo ""

# プロジェクトを探す
PROJECT=""
for cand in "hydroponic" "fire/hydroponic" "../hydroponic" "../fire/hydroponic" "."; do
  if [ -f "$cand/package.json" ] && grep -q '"hydroponic-ai"' "$cand/package.json" 2>/dev/null; then
    PROJECT="$cand"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  echo "[エラー] プロジェクトが見つかりません"
  echo ""
  echo " このファイルと同じフォルダか親フォルダに"
  echo "   fire/hydroponic/  または  hydroponic/"
  echo " を配置してください。"
  echo ""
  echo " 現在の場所: $(pwd)"
  echo ""
  read -p "Enter キーで終了..."
  exit 1
fi

cd "$PROJECT"
echo "[OK] プロジェクト: $(pwd)"

# Node.js チェック
if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "[エラー] Node.js がインストールされていません"
  echo "   https://nodejs.org/ から LTS 版をインストールしてください"
  echo ""
  read -p "Enter キーで終了..."
  exit 1
fi
echo "[OK] Node.js $(node --version)"

# 依存関係のインストール (初回のみ)
if [ ! -d node_modules ]; then
  echo ""
  echo "初回セットアップ中... 数分かかります。"
  echo ""
  if ! npm install; then
    echo ""
    echo "[エラー] npm install に失敗しました"
    read -p "Enter キーで終了..."
    exit 1
  fi
fi

# 環境変数チェック
if [ ! -f .env.local ]; then
  echo ""
  echo "[警告] .env.local が見つかりません"
  echo "   AI 機能を使うには .env.local に ANTHROPIC_API_KEY を設定してください"
  echo "   記録機能だけなら未設定でも動きます"
fi

echo ""
echo "============================================"
echo " サーバーを起動します..."
echo " 停止するには Ctrl+C を押してください"
echo "============================================"
echo ""

# ポート 3000 が応答したら自動でブラウザを開く (バックグラウンド, 最大 120 秒)
(
  for i in $(seq 1 120); do
    if curl -s -o /dev/null --connect-timeout 1 http://localhost:3000; then
      sleep 1
      open "http://localhost:3000"
      break
    fi
    sleep 1
  done
) &

# サーバー起動 (LAN にも公開)
npm run dev:lan
