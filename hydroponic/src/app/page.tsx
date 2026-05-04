import Link from "next/link";
import { listPlants, listRecords } from "@/lib/db";

export const dynamic = "force-dynamic";

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default async function Home() {
  const plants = await listPlants();
  const stats = await Promise.all(
    plants.map(async (p) => {
      const records = await listRecords(p.id);
      return {
        plant: p,
        recordCount: records.length,
        lastDate: records[records.length - 1]?.date,
      };
    }),
  );
  const totalRecords = stats.reduce((s, x) => s + x.recordCount, 0);

  return (
    <div className="space-y-12">
      {/* ヒーロー */}
      <section className="overflow-hidden rounded-2xl border border-leaf-100 bg-gradient-to-br from-white via-leaf-50 to-leaf-100">
        <div className="grid gap-6 p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <span className="inline-block rounded-full bg-leaf-600/10 px-3 py-1 text-xs font-medium text-leaf-700">
              家庭の水耕栽培 × AI
            </span>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-800 md:text-4xl">
              育成記録をつけて、
              <br className="hidden sm:inline" />
              AI に育て方をフィードバックしてもらおう
            </h1>
            <p className="mt-4 text-slate-600">
              水温・pH・EC・草丈などのデータと植物の写真を Claude が分析。
              <br className="hidden sm:inline" />
              植物の状態に合わせた具体的なアクションを提案します。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/plants/new"
                className="rounded-md bg-leaf-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-leaf-700"
              >
                + 植物を登録する
              </Link>
              {plants.length > 0 && (
                <a
                  href="#plants"
                  className="rounded-md border border-leaf-500 px-5 py-2.5 text-sm font-medium text-leaf-700 hover:bg-leaf-50"
                >
                  植物一覧を見る
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 self-end md:grid-cols-1">
            <Stat label="登録植物" value={plants.length} unit="株" />
            <Stat label="累計記録" value={totalRecords} unit="件" />
            <Stat
              label="使用 AI"
              value="Claude"
              sub="Opus 4.7 + Vision"
            />
          </div>
        </div>
      </section>

      {/* 機能 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800">できること</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon="📝"
            title="毎日の記録"
            desc="水温・pH・EC・室温・湿度・照明時間・草丈・葉数・メモ・写真を 1 画面で。"
          />
          <Feature
            icon="📷"
            title="写真診断"
            desc="直近の写真を AI が見て、葉色・ハリ・カビや藻まで観察してアドバイス。"
          />
          <Feature
            icon="🤖"
            title="次のアクション提案"
            desc="記録の傾向から、水換え頻度や養液濃度を含めた今やるべきことを提案。"
          />
        </div>
      </section>

      {/* 植物一覧 */}
      <section id="plants">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-slate-800">育てている植物</h2>
          {plants.length > 0 && (
            <span className="text-xs text-slate-500">
              {plants.length} 株 / 記録 {totalRecords} 件
            </span>
          )}
        </div>

        {plants.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-leaf-200 bg-white p-12 text-center">
            <p className="text-slate-500">まだ植物が登録されていません</p>
            <Link
              href="/plants/new"
              className="mt-4 inline-block rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
            >
              最初の植物を追加する
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map(({ plant, recordCount, lastDate }) => (
              <li key={plant.id}>
                <Link
                  href={`/plants/${plant.id}`}
                  className="block h-full rounded-lg border border-leaf-100 bg-white p-4 transition hover:border-leaf-500 hover:shadow"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {plant.name}
                    </h3>
                    <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-medium text-leaf-700">
                      {daysSince(plant.startDate)}日目
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {plant.species}
                    {plant.systemType ? ` · ${plant.systemType}` : ""}
                  </p>
                  <div className="mt-3 flex justify-between border-t border-leaf-50 pt-2 text-xs text-slate-500">
                    <span>記録 {recordCount} 件</span>
                    <span>{lastDate ? `最終: ${lastDate}` : "未記録"}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 使い方 */}
      <section className="rounded-2xl border border-leaf-100 bg-white p-6 md:p-8">
        <h2 className="mb-4 text-xl font-bold text-slate-800">使い方</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          <Step
            no={1}
            title="植物を登録"
            desc="名前・種類・栽培方式・開始日を入力。1株ごとに別カードで管理します。"
          />
          <Step
            no={2}
            title="記録を追加"
            desc="水温・pH・EC など測ったデータを入力。スマホからなら写真もその場で撮影できます。"
          />
          <Step
            no={3}
            title="AI に相談"
            desc="「アドバイスをもらう」を押すと、記録と写真から評価・リスク・次のアクションを返します。"
          />
        </ol>
      </section>

      {/* 接続ヘルプ */}
      <section className="rounded-2xl border border-leaf-100 bg-white p-6 md:p-8">
        <h2 className="mb-3 text-xl font-bold text-slate-800">
          スマホからアクセスするには？
        </h2>
        <p className="text-sm text-slate-600">
          PC で <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev -- -H 0.0.0.0</code> で起動し、
          同じ Wi-Fi のスマホから
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">http://&lt;PCのローカルIP&gt;:3000</code>
          を開いてください。写真撮影はスマホからの方が便利です。
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number | string;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-leaf-100 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-slate-500">
            {unit}
          </span>
        )}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-leaf-100 bg-white p-5">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-2 font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Step({
  no,
  title,
  desc,
}: {
  no: number;
  title: string;
  desc: string;
}) {
  return (
    <li className="rounded-lg bg-leaf-50/60 p-4">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-white">
        {no}
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </li>
  );
}
