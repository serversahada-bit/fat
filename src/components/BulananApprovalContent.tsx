"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BulananTable, type PengajuanBulanan } from "@/components/BulananTable";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { ImportKebutuhanBulananButton } from "@/components/ImportKebutuhanBulananButton";

export function BulananApprovalContent({
  items,
  currentTab,
  reportTitle,
}: {
  items: PengajuanBulanan[];
  currentTab: string;
  reportTitle: string;
}) {
  const [bulanFilter, setBulanFilter] = useState("SEMUA");
  const exportItems = useMemo(
    () => bulanFilter === "SEMUA" ? items : items.filter((item) => item.bulan === bulanFilter),
    [items, bulanFilter],
  );
  const exportTitle = bulanFilter === "SEMUA" ? reportTitle : `${reportTitle} - ${bulanFilter.toUpperCase()}`;

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {["Semua", "ATK", "P3K", "Operasional", "NON-RAB"].map((tab) => (
            <Link
              key={tab}
              href={`/dashboard/bulanan?tab=${tab}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                currentTab === tab
                  ? "gradient-brand text-white shadow-md shadow-purple-600/25"
                  : "bg-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ImportKebutuhanBulananButton />
          <ExportPDFButton data={exportItems} title={exportTitle} kategori={currentTab} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          Belum ada data pengajuan bulanan di kategori ini.
        </div>
      ) : (
        <BulananTable items={items} bulanFilter={bulanFilter} onBulanFilterChange={setBulanFilter} />
      )}
    </>
  );
}