// Copies the pdf.js worker that matches the installed pdfjs-dist into /public so the
// browser PDF pipeline (lib/pdf/browser.ts) can load it from our own origin.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const target = join(root, 'public', 'pdf.worker.min.mjs');

if (!existsSync(source)) {
  console.warn('[copy-pdf-worker] pdfjs-dist worker not found; skipping');
} else {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log('[copy-pdf-worker] copied pdf.worker.min.mjs to public/');
}
