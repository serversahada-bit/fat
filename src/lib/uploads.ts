import path from "node:path";

export type UploadField = "lampiranFinance" | "lampiranTax" | "invoice";

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
  return process.env.UPLOAD_DIR?.trim() || path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
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

export function splitStoredUploadUrls(value: string | null | undefined) {
  return String(value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("/"));
}

export function parseUploadUrls(value: string | null | undefined) {
  return splitStoredUploadUrls(value).map((url) => normalizeUploadUrl(url));
}

export function getUploadContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function getUploadRelativePath(url: string) {
  const normalized = normalizeUploadUrl(url);

  if (!normalized.startsWith(`${UPLOAD_ROUTE_PREFIX}/`)) {
    return null;
  }

  const relativePath = normalized.slice(UPLOAD_ROUTE_PREFIX.length + 1);
  const parts = relativePath.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return parts;
}

export function getUploadAbsolutePathFromUrl(url: string) {
  const relativePath = getUploadRelativePath(url);
  if (!relativePath) {
    return null;
  }

  return path.join(getUploadRootDir(), ...relativePath);
}

// Stored filenames are prefixed with "<timestamp>-<uuid>-" to keep them unique on
// disk; strip that back off so downloads are named after the original file.
export function getUploadDisplayName(url: string) {
  const filename = normalizeUploadUrl(url).split("/").pop() ?? "";
  return filename.replace(/^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "") || filename;
}

