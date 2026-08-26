"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";

const KATEGORI_VALUES = new Set(["OPS RT", "ATK", "P3K", "DI LUAR RAB"]);

export type ImportBulananState = {
  status: "idle" | "success" | "error";
  message: string;
  successCount: number;
  duplicateCount: number;
  errors: string[];
};

function rowSignature(params: { kategori: string; userId: string; rincian: string; qty: number; hargaSatuan: number }) {
  return `${params.kategori}|${params.userId}|${params.rincian.trim().toUpperCase()}|${params.qty}|${params.hargaSatuan}`;
}

function readCell(row: ExcelJS.Row, index: number): string {
  const value = row.getCell(index).value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((r) => r.text).join("").trim();
    }
    if ("text" in obj) return String(obj.text ?? "").trim();
    if ("result" in obj) return String(obj.result ?? "").trim();
  }
  return String(value).trim();
}

function parseIndonesianNumber(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return NaN;

  // Grouped thousands with dots, no decimals: "1.510.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return parseInt(trimmed.replace(/\./g, ""), 10);
  }

  // Grouped thousands with dots plus comma decimals: "1.510.000,50"
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(trimmed)) {
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  }

  const cleaned = trimmed.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned);
}

/**
 * Reads a cell meant to hold a number. Prefers the cell's real numeric value
 * (including a formula's computed result) over re-parsing display text, since
 * text parsing of "200.000"-style values is what caused totals to come out
 * 1000x too small when a value round-tripped through string formatting.
 */

function readNumericCell(row: ExcelJS.Row, index: number): number {
  const value = row.getCell(index).value;
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if (typeof obj.result === "number") return obj.result;
  }
  return parseIndonesianNumber(readCell(row, index));
}

type ColumnField = "divisi" | "pic" | "rincian" | "qty" | "satuan" | "harga" | "catatan" | "status";

const HEADER_MATCHERS: { field: ColumnField; test: (header: string) => boolean }[] = [
  { field: "divisi", test: (h) => h.includes("DIVISI") },
  { field: "pic", test: (h) => h === "PIC" || h.includes("PIC") },
  { field: "rincian", test: (h) => h.includes("RINCIAN") || h.includes("URAIAN") },
  { field: "qty", test: (h) => h.includes("QTY") },
  { field: "satuan", test: (h) => h.includes("SATUAN") && !h.includes("HARGA") },
  { field: "harga", test: (h) => h.includes("HARGA") },
  { field: "catatan", test: (h) => h.includes("CATATAN") },
  { field: "status", test: (h) => h.includes("STATUS") },
];

function findHeaderRow(sheet: ExcelJS.Worksheet) {
  const maxScan = Math.min(sheet.rowCount, 30);

  for (let rowNumber = 1; rowNumber <= maxScan; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const columns: Partial<Record<ColumnField, number>> = {};
    const lastCol = Math.max(row.cellCount, 12);

    for (let col = 1; col <= lastCol; col++) {
      const value = readCell(row, col).toUpperCase();
      if (!value) continue;

      for (const matcher of HEADER_MATCHERS) {
        if (!columns[matcher.field] && matcher.test(value)) {
          columns[matcher.field] = col;
        }
      }
    }

    if (columns.divisi && columns.pic && columns.rincian) {
      return { rowNumber, columns };
    }
  }

  return null;
}

/** Reads the title block (rows above the header) and guesses the RAB category from it. */
function detectKategoriFromTitle(sheet: ExcelJS.Worksheet, headerRowNumber: number, fallback: string): string {
  const titleParts: string[] = [];
  const scanUntil = Math.max(headerRowNumber - 1, 1);

  for (let rowNumber = 1; rowNumber <= scanUntil; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const lastCol = Math.max(row.cellCount, 12);
    for (let col = 1; col <= lastCol; col++) {
      const value = readCell(row, col);
      if (value) titleParts.push(value.toUpperCase());
    }
  }

  const title = titleParts.join(" | ");

  if (/\bATK\b/.test(title)) return "ATK";
  if (/\bP3K\b/.test(title)) return "P3K";
  if (title.includes("LUAR RAB") || title.includes("NON-RAB") || title.includes("NON RAB")) return "DI LUAR RAB";
  if (title.includes("OPERASIONAL") || title.includes("RUMAH TANGGA") || title.includes("OPS RT")) return "OPS RT";

  return fallback;
}

type PicCandidate = { id: string; name: string | null; username: string | null };

/**
 * Picks the best user match for a PIC name, preferring precision over recall:
 * 1. Exact username match (case-insensitive)
 * 2. Exact whole-word match against the user's full name (avoids false positives like
 *    "SARI" matching inside "PUSPITASARI")
 * 3. Falls back to the raw substring-contains candidate set as a last resort
 */
