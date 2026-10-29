import Link from "next/link";
import { Download, Paperclip } from "lucide-react";
import { getUploadDisplayName, parseUploadUrls } from "@/lib/uploads";

export function LampiranCatatanLinks({ value }: { value: string | null }) {
  const urls = parseUploadUrls(value);
  if (urls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {urls.map((url, index) => (
        <span key={url} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px]">
          <Paperclip className="h-3 w-3 text-slate-400" />
          <Link className="text-blue-600 hover:underline" href={url} rel="noreferrer" target="_blank" title={getUploadDisplayName(url)}>
            Lampiran {index + 1}
          </Link>
          <a
            href={url}
            download={getUploadDisplayName(url)}
            title={`Unduh ${getUploadDisplayName(url)}`}
            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <Download className="h-3 w-3" />
          </a>
        </span>
      ))}
    </div>
  );
}
