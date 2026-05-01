import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function saveUpload(file: File): Promise<{
  publicPath: string;
  absolutePath: string;
  mediaType: string;
}> {
  const mediaType = file.type || "image/jpeg";
  const ext = EXT_BY_MIME[mediaType] ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const absolutePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  return {
    publicPath: `/uploads/${filename}`,
    absolutePath,
    mediaType,
  };
}

export async function readImageAsBase64(
  publicPath: string,
): Promise<{ data: string; mediaType: string }> {
  const filename = path.basename(publicPath);
  const absolutePath = path.join(UPLOAD_DIR, filename);
  const buffer = await fs.readFile(absolutePath);
  const ext = path.extname(filename).toLowerCase().slice(1);
  const mediaType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";
  return { data: buffer.toString("base64"), mediaType };
}
