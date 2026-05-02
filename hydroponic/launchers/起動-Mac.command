#!/bin/bash
# 水耕栽培アシスタント — ランチャー (Mac)
# ダブルクリックでローカルサーバーを起動し、ブラウザを自動で開きます。
#
# 配置例:
#   ~/Documents/AI/起動-Mac.command   ← このファイル
#   ~/Documents/AI/fire/hydroponic/   ← プロジェクト本体
# のように、Documents/AI フォルダの中に fire (または hydroponic) フォルダがあればOK。

set -e
cd "$(dirname "$0")"

# プロジェクトを探す
PROJECT=""
for cand in "hydroponic" "fire/hydroponic" "../hydroponic" "../fire/hydroponic" "."; do
  if [ -f "$cand/package.json" ] && grep -q '"hydroponic-ai"' "$cand/package.json" 2>/dev/null; then
    PROJECT="$cand"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  cat <<EOF

❌ プロジェクトが見つかりません

このファイルと同じフォルダ、または親フォルダに
  fire/hydroponic/  または  hydroponic/
を配置してください。

現在の場所: $(pwd)

EOF
  read -p "Enter キーで終了..."
  exit 1
fi

cd "$PROJECT"
echo "📂 プロジェクト: $(pwd)"
echo ""

# Node.js チェック
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js がインストールされていません"
  echo "   https://nodejs.org/ から LTS 版をインストールしてください"
  read -p "Enter キーで終了..."
  exit 1
fi

# 依存関係のインストール (初回のみ)
if [ ! -d node_modules ]; then
  echo "📦 初回セットアップ中（数分かかります）..."
  npm install
  echo ""
fi

# 環境変数チェック
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local が見つかりません"
  echo "   AI 機能を使うには .env.local に ANTHROPIC_API_KEY を設定してください"
  echo "   (記録機能だけなら未設定でも動きます)"
  echo ""
fi

# 3 秒後にブラウザを開く
( sleep 3 && open "http://localhost:3000" ) &

echo "🌱 サーバーを起動します..."
echo "   ブラウザが自動で開きます"
echo "   停止するには Ctrl+C を押すか、このウィンドウを閉じてください"
echo ""

# LAN にも公開 (同じ Wi-Fi のスマホからもアクセス可能)
npm run dev:lan
