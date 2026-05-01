import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlant, listRecords } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plant = await getPlant(id);
  if (!plant) notFound();
  const records = await listRecords(id);
  const days = Math.floor(
    (Date.now() - new Date(plant.startDate).getTime()) / 86400000,
  );

  return (
    <div>
      <Link href="/" className="text-sm text-leaf-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{plant.name}</h1>
          <p className="text-sm text-slate-500">
            {plant.species}
            {plant.systemType ? ` · ${plant.systemType}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            開始: {plant.startDate} ({days}日目)
          </p>
          {plant.notes && (
            <p className="mt-2 text-sm text-slate-600">{plant.notes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/plants/${plant.id}/record`}
            className="rounded-md bg-leaf-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf-700"
          >
            + 記録を追加
          </Link>
          <Link
            href={`/plants/${plant.id}/advice`}
            className="rounded-md border border-leaf-500 px-3 py-1.5 text-sm font-medium text-leaf-700 hover:bg-leaf-50"
          >
            🤖 AI にアドバイスをもらう
          </Link>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-slate-800">
        育成記録 ({records.length}件)
      </h2>

      {records.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-leaf-100 bg-white p-8 text-center text-sm text-slate-500">
          まだ記録がありません。「記録を追加」から始めましょう。
        </div>
      ) : (
        <ul className="space-y-3">
          {[...records].reverse().map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-leaf-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-slate-700">{r.date}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                    <Stat label="水温" value={r.waterTempC} unit="℃" />
                    <Stat label="pH" value={r.ph} />
                    <Stat label="EC" value={r.ecMs} unit="mS/cm" />
                    <Stat label="室温" value={r.roomTempC} unit="℃" />
                    <Stat label="湿度" value={r.humidity} unit="%" />
                    <Stat label="照明" value={r.lightHours} unit="h" />
                    <Stat label="草丈" value={r.heightCm} unit="cm" />
                    <Stat label="葉の枚数" value={r.leafCount} unit="枚" />
                  </dl>
                  {r.memo && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {r.memo}
                    </p>
                  )}
                </div>
                {r.photoPath && (
                  <Image
                    src={r.photoPath}
                    alt={`${r.date} の写真`}
                    width={120}
                    height={120}
                    unoptimized
                    className="h-24 w-24 flex-shrink-0 rounded-md object-cover"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit?: string;
}) {
  if (value === undefined) return null;
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">
        {value}
        {unit ?? ""}
      </dd>
    </div>
  );
}
