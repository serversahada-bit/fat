"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { getSignatures } from "@/app/actions/setting";

interface ExportPDFItem {
  status?: string;
  kategori?: string;
  divisi?: string;
  pic?: string;
  rincian?: string;
  qty?: number | string;
  satuan?: string;
  hargaSatuan?: number | string;
  total?: number | string;
  createdAt?: string | Date | null;
  catatanAdmin?: string | null;
  catatanTambahan?: string | null;
}

interface ExportPDFButtonProps {
  data: ExportPDFItem[];
  title: string;
  documentNumber?: string;
  kategori?: string;
}

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

/*
|--------------------------------------------------------------------------
| Pengaturan layout PDF
|--------------------------------------------------------------------------
*/

const PDF_LAYOUT = {
  logo: {
    x: 5,
    y: 2,
    maxWidth: 12,
    maxHeight: 16,
  },

  wave: {
    right: 0,
    y: 0,
    maxWidth: 50,
    maxHeight: 28,
  },

  titleY: 22,
  documentNumberY: 29,
  tableStartY: 40,

  marginLeft: 10,
  marginRight: 10,
  marginBottom: 16,
};

/*
|--------------------------------------------------------------------------
| Memotong area transparan pada logo
|--------------------------------------------------------------------------
|
| Favicon terkadang mempunyai ruang transparan yang besar.
| Fungsi ini memotong ruang tersebut agar logo terlihat lebih proporsional.
|
*/

const trimTransparentCanvas = (
  sourceCanvas: HTMLCanvasElement,
): HTMLCanvasElement => {
  const context = sourceCanvas.getContext("2d");

  if (!context) {
    return sourceCanvas;
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const imageData = context.getImageData(
    0,
    0,
    width,
    height,
  );

  const pixels = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alphaIndex = (y * width + x) * 4 + 3;
      const alpha = pixels[alphaIndex];

      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return sourceCanvas;
  }

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const croppedCanvas =
    document.createElement("canvas");

  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;

  const croppedContext =
    croppedCanvas.getContext("2d");

  if (!croppedContext) {
    return sourceCanvas;
  }

  croppedContext.drawImage(
    sourceCanvas,
    minX,
    minY,
    croppedWidth,
    croppedHeight,
    0,
    0,
    croppedWidth,
    croppedHeight,
  );

  return croppedCanvas;
};

/*
|--------------------------------------------------------------------------
| Membaca gambar menjadi Base64 PNG
|--------------------------------------------------------------------------
*/

const loadImageAsBase64 = (
  url: string,
  trimTransparent = false,
): Promise<LoadedImage | null> => {
  return new Promise((resolve) => {
    const image = new Image();

    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const naturalWidth =
          image.naturalWidth || image.width || 1;

        const naturalHeight =
          image.naturalHeight || image.height || 1;

        const canvas =
          document.createElement("canvas");

        canvas.width = naturalWidth;
        canvas.height = naturalHeight;

        const context =
          canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        context.clearRect(
          0,
          0,
          naturalWidth,
          naturalHeight,
        );

        context.drawImage(
          image,
          0,
          0,
          naturalWidth,
          naturalHeight,
        );

        const finalCanvas = trimTransparent
          ? trimTransparentCanvas(canvas)
          : canvas;

        resolve({
          data: finalCanvas.toDataURL("image/png"),
          width: finalCanvas.width,
          height: finalCanvas.height,
        });
      } catch (error) {
        console.error(
          `Gagal mengubah gambar ${url}:`,
          error,
        );

        resolve(null);
      }
    };

    image.onerror = () => {
      console.error(
        `Gambar tidak ditemukan atau gagal dimuat: ${url}`,
      );

      resolve(null);
    };

    image.src = url;
  });
};

/*
|--------------------------------------------------------------------------
| Menentukan ukuran gambar tanpa merusak rasio
|--------------------------------------------------------------------------
*/