function pickBestPicMatch(pic: string, candidates: PicCandidate[]): PicCandidate | "ambiguous" | null {
  if (candidates.length === 0) return null;

  const picUpper = pic.toUpperCase();

  const exactUsername = candidates.filter((u) => (u.username ?? "").toUpperCase() === picUpper);
  if (exactUsername.length === 1) return exactUsername[0];
  if (exactUsername.length > 1) return "ambiguous";

  const exactNameWord = candidates.filter((u) => (u.name ?? "").toUpperCase().split(/\s+/).includes(picUpper));
  if (exactNameWord.length === 1) return exactNameWord[0];
  if (exactNameWord.length > 1) return "ambiguous";

  if (candidates.length === 1) return candidates[0];
  return "ambiguous";
}

type RowToInsert = {
  userId: string;
  bulan: string;
  kategori: string;
  divisi: string;
  pic: string;
  rincian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  catatanTambahan: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

async function parseWorkbookBuffer(
  buffer: Buffer,
  bulan: string,
  fallbackKategori: string,
): Promise<
  | { rowsToInsert: RowToInsert[]; errors: string[]; sheetsWithData: number; duplicateCount: number }
  | { error: string }
> {
  const workbook = new ExcelJS.Workbook();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    return { error: "File tidak bisa dibaca. Pastikan formatnya .xlsx." };
  }

  if (workbook.worksheets.length === 0) {
    return { error: "Sheet tidak ditemukan di file." };
  }

  // Existing rows for this bulan are used to skip re-importing data that's already there
  // (same kategori + PIC + rincian + qty + harga = the same RAB line item).
  const existingRows = await prisma.kebutuhan_bulanan.findMany({
    where: { bulan },
    select: { userId: true, kategori: true, rincian: true, qty: true, hargaSatuan: true },
  });
  const seenSignatures = new Set(
    existingRows.map((row) =>
      rowSignature({ kategori: row.kategori, userId: row.userId, rincian: row.rincian, qty: row.qty, hargaSatuan: row.hargaSatuan }),
    ),
  );

  const errors: string[] = [];
  const rowsToInsert: RowToInsert[] = [];
  let duplicateCount = 0;

  const picCache = new Map<
    string,
    { id: string; name: string | null; username: string | null } | "ambiguous" | null
  >();

  let sheetsWithData = 0;

  for (const sheet of workbook.worksheets) {
    const header = findHeaderRow(sheet);
    if (!header) continue; // sheet without a recognizable RAB table (e.g. a summary/ringkasan tab) is skipped silently

    sheetsWithData += 1;
    const { rowNumber: headerRowNumber, columns } = header;
    const kategori = detectKategoriFromTitle(sheet, headerRowNumber, fallbackKategori);
    const sheetLabel = sheet.name || `Sheet ${sheet.id}`;

    for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);

      const divisi = columns.divisi ? readCell(row, columns.divisi) : "";
      const pic = columns.pic ? readCell(row, columns.pic) : "";
      const rincian = columns.rincian ? readCell(row, columns.rincian) : "";
      const satuan = columns.satuan ? readCell(row, columns.satuan) : "";
      const catatan = columns.catatan ? readCell(row, columns.catatan) : "";
      const statusRaw = columns.status ? readCell(row, columns.status).toUpperCase() : "";
      const hasQtyOrHarga = (columns.qty && readCell(row, columns.qty)) || (columns.harga && readCell(row, columns.harga));

      if (divisi.toUpperCase() === "TOTAL") break;

      if (!divisi && !pic && !rincian && !hasQtyOrHarga) continue;

      if (!pic || !rincian) {
        errors.push(`[${sheetLabel}] Baris ${rowNumber}: PIC atau Rincian kosong, dilewati.`);
        continue;
      }

      const qty = columns.qty ? readNumericCell(row, columns.qty) : 1;
      const hargaSatuan = columns.harga ? readNumericCell(row, columns.harga) : NaN;
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(hargaSatuan) || hargaSatuan < 0) {
        errors.push(`[${sheetLabel}] Baris ${rowNumber} (${rincian}): Qty atau Harga Satuan tidak valid.`);
        continue;
      }

      if (!picCache.has(pic)) {
        const candidates = await prisma.user.findMany({
          where: { OR: [{ username: { contains: pic } }, { name: { contains: pic } }] },
          select: { id: true, name: true, username: true },
        });
        picCache.set(pic, pickBestPicMatch(pic, candidates));
      }

      const matched = picCache.get(pic) ?? null;
      if (matched === null) {
        errors.push(`[${sheetLabel}] Baris ${rowNumber} (${rincian}): PIC "${pic}" tidak ditemukan sebagai user terdaftar.`);
        continue;
      }
      if (matched === "ambiguous") {
        errors.push(`[${sheetLabel}] Baris ${rowNumber} (${rincian}): PIC "${pic}" cocok dengan lebih dari satu user, tidak jelas mana yang dimaksud.`);
        continue;
      }

      const signature = rowSignature({ kategori, userId: matched.id, rincian, qty, hargaSatuan });
      if (seenSignatures.has(signature)) {
        duplicateCount += 1;
        continue;
      }
      seenSignatures.add(signature);

      const status: "PENDING" | "APPROVED" | "REJECTED" = statusRaw.startsWith("APPROVE")
        ? "APPROVED"
        : statusRaw.startsWith("REJECT")
          ? "REJECTED"
          : "PENDING";

      rowsToInsert.push({
        userId: matched.id,
        bulan,
        kategori,
        divisi: divisi || "Belum diatur",
        pic: matched.name || matched.username || pic,
        rincian,
        qty,
        satuan: satuan || "-",
        hargaSatuan,
        total: qty * hargaSatuan,
        catatanTambahan: catatan || null,
        status,
      });
    }
  }

  return { rowsToInsert, errors, sheetsWithData, duplicateCount };
}

