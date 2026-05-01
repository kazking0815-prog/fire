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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">育てている植物</h1>
        <p className="mt-1 text-sm text-slate-500">
          家庭菜園の水耕栽培を AI と一緒に育てよう
        </p>
      </div>

      {plants.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-leaf-100 bg-white p-12 text-center">
          <p className="text-slate-500">まだ植物が登録されていません</p>
          <Link
            href="/plants/new"
            className="mt-4 inline-block rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
          >
            最初の植物を追加する
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stats.map(({ plant, recordCount, lastDate }) => (
            <li key={plant.id}>
              <Link
                href={`/plants/${plant.id}`}
                className="block rounded-lg border border-leaf-100 bg-white p-4 transition hover:border-leaf-500 hover:shadow"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {plant.name}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {daysSince(plant.startDate)}日目
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{plant.species}</p>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>記録 {recordCount} 件</span>
                  <span>{lastDate ? `最終: ${lastDate}` : "未記録"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
