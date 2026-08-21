"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2, Check, X as XIcon, RotateCcw } from "lucide-react";
import { ApprovalDropdown } from "@/components/ApprovalDropdown";
import { ApprovalNote } from "@/components/ApprovalNote";
import { EditableAmount } from "@/components/EditableAmount";
import { deleteKebutuhanBulananBulk, updateKebutuhanBulananStatusBulk } from "@/app/actions/pengajuan";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type PengajuanBulanan = {
  id: string;
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function BulananTable({ items }: { items: PengajuanBulanan[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

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
      await deleteKebutuhanBulananBulk(formData);
      setSelected(new Set());
    });
  }

  function handleSetStatus(status: PengajuanStatus) {
    if (selected.size === 0) return;

    const formData = new FormData();
    Array.from(selected).forEach((id) => formData.append("ids", id));
    formData.append("status", status);

    startTransition(async () => {
      await updateKebutuhanBulananStatusBulk(formData);
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-purple-700">{selected.size} baris dipilih</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetStatus("APPROVED")}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              Setujui
            </button>
            <button
              type="button"
              onClick={() => handleSetStatus("REJECTED")}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XIcon className="h-3.5 w-3.5" />
              Tolak
            </button>
            <button
              type="button"
              onClick={() => handleSetStatus("PENDING")}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Set Pending
            </button>
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
              <th className="px-4 py-4 text-center font-semibold">KATEGORI</th>
              <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
              <th className="px-4 py-4 text-center font-semibold">PIC</th>
              <th className="px-4 py-4 font-semibold">RINCIAN</th>
              <th className="px-4 py-4 text-center font-semibold">QTY</th>
              <th className="px-4 py-4 text-right font-semibold">HARGA</th>
              <th className="px-4 py-4 text-right font-semibold">TOTAL</th>
              <th className="px-4 py-4 text-center font-semibold">TANGGAL</th>
              <th className="min-w-[250px] px-4 py-4 text-left font-semibold">CATATAN</th>
              <th className="min-w-[150px] px-4 py-4 text-center font-semibold">STATUS APPROVAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors hover:bg-slate-50 ${selected.has(item.id) ? "bg-purple-50/60" : ""}`}
              >
                <td className="px-4 py-4 text-center">
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
                    {item.kategori || "OPS RT"}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-slate-600">{item.divisi}</td>
                <td className="px-4 py-4 text-center text-slate-600">{item.pic}</td>
                <td className="min-w-[200px] whitespace-normal px-4 py-4">
                  <div className="font-semibold text-slate-900">{item.rincian}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{item.bulan}</div>
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-700">
                  <div className="flex items-center justify-center gap-1">
                    <EditableAmount pengajuanId={item.id} initialValue={item.qty} field="qty" type="bulanan" isEditable={item.status === "PENDING"} /> {item.satuan}
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-slate-600">
                  <div className="flex justify-end">
                    <EditableAmount pengajuanId={item.id} initialValue={item.hargaSatuan} field="hargaSatuan" type="bulanan" isEditable={item.status === "PENDING"} />
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                <td className="px-4 py-4 text-center text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                <td className="min-w-[250px] px-4 py-4 text-left">
                  {item.catatanTambahan && (
                    <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
                      <span className="font-semibold text-slate-700">Karyawan:</span>
                      <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{item.catatanTambahan}</p>
                    </div>
                  )}
                  <ApprovalNote pengajuanId={item.id} initialCatatan={item.catatanAdmin} />
                </td>
                <td className="px-4 py-4 text-center">
                  <ApprovalDropdown pengajuanId={item.id} initialStatus={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
