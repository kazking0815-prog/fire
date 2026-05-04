# 水耕栽培アシスタント (Hydroponic AI)

家庭の水耕栽培の育成記録をつけて、Claude に分析・アドバイスをもらう Next.js アプリ。

## 機能
- 植物の登録 (種類・栽培方式・開始日)
- 育成記録 (水温/pH/EC/室温/湿度/照明時間/草丈/葉数/メモ/写真)
- AI フィードバック (Claude Opus 4.7 + Vision で写真診断)

## セットアップ

```bash
cd hydroponic
npm install
cp .env.local.example .env.local
# .env.local に ANTHROPIC_API_KEY を記入
npm run dev
```

http://localhost:3000 を開く。

## 使い方
1. 「+ 植物を追加」で植物を登録
2. 詳細ページで「+ 記録を追加」 (写真もアップロード可)
3. 「🤖 AI にアドバイスをもらう」で分析

## データ保存先
- 記録: `data/db.json`
- 写真: `public/uploads/`

ローカル運用前提。デプロイする場合は永続ストレージ (DB + オブジェクトストレージ) に置き換えてください。
