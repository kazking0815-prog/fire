import { NextResponse } from "next/server";
import { createRecord, getPlant, listRecords } from "@/lib/db";
import { saveUpload } from "@/lib/upload";

function num(v: FormDataEntryValue | null): number | undefined {
  if (v === null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const records = await listRecords(id);
  return NextResponse.json({ records });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const plant = await getPlant(id);
  if (!plant) {
    return NextResponse.json({ error: "plant not found" }, { status: 404 });
  }

  const form = await req.formData();
  const date = String(form.get("date") ?? "").trim();
  if (!date) {
    return NextResponse.json({ error: "date は必須です" }, { status: 400 });
  }

  let photoPath: string | undefined;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const saved = await saveUpload(photo);
    photoPath = saved.publicPath;
  }

  const record = await createRecord({
    plantId: id,
    date,
    waterTempC: num(form.get("waterTempC")),
    ph: num(form.get("ph")),
    ecMs: num(form.get("ecMs")),
    roomTempC: num(form.get("roomTempC")),
    humidity: num(form.get("humidity")),
    lightHours: num(form.get("lightHours")),
    heightCm: num(form.get("heightCm")),
    leafCount: num(form.get("leafCount")),
    memo: form.get("memo") ? String(form.get("memo")) : undefined,
    photoPath,
  });

  return NextResponse.json({ record });
}