const calculateContainSize = (
  originalWidth: number,
  originalHeight: number,
  maximumWidth: number,
  maximumHeight: number,
) => {
  if (
    originalWidth <= 0 ||
    originalHeight <= 0
  ) {
    return {
      width: maximumWidth,
      height: maximumHeight,
    };
  }

  const scale = Math.min(
    maximumWidth / originalWidth,
    maximumHeight / originalHeight,
  );

  return {
    width: originalWidth * scale,
    height: originalHeight * scale,
  };
};

/*
|--------------------------------------------------------------------------
| Format rupiah
|--------------------------------------------------------------------------
*/

const formatCurrency = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "Rp 0";
  }

  return `Rp ${amount.toLocaleString("id-ID")}`;
};

/*
|--------------------------------------------------------------------------
| Format tanggal
|--------------------------------------------------------------------------
*/

const formatDate = (
  value: string | Date | null | undefined,
): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/*
|--------------------------------------------------------------------------
| Nomor dokumen otomatis
|--------------------------------------------------------------------------
*/

const createDefaultDocumentNumber = (): string => {
  const date = new Date();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const year = date.getFullYear();

  return `NO : RAB/${month}/FAT/${year}`;
};

/*
|--------------------------------------------------------------------------
| Menyesuaikan ukuran tulisan agar tetap satu baris
|--------------------------------------------------------------------------
*/

const getFittedFontSize = ({
  doc,
  text,
  maximumWidth,
  defaultSize,
  minimumSize,
}: {
  doc: jsPDF;
  text: string;
  maximumWidth: number;
  defaultSize: number;
  minimumSize: number;
}): number => {
  let fontSize = defaultSize;

  doc.setFontSize(fontSize);

  while (
    doc.getTextWidth(text) > maximumWidth &&
    fontSize > minimumSize
  ) {
    fontSize -= 0.25;
    doc.setFontSize(fontSize);
  }

  return fontSize;
};

/*
|--------------------------------------------------------------------------
| Header mengikuti penataan Word
|--------------------------------------------------------------------------
*/

const drawDocumentHeader = ({
  doc,
  logo,
  wave,
  title,
  documentNumber,
}: {
  doc: jsPDF;
  logo: LoadedImage | null;
  wave: LoadedImage | null;
  title: string;
  documentNumber: string;
}) => {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  /*
   * Background putih pada area header.
   */
  doc.setFillColor(255, 255, 255);

  doc.rect(
    0,
    0,
    pageWidth,
    PDF_LAYOUT.tableStartY,
    "F",
  );

  /*
   |--------------------------------------------------------------------------
   | Logo kiri atas
   |--------------------------------------------------------------------------
   */

  if (logo?.data) {
    const logoSize = calculateContainSize(
      logo.width,
      logo.height,
      PDF_LAYOUT.logo.maxWidth,
      PDF_LAYOUT.logo.maxHeight,
    );

    doc.addImage(
      logo.data,
      "PNG",
      PDF_LAYOUT.logo.x,
      PDF_LAYOUT.logo.y,
      logoSize.width,
      logoSize.height,
      "sahada-logo",
      "FAST",
    );
  }

  /*
   |--------------------------------------------------------------------------
   | Ornamen kanan atas
   |--------------------------------------------------------------------------
   */

  if (wave?.data) {
    const waveSize = calculateContainSize(
      wave.width,
      wave.height,
      PDF_LAYOUT.wave.maxWidth,
      PDF_LAYOUT.wave.maxHeight,
    );

    const waveX =
      pageWidth -
      waveSize.width -
      PDF_LAYOUT.wave.right;

    doc.addImage(
      wave.data,
      "PNG",
      waveX,
      PDF_LAYOUT.wave.y,
      waveSize.width,
      waveSize.height,
      "sahada-wave",
      "FAST",
    );
  }

  /*
   |--------------------------------------------------------------------------
   | Judul dokumen
   |--------------------------------------------------------------------------
   */

  const uppercaseTitle =
    title.toUpperCase();

  const maximumTitleWidth =
    pageWidth - 75;

  doc.setFont(
    "helvetica",
    "bold",
  );

  const fittedTitleSize =
    getFittedFontSize({
      doc,
      text: uppercaseTitle,
      maximumWidth: maximumTitleWidth,
      defaultSize: 11,
      minimumSize: 7.5,
    });

  doc.setFontSize(fittedTitleSize);
  doc.setTextColor(0, 0, 0);

  doc.text(
    uppercaseTitle,
    pageWidth / 2,
    PDF_LAYOUT.titleY,
    {
      align: "center",
    },
  );

  /*
   |--------------------------------------------------------------------------
   | Nomor dokumen
   |--------------------------------------------------------------------------
   */

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8.5);

  doc.text(
    documentNumber.toUpperCase(),
    pageWidth / 2,
    PDF_LAYOUT.documentNumberY,
    {
      align: "center",
    },
  );
};

