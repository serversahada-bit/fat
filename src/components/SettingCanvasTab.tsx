import { prisma } from "@/lib/prisma";
import { createCanvas, deleteCanvas } from "@/app/actions/setting";
import { DeleteConfirmButton } from "./DeleteConfirmButton";
import { VisualSignatureEditor } from "./VisualSignatureEditor";

export async function SettingCanvasTab() {
  const canvases = await prisma.master_canvas.findMany({
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <VisualSignatureEditor initialSignatures={canvases} />
      </section>
    </div>
  );
}
