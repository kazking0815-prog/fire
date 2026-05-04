# 引継ぎドキュメント — 水耕栽培アシスタント

> 別の Claude セッションで作業を継続するための引継ぎメモ。
> このファイルを最初に読ませると、最小限のキャッチアップで作業を続行できます。

最終更新: 2026-05 / ブランチ: `claude/hydroponic-ai-feedback-app-cvwc6`

---

## 1. プロジェクト概要

家庭の水耕栽培の育成記録を取り、Claude API に分析させて育成アドバイスをもらう Web アプリ。

- **ユーザー**: 家庭菜園で水耕栽培をする人 (技術者ではない)
- **対象植物**: 多様 (レタス、ハーブ、ミニトマトなど不特定)
- **必須機能**: 植物登録 / 日々の記録 / 写真撮影付き記録 / AI フィードバック
- **想定運用**: ローカル PC で起動、同じ Wi-Fi のスマホからもアクセス

---

## 2. 技術スタック

| 項目 | 選択 |
|---|---|
| フレームワーク | Next.js 16 (App Router) + React 19 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| AI | `@anthropic-ai/sdk` (^0.92), モデル `claude-opus-4-7`, 画像入力 (Vision) + adaptive thinking |
| データ保存 | JSON ファイル (`data/db.json`) — ローカル運用前提 |
| 画像保存 | `public/uploads/` にローカル保存 |
| 起動 | `npm run dev` (localhost) / `npm run dev:lan` (LAN 公開) |

ローカル/家庭内利用に特化しているため、認証・マルチユーザー・本番 DB は実装していない。

---

## 3. ディレクトリ構成

```
hydroponic/
├── package.json                    # next 16 + react 19 + @anthropic-ai/sdk ^0.92
├── tsconfig.json                   # Next.js が自動更新する場合あり
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local.example              # ANTHROPIC_API_KEY=sk-ant-...
├── .gitignore                      # data/db.json と public/uploads/* を ignore
├── README.md
├── HANDOFF.md                      # このファイル
├── data/
│   └── .gitkeep                    # db.json は ignore 済
├── public/
│   └── uploads/.gitkeep            # アップロード先 (ignore 済)
├── launchers/                      # ダブルクリック起動用スクリプト
│   ├── 起動-Mac.command            # UTF-8 (Mac/Linux はそのまま動く)
│   ├── 起動-Windows.bat            # 中身は ASCII (cmd の文字化け回避済)
│   ├── 起動-Linux.sh
│   └── README.md
└── src/
    ├── lib/
    │   ├── types.ts                # Plant / GrowthRecord / Database
    │   ├── db.ts                   # JSON ファイル CRUD
    │   ├── upload.ts               # 画像保存 / base64 読み出し
    │   └── markdown.ts             # AI 応答用の簡易 Markdown→HTML
    └── app/
        ├── layout.tsx              # 共通ヘッダー/フッター, max-w-5xl
        ├── globals.css             # Tailwind + .markdown スタイル
        ├── page.tsx                # ホーム (ヒーロー / 機能 / 植物一覧 / 使い方 / スマホヘルプ)
        ├── plants/
        │   ├── new/page.tsx        # 植物登録フォーム
        │   └── [id]/
        │       ├── page.tsx        # 植物詳細 + 記録一覧
        │       ├── record/page.tsx # 記録追加 (multipart for photo)
        │       └── advice/page.tsx # AI アドバイス画面
        └── api/
            ├── plants/
            │   ├── route.ts        # GET 一覧 / POST 作成
            │   └── [id]/
            │       ├── route.ts    # GET 詳細 / DELETE
            │       └── records/route.ts  # GET 一覧 / POST 作成 (multipart)
            └── advice/
                └── [id]/route.ts   # POST: 全記録 + 直近3枚の写真を Claude に渡す
```

---

## 4. 完成済み機能

- [x] 植物登録 (名前・種類・栽培方式・開始日・メモ)
- [x] 育成記録 (水温・pH・EC・室温・湿度・照明時間・草丈・葉数・メモ・写真)
- [x] 写真アップロード (`public/uploads/<uuid>.{jpg,png,webp,gif}`)
- [x] 植物詳細 + 記録タイムライン (新しい順)
- [x] AI アドバイス: 全記録 + 直近 3 枚の写真を渡し、固定見出し (全体評価/良い点/リスク/アクション/補足) で Markdown 返却
- [x] ホームページのランディング風レイアウト (ヒーロー + 統計 + 機能 3カラム + 植物カード)
- [x] レスポンシブ (Tailwind, sm/md/lg ブレークポイント)
- [x] ダブルクリックランチャー (Mac/Windows/Linux)

---

## 5. 既知の問題と未実装

### 解決済の経緯 (再発防止のメモ)
- **Anthropic SDK 0.39 では adaptive thinking 型が無く 400** → SDK を ^0.92 に更新済
- **Next.js 15 のセキュリティ警告** → next@latest (16.x) に更新済
- **Windows .bat の文字化け** → 中身を ASCII に書き換え済 (Japanese cmd は cp932 で .bat を読むため)
- **ランチャーが早く localhost を開きすぎて ERR_CONNECTION_REFUSED** → ポート 3000 が応答するまでポーリング (Mac=curl, Windows=PowerShell TcpClient)

