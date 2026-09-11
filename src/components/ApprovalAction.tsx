"use client";

import { updateKebutuhanBulananStatus } from "@/app/actions/pengajuan";

export function ApprovalAction({
  pengajuanId,
  initialStatus,
  initialCatatan,
}: {
  pengajuanId: string;
  initialStatus: string;
  initialCatatan: string | null;
}) {
  return (
    <form action={updateKebutuhanBulananStatus} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input type="hidden" name="pengajuanId" value={pengajuanId} />
      
      <select
        name="status"
        defaultValue={initialStatus}
        onChange={(e) => {
          // This will automatically submit the form when the dropdown changes
          e.target.form?.requestSubmit();
        }}
        style={{
          padding: "6px",
          borderRadius: "4px",
          border: "1px solid var(--border)",
          fontSize: "13px",
          background: "var(--surface)",
          color: "var(--text-main)",
          cursor: "pointer"
        }}
      >
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approve</option>
        <option value="REJECTED">Reject</option>
      </select>

      <textarea
        name="catatanAdmin"
        defaultValue={initialCatatan || ""}
        placeholder="Ketik catatan & klik di luar kotak utk simpan..."
        rows={2}
        onBlur={(e) => {
          // This will automatically submit the form when the admin clicks outside the textarea
          e.target.form?.requestSubmit();
        }}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid var(--border)",
          fontSize: "13px",
        }}
      />
    </form>
  );
}
