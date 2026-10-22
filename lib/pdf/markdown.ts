/**
 * Layout-aware PDF text -> Markdown.
 *
 * Works on pdf.js `getTextContent()` items, so it runs the same in the browser and on the server.
 * It rebuilds lines from item positions, detects headings from font size (relative to the
 * document's body size) and bold fonts, recognises bullets and numbered lists, merges wrapped
 * lines into paragraphs, repairs hyphenation and strips repeated headers/footers and page numbers.
 */

export type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  fontName?: string;
  hasEOL?: boolean;
};

export type PdfPageText = {
  items: PdfTextItem[];
  /** fontName -> fontFamily, from textContent.styles; used to spot bold faces. */
  styles?: Record<string, { fontFamily?: string }>;
};

type Line = {
  text: string;
  size: number;
  x: number;
  y: number;
  bold: boolean;
};

const BULLET_RE = /^[•◦▪●○■□‣⁃∙·➢✓✔*\-–—]\s*/;
const ORDERED_RE = /^(\(?(\d{1,3}|[a-zA-Z]|[ivxlcdm]{1,5})[.)])\s+/;
const PAGE_NUMBER_RE = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i;

function itemSize(item: PdfTextItem) {
  const [a, b, c, d] = item.transform;
  return Math.max(Math.hypot(c ?? 0, d ?? 0), Math.hypot(a ?? 0, b ?? 0), item.height ?? 0) || 10;
}

function isBoldFont(item: PdfTextItem, styles?: PdfPageText['styles']) {
  const name = `${item.fontName ?? ''} ${styles?.[item.fontName ?? '']?.fontFamily ?? ''}`;
  return /bold|black|heavy|semibold|demi/i.test(name);
}

function buildLines(page: PdfPageText): Line[] {
  // Drop rotated text (margin stamps, watermarks): it breaks line reconstruction.
  const items = page.items.filter((item) => {
    if (typeof item.str !== 'string' || item.str.length === 0) return false;
    const [a, b] = item.transform;
    return Math.abs(b ?? 0) <= Math.abs(a ?? 0) * 0.1;
  });
  if (!items.length) return [];

  const sorted = [...items].sort((p, q) => {
    const dy = q.transform[5] - p.transform[5];
    if (Math.abs(dy) > Math.min(itemSize(p), itemSize(q)) * 0.45) return dy;
    return p.transform[4] - q.transform[4];
  });

  const lines: Array<{ parts: PdfTextItem[]; y: number; size: number }> = [];
  for (const item of sorted) {
    const y = item.transform[5];
    const size = itemSize(item);
    const current = lines[lines.length - 1];
    if (current && Math.abs(current.y - y) <= Math.max(current.size, size) * 0.45) {
      current.parts.push(item);
      current.size = Math.max(current.size, size);
    } else {
      lines.push({ parts: [item], y, size });
    }
  }

  return lines
    .map(({ parts, y }) => {
      parts.sort((p, q) => p.transform[4] - q.transform[4]);
      let text = '';
      let lastEnd: number | null = null;
      let boldChars = 0;
      let totalChars = 0;
      const sizes: number[] = [];
      for (const part of parts) {
        const x = part.transform[4];
        const size = itemSize(part);
        if (lastEnd !== null && x - lastEnd > size * 0.18 && !text.endsWith(' ') && !part.str.startsWith(' ')) {
          text += ' ';
        }
        text += part.str;
        lastEnd = x + (part.width ?? part.str.length * size * 0.5);
        const len = part.str.trim().length;
        totalChars += len;
        if (isBoldFont(part, page.styles)) boldChars += len;
        if (len) sizes.push(size);
      }
      sizes.sort((p, q) => p - q);
      return {
        text: text.replace(/\s+/g, ' ').trim(),
        size: sizes[Math.floor(sizes.length / 2)] ?? 10,
        x: parts[0].transform[4],
        y,
        bold: totalChars > 0 && boldChars / totalChars > 0.6,
      };
    })
    .filter((line) => line.text.length > 0);
}

