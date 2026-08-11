"use client";

import { useMemo, useState } from "react";
import { FileText, Search, X, ExternalLink, ArrowDownUp } from "lucide-react";

export type GaleriItem = {
  id: string;
  url: string;
  type: string;
  namaPemohon: string;
  keterangan: string | null;
  tanggal: string | null;
  tanggalKey: string | null;
  nominal: string | null;
  isImage: boolean;
  fileName: string;
};

const TYPE_FILTERS = ["Semua", "Lampiran Finance", "Lampiran Tax", "Bukti Transfer / Invoice"];
const UNKNOWN_KEY = "tanggal-tidak-diketahui";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA").format(d);
}

function groupLabel(key: string, today: string, yesterday: string) {
  if (key === UNKNOWN_KEY) return "Tanggal Tidak Diketahui";
  const full = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${key}T00:00:00`));

  if (key === today) return `Hari Ini · ${full}`;
  if (key === yesterday) return `Kemarin · ${full}`;
  return full;
}

export function GaleriGrid({ items }: { items: GaleriItem[] }) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("Semua");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [preview, setPreview] = useState<GaleriItem | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = activeType === "Semua" || item.type === activeType;
      const matchesQuery =
        !query ||
        item.namaPemohon.toLowerCase().includes(query) ||
        (item.keterangan ?? "").toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });
  }, [items, search, activeType]);

  const groups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const keyA = a.tanggalKey ?? "";
      const keyB = b.tanggalKey ?? "";
      if (!keyA && !keyB) return 0;
      if (!keyA) return 1;
      if (!keyB) return -1;
      return sortOrder === "desc" ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
    });

    const map = new Map<string, GaleriItem[]>();
    for (const item of sorted) {
      const key = item.tanggalKey ?? UNKNOWN_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered, sortOrder]);

  const today = useMemo(() => todayKey(), []);
  const yesterday = useMemo(() => yesterdayKey(), []);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pemohon / keterangan..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeType === type
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            title="Urutkan berdasarkan tanggal"
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="py-16 text-center text-slate-500">Tidak ada bukti transfer / lampiran yang ditemukan.</div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([key, groupItems]) => (
            <div key={key}>
              <h3 className="mb-3 text-sm font-bold text-slate-700">{groupLabel(key, today, yesterday)}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {groupItems.map((item) => (
                  <button
                    key={`${item.id}-${item.url}`}
                    type="button"
                    onClick={() => setPreview(item)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-32 items-center justify-center overflow-hidden bg-slate-100">
                      {item.isImage ? (
                        <img src={item.url} alt={item.fileName} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <FileText className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 px-3 py-2">
                      <span className="truncate text-xs font-semibold text-slate-800">{item.namaPemohon}</span>
                      <span className="truncate text-[11px] text-slate-500">{item.type}</span>
                      <span className="text-[11px] text-slate-400">{item.tanggal ?? "-"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{preview.namaPemohon}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {preview.type} &middot; {preview.tanggal ?? "-"}
                  {preview.nominal ? ` · ${preview.nominal}` : ""}
                </p>
                {preview.keterangan && <p className="mt-1 text-xs text-slate-400">{preview.keterangan}</p>}
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup preview"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-100 px-4 py-4 md:px-6">
              {preview.isImage ? (
                <img src={preview.url} alt={preview.fileName} className="max-h-[62vh] w-auto rounded-lg border border-slate-300 bg-white shadow-inner" />
              ) : (
                <iframe src={preview.url} title={preview.fileName} className="h-[62vh] w-full rounded-lg border border-slate-300 bg-white shadow-inner" />
              )}
            </div>
            <div className="flex flex-col justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Tutup
              </button>
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-purple-700"
              >
                <ExternalLink className="h-4 w-4" />
                Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
