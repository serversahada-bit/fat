"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Send } from "lucide-react";
import { FinanceSubmissionLauncher } from "@/components/FinanceSubmissionLauncher";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { EditableAmount } from "@/components/EditableAmount";
import { SemuaPengajuanForm } from "@/components/SemuaPengajuanForm";
import { deleteKebutuhanBulananEmployeeBulk, updateKebutuhanBulananEmployee } from "@/app/actions/pengajuan";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type PengajuanBulanan = {
  id: string;
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
};

type FinanceData = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isManagerApproved: boolean;
  tipePengajuan: string | null;
  invoice: string | null;
  totalRealisasi: number;
  hasPending: boolean;
} | null;

type Row = {
  item: PengajuanBulanan;
  financeData: FinanceData;
  totalRealisasi: number;
  sisaBudget: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const KATEGORI_OPTIONS = ["OPS RT", "ATK", "P3K", "DI LUAR RAB"];
const SATUAN_OPTIONS = ["UNIT", "PCS", "BOX", "ORANG", "BANDLE", "PACK", "BULANAN", "MINGGUAN", "HARI", "JAM", "LITER", "KG", "RIM", "SET", "VIDEO", "FOTO", "SHEETS", "DUS"];

export function PengajuanBulananTable({
  rows,
  today,
  userEmail,
  userName,
  financeSubmissionEnabled,
  financeSubmissionStartDate,
}: {
  rows: Row[];
  today: string;
  userEmail: string;
  userName: string;
  financeSubmissionEnabled: boolean;
  financeSubmissionStartDate: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [isBulkFinanceOpen, setIsBulkFinanceOpen] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const selectableIds = rows
    .filter((row) => row.item.status === "PENDING" || row.item.status === "APPROVED")
    .map((row) => row.item.id);

  const selectedRows = rows.filter((row) => selected.has(row.item.id));
  const isPendingOnlySelection = selectedRows.length > 0 && selectedRows.every((row) => row.item.status === "PENDING");
  const isApprovedOnlySelection = selectedRows.length > 0 && selectedRows.every((row) => row.item.status === "APPROVED");

  const isScheduleOpen = financeSubmissionEnabled && !(financeSubmissionStartDate && today < financeSubmissionStartDate);
  const allApprovedEligible = isApprovedOnlySelection && isScheduleOpen && selectedRows.every(
    (row) => row.sisaBudget > 0 && !(row.financeData?.hasPending)
  );

  useEffect(() => {
    setSelected((prev) => {
      const validIds = new Set(selectableIds);
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const allSelected = selectableIds.length > 0 && selected.size === selectableIds.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
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
      await deleteKebutuhanBulananEmployeeBulk(formData);
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleRowDoubleClick(row: Row) {
    if (row.item.status !== "PENDING") return;
    setEditingRow(row);
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-purple-700">{selected.size} baris dipilih</span>

          {isPendingOnlySelection && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          )}

          {isApprovedOnlySelection && allApprovedEligible && (
            <button
              type="button"
              onClick={() => setIsBulkFinanceOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-purple-700"
            >
              <Send className="h-3.5 w-3.5" />
              Ajukan Gabungan ke Finance
            </button>
          )}

          {isApprovedOnlySelection && !allApprovedEligible && (
            <span className="text-xs font-medium text-amber-700">
              Ada item yang belum bisa diajukan (budget habis / masih menunggu finance / belum waktunya).
            </span>
          )}

          {!isPendingOnlySelection && !isApprovedOnlySelection && (
            <span className="text-xs font-medium text-slate-500">
              Pilih item dengan status yang sama: semua PENDING untuk hapus, atau semua APPROVED untuk ajukan gabungan ke finance.
            </span>
          )}
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1050px] w-full border-collapse whitespace-nowrap text-left">
          <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
            <tr>
              <th className="w-10 px-4 py-4 text-center font-semibold">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  className="h-4 w-4 cursor-pointer rounded border-white/50 accent-white"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-4 text-center font-semibold">STATUS</th>
              <th className="px-4 py-4 text-center font-semibold">KATEGORI</th>
              <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
              <th className="px-4 py-4 text-center font-semibold">PIC</th>
              <th className="px-4 py-4 font-semibold">RINCIAN / URAIAN</th>
              <th className="px-4 py-4 text-center font-semibold">QTY</th>
              <th className="px-4 py-4 text-center font-semibold">SATUAN</th>
              <th className="px-4 py-4 text-right font-semibold">HARGA SATUAN (Rp)</th>
              <th className="px-4 py-4 text-right font-semibold">TOTAL BUDGET (RAB)</th>
              <th className="px-4 py-4 text-right font-semibold">REALISASI (Rp)</th>
              <th className="px-4 py-4 text-right font-semibold">SISA BUDGET (Rp)</th>
              <th className="px-4 py-4 text-center font-semibold">AKSI / STATUS</th>
              <th className="px-4 py-4 font-semibold">CATATAN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.map(({ item, financeData, totalRealisasi, sisaBudget }) => {
              const isSelectable = item.status === "PENDING" || item.status === "APPROVED";
              const isEditableByDoubleClick = item.status === "PENDING";
              return (
                <tr
                  key={item.id}
                  onDoubleClick={() => handleRowDoubleClick({ item, financeData, totalRealisasi, sisaBudget })}
                  title={isEditableByDoubleClick ? "Klik 2 kali untuk edit" : undefined}
                  className={`transition-colors hover:bg-slate-50 ${isEditableByDoubleClick ? "cursor-pointer" : ""} ${selected.has(item.id) ? "bg-purple-50/60" : ""}`}
                >
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    {isSelectable && (
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
                        aria-label={`Pilih ${item.rincian}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                      item.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                      "bg-red-100 text-red-600"
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
                  <td className="px-4 py-4 text-center font-medium text-slate-700" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <EditableAmount
                        pengajuanId={item.id}
                        initialValue={item.qty}
                        field="qty"
                        type="bulanan"
                        role="employee"
                        isEditable={item.status === "PENDING"}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600">{item.satuan}</td>
                  <td className="px-4 py-4 text-right text-slate-600" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <EditableAmount
                        pengajuanId={item.id}
                        initialValue={item.hargaSatuan}
                        field="hargaSatuan"
                        type="bulanan"
                        role="employee"
                        isEditable={item.status === "PENDING"}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatCurrency(totalRealisasi)}</td>
                  <td className="px-4 py-4 text-right font-bold text-amber-600">{formatCurrency(sisaBudget)}</td>
                  <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="font-bold text-emerald-700">
                      {item.status === "APPROVED" && (
                        <div className="mt-2">
                          <FinanceSubmissionLauncher
                            defaultTanggal={today}
                            keterangan={item.rincian}
                            nominal={sisaBudget > 0 ? sisaBudget : item.total}
                            sourceId={item.id}
                            sourceType="bulanan"
                            submittedStatus={financeData?.status}
                            isManagerApproved={financeData?.isManagerApproved}
                            userEmail={userEmail}
                            userName={userName}
                            sisaBudget={sisaBudget}
                            hasPending={financeData?.hasPending ?? false}
                            todayStr={today}
                            financeSubmissionEnabled={financeSubmissionEnabled}
                            financeSubmissionStartDate={financeSubmissionStartDate}
                          />
                        </div>
                      )}
                    </div>
                    {financeData?.tipePengajuan === "KASBON" && (
                      <div className="mt-3 flex justify-center">
                        <UploadInvoiceButton
                          id={financeData.id}
                          initialValue={financeData.invoice}
                          isKasbon={true}
                        />
                      </div>
                    )}
                  </td>
                  <td className="min-w-[200px] whitespace-normal px-4 py-4 text-xs">
                    {item.catatanTambahan && (
                      <div className="mb-1.5">
                        <span className="font-semibold text-slate-700">Karyawan:</span> <span className="text-slate-600">{item.catatanTambahan}</span>
                      </div>
                    )}
                    {item.catatanAdmin && (
                      <div className={`mt-1.5 border-t border-slate-100 pt-1.5 ${!item.catatanTambahan ? "mt-0 border-none pt-0" : ""}`}>
                        <span className="font-semibold text-purple-700">Admin:</span> <span className="font-medium text-purple-600">{item.catatanAdmin}</span>
                      </div>
                    )}
                    {!item.catatanTambahan && !item.catatanAdmin && <span className="text-slate-400">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingRow && (
        <EditPengajuanModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
        />
      )}

      {isBulkFinanceOpen && (
        <BulkFinanceModal
          rows={selectedRows}
          today={today}
          userEmail={userEmail}
          userName={userName}
          onClose={() => {
            setIsBulkFinanceOpen(false);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}

function BulkFinanceModal({
  rows,
  today,
  userEmail,
  userName,
  onClose,
}: {
  rows: Row[];
  today: string;
  userEmail: string;
  userName: string;
  onClose: () => void;
}) {
  const sourceId = rows.map((row) => row.item.id).join(",");
  const combinedNominal = rows.reduce((sum, row) => sum + (row.sisaBudget > 0 ? row.sisaBudget : row.item.total), 0);
  const combinedKeterangan = `Gabungan ${rows.length} item: ${rows.map((row) => row.item.rincian).join(", ")}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 bg-gradient-to-b from-purple-50/50 to-white p-6 md:px-8 md:py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Ajukan Gabungan ke Finance</h2>
              <p className="mt-1 text-sm text-slate-500">
                {rows.length} item akan diajukan sebagai satu pengajuan finance senilai {formatCurrency(combinedNominal)}.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-slate-900/5 transition-all hover:bg-slate-50 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
            </button>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {rows.map((row) => (
              <li key={row.item.id} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                {row.item.rincian} &bull; {formatCurrency(row.sisaBudget > 0 ? row.sisaBudget : row.item.total)}
              </li>
            ))}
          </ul>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-6 text-left md:p-8">
          <SemuaPengajuanForm
            defaultKeterangan={combinedKeterangan}
            defaultNominal={String(combinedNominal)}
            defaultTanggal={today}
            inlineMode
            onClose={onClose}
            sourceId={sourceId}
            sourceType="bulanan"
            userEmail={userEmail}
            userName={userName}
          />
        </div>
      </div>
    </div>
  );
}

function EditPengajuanModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const router = useRouter();
  const { item } = row;
  const [isPending, startTransition] = useTransition();
  const [kategori, setKategori] = useState(item.kategori || "OPS RT");
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
    formData.append("kategori", kategori);
    formData.append("rincian", rincian);
    formData.append("qty", String(qty));
    formData.append("satuan", satuan);
    formData.append("hargaSatuan", String(hargaSatuan));
    formData.append("catatanTambahan", catatanTambahan);

    startTransition(async () => {
      await updateKebutuhanBulananEmployee(formData);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Edit Pengajuan Bulanan</h2>
            <p className="text-sm text-slate-500">Ubah rincian kebutuhan bulanan yang masih berstatus PENDING.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="edit-kategori" className="text-sm font-semibold text-slate-700">Kategori Kebutuhan</label>
                <select
                  id="edit-kategori"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-rincian" className="text-sm font-semibold text-slate-700">Rincian / Uraian</label>
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
                <label htmlFor="edit-hargaSatuan" className="text-sm font-semibold text-slate-700">Harga Satuan (Rp)</label>
                <input
                  id="edit-hargaSatuan"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(total)}
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
