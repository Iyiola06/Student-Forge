/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletion, imagePart, isAIConfigured } from '@/lib/ai/openrouter';
import { isLikelyScannedPage, joinMarkdownPages, OCR_PAGE_PROMPT, pdfPagesToMarkdown, type PdfPageText } from '@/lib/pdf/markdown';

if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) {
  // pdf.js v5 expects DOMMatrix even when only extracting text.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (globalThis as any).DOMMatrix = require('@napi-rs/canvas').DOMMatrix;
  } catch {
    /* text extraction still works without it in most files */
  }
}

/**
 * Server-side PDF -> Markdown (fallback for when the browser could not process the file).
 * Text pages use the layout-aware converter; scanned pages are rendered with @napi-rs/canvas
 * and read by free vision models, within a time budget that fits a serverless function.
 */
export async function extractPdfMarkdownOnServer(
  data: ArrayBuffer,
  options: { maxPages?: number; maxOcrPages?: number; budgetMs?: number } = {}
) {
  const started = Date.now();
  const budgetMs = options.budgetMs ?? 45_000;
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pageCount = Math.min(doc.numPages, options.maxPages ?? 150);
  const pages: PdfPageText[] = [];
  const scanned: number[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text: PdfPageText = { items: content.items.filter((item: any) => 'str' in item) as any, styles: content.styles as any };
    pages.push(text);
    if (isLikelyScannedPage(text)) scanned.push(i);
    page.cleanup();
  }

  const markdownPages = pdfPagesToMarkdown(pages);
  let ocrPages = 0;

  if (scanned.length && isAIConfigured()) {
    for (const pageNumber of scanned.slice(0, options.maxOcrPages ?? 8)) {
      if (Date.now() - started > budgetMs) break;
      try {
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1400 / Math.max(base.width, base.height)) });
        const factory = (doc as any).canvasFactory;
        const { canvas, context } = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        const jpeg: Buffer = canvas.toBuffer('image/jpeg', 82);
        factory.destroy({ canvas, context });
        page.cleanup();

        const { text } = await chatCompletion({
          vision: true,
          temperature: 0,
          maxTokens: 4000,
          timeoutMs: 30_000,
          deadlineMs: Math.max(5_000, budgetMs - (Date.now() - started)),
          messages: [{ role: 'user', content: [{ type: 'text', text: OCR_PAGE_PROMPT }, imagePart(jpeg.toString('base64'), 'image/jpeg')] }],
        });
        markdownPages[pageNumber - 1] = text.replace(/^\s*```(?:markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '');
        ocrPages++;
      } catch (error) {
        console.warn(`[pdf] OCR failed for page ${pageNumber}`, error);
      }
    }
  }

  await doc.destroy();
  return {
    markdown: joinMarkdownPages(markdownPages),
    totalPages: doc.numPages,
    scannedPages: scanned.length,
    ocrPages,
    method: ocrPages ? 'pdf_markdown_ocr' : 'pdf_markdown',
  };
}
