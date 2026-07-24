import { PDFDocument, rgb } from 'pdf-lib';

export type TextAnnotation = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export type ImageAnnotation = {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Convert hex color to rgb for pdf-lib
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const exportPdf = async (
  originalPdfUrl: string,
  texts: TextAnnotation[],
  images: ImageAnnotation[],
  pdfScale: number // Ratio of rendered canvas size vs actual PDF page size
) => {
  // Load the original PDF
  const existingPdfBytes = await fetch(originalPdfUrl).then((res) =>
    res.arrayBuffer()
  );
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // We assume we are editing the first page for this simple example.
  // A full implementation would need to track which page an annotation belongs to.
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();

  // Add texts
  for (const text of texts) {
    const color = hexToRgb(text.color);
    
    // pdf-lib's origin (0,0) is at the bottom-left corner.
    // Our UI's origin (0,0) is at the top-left corner.
    // We need to convert the Y coordinate.
    const pdfX = text.x / pdfScale;
    const pdfY = height - (text.y / pdfScale) - (text.fontSize / pdfScale);

    firstPage.drawText(text.text, {
      x: pdfX,
      y: pdfY,
      size: text.fontSize / pdfScale,
      color: rgb(color.r, color.g, color.b),
    });
  }

  // Add images
  for (const img of images) {
    // Determine image type and embed
    let embeddedImage;
    if (img.dataUrl.includes('image/png')) {
      embeddedImage = await pdfDoc.embedPng(img.dataUrl);
    } else if (img.dataUrl.includes('image/jpeg')) {
      embeddedImage = await pdfDoc.embedJpg(img.dataUrl);
    } else {
      continue; // Skip unsupported image formats
    }

    const pdfX = img.x / pdfScale;
    const pdfHeight = img.height / pdfScale;
    const pdfY = height - (img.y / pdfScale) - pdfHeight;

    firstPage.drawImage(embeddedImage, {
      x: pdfX,
      y: pdfY,
      width: img.width / pdfScale,
      height: pdfHeight,
    });
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  // Trigger the browser to download the PDF document
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `edited_document_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
