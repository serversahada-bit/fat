"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { saveAllSignatures } from "@/app/actions/setting";

const CATEGORIES = ["Semua", "ATK", "P3K", "Operasional", "Iklan", "Meta Ads", "Google Ads", "TikTok Ads", "Snack Video", "Marketplace"];

interface Signature {
  id: string;
  posisi: string;
  nama: string;
  jabatan: string;
  x: number;
  y: number;
  kategori: string;
}

export function VisualSignatureEditor({ initialSignatures }: { initialSignatures: Signature[] }) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  
  const defaultSignatures = (cat: string): Signature[] => {
    if (cat === "Meta Ads") {
      return [
        { id: "sig1", posisi: "Dibuat oleh", nama: "AHMAD BAHRUDDIN RAMDHAN", jabatan: "KOORDINATOR ADVERTISER", x: 0, y: 0, kategori: cat },
        { id: "sig2", posisi: "Diketahui oleh (SPV)", nama: "RIFAN ARI EFENDI", jabatan: "SUPERVISOR MARKETING", x: 0, y: 0, kategori: cat },
        { id: "sig3", posisi: "Diketahui oleh (MGR)", nama: "YANUER MONTIO", jabatan: "MANAGER BRANDING", x: 0, y: 0, kategori: cat },
        { id: "sig4", posisi: "Divalidasi oleh", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT MANAGER", x: 0, y: 0, kategori: cat },
        { id: "sig5", posisi: "Disetujui oleh", nama: "HANIIF KISBULLAH AULIA IBRAHIM", jabatan: "CEO", x: 0, y: 0, kategori: cat },
      ];
    }
    if (cat === "Marketplace") {
      return [
        { id: "sig1", posisi: "Dibuat oleh", nama: "HAIDAR BAHI TAQI", jabatan: "KOOR MARKETPLACE", x: 0, y: 0, kategori: cat },
        { id: "sig2", posisi: "Diketahui oleh", nama: "FARHAN FAHRUDIN SUBIANTO", jabatan: "SPV MARKETPLACE", x: 0, y: 0, kategori: cat },
        { id: "sig3", posisi: "Divalidasi oleh", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT MANAGER", x: 0, y: 0, kategori: cat },
        { id: "sig4", posisi: "Disetujui oleh", nama: "HANIIF KISBULLAH AULIA IBRAHIM", jabatan: "CEO", x: 0, y: 0, kategori: cat },
      ];
    }
    return [
      { id: "sig1", posisi: "Dibuat oleh", nama: "NURUL FITRIYAH", jabatan: "Koordinator HC", x: 0, y: 0, kategori: cat },
      { id: "sig2", posisi: "Disetujui & Diverifikasi oleh,", nama: "RAMADHANI FAREGA FERNANDA", jabatan: "FAT Manager", x: 0, y: 0, kategori: cat }
    ];
  };

  const getInitialState = (cat: string) => {
    const sigsForCategory = initialSignatures.filter(s => s.kategori === cat);
    if (sigsForCategory.length > 0) return sigsForCategory;
    return defaultSignatures(cat);
  };

  const [signatures, setSignatures] = useState<Signature[]>(getInitialState(selectedCategory));
  const [isSaving, setIsSaving] = useState(false);

  // Gunakan JSON.stringify agar re-render dari parent tidak mereset state
  // jika isi datanya sebenarnya tidak berubah.
  const initialSignaturesString = JSON.stringify(initialSignatures);

  React.useEffect(() => {
    setSignatures(getInitialState(selectedCategory));
  }, [selectedCategory, initialSignaturesString]);

  const PAGE_WIDTH = 297; // A4 landscape width in mm
  const PAGE_HEIGHT = 210; // A4 landscape height in mm
  const SCALE = 3; // Scale factor for web preview (e.g. 1mm = 3px)

  const handleDragStop = (id: string, d: { x: number, y: number }) => {
    const xMm = d.x / SCALE;
    const yMm = d.y / SCALE;

    setSignatures((prev) =>
      prev.map((sig) => (sig.id === id ? { ...sig, x: xMm, y: yMm } : sig))
    );
  };

  const savePositions = async () => {
    setIsSaving(true);
    try {
      const payloads = signatures.map((sig) => ({
        kategori: selectedCategory,
        posisi: sig.posisi,
        nama: sig.nama,
        jabatan: sig.jabatan,
        x: sig.x,
        y: sig.y,
      }));
      await saveAllSignatures(selectedCategory, payloads);
      alert("Tata letak berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan tata letak.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm(`Apakah Anda yakin ingin mereset tata letak untuk Kategori ${selectedCategory === "Semua" ? "Semua (Default)" : selectedCategory} ke pengaturan awal?`)) {
      setIsSaving(true);
      try {
        const defaults = defaultSignatures(selectedCategory);
        const payloads = defaults.map((sig) => ({
          kategori: selectedCategory,
          posisi: sig.posisi,
          nama: sig.nama,
          jabatan: sig.jabatan,
          x: sig.x,
          y: sig.y,
        }));
        await saveAllSignatures(selectedCategory, payloads);
        setSignatures(defaults);
        alert("Tata letak berhasil direset ke pengaturan awal!");
      } catch (error) {
        console.error(error);
        alert("Gagal mereset tata letak.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateSignature = (id: string, field: keyof Signature, value: string) => {
    setSignatures(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSignature = () => {
    const newId = `sig_${Date.now()}`;
    const newSig: Signature = {
      id: newId,
      posisi: "Judul Tanda Tangan",
      nama: "Nama Pegawai",
      jabatan: "Jabatan",
      x: 0,
      y: 0,
      kategori: selectedCategory,
    };
    setSignatures(prev => [...prev, newSig]);
  };

  const removeSignature = (id: string) => {
    if (confirm("Hapus tanda tangan ini?")) {
      setSignatures(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex w-full justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Editor Tata Letak Tanda Tangan</h3>
            <p className="text-sm text-slate-500">Geser kotak tanda tangan di bawah ini untuk mengatur posisinya pada dokumen A4 Landscape.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
            >
              Reset ke Default
            </button>
            <button
              onClick={savePositions}
              disabled={isSaving}
              className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Tata Letak"}
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center gap-3 border-t border-slate-200 pt-4">
          <label className="text-sm font-semibold text-slate-700">Kategori Laporan:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-medium"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === "Semua" ? "Semua Laporan (Default)" : `Laporan ${cat}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Sidebar Inputs */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
          {signatures.map((sig) => (
            <div key={sig.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
              <button 
                onClick={() => removeSignature(sig.id)}
                className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                title="Hapus Tanda Tangan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="mb-3 pr-8">
                <input 
                  type="text" 
                  value={sig.posisi}
                  onChange={(e) => updateSignature(sig.id, 'posisi', e.target.value)}
                  className="font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-purple-600 outline-none w-full transition-colors"
                  placeholder="Posisi (contoh: Dibuat oleh)"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Nama</label>
                  <input 
                    type="text" 
                    value={sig.nama}
                    onChange={(e) => updateSignature(sig.id, 'nama', e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Jabatan</label>
                  <input 
                    type="text" 
                    value={sig.jabatan}
                    onChange={(e) => updateSignature(sig.id, 'jabatan', e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={addSignature}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Tanda Tangan
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto max-w-full custom-scrollbar p-4 bg-slate-200 rounded-2xl flex justify-center items-start">
        {/* A4 Paper Representation */}
        <div 
          className="relative bg-white shadow-2xl overflow-hidden pointer-events-none shrink-0"
          style={{ 
            width: PAGE_WIDTH * SCALE, 
            height: PAGE_HEIGHT * SCALE,
          }}
        >
          {/* Header Mockup */}
          {/* Logo Kiri */}
          <img 
            src="/favicon.ico" 
            alt="Logo"
            className="absolute object-contain object-left-top"
            style={{ 
              left: 5 * SCALE, 
              top: 2 * SCALE,
              maxWidth: 12 * SCALE,
              maxHeight: 16 * SCALE
            }}
          />
          {/* Wave Kanan */}
          <img 
            src="/Picture1.png" 
            alt="Wave"
            className="absolute object-contain object-right-top"
            style={{ 
              right: 0, 
              top: 0,
              width: 50 * SCALE,
              height: 28 * SCALE
            }}
          />

          {/* Judul & No Dokumen */}
          <div 
            className="absolute w-full text-center flex flex-col items-center"
            style={{ top: 22 * SCALE - (14 * SCALE / 3) }}
          >
            <div className="font-bold text-black font-sans" style={{ fontSize: 11 * 0.3527 * SCALE }}>
              RENCANA ANGGARAN & BIAYA ({selectedCategory === "Semua" ? "SEMUA KATEGORI" : `KATEGORI ${selectedCategory.toUpperCase()}`})
            </div>
            <div className="font-bold text-black font-sans mt-0.5" style={{ fontSize: 8.5 * 0.3527 * SCALE }}>
              NO : RAB/07/FAT/2026
            </div>
          </div>
          
          {/* Table Mockup */}
          <div 
            className="absolute"
            style={{ 
              top: 40 * SCALE,
              left: 10 * SCALE,
              right: 10 * SCALE,
            }}
          >
            <table className="w-full border-collapse border border-slate-200">
              <thead className="bg-[#4f46e5] text-white">
                <tr>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 16 * SCALE }}>Status</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 20 * SCALE }}>Kategori</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 25 * SCALE }}>Divisi</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 25 * SCALE }}>PIC</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 60 * SCALE }}>Rincian</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 15 * SCALE }}>Qty</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 25 * SCALE }}>Harga Satuan</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 25 * SCALE }}>Total</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 20 * SCALE }}>Tanggal</th>
                  <th className="border border-[#4338ca] py-1 px-1 font-bold text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE, width: 46 * SCALE }}>Catatan</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-800">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>APPROVED</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>{selectedCategory === "Semua" ? "ATK" : selectedCategory}</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>Fulfillment</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>arga</td>
                    <td className="border border-slate-200 py-1.5 px-1" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>Barang Dummy {i+1}</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>1 PCS</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-right" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>Rp 10.000</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-right" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>Rp 10.000</td>
                    <td className="border border-slate-200 py-1.5 px-1 text-center" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>24/07/2026</td>
                    <td className="border border-slate-200 py-1.5 px-1" style={{ fontSize: 5.3 * 0.3527 * SCALE }}>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Line Mockup */}
          <div 
            className="absolute border-t-2 border-[#cbd5e1]"
            style={{ 
              bottom: 11 * SCALE, 
              left: 10 * SCALE, 
              right: 10 * SCALE 
            }}
          />

          {/* Draggable Signatures */}
          {signatures.map((sig, index) => {
            // Spread signatures evenly across the page width
            const totalWidth = PAGE_WIDTH - 20; // 10mm margins on left and right
            const spacing = totalWidth / signatures.length;
            const defaultX = (10 + (spacing * index) + (spacing / 2) - 25) * SCALE; // 25 is roughly half the width of a signature block
            const defaultY = (PAGE_HEIGHT - 60) * SCALE; // roughly bottom area

            const currentXPx = sig.x !== 0 ? sig.x * SCALE : defaultX;
            const currentYPx = sig.y !== 0 ? sig.y * SCALE : defaultY;

            return (
              <Rnd
                key={sig.id}
                className="pointer-events-auto border border-dashed border-slate-300 hover:border-purple-500 bg-white/40 hover:bg-purple-50/60 p-0 cursor-move transition-colors"
                position={{ x: currentXPx, y: currentYPx }}
                onDragStop={(e, d) => handleDragStop(sig.id, d)}
                enableResizing={false}
                bounds="parent"
              >
                <div className="flex flex-col" style={{ width: 'fit-content' }}>
                  {index === 0 && (
                    <div className="text-black font-sans" style={{ fontSize: 9 * 0.3527 * SCALE, height: 5 * SCALE, lineHeight: `${5 * SCALE}px` }}>
                      Madiun, 24 Juli 2026
                    </div>
                  )}
                  {index !== 0 && (
                    <div style={{ height: 5 * SCALE }} />
                  )}
                  
                  <div className="text-black font-sans" style={{ fontSize: 9 * 0.3527 * SCALE, height: 20 * SCALE, lineHeight: `${9 * 0.3527 * SCALE}px` }}>
                    {sig.posisi.replace(/\s*\(.*?\)\s*/g, '')}
                  </div>
                  <div className="text-black font-sans font-bold underline whitespace-nowrap" style={{ fontSize: 9 * 0.3527 * SCALE, height: 5 * SCALE, lineHeight: `${9 * 0.3527 * SCALE}px` }}>
                    {sig.nama}
                  </div>
                  <div className="text-black font-sans" style={{ fontSize: 9 * 0.3527 * SCALE, lineHeight: `${9 * 0.3527 * SCALE}px` }}>
                    {sig.jabatan}
                  </div>
                </div>
              </Rnd>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
