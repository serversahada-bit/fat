import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildUploadUrl, getUploadRootDir } from "@/lib/uploads";

export function getUploadedFiles(entries: FormDataEntryValue[]) {
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function saveUploadedFile(entry: FormDataEntryValue | null, folder: string) {
  if (!(entry instanceof File) || entry.size === 0) {
    return null;
  }

  const uploadDir = path.join(getUploadRootDir(), folder);
  await mkdir(uploadDir, { recursive: true });

  const safeName = entry.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const absolutePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await entry.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return buildUploadUrl(folder, filename);
}

export async function saveUploadedFiles(entries: FormDataEntryValue[], folder: string, maxFiles: number) {
  const files = getUploadedFiles(entries).slice(0, maxFiles);
  const urls: string[] = [];

  for (const file of files) {
    const url = await saveUploadedFile(file, folder);
    if (url) urls.push(url);
  }

  return urls;
}
