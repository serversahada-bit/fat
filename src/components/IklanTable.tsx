"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ApprovalDropdown } from "@/components/ApprovalDropdown";
import { ApprovalNote } from "@/components/ApprovalNote";
import { EditableAmount } from "@/components/EditableAmount";
import { deleteKebutuhanIklanBulk, updateKebutuhanIklanAdminDetail, updateKebutuhanIklanBulan, updateKebutuhanIklanBulanBulk } from "@/app/actions/pengajuan";
import { getBulanLabel } from "@/lib/bulan";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type PengajuanIklan = {
  id: string;
  userId: string;
  bulan: string;
  platform: string;
  divisi: string;
  pic: string;
  rincian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  status: PengajuanStatus;
  catatanTambahan: string | null;
  catatanAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatRibuan(amount: number) {
  return amount ? new Intl.NumberFormat("id-ID").format(amount) : "";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const PLATFORM_OPTIONS = ["Meta Ads", "Google Ads", "TikTok Ads", "Snack Video", "Marketplace", "Marcom", "CRM", "CSO", "Lainnya"];
const SATUAN_OPTIONS = ["UNIT", "PCS", "BOX", "ORANG", "BANDLE", "PACK", "BULANAN", "MINGGUAN", "HARI", "JAM", "LITER", "KG", "RIM", "SET", "VIDEO", "FOTO", "SHEETS", "DUS"];

function EditableBulanIklan({ pengajuanId, bulan }: { pengajuanId: string; bulan: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Correction range covers the realistic mistagging window: last, current, and next month.
  const monthOptions = [getBulanLabel(-1), getBulanLabel(0), getBulanLabel(1)];
  const options = monthOptions.includes(bulan) ? monthOptions : [bulan, ...monthOptions];

  function handleChange(newBulan: string) {
    setIsEditing(false);
    if (newBulan === bulan) return;

    const formData = new FormData();
    formData.append("pengajuanId", pengajuanId);
    formData.append("bulan", newBulan);

    startTransition(async () => {
      await updateKebutuhanIklanBulan(formData);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <select
        autoFocus
        defaultValue={bulan}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className="rounded-md border border-purple-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Klik untuk ubah bulan penganggaran"
      className={`inline-flex items-center gap-1 rounded px-1 -mx-1 text-xs text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-700 ${isPending ? "opacity-50" : ""}`}
    >
      {bulan}
      <Pencil className="h-2.5 w-2.5 opacity-60" />
    </button>
  );
}

export function IklanTable({ items }: { items: PengajuanIklan[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<PengajuanIklan | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Correction range covers the realistic mistagging window: last, current, and next month.
  const bulanBulkOptions = [getBulanLabel(-1), getBulanLabel(0), getBulanLabel(1)];

  useEffect(() => {
    setSelected((prev) => {
      const validIds = new Set(items.map((item) => item.id));
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Yakin mau hapus ${selected.size} pengajuan yang dipilih? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }

    const formData = new FormData();
    Array.from(selected).forEach((id) => formData.append("ids", id));

    startTransition(async () => {
      await deleteKebutuhanIklanBulk(formData);
      setSelected(new Set());
    });
  }

  function handleChangeBulanSelected(bulan: string) {
    if (selected.size === 0 || !bulan) return;

    const formData = new FormData();
    Array.from(selected).forEach((id) => formData.append("ids", id));
    formData.append("bulan", bulan);

    startTransition(async () => {
      await updateKebutuhanIklanBulanBulk(formData);
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleRowDoubleClick(item: PengajuanIklan) {
    if (item.status !== "PENDING") return;
    setEditingItem(item);
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-purple-700">{selected.size} baris dipilih</span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              disabled={isPending}
              defaultValue=""
              onChange={(e) => {
                handleChangeBulanSelected(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>Ubah Bulan ke...</option>
              {bulanBulkOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1250px] w-full border-collapse whitespace-nowrap text-left">
          <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
            <tr>
              <th className="w-10 px-4 py-4 text-center font-semibold">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-white/50 accent-white"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-4 text-center font-semibold">STATUS</th>
              <th className="px-4 py-4 text-center font-semibold">PLATFORM</th>
              <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
              <th className="px-4 py-4 text-center font-semibold">PIC</th>
              <th className="px-4 py-4 font-semibold">KAMPANYE / URAIAN</th>
              <th className="px-4 py-4 text-center font-semibold">QTY</th>
              <th className="px-4 py-4 text-right font-semibold">BUDGET SATUAN</th>
              <th className="px-4 py-4 text-right font-semibold">TOTAL BUDGET</th>
              <th className="px-4 py-4 text-center font-semibold">TANGGAL</th>
              <th className="min-w-[250px] px-4 py-4 text-left font-semibold">CATATAN</th>
              <th className="min-w-[150px] px-4 py-4 text-center font-semibold">STATUS APPROVAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item) => {
              const isEditableByDoubleClick = item.status === "PENDING";
              return (
                <tr
                  key={item.id}
                  onDoubleClick={() => handleRowDoubleClick(item)}
                  title={isEditableByDoubleClick ? "Klik 2 kali untuk edit" : undefined}
                  className={`transition-colors hover:bg-slate-50 ${isEditableByDoubleClick ? "cursor-pointer" : ""} ${selected.has(item.id) ? "bg-purple-50/60" : ""}`}
                >
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleOne(item.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
                      aria-label={`Pilih ${item.rincian}`}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.status === "PENDING"
                        ? "bg-amber-100 text-amber-600"
                        : item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item.platform || "Meta Ads"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600">{item.divisi}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{item.pic}</td>
                  <td className="min-w-[200px] whitespace-normal px-4 py-4">
                    <div className="font-semibold text-slate-900">{item.rincian}</div>
                    <div className="mt-0.5" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                      <EditableBulanIklan pengajuanId={item.id} bulan={item.bulan} />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-slate-700" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <EditableAmount pengajuanId={item.id} initialValue={item.qty} field="qty" type="iklan" isEditable={item.status === "PENDING"} /> {item.satuan}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-600" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <EditableAmount pengajuanId={item.id} initialValue={item.hargaSatuan} field="hargaSatuan" type="iklan" isEditable={item.status === "PENDING"} />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                  <td className="px-4 py-4 text-center text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="min-w-[250px] px-4 py-4 text-left" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    {item.catatanTambahan && (
                      <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
                        <span className="font-semibold text-slate-700">Karyawan:</span>
                        <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{item.catatanTambahan}</p>
                      </div>
                    )}
                    <ApprovalNote
                      pengajuanId={item.id}
                      initialCatatan={item.catatanAdmin}
                      type="iklan"
                    />
                  </td>
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <ApprovalDropdown
                      pengajuanId={item.id}
                      initialStatus={item.status}
                      type="iklan"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <EditIklanModal item={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
}

function EditIklanModal({ item, onClose }: { item: PengajuanIklan; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [platform, setPlatform] = useState(item.platform || "Meta Ads");
  const [divisi, setDivisi] = useState(item.divisi);
  const [pic, setPic] = useState(item.pic);
  const [rincian, setRincian] = useState(item.rincian);
  const [qty, setQty] = useState(item.qty);
  const [satuan, setSatuan] = useState(item.satuan);
  const [hargaSatuan, setHargaSatuan] = useState(item.hargaSatuan);
  const [catatanTambahan, setCatatanTambahan] = useState(item.catatanTambahan || "");

  const total = qty * hargaSatuan;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("pengajuanId", item.id);
    formData.append("platform", platform);
    formData.append("divisi", divisi);
    formData.append("pic", pic);
    formData.append("rincian", rincian);
    formData.append("qty", String(qty));
    formData.append("satuan", satuan);
    formData.append("hargaSatuan", String(hargaSatuan));
    formData.append("catatanTambahan", catatanTambahan);

    startTransition(async () => {
      await updateKebutuhanIklanAdminDetail(formData);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Edit Pengajuan Iklan</h2>
            <p className="text-sm text-slate-500">Ubah rincian kebutuhan iklan yang masih berstatus PENDING.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-platform" className="text-sm font-semibold text-slate-700">Platform</label>
                <select
                  id="edit-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-divisi" className="text-sm font-semibold text-slate-700">Divisi</label>
                <input
                  id="edit-divisi"
                  type="text"
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="edit-pic" className="text-sm font-semibold text-slate-700">PIC</label>
                <input
                  id="edit-pic"
                  type="text"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-rincian" className="text-sm font-semibold text-slate-700">Kampanye / Uraian</label>
              <textarea
                id="edit-rincian"
                value={rincian}
                onChange={(e) => setRincian(e.target.value)}
                rows={3}
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 md:gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-qty" className="text-sm font-semibold text-slate-700">QTY</label>
                <input
                  id="edit-qty"
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-satuan" className="text-sm font-semibold text-slate-700">Satuan</label>
                <select
                  id="edit-satuan"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                >
                  {SATUAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-hargaSatuan" className="text-sm font-semibold text-slate-700">Budget Satuan (Rp)</label>
                <input
                  id="edit-hargaSatuan"
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatRibuan(hargaSatuan)}
                  onChange={(e) => setHargaSatuan(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Total: {formatCurrency(total)}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-catatanTambahan" className="text-sm font-semibold text-slate-700">Catatan Tambahan (Opsional)</label>
              <textarea
                id="edit-catatanTambahan"
                value={catatanTambahan}
                onChange={(e) => setCatatanTambahan(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className="gradient-brand w-full rounded-xl px-6 py-3 font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
