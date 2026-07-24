"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Rnd } from "react-rnd";
import { exportPdf, TextAnnotation, ImageAnnotation } from "@/lib/pdfModifier";
import { Upload, Type, Image as ImageIcon, Download, X, Trash2 } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFEditor({ initialPdfUrl }: { initialPdfUrl?: string }) {
  const [pdfFile, setPdfFile] = useState<string | null>(initialPdfUrl || null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfPageDimensions, setPdfPageDimensions] = useState({ width: 0, height: 0 });

  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [images, setImages] = useState<ImageAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPdfFile(fileUrl);
      setTexts([]);
      setImages([]);
    }
  };

  const handleAddText = () => {
    const newText: TextAnnotation = {
      id: `text-${Date.now()}`,
      text: "Teks Baru",
      x: 50,
      y: 50,
      fontSize: 16,
      color: "#000000",
    };
    setTexts([...texts, newText]);
    setSelectedId(newText.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        // Auto-detect image dimensions to maintain aspect ratio ideally,
        // but for simplicity we set a default size
        const newImage: ImageAnnotation = {
          id: `img-${Date.now()}`,
          dataUrl,
          x: 50,
          y: 50,
          width: 150,
          height: 150,
        };
        setImages([...images, newImage]);
        setSelectedId(newImage.id);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    e.target.value = '';
  };

  const handleExport = async () => {
    if (!pdfFile) return;
    
    // In a real app, you'd calculate the actual scale by comparing 
    // the rendered width (pdfPageDimensions.width) with the internal PDF points.
    // react-pdf typically renders at 96 DPI, which roughly matches pdf points if scale=1.
    // For exact math, pdf-lib points = CSS pixels * (72/96) / scale.
    // But react-pdf abstracts this. Usually scale ratio is just the state `scale`.
    await exportPdf(pdfFile, texts, images, scale);
  };

  const updateText = (id: string, newValues: Partial<TextAnnotation>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...newValues } : t));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setTexts(texts.filter(t => t.id !== selectedId));
    setImages(images.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  // Deselect when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Very basic check - if they click the main wrapper but not an Rnd item
      const target = e.target as HTMLElement;
      if (target.classList.contains("react-pdf__Page__canvas")) {
        setSelectedId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 md:flex-row">
      {/* Sidebar Toolbar */}
      <div className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Editor PDF</h2>
        
        <div className="flex flex-col gap-3">
          {!initialPdfUrl && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              <Upload size={18} />
              <span>Upload PDF</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          )}

          <button 
            disabled={!pdfFile}
            onClick={handleAddText}
            className="flex items-center gap-2 rounded-xl bg-purple-100 p-3 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
          >
            <Type size={18} />
            Tambah Teks
          </button>

          <label className={`flex items-center gap-2 rounded-xl bg-purple-100 p-3 text-sm font-medium text-purple-700 transition-colors ${!pdfFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-200 cursor-pointer'}`}>
            <ImageIcon size={18} />
            <span>Tambah Gambar/TTD</span>
            <input type="file" accept="image/png, image/jpeg" className="hidden" disabled={!pdfFile} onChange={handleImageUpload} />
          </label>

          <div className="my-2 border-t border-slate-100"></div>
          
          <button 
            disabled={!pdfFile}
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-slate-900 p-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            <Download size={18} />
            Export PDF Baru
          </button>
        </div>

        {/* Selected Item Properties */}
        {selectedId && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Properti</span>
              <button onClick={deleteSelected} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
            </div>
            
            {texts.find(t => t.id === selectedId) && (
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  value={texts.find(t => t.id === selectedId)?.text || ''}
                  onChange={(e) => updateText(selectedId, { text: e.target.value })}
                  className="w-full rounded border border-slate-300 p-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={texts.find(t => t.id === selectedId)?.fontSize || 16}
                    onChange={(e) => updateText(selectedId, { fontSize: parseInt(e.target.value) || 16 })}
                    className="w-16 rounded border border-slate-300 p-1.5 text-sm"
                    title="Font Size"
                  />
                  <input 
                    type="color" 
                    value={texts.find(t => t.id === selectedId)?.color || '#000000'}
                    onChange={(e) => updateText(selectedId, { color: e.target.value })}
                    className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0"
                    title="Color"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-auto bg-slate-200 p-4 md:p-8 relative custom-scrollbar" ref={containerRef}>
        {!pdfFile ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50">
            <Upload size={48} className="mb-4 text-slate-400" />
            <p className="text-slate-500">Upload file PDF untuk mulai mengedit</p>
          </div>
        ) : (
          <div className="flex justify-center min-w-max">
            {/* The wrapper that holds the PDF and exactly matches its size */}
            <div className="relative shadow-xl" style={{ width: pdfPageDimensions.width, height: pdfPageDimensions.height }}>
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                className="pdf-document"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale} 
                  onRenderSuccess={(page) => {
                    // Update dimensions so the overlay matches perfectly
                    setPdfPageDimensions({ width: page.width, height: page.height });
                  }}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* OVERLAY LAYER */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Texts */}
                {texts.map((text) => (
                  <Rnd
                    key={text.id}
                    className={`pointer-events-auto cursor-move ${selectedId === text.id ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-purple-300'}`}
                    position={{ x: text.x, y: text.y }}
                    onDragStop={(e, d) => updateText(text.id, { x: d.x, y: d.y })}
                    enableResizing={false}
                    bounds="parent"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(text.id); }}
                  >
                    <div 
                      style={{ 
                        fontSize: `${text.fontSize}px`, 
                        color: text.color,
                        lineHeight: 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {text.text}
                    </div>
                  </Rnd>
                ))}

                {/* Images */}
                {images.map((img) => (
                  <Rnd
                    key={img.id}
                    className={`pointer-events-auto ${selectedId === img.id ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-purple-300'}`}
                    position={{ x: img.x, y: img.y }}
                    size={{ width: img.width, height: img.height }}
                    onDragStop={(e, d) => setImages(images.map(i => i.id === img.id ? { ...i, x: d.x, y: d.y } : i))}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      setImages(images.map(i => i.id === img.id ? { 
                        ...i, 
                        width: parseInt(ref.style.width), 
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y
                      } : i))
                    }}
                    bounds="parent"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(img.id); }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.dataUrl} alt="Overlay" className="h-full w-full object-contain pointer-events-none select-none" />
                  </Rnd>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
