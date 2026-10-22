'use client';

import { isLikelyScannedPage, joinMarkdownPages, pdfPagesToMarkdown, type PdfPageText } from '@/lib/pdf/markdown';

export type PdfExtractProgress = {
  phase: 'reading' | 'ocr' | 'done';
  page: number;
  totalPages: number;
  ocrDone: number;
  ocrTotal: number;
};

export type PdfExtractResult = {
  markdown: string;
  totalPages: number;
  processedPages: number;
  ocrPages: number;
  ocrFailedPages: number[];
  method: 'pdf_markdown' | 'pdf_markdown_ocr' | 'pdf_ocr';
};

const MAX_PAGES = 200;
const MAX_OCR_PAGES = 60;
const OCR_CONCURRENCY = 3;

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/build/pdf.min.mjs').then((pdfjs) => {
      // Self-hosted copy of the matching worker (scripts/copy-pdf-worker.mjs).
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** True when almost every sampled pixel is near-white (an empty page). */
function isBlankCanvas(context: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = context.getImageData(0, 0, width, height);
  const step = 4 * 37;
  let dark = 0;
  let samples = 0;
  for (let i = 0; i < data.length; i += step) {
    samples++;
    if (data[i] + data[i + 1] + data[i + 2] < 600) dark++;
  }
  return dark / samples < 0.002;
}

async function renderPageToJpeg(page: import('pdfjs-dist').PDFPageProxy) {
  const base = page.getViewport({ scale: 1 });
  // ~1500px on the long edge keeps small print legible while staying well under request limits.
  const scale = Math.min(2.2, 1500 / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  if (isBlankCanvas(context, canvas.width, canvas.height)) {
    canvas.width = 0;
    canvas.height = 0;
    return null;
  }
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

async function ocrPage(image: string, page: number, signal?: AbortSignal): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/resources/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, page }),
        signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `OCR failed (${res.status})`);
      return String(data.markdown ?? '');
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Extracts a PDF into Markdown entirely in the browser.
 * Text pages are converted locally; scanned pages are rendered and read by free vision models.
 */
export async function extractPdfToMarkdown(
  data: ArrayBuffer,
  options: { onProgress?: (p: PdfExtractProgress) => void; signal?: AbortSignal; allowOcr?: boolean } = {}
): Promise<PdfExtractResult> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data), useSystemFonts: true, isEvalSupported: false }).promise;
  const totalPages = doc.numPages;
  const processedPages = Math.min(totalPages, MAX_PAGES);
  const allowOcr = options.allowOcr !== false;

  const textPages: PdfPageText[] = [];
  const scanned: number[] = [];

  for (let i = 1; i <= processedPages; i++) {
    if (options.signal?.aborted) throw new Error('Cancelled');
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText: PdfPageText = {
      items: content.items.filter((item): item is (typeof content.items)[number] & { str: string; transform: number[] } => 'str' in item),
      styles: content.styles as PdfPageText['styles'],
    };
    textPages.push(pageText);
    if (isLikelyScannedPage(pageText)) scanned.push(i);
    page.cleanup();
    options.onProgress?.({ phase: 'reading', page: i, totalPages: processedPages, ocrDone: 0, ocrTotal: 0 });
  }

  const pageMarkdown = pdfPagesToMarkdown(textPages);
  const ocrTargets = allowOcr ? scanned.slice(0, MAX_OCR_PAGES) : [];
  const ocrFailedPages: number[] = [];
  let ocrDone = 0;

  if (ocrTargets.length) {
    options.onProgress?.({ phase: 'ocr', page: 0, totalPages: processedPages, ocrDone, ocrTotal: ocrTargets.length });
    const queue = [...ocrTargets];
    const worker = async () => {
      while (queue.length) {
        const pageNumber = queue.shift()!;
        try {
          const page = await doc.getPage(pageNumber);
          const image = await renderPageToJpeg(page);
          page.cleanup();
          if (image) pageMarkdown[pageNumber - 1] = await ocrPage(image, pageNumber, options.signal);
        } catch {
          ocrFailedPages.push(pageNumber);
        } finally {
          ocrDone++;
          options.onProgress?.({ phase: 'ocr', page: pageNumber, totalPages: processedPages, ocrDone, ocrTotal: ocrTargets.length });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(OCR_CONCURRENCY, ocrTargets.length) }, worker));
  }

  await doc.destroy();

  let markdown = joinMarkdownPages(pageMarkdown);
  if (totalPages > processedPages) {
    markdown += `\n\n> Only the first ${processedPages} of ${totalPages} pages were imported.`;
  }
  if (scanned.length > ocrTargets.length && allowOcr) {
    markdown += `\n\n> ${scanned.length - ocrTargets.length} more scanned pages were skipped. Split the file to import them.`;
  }

  options.onProgress?.({ phase: 'done', page: processedPages, totalPages: processedPages, ocrDone, ocrTotal: ocrTargets.length });

  const ocrPages = ocrTargets.length - ocrFailedPages.length;
  return {
    markdown,
    totalPages,
    processedPages,
    ocrPages,
    ocrFailedPages: ocrFailedPages.sort((a, b) => a - b),
    method: ocrPages === 0 ? 'pdf_markdown' : ocrPages >= processedPages ? 'pdf_ocr' : 'pdf_markdown_ocr',
  };
}