async function finalizeImport(
  result:
    | { rowsToInsert: RowToInsert[]; errors: string[]; sheetsWithData: number; duplicateCount: number }
    | { error: string },
): Promise<ImportBulananState> {
  if ("error" in result) {
    return { status: "error", message: result.error, successCount: 0, duplicateCount: 0, errors: [] };
  }

  const { rowsToInsert, errors, sheetsWithData, duplicateCount } = result;

  if (sheetsWithData === 0) {
    return {
      status: "error",
      message: 'Tidak ada tab dengan kolom header (DIVISI, PIC, RINCIAN/URAIAN) yang terbaca. Pastikan sesuai format RAB.',
      successCount: 0,
      duplicateCount: 0,
      errors: [],
    };
  }

  if (rowsToInsert.length > 0) {
    await prisma.kebutuhan_bulanan.createMany({ data: rowsToInsert });
    revalidatePath("/dashboard/bulanan");
    revalidatePath("/pengajuan/bulanan");
  }

  if (rowsToInsert.length === 0 && errors.length === 0 && duplicateCount === 0) {
    return { status: "error", message: "Tidak ada baris data ditemukan.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  const parts = [`${rowsToInsert.length} baris berhasil diimport dari ${sheetsWithData} tab`];
  if (duplicateCount > 0) parts.push(`${duplicateCount} baris dilewati karena sudah pernah diimport sebelumnya`);
  if (errors.length > 0) parts.push(`${errors.length} baris gagal (lihat detail di bawah)`);

  return {
    status: rowsToInsert.length === 0 && duplicateCount === 0 ? "error" : "success",
    message: `${parts.join(", ")}.`,
    successCount: rowsToInsert.length,
    duplicateCount,
    errors,
  };
}

export async function importKebutuhanBulanan(
  _prevState: ImportBulananState,
  formData: FormData,
): Promise<ImportBulananState> {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);

  const bulan = String(formData.get("bulan") ?? "").trim();
  const fallbackKategori = String(formData.get("kategori") ?? "").trim().toUpperCase();
  const file = formData.get("file");

  if (!bulan) {
    return { status: "error", message: "Bulan wajib dipilih.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  if (!KATEGORI_VALUES.has(fallbackKategori)) {
    return { status: "error", message: "Kategori wajib dipilih.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "File belum dipilih.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseWorkbookBuffer(buffer, bulan, fallbackKategori);
  return finalizeImport(result);
}

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function importKebutuhanBulananFromLink(
  _prevState: ImportBulananState,
  formData: FormData,
): Promise<ImportBulananState> {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);

  const bulan = String(formData.get("bulan") ?? "").trim();
  const fallbackKategori = String(formData.get("kategori") ?? "").trim().toUpperCase();
  const link = String(formData.get("link") ?? "").trim();

  if (!bulan) {
    return { status: "error", message: "Bulan wajib dipilih.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  if (!KATEGORI_VALUES.has(fallbackKategori)) {
    return { status: "error", message: "Kategori wajib dipilih.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  const spreadsheetId = extractSpreadsheetId(link);
  if (!spreadsheetId) {
    return {
      status: "error",
      message: "Link Google Sheets tidak valid. Pastikan berupa URL docs.google.com/spreadsheets/d/....",
      successCount: 0,
      duplicateCount: 0,
      errors: [],
    };
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

  let response: Response;
  try {
    response = await fetch(exportUrl, { cache: "no-store" });
  } catch {
    return { status: "error", message: "Gagal mengambil data dari Google Sheets.", successCount: 0, duplicateCount: 0, errors: [] };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: "Sheet tidak bisa diakses. Pastikan sharing-nya diatur \"Anyone with the link\" (bisa dilihat siapa saja yang punya link).",
      successCount: 0,
      duplicateCount: 0,
      errors: [],
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const result = await parseWorkbookBuffer(buffer, bulan, fallbackKategori);
  return finalizeImport(result);
}
