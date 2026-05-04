import { NextResponse } from "next/server";
import { deletePlant, getPlant, listRecords } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const plant = await getPlant(id);
  if (!plant) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const records = await listRecords(id);
  return NextResponse.json({ plant, records });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await deletePlant(id);
  return NextResponse.json({ ok: true });
}