### 未着手 / 拡張余地
- [ ] グラフ表示 (草丈・pH・EC の時系列)
- [ ] CSV インポート/エクスポート
- [ ] 通知 (例: 7 日ごとの記録リマインダ)
- [ ] 写真ギャラリービュー (時系列で写真だけ並べる)
- [ ] 植物テンプレート (リーフレタス用 / トマト用などの推奨 EC 範囲プリセット)
- [ ] 本番デプロイ対応 (Vercel + Postgres + Blob Storage への移行)
- [ ] アドバイスのストリーミング表示 (今は完了まで待たせている)
- [ ] 編集・削除 UI (今は POST 系のみで、レコード編集や植物削除の API はあるが UI 未実装)
- [ ] 画像のサイズ縮小/EXIF 除去 (今は受け取ったまま保存している)

---

## 6. 環境構築 / 起動手順

```bash
cd hydroponic
npm install
cp .env.local.example .env.local      # ANTHROPIC_API_KEY を記入
npm run dev                            # localhost:3000
# または
npm run dev:lan                        # 0.0.0.0 にバインドし、同じ Wi-Fi のスマホからアクセス可
```

`Documents/AI/` 直下に置くダブルクリック用スクリプトは `launchers/` 配下を参照。

ビルド確認:
```bash
npx next build
```

---

## 7. データモデル (`src/lib/types.ts`)

```ts
type Plant = {
  id: string; name: string; species: string;
  systemType?: string; startDate: string;  // ISO date
  notes?: string; createdAt: string;        // ISO datetime
};

type GrowthRecord = {
  id: string; plantId: string; date: string;
  waterTempC?: number; ph?: number; ecMs?: number;
  roomTempC?: number; humidity?: number; lightHours?: number;
  heightCm?: number; leafCount?: number;
  photoPath?: string;  // /uploads/<uuid>.{jpg|png|webp|gif}
  memo?: string; createdAt: string;
};
```

`data/db.json` の形:
```json
{ "plants": [...], "records": [...] }
```

---

## 8. AI 呼び出し (`src/app/api/advice/[id]/route.ts`)

- モデル: `claude-opus-4-7`
- `thinking: { type: "adaptive" }` (Opus 4.7 では `budget_tokens` 不可)
- `max_tokens: 4096`
- システムプロンプトは固定見出し構成を強制 (Markdown)
- 画像は直近 3 枚を base64 で渡す (`image/jpeg`/`png`/`gif`/`webp`)
- 応答テキストはクライアントで `src/lib/markdown.ts` の簡易レンダラーで HTML 化

サンプル応答:
```
## 全体評価
～
## 良い点
- ～
## 気になる点 / リスク
- ～
## 次に取るべきアクション
1. ～
## 補足
～
```

---

## 9. Git 運用

- ブランチ: `claude/hydroponic-ai-feedback-app-cvwc6`
- main へは未マージ (PR は必要なら別途)
- リモート: `kazking0815-prog/fire`
- `data/db.json` と `public/uploads/*` は `.gitignore` 済 (`.gitkeep` のみ追跡)

直近のコミット (新→古):
1. Rewrite Windows launcher in ASCII to avoid mojibake
2. Make launchers wait for server before opening browser
3. Add double-click launcher scripts for Mac/Windows/Linux
4. Redesign home page with hero, features, steps, and LAN access guide
5. Add hydroponic AI feedback web app (初期実装)

---

## 10. よく聞かれる質問 / 落とし穴

| Q | A |
|---|---|
| `tsconfig.json` の `jsx` が変わっている | Next.js 16 が初回ビルド時に `react-jsx` に書き換える。意図通り。 |
| `package.json` の deps バージョンが ^16 など | next@latest と SDK@latest に更新済。低くしないこと。 |
| Vercel デプロイしたい | JSON + ローカル画像保存なので不可。DB + Blob 化が必要。 |
| Windows でランチャーが文字化け | 必ず `.bat` の中身を ASCII で書く。日本語必須なら BOM 付き UTF-8。 |
| ポート 3000 が衝突 | 他の dev server を停止するか `PORT=3001 npm run dev` |

---

## 11. 次に作業する場合のおすすめ順

1. **まず動作確認**: `cd hydroponic && npm install && npm run dev`、`/` を開いて植物追加→記録追加→AIアドバイスが通るか
2. **小さい改善**: 画像のクライアント側リサイズ (HEIC を JPEG にする、長辺 1568px に縮小) — 写真アップロードのサイズと API コストの両方が下がる
3. **記録の編集/削除 UI**: API は概ね揃っているのでフォーム追加だけ
4. **グラフ**: `recharts` などで pH/EC/草丈の推移を可視化
5. **本番化が必要になったら**: Postgres (Neon) + Vercel Blob に移行

---

## 12. 連絡 / 参考

- Anthropic SDK ドキュメント: https://platform.claude.com/docs/
- モデル `claude-opus-4-7` の制約: adaptive thinking のみ、`temperature`/`top_p`/`top_k` は 400 エラー
- Next.js 16 App Router: https://nextjs.org/docs
