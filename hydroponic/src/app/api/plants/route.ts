import { NextResponse } from "next/server";
import { createPlant, listPlants } from "@/lib/db";

export async function GET() {
  const plants = await listPlants();
  return NextResponse.json({ plants });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const species = String(body.species ?? "").trim();
  const startDate = String(body.startDate ?? "").trim();

  if (!name || !species || !startDate) {
    return NextResponse.json(
      { error: "name, species, startDate は必須です" },
      { status: 400 },
    );
  }

  const plant = await createPlant({
    name,
    species,
    startDate,
    systemType: body.systemType ? String(body.systemType) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  });
  return NextResponse.json({ plant });
}
