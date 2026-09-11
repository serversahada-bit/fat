"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Trash2, Check, X as XIcon, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
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

type Group = {
  key: string;
  bulan: string;
  kategori: string;
  divisi: string;
  pic: string;
  items: PengajuanBulanan[];
  totalBudget: number;
  latestCreatedAt: Date;
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
    timeStyle: "medium",
  }).format(date);
}

function groupItems(items: PengajuanBulanan[]): Group[] {
  const map = new Map<string, Group>();

  for (const item of items) {
    const key = `${item.bulan}|${item.kategori}|${item.divisi}|${item.pic}`;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      existing.totalBudget += item.total;
      if (item.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = item.createdAt;
      }
    } else {
      map.set(key, {
        key,
        bulan: item.bulan,
        kategori: item.kategori,
        divisi: item.divisi,
        pic: item.pic,
        items: [item],
        totalBudget: item.total,
        latestCreatedAt: item.createdAt,
      });
    }
  }

  return Array.from(map.values());
}

export function BulananTable({ items }: { items: PengajuanBulanan[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => groupItems(items), [items]);

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

  function toggleGroup(group: Group) {
    const groupIds = group.items.map((item) => item.id);
    const allGroupSelected = groupIds.every((id) => selected.has(id));

    setSelected((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleExpanded(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
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

  function renderItemRow(item: PengajuanBulanan, indented: boolean) {
    return (
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
        <td className={`min-w-[200px] whitespace-normal px-4 py-4 ${indented ? "pl-10" : ""}`}>
          <div className="font-semibold text-slate-900">{item.rincian}</div>
          <div className="mt-0.5 text-xs text-slate-500">Pengajuan untuk bulan {item.bulan}</div>
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
        <td className="px-4 py-4 text-center text-xs text-slate-500">Diajukan tanggal {formatDate(item.createdAt)}</td>
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
    );
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
            {groups.map((group) => {
              if (group.items.length === 1) {
                return renderItemRow(group.items[0], false);
              }

              const isExpanded = expandedGroups.has(group.key);
              const groupIds = group.items.map((item) => item.id);
              const groupSelectedCount = groupIds.filter((id) => selected.has(id)).length;
              const isGroupAllSelected = groupSelectedCount === groupIds.length;
              const isGroupSomeSelected = groupSelectedCount > 0 && !isGroupAllSelected;
              const statusCounts = group.items.reduce<Record<PengajuanStatus, number>>((acc, item) => {
                acc[item.status] = (acc[item.status] ?? 0) + 1;
                return acc;
              }, { PENDING: 0, APPROVED: 0, REJECTED: 0 });

              return (
                <Fragment key={group.key}>
                  <tr
                    onClick={() => toggleExpanded(group.key)}
                    className={`cursor-pointer bg-slate-50/80 transition-colors hover:bg-slate-100 ${isGroupSomeSelected || isGroupAllSelected ? "bg-purple-50/60" : ""}`}
                  >
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isGroupAllSelected}
                        ref={(el) => { if (el) el.indeterminate = isGroupSomeSelected; }}
                        onChange={() => toggleGroup(group)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
                        aria-label={`Pilih semua ${group.divisi}`}
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {statusCounts.PENDING > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">{statusCounts.PENDING} PENDING</span>
                        )}
                        {statusCounts.APPROVED > 0 && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{statusCounts.APPROVED} APPROVED</span>
                        )}
                        {statusCounts.REJECTED > 0 && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">{statusCounts.REJECTED} REJECTED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {group.kategori || "OPS RT"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{group.divisi}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">{group.pic}</td>
                    <td className="min-w-[200px] whitespace-normal px-4 py-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        {group.items.length} item digabung
                      </div>
                      <div className="mt-0.5 pl-6 text-xs text-slate-500">Pengajuan untuk bulan {group.bulan}</div>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-400">-</td>
                    <td className="px-4 py-4 text-right text-slate-400">-</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(group.totalBudget)}</td>
                    <td className="px-4 py-4 text-center text-xs text-slate-500">
                      <div>Diajukan tanggal {formatDate(group.latestCreatedAt)}</div>
                      <div className="text-slate-400">(terbaru)</div>
                    </td>
                    <td className="px-4 py-4 text-left text-xs text-slate-400">-</td>
                    <td className="px-4 py-4 text-center text-xs text-slate-400">-</td>
                  </tr>
                  {isExpanded && group.items.map((item) => renderItemRow(item, true))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
