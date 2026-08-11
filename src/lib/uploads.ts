import path from "node:path";

const UPLOAD_ROUTE_PREFIX = "/api/uploads";
const LEGACY_UPLOAD_ROUTE_PREFIX = "/uploads";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export function getUploadRootDir() {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "public", "uploads");
}

export function buildUploadUrl(folder: string, filename: string) {
  return `${UPLOAD_ROUTE_PREFIX}/${folder}/${filename}`;
}

export function normalizeUploadUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/")) return trimmed;

  if (trimmed.startsWith(`${UPLOAD_ROUTE_PREFIX}/`)) {
    return trimmed;
  }

  if (trimmed.startsWith(`${LEGACY_UPLOAD_ROUTE_PREFIX}/`)) {
    return `${UPLOAD_ROUTE_PREFIX}${trimmed.slice(LEGACY_UPLOAD_ROUTE_PREFIX.length)}`;
  }

  return trimmed;
}

export function parseUploadUrls(value: string | null | undefined) {
  return String(value ?? "")
    .split(",")
    .map((url) => normalizeUploadUrl(url))
    .filter((url) => url.startsWith("/"));
}

export function getUploadContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}