function normaliseForRepeat(text: string) {
  return text.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
}

/** Characters of real text on a page; below a threshold the page is probably a scan. */
export function pageTextLength(page: PdfPageText) {
  return page.items.reduce((sum, item) => sum + (item.str?.replace(/\s/g, '').length ?? 0), 0);
}

export function isLikelyScannedPage(page: PdfPageText) {
  return pageTextLength(page) < 40;
}

/** Converts pages to Markdown. Returns one Markdown string per input page (empty for blank pages). */
export function pdfPagesToMarkdown(pages: PdfPageText[]): string[] {
  const pageLines = pages.map(buildLines);

  // Body font size = the size carrying the most characters.
  const weight = new Map<number, number>();
  for (const lines of pageLines) {
    for (const line of lines) {
      const key = Math.round(line.size * 2) / 2;
      weight.set(key, (weight.get(key) ?? 0) + line.text.length);
    }
  }
  const bodySize = [...weight.entries()].sort((p, q) => q[1] - p[1])[0]?.[0] ?? 10;

  // Repeated headers/footers. Only the outermost line, or small print right next to it, qualifies;
  // anything at body size or larger (headings, list items) is never stripped as a running header.
  const isEdgeCandidate = (lines: Line[], index: number) => {
    const last = lines.length - 1;
    if (index === 0 || index === last) return lines[index].size <= bodySize * 1.05;
    if (index === 1 || index === last - 1) return lines[index].size < bodySize * 0.97;
    return false;
  };

  const repeated = new Set<string>();
  if (pages.length >= 3) {
    const counts = new Map<string, number>();
    for (const lines of pageLines) {
      const keys = new Set<string>();
      lines.forEach((line, index) => {
        if (isEdgeCandidate(lines, index)) keys.add(normaliseForRepeat(line.text));
      });
      for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of counts) {
      if (count >= Math.max(3, pages.length * 0.4) && key.length < 120) repeated.add(key);
    }
  }

  return pageLines.map((lines) => {
    const kept = lines.filter((line, index) => {
      if (!isEdgeCandidate(lines, index)) return true;
      if (repeated.has(normaliseForRepeat(line.text))) return false;
      if (PAGE_NUMBER_RE.test(line.text)) return false;
      return true;
    });

    const blocks: string[] = [];
    let paragraph = '';
    let prev: Line | null = null;
    let demotedSize: number | null = null;

    const flush = () => {
      if (paragraph.trim()) blocks.push(paragraph.trim());
      paragraph = '';
    };

    for (const line of kept) {
      const ratio = line.size / bodySize;
      const words = line.text.split(/\s+/).length;
      const short = line.text.length <= 90 && words <= 14;
      const endsLikeSentence = /[.,;:]$/.test(line.text);
      let heading = 0;
      const dotted = line.text.match(/^(\d+(?:\.\d+){1,3})\.?\s+[A-Z(]/);
      const letters = line.text.replace(/[^A-Za-z]/g, '');
      const allCaps = letters.length >= 6 && letters === letters.toUpperCase() && words >= 2 && words <= 9;
      if (short && ratio >= 1.6) heading = 1;
      else if (short && ratio >= 1.3) heading = 2;
      else if (short && (ratio >= 1.12 || (line.bold && line.text.length <= 80 && !endsLikeSentence && /[A-Za-z]/.test(line.text)))) heading = 3;
      else if (dotted && words <= 10 && !endsLikeSentence) heading = Math.min(5, dotted[1].split('.').length + 2);
      else if (short && !endsLikeSentence && /^(chapter|unit|lesson|week|module|topic|section|part)\s+[\divxlc]+\b/i.test(line.text)) heading = 2;
      else if (short && allCaps && !endsLikeSentence) heading = 3;

      // Continuation of an emphasised paragraph that was demoted from a heading.
      if (heading && demotedSize !== null && Math.abs(demotedSize - line.size) < 0.5 && prev && prev.y - line.y < line.size * 1.8) {
        paragraph += ` ${line.text}`;
        prev = line;
        continue;
      }
      demotedSize = null;

      if (heading) {
        // Join a heading that wrapped onto two lines.
        const lastBlock = blocks[blocks.length - 1];
        const prefix = '#'.repeat(heading) + ' ';
        if (!paragraph && prev && lastBlock?.startsWith(prefix) && Math.abs(prev.size - line.size) < 0.5 && prev.y - line.y < line.size * 1.8) {
          const joined = `${lastBlock.slice(prefix.length)} ${line.text}`;
          // Two "heading" lines that read as a sentence are really an emphasised paragraph.
          if (joined.length > 110 || /[.;:]$/.test(joined)) {
            blocks.pop();
            paragraph = joined;
            demotedSize = line.size;
          } else {
            blocks[blocks.length - 1] = prefix + joined;
          }
        } else {
          flush();
          blocks.push(prefix + line.text.replace(/^#+\s*/, ''));
        }
        prev = line;
        continue;
      }

      const bullet = line.text.match(BULLET_RE);
      const ordered = line.text.match(ORDERED_RE);
      if ((bullet && line.text.length > bullet[0].length) || ordered) {
        flush();
        paragraph = bullet ? `- ${line.text.slice(bullet[0].length)}` : `${ordered![1]} ${line.text.slice(ordered![0].length)}`;
        prev = line;
        continue;
      }

      const gap = prev ? prev.y - line.y : 0;
      const newBlock =
        !paragraph ||
        !prev ||
        gap > Math.max(prev.size, line.size) * 1.75 ||
        gap < 0 ||
        Math.abs(line.size - prev.size) > 1.2;

      if (newBlock && !(paragraph.startsWith('- ') && gap > 0 && gap <= line.size * 1.75 && line.x > (prev?.x ?? 0) - 2)) {
        flush();
        paragraph = line.text;
      } else if (/[A-Za-z]-$/.test(paragraph) && /^[a-z]/.test(line.text)) {
        // "computa-" + "tion" -> "computation"; keep the hyphen for compounds like "English-to-German".
        const lastWord = paragraph.slice(paragraph.lastIndexOf(' ') + 1);
        const keepHyphen = /^[A-Z]/.test(lastWord) || /-/.test(lastWord.slice(0, -1)) || /^[a-z]+-/.test(line.text);
        paragraph = (keepHyphen ? paragraph : paragraph.slice(0, -1)) + line.text;
      } else {
        paragraph += ` ${line.text}`;
      }
      prev = line;
    }
    flush();

    const isListItem = (block: string) => /^(- |\(?(\d{1,3}|[a-zA-Z]|[ivxlcdm]{1,5})[.)] )/.test(block);
    return blocks.reduce((out, block, index) => {
      if (index === 0) return block;
      return out + (isListItem(block) && isListItem(blocks[index - 1]) ? '\n' : '\n\n') + block;
    }, '');
  });
}

/** Joins page Markdown into one document and tidies spacing. */
export function joinMarkdownPages(pages: string[]) {
  let doc = pages
    .map((page) => page.trim())
    .filter(Boolean)
    .join('\n\n');
  // If sections only ever reached level 3, promote them so the outline starts at ##.
  if (!/^## /m.test(doc) && /^### /m.test(doc)) doc = doc.replace(/^#(#{2,5}) /gm, '$1 ');
  return doc
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const OCR_PAGE_PROMPT =
  'You are transcribing a page of a student\'s study material. Transcribe ALL readable text exactly, in reading order, as clean Markdown: ' +
  'use #/##/### for headings, "-" for bullet lists, "1." for numbered lists, **bold** where the page emphasises text, and Markdown tables for tables. ' +
  'Write equations in plain text or LaTeX between $...$. For diagrams, add one short line in italics describing them, e.g. *Diagram: labelled plant cell.* ' +
  'Do not add commentary, summaries or anything that is not on the page. If the page is blank, reply with an empty string.';
