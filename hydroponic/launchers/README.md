# ローカル起動ショートカット

水耕栽培アシスタントを **ダブルクリックだけで起動** するためのスクリプトです。

## 配置例

`Documents/AI/` 直下にショートカットを置く想定:

```
Documents/
└── AI/
    ├── 起動-Mac.command       ← Mac の方はこれ
    ├── 起動-Windows.bat       ← Windows の方はこれ
    └── fire/                  ← プロジェクト本体 (git clone 済みのフォルダ)
        └── hydroponic/
```

スクリプトは「自分と同じフォルダ」または「直下のサブフォルダ」を自動で探すので、`fire/hydroponic/` の代わりに `hydroponic/` だけを置いても動きます。

## セットアップ (初回のみ)

1. **Node.js をインストール** — https://nodejs.org/ から LTS 版を入れる
2. このフォルダの中から自分の OS に合うショートカットを `Documents/AI/` にコピー
   - Mac: `起動-Mac.command`
   - Windows: `起動-Windows.bat`
   - Linux: `起動-Linux.sh`
3. **AI 機能を使う場合**: `fire/hydroponic/.env.local.example` を `.env.local` にリネームし、`ANTHROPIC_API_KEY=sk-ant-...` を記入
4. (Mac のみ) Finder でショートカットを右クリック →「情報を見る」で「ターミナル」で開くように設定するか、ターミナルで一度だけ:
   ```sh
   chmod +x ~/Documents/AI/起動-Mac.command
   ```

## 使い方

ショートカットを **ダブルクリック** するだけ:

1. ターミナル / コマンドプロンプトが開く
2. (初回のみ) 依存パッケージを自動インストール (数分)
3. 3 秒後に既定ブラウザで http://localhost:3000 が開く
4. 終了するには ターミナル / コマンドプロンプトの画面で `Ctrl+C`、またはウィンドウを閉じる

## スマホからもアクセスする場合

スクリプトは `npm run dev:lan` で起動するため、PC が起動中は同じ Wi-Fi のスマホ・タブレットからも開けます:

```
http://<PCのローカルIP>:3000
例: http://192.168.1.42:3000
```

PC の IP は

- Mac: `システム設定 → ネットワーク → Wi-Fi → 詳細...`
- Windows: コマンドプロンプトで `ipconfig`

で確認できます。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `❌ プロジェクトが見つかりません` | スクリプトと同じフォルダ (またはその直下) に `fire/hydroponic/` または `hydroponic/` フォルダがあるか確認 |
| `❌ Node.js がインストールされていません` | https://nodejs.org/ から LTS 版をインストール |
| ブラウザが自動で開かない | 手動で http://localhost:3000 を開く |
| ポート 3000 が使用中 | 他の dev サーバーを停止してから再実行 |
| (Mac) "開発元が未確認" で実行できない | 右クリック → 開く → そのまま開く |
