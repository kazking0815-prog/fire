import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Database, GrowthRecord, Plant } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureDb(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const empty: Database = { plants: [], records: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as Database;
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function listPlants(): Promise<Plant[]> {
  const db = await readDb();
  return [...db.plants].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPlant(id: string): Promise<Plant | null> {
  const db = await readDb();
  return db.plants.find((p) => p.id === id) ?? null;
}

export async function createPlant(
  input: Omit<Plant, "id" | "createdAt">,
): Promise<Plant> {
  const db = await readDb();
  const plant: Plant = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  db.plants.push(plant);
  await writeDb(db);
  return plant;
}

export async function deletePlant(id: string): Promise<void> {
  const db = await readDb();
  db.plants = db.plants.filter((p) => p.id !== id);
  db.records = db.records.filter((r) => r.plantId !== id);
  await writeDb(db);
}

export async function listRecords(plantId: string): Promise<GrowthRecord[]> {
  const db = await readDb();
  return db.records
    .filter((r) => r.plantId === plantId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function createRecord(
  input: Omit<GrowthRecord, "id" | "createdAt">,
): Promise<GrowthRecord> {
  const db = await readDb();
  const record: GrowthRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  db.records.push(record);
  await writeDb(db);
  return record;
}
