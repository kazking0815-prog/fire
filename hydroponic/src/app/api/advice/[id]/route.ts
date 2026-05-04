import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getPlant, listRecords } from "@/lib/db";
import { readImageAsBase64 } from "@/lib/upload";
import type { GrowthRecord, Plant } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `あなたは家庭での水耕栽培をサポートする経験豊富な園芸アドバイザーです。
日本の家庭菜園を前提とし、日本語で回答してください。

回答は次の構成で、Markdown 見出しと箇条書きを使ってまとめてください:

## 全体評価
育成状況の総合評価を 2〜3 行で。

## 良い点
うまくいっている点を箇条書きで。

## 気になる点 / リスク
水温・pH・EC・徒長・黄変・根腐れなど、観察できる兆候から推測されるリスクを箇条書きで。
写真がある場合は葉色・ハリ・形状・カビや藻の有無についても言及してください。

## 次に取るべきアクション
今日〜今週やるべき具体的アクションを優先度の高い順に番号付きで 3〜6 個。
水換え頻度・養液濃度の目安・光量・剪定・追肥などを、植物種に合わせて数値や頻度を含めて提案してください。

## 補足
注意点や、判断のために追加で記録してほしい項目があれば最後に短く。

数値は推測ではなく観察データに基づいて言及し、データが不足する場合は「不足しているので記録を勧める」と書いてください。`;

function recordSummary(records: GrowthRecord[]): string {
  if (records.length === 0) return "(まだ記録がありません)";
  const lines = records.map((r) => {
    const parts: string[] = [`- ${r.date}`];
    if (r.waterTempC !== undefined) parts.push(`水温${r.waterTempC}℃`);
    if (r.ph !== undefined) parts.push(`pH${r.ph}`);
    if (r.ecMs !== undefined) parts.push(`EC${r.ecMs}mS/cm`);
    if (r.roomTempC !== undefined) parts.push(`室温${r.roomTempC}℃`);
    if (r.humidity !== undefined) parts.push(`湿度${r.humidity}%`);
    if (r.lightHours !== undefined) parts.push(`照明${r.lightHours}h`);
    if (r.heightCm !== undefined) parts.push(`草丈${r.heightCm}cm`);
    if (r.leafCount !== undefined) parts.push(`葉${r.leafCount}枚`);
    if (r.memo) parts.push(`メモ: ${r.memo}`);
    return parts.join(" / ");
  });
  return lines.join("\n");
}

function plantSummary(plant: Plant): string {
  const days = Math.floor(
    (Date.now() - new Date(plant.startDate).getTime()) / 86400000,
  );
  return [
    `名前: ${plant.name}`,
    `種類: ${plant.species}`,
    plant.systemType ? `栽培方式: ${plant.systemType}` : null,
    `栽培開始: ${plant.startDate} (${days}日経過)`,
    plant.notes ? `補足: ${plant.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY が未設定です。.env.local を確認してください。",
      },
      { status: 500 },
    );
  }

  const { id } = await ctx.params;
  const plant = await getPlant(id);
  if (!plant) {
    return NextResponse.json({ error: "plant not found" }, { status: 404 });
  }
  const records = await listRecords(id);

  const recentWithPhoto = [...records]
    .reverse()
    .filter((r) => r.photoPath)
    .slice(0, 3)
    .reverse();

  const userBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `# 植物の基本情報\n${plantSummary(plant)}\n\n# 育成記録 (古い→新しい)\n${recordSummary(records)}`,
    },
  ];

  for (const r of recentWithPhoto) {
    if (!r.photoPath) continue;
    try {
      const { data, mediaType } = await readImageAsBase64(r.photoPath);
      userBlocks.push({
        type: "text",
        text: `↓ ${r.date} の写真`,
      });
      userBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data,
        },
      });
    } catch (err) {
      console.error("failed to load image", r.photoPath, err);
    }
  }

  userBlocks.push({
    type: "text",
    text: "上記の情報を基に、育成状況を分析しアドバイスをお願いします。",
  });

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userBlocks }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");

    return NextResponse.json({
      advice: text,
      usedPhotos: recentWithPhoto.length,
      records: records.length,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `AI 呼び出しに失敗しました: ${message}` },
      { status: 500 },
    );
  }
}