/*
|--------------------------------------------------------------------------
| Footer dokumen
|--------------------------------------------------------------------------
*/

const drawDocumentFooter = (
  doc: jsPDF,
  pageNumber: number,
) => {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);

  doc.line(
    PDF_LAYOUT.marginLeft,
    pageHeight - 11,
    pageWidth - PDF_LAYOUT.marginRight,
    pageHeight - 11,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);

  doc.text(
    `Dicetak: ${new Date().toLocaleString(
      "id-ID",
    )}`,
    PDF_LAYOUT.marginLeft,
    pageHeight - 6,
  );

  doc.text(
    `Halaman ${pageNumber}`,
    pageWidth - PDF_LAYOUT.marginRight,
    pageHeight - 6,
    {
      align: "right",
    },
  );
};

/*
|--------------------------------------------------------------------------
| Komponen Export PDF
|--------------------------------------------------------------------------
*/

export function ExportPDFButton({
  data,
  title,
  documentNumber,
  kategori = "Semua",
}: ExportPDFButtonProps) {
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [pdfDocument, setPdfDocument] =
    useState<jsPDF | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  /*
   * Membersihkan URL preview lama.
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const closePreview = () => {
    setPreviewUrl(null);
    setPdfDocument(null);
  };

  const generatePDF = async () => {
    if (isGenerating) {
      return;
    }

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      window.alert(
        "Tidak ada data yang dapat dicetak.",
      );

      return;
    }

    setIsGenerating(true);

    try {
      /*
       * Nama file tetap menggunakan milik Anda:
       *
       * public/favicon.ico
       * public/Picture1.png
       */
      const [logo, wave, signatures] =
        await Promise.all([
          loadImageAsBase64(
            "/favicon.ico",
            true,
          ),

          loadImageAsBase64(
            "/Picture1.png",
            false,
          ),
          getSignatures(),
        ]);

      /*
       * A4 portrait.
       */
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const finalDocumentNumber =
        documentNumber ||
        createDefaultDocumentNumber();

      const tableColumns = [
        "Status",
        "Kategori",
        "Divisi",
        "PIC",
        "Rincian",
        "Qty",
        "Harga Satuan",
        "Total",
        "Tanggal",
        "Catatan",
      ];

      const tableRows = data.map(
        (item) => {
          const quantity =
            item.qty === null ||
              item.qty === undefined ||
              item.qty === ""
              ? "-"
              : String(item.qty);

          const unit = item.satuan
            ? ` ${item.satuan}`
            : "";

          return [
            item.status || "-",
            item.kategori || "OPS RT",
            item.divisi || "-",
            item.pic || "-",
            item.rincian || "-",
            `${quantity}${unit}`,
            formatCurrency(
              item.hargaSatuan,
            ),
            formatCurrency(item.total),
            formatDate(item.createdAt),
            item.catatanAdmin ||
            item.catatanTambahan ||
            "-",
          ];
        },
      );

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,

        startY:
          PDF_LAYOUT.tableStartY,

        margin: {
          top: PDF_LAYOUT.tableStartY,
          left: PDF_LAYOUT.marginLeft,
          right: PDF_LAYOUT.marginRight,
          bottom: PDF_LAYOUT.marginBottom,
        },

        theme: "grid",
        showHead: "everyPage",

        styles: {
          font: "helvetica",
          fontSize: 5.3,
          cellPadding: 1.1,
          valign: "middle",
          overflow: "linebreak",
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.12,
          minCellHeight: 6,
        },

        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 5.3,
          halign: "center",
          valign: "middle",
          lineColor: [67, 56, 202],
          lineWidth: 0.15,
          minCellHeight: 7,
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        /*
         * Total lebar kolom 277 mm.
         * A4 landscape: 297 mm.
         * Margin kiri dan kanan masing-masing 10 mm.
         */
        columnStyles: {
          0: { cellWidth: 16, halign: "center" },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 60 },
          5: { cellWidth: 15, halign: "center" },
          6: { cellWidth: 25, halign: "right" },
          7: { cellWidth: 25, halign: "right" },
          8: { cellWidth: 20, halign: "center" },
          9: { cellWidth: 46 },
        },

        /*
         * Header digambar pada setiap halaman.
         */
        willDrawPage: () => {
          drawDocumentHeader({
            doc,
            logo,
            wave,
            title,
            documentNumber:
              finalDocumentNumber,
          });
        },

        /*
         * Footer digambar pada setiap halaman.
         */
        didDrawPage: (hookData) => {
          drawDocumentFooter(
            doc,
            hookData.pageNumber,
          );
        },
      });

      /*
       * Tambahkan tanda tangan di bawah tabel
       */
      const finalY = (doc as any).lastAutoTable.finalY || PDF_LAYOUT.tableStartY;
      const signatureStartY = finalY + 15;
      const signatureHeight = 40;
      
      // Jika sisa ruang di halaman tidak cukup untuk tanda tangan, buat halaman baru
      if (signatureStartY + signatureHeight > doc.internal.pageSize.getHeight() - PDF_LAYOUT.marginBottom) {
        doc.addPage();
        (doc as any).lastAutoTable.finalY = PDF_LAYOUT.tableStartY;
      }

      const currentY = (doc as any).lastAutoTable.finalY === PDF_LAYOUT.tableStartY ? PDF_LAYOUT.tableStartY + 10 : signatureStartY;

      // Format tanggal
      const now = new Date();
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const dateString = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      // Dapatkan tanda tangan spesifik kategori atau gunakan Default (Semua)
      let signersForCategory = signatures.filter((s: any) => s.kategori === kategori);
      if (signersForCategory.length === 0) {
        if (kategori === "Meta Ads") {
          signersForCategory = [
            { id: "sig1", posisi: "Dibuat oleh", nama: "AHMAD BAHRUDDIN RAMDHAN", jabatan: "KOORDINATOR ADVERTISER", x: 0, y: 0, kategori },
            { id: "sig2", posisi: "Diketahui oleh (SPV)", nama: "RIFAN ARI EFENDI", jabatan: "SUPERVISOR MARKETING", x: 0, y: 0, kategori },
            { id: "sig3", posisi: "Diketahui oleh (MGR)", nama: "YANUER MONTIO", jabatan: "MANAGER BRANDING", x: 0, y: 0, kategori },
            { id: "sig4", posisi: "Divalidasi oleh", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT MANAGER", x: 0, y: 0, kategori },
            { id: "sig5", posisi: "Disetujui oleh", nama: "HANIIF KISBULLAH AULIA IBRAHIM", jabatan: "CEO", x: 0, y: 0, kategori },
          ];
        } else if (kategori === "Marketplace") {
          signersForCategory = [
            { id: "sig1", posisi: "Dibuat oleh", nama: "HAIDAR BAHI TAQI", jabatan: "KOOR MARKETPLACE", x: 0, y: 0, kategori },
            { id: "sig2", posisi: "Diketahui oleh", nama: "FARHAN FAHRUDIN SUBIANTO", jabatan: "SPV MARKETPLACE", x: 0, y: 0, kategori },
            { id: "sig3", posisi: "Divalidasi oleh", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT MANAGER", x: 0, y: 0, kategori },
            { id: "sig4", posisi: "Disetujui oleh", nama: "HANIIF KISBULLAH AULIA IBRAHIM", jabatan: "CEO", x: 0, y: 0, kategori },
          ];
        } else {
          signersForCategory = [
            { posisi: "Dibuat oleh", nama: "NURUL FITRIYAH", jabatan: "Koordinator HC", x: 0, y: 0 },
            { posisi: "Disetujui & Diverifikasi oleh,", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT Manager", x: 0, y: 0 }
          ];
        }
      }

      const PAGE_WIDTH = doc.internal.pageSize.getWidth();
      const totalWidth = PAGE_WIDTH - PDF_LAYOUT.marginLeft - PDF_LAYOUT.marginRight;
      const spacing = totalWidth / signersForCategory.length;

      signersForCategory.forEach((sig: any, index: number) => {
        // Default X spreads evenly based on the number of signatures
        const defaultX = PDF_LAYOUT.marginLeft + (spacing * index) + (spacing / 2) - 25; // 25mm is roughly half width of one block

        const xPos = sig.x !== 0 ? sig.x : defaultX;
        const yPos = sig.y !== 0 ? sig.y : currentY;

        doc.setFont("helvetica", "normal");
        if (index === 0) {
          doc.text(`Madiun, ${dateString}`, xPos, yPos);
        }
        
        doc.text(sig.posisi.replace(/\s*\(.*?\)\s*/g, ''), xPos, yPos + 5);
        
        doc.setFont("helvetica", "bold");
        doc.text(sig.nama, xPos, yPos + 25);
        
        doc.setLineWidth(0.3);
        doc.line(xPos, yPos + 26, xPos + doc.getTextWidth(sig.nama), yPos + 26);
        
        doc.setFont("helvetica", "normal");
        doc.text(sig.jabatan, xPos, yPos + 30);
      });


      const pdfBlob =
        doc.output("blob");

      const newPreviewUrl =
        URL.createObjectURL(pdfBlob);

      setPdfDocument(doc);
      setPreviewUrl(newPreviewUrl);
    } catch (error) {
      console.error(
        "Gagal membuat PDF:",
        error,
      );

      window.alert(
        "PDF gagal dibuat. Pastikan favicon.ico dan Picture1.png tersedia di folder public.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfDocument) {
      return;
    }

    const safeTitle = title
      .replace(
        /[^a-zA-Z0-9\s_-]/g,
        "",
      )
      .trim()
      .replace(/\s+/g, "_");

    pdfDocument.save(
      `Laporan_${safeTitle}_${Date.now()}.pdf`,
    );

    closePreview();
  };

  return (
    <>
      <button
        type="button"
        onClick={generatePDF}
        disabled={isGenerating}
        className="
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-lg
          bg-purple-600
          px-4
          py-2
          text-sm
          font-medium
          text-white
          shadow-md
          shadow-purple-600/20
          transition-all
          hover:bg-purple-700
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-60
          sm:w-auto
        "
      >
        {isGenerating ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />

            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}

        {isGenerating
          ? "Membuat PDF..."
          : "Cetak PDF"}
      </button>

      {previewUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4 md:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Preview PDF
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Format A4 portrait
                </p>
              </div>

              <button
                type="button"
                onClick={closePreview}
                aria-label="Tutup preview"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100 p-2 md:p-4">
              <iframe
                src={previewUrl}
                className="h-full w-full rounded-lg border border-slate-200 bg-white shadow-sm"
                title="PDF Preview"
              />
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 p-4 md:p-6">
              <button
                type="button"
                onClick={closePreview}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={downloadPDF}
                className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98]"
              >
                Unduh PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}