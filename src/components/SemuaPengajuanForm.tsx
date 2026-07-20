"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSemuaPengajuan, createSemuaPengajuanInline } from "@/app/actions/semua_pengajuan";

const TRANSACTION_OPTIONS = [
  "TAGIHAN",
  "OVERBOOKING",
  "IKLAN",
  "OPERASIONAL",
  "PAJAK",
] as const;

const PAYMENT_OPTIONS = [
  "TUNAI",
  "TRANSFER BANK",
  "CEK / BILYET GIRO",
  "VIRTUAL ACCOUNT",
] as const;

const RECIPIENT_OPTIONS = ["PERORANGAN", "PERUSAHAAN", "PEMERINTAH"] as const;

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-slate-500">{children}</p>;
}

function ChoiceCard({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label?: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
      checked
        ? "border-purple-600 bg-purple-50 text-purple-900"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
    }`}>
      <input
        checked={checked}
        className="h-4 w-4 accent-purple-600"
        name={name}
        onChange={() => onChange(value)}
        type="radio"
        value={value}
      />
      <span className="font-medium">{label ?? value}</span>
    </label>
  );
}

function toUppercase(value: string) {
  return value.toUpperCase();
}

function formatAccountNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 20);
  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function sanitizeNominal(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  const parsed = Number(digitsOnly);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return String(Math.trunc(parsed));
}

export function SemuaPengajuanForm({
  defaultKeterangan,
  defaultNominal,
  defaultTanggal,
  inlineMode = false,
  onClose,
  sourceId,
  sourceType,
  userEmail,
}: {
  defaultKeterangan: string;
  defaultNominal: string;
  defaultTanggal: string;
  inlineMode?: boolean;
  onClose?: () => void;
  sourceId?: string;
  sourceType?: string;
  userEmail: string;
}) {
  const router = useRouter();
  const initialState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState(createSemuaPengajuanInline, initialState);
  const [tipeTransaksiPreset, setTipeTransaksiPreset] = useState<string>(TRANSACTION_OPTIONS[0]);
  const [tipeTransaksiOther, setTipeTransaksiOther] = useState("");
  const [tipePembayaranPreset, setTipePembayaranPreset] = useState<string>(PAYMENT_OPTIONS[1]);
  const [tipePembayaranOther, setTipePembayaranOther] = useState("");
  const [informasiPenerima, setInformasiPenerima] = useState<string>(RECIPIENT_OPTIONS[0]);
  const [namaPenerima, setNamaPenerima] = useState("");
  const [detailBankPenerima, setDetailBankPenerima] = useState("");
  const [nomorRekeningHp, setNomorRekeningHp] = useState("");
  const [keterangan, setKeterangan] = useState(toUppercase(defaultKeterangan));
  const [nominalError, setNominalError] = useState(false);

  const approvalNominal = useMemo(() => {
    const parsed = Number(defaultNominal);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [defaultNominal]);

  const [nominalTransaksi, setNominalTransaksi] = useState(() => sanitizeNominal(defaultNominal));

  const finalTipeTransaksi =
    tipeTransaksiPreset === "__other__" ? toUppercase(tipeTransaksiOther) : tipeTransaksiPreset;
  const finalTipePembayaran =
    tipePembayaranPreset === "__other__" ? toUppercase(tipePembayaranOther) : tipePembayaranPreset;

  const nominalDisplayValue = nominalTransaksi ? formatRupiah(Number(nominalTransaksi)) : "";

  function handleNominalChange(nextValue: string) {
    const sanitized = sanitizeNominal(nextValue);

    if (!sanitized) {
      setNominalTransaksi("");
      setNominalError(false);
      return;
    }

    const parsed = Number(sanitized);
    if (approvalNominal !== null && parsed > approvalNominal) {
      setNominalError(true);
      return;
    }

    setNominalTransaksi(sanitized);
    setNominalError(false);
  }

  return (
    <>
      <form
        action={inlineMode ? formAction : createSemuaPengajuan}
        className="flex flex-col gap-6"
      >
        <input name="email" type="hidden" value={userEmail} />
        <input name="tipeTransaksi" type="hidden" value={finalTipeTransaksi} />
        <input name="tipePembayaran" type="hidden" value={finalTipePembayaran} />
        <input name="informasiPenerima" type="hidden" value={informasiPenerima} />
        <input name="nominalTransaksi" type="hidden" value={nominalTransaksi} />
        <input name="column17" type="hidden" value={sourceType ?? ""} />
        <input name="score" type="hidden" value={sourceId ?? ""} />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              TANGGAL PERMOHONAN
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              defaultValue={defaultTanggal}
              name="tanggalPermohonan"
              type="date"
            />
            <FieldHint>Tanggal</FieldHint>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              TIPE TRANSAKSI
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {TRANSACTION_OPTIONS.map((option) => (
                <ChoiceCard
                  checked={tipeTransaksiPreset === option}
                  key={option}
                  name="tipeTransaksiPreset"
                  onChange={setTipeTransaksiPreset}
                  value={option}
                />
              ))}
              <ChoiceCard
                checked={tipeTransaksiPreset === "__other__"}
                label="Yang lain"
                name="tipeTransaksiPreset"
                onChange={setTipeTransaksiPreset}
                value="__other__"
              />
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={tipeTransaksiPreset !== "__other__"}
              onChange={(event) => setTipeTransaksiOther(event.target.value)}
              placeholder="Yang lain:"
              type="text"
              value={tipeTransaksiOther}
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              TIPE PEMBAYARAN
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PAYMENT_OPTIONS.map((option) => (
                <ChoiceCard
                  checked={tipePembayaranPreset === option}
                  key={option}
                  name="tipePembayaranPreset"
                  onChange={setTipePembayaranPreset}
                  value={option}
                />
              ))}
              <ChoiceCard
                checked={tipePembayaranPreset === "__other__"}
                label="Yang lain"
                name="tipePembayaranPreset"
                onChange={setTipePembayaranPreset}
                value="__other__"
              />
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={tipePembayaranPreset !== "__other__"}
              onChange={(event) => setTipePembayaranOther(event.target.value)}
              placeholder="Yang lain:"
              type="text"
              value={tipePembayaranOther}
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              INFORMASI PENERIMA
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {RECIPIENT_OPTIONS.map((option) => (
                <ChoiceCard
                  checked={informasiPenerima === option}
                  key={option}
                  name="informasiPenerimaChoice"
                  onChange={setInformasiPenerima}
                  value={option}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              NAMA PENERIMA
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              name="namaPenerima"
              onChange={(event) => setNamaPenerima(toUppercase(event.target.value))}
              type="text"
              value={namaPenerima}
            />
            <FieldHint>MOHON DIISI DENGAN HURUF KAPITAL</FieldHint>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              DETAIL BANK PENERIMA
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              name="detailBankPenerima"
              onChange={(event) => setDetailBankPenerima(toUppercase(event.target.value))}
              type="text"
              value={detailBankPenerima}
            />
            <FieldHint>MOHON DIISI DENGAN HURUF KAPITAL</FieldHint>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              NOMOR REKENING / NOMOR HANDPHONE
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              inputMode="numeric"
              name="nomorRekeningHp"
              onChange={(event) => setNomorRekeningHp(formatAccountNumber(event.target.value))}
              placeholder="1234-5678-9000"
              type="text"
              value={nomorRekeningHp}
            />
            <FieldHint>MOHON DIBERIKAN TANDA PER 4 ANGKA DENGAN TANDA (-)</FieldHint>
            <FieldHint>CONTOH PENGISIAN : 1234-5678-9000</FieldHint>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              NOMINAL TRANSAKSI (DALAM RUPIAH)
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                nominalError
                  ? "border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-900 focus:border-purple-600 focus:ring-purple-600/20"
              }`}
              inputMode="numeric"
              onChange={(event) => handleNominalChange(event.target.value)}
              placeholder="1.000.000"
              type="text"
              value={nominalDisplayValue}
            />
            {approvalNominal !== null ? (
              nominalError ? (
                <p className="text-xs leading-relaxed text-rose-600">
                  Nominal tidak boleh lebih dari approval: {formatRupiah(approvalNominal)}
                </p>
              ) : (
                <FieldHint>Nominal maksimal sesuai approval: {formatRupiah(approvalNominal)}</FieldHint>
              )
            ) : (
              <FieldHint>MOHON DIISI DENGAN ANGKA SAJA - CONTOH : 1000000</FieldHint>
            )}
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              BERITA TRANSAKSI / KETERANGAN PERMOHONAN DANA
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              name="keterangan"
              onChange={(event) => setKeterangan(toUppercase(event.target.value))}
              rows={4}
              value={keterangan}
            />
            <FieldHint>MOHON DIISI DENGAN HURUF KAPITAL</FieldHint>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              LAMPIRAN PENDUKUNG (FINANCE)
            </label>
            <input
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
              name="lampiranFinance"
              type="file"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">LAMPIRAN PENDUKUNG (TAX)</label>
            <input
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              name="lampiranTax"
              type="file"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <button
            className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            disabled={inlineMode ? isPending || nominalError : nominalError}
            type="submit"
          >
            {inlineMode && isPending ? "Mengajukan..." : "Simpan Data"}
          </button>
          {inlineMode ? (
            <button
              className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
          ) : (
            <Link
              className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"
              href="/pengajuan"
            >
              Batal
            </Link>
          )}
        </div>
      </form>

      {inlineMode && state.success && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pengajuan dalam proses</h3>
            <p className="mt-2 text-sm text-slate-500">{state.message}</p>
            <button
              className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
              onClick={() => {
                onClose?.();
                router.refresh();
              }}
              type="button"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
