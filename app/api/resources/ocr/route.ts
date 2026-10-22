import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import { AIUnavailableError, chatCompletion, imagePart, isAIConfigured } from '@/lib/ai/openrouter';
import { OCR_PAGE_PROMPT } from '@/lib/pdf/markdown';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PAGES_PER_WINDOW = 150;
const usage = new Map<string, { count: number; start: number }>();

function allow(userId: string) {
  const now = Date.now();
  const entry = usage.get(userId);
  if (!entry || now - entry.start > WINDOW_MS) {
    usage.set(userId, { count: 1, start: now });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PAGES_PER_WINDOW;
}

/** Reads one rendered page image (scanned PDF page or photo) into Markdown using free vision models. */
export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 });

    const { user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!allow(user.id)) {
      return NextResponse.json({ error: 'Too many pages at once. Please wait a few minutes and retry.' }, { status: 429 });
    }

    const { image } = await request.json();
    if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
      return NextResponse.json({ error: 'A base64 image data URL is required' }, { status: 400 });
    }
    if (image.length * 0.75 > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Page image is too large' }, { status: 413 });
    }

    const { text, model } = await chatCompletion({
      vision: true,
      temperature: 0,
      maxTokens: 4000,
      timeoutMs: 40_000,
      deadlineMs: 55_000,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: OCR_PAGE_PROMPT }, imagePart(image)],
        },
      ],
    });

    const markdown = text.replace(/^\s*```(?:markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return NextResponse.json({ markdown, model });
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('OCR route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'OCR failed' }, { status: 500 });
  }
}
