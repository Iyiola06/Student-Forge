import type { z } from 'zod';

/**
 * OpenRouter client with automatic model fallback.
 *
 * Every request walks FREE_MODEL_CHAIN in order and moves to the next model when one is
 * rate limited, down, times out, returns nothing, or (for JSON calls) returns output that
 * does not parse / validate. The model that finally answered is returned so usage logs
 * record what actually ran.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

type ChainModel = { id: string; vision: boolean };

// Strongest / fastest first. All are free on OpenRouter (verified against /api/v1/models).
export const FREE_MODEL_CHAIN: ChainModel[] = [
  { id: 'minimax/minimax-m3.1-flash:free', vision: true },
  { id: 'thinkingmachines/inkling:free', vision: true },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', vision: false },
  { id: 'nvidia/nemotron-3.5-super-vl:free', vision: true },
  { id: 'dots-studio/dots-3-note-preview:free', vision: true },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', vision: false },
  { id: 'google/gemma-4-31b-it:free', vision: true },
  { id: 'thinkingmachines/inkling-small:free', vision: true },
  { id: 'xingchen-agi/xing4.0-29b-a4b:free', vision: false },
  { id: 'google/gemma-4-26b-a4b-it:free', vision: true },
  // Last resort: OpenRouter picks any free model that supports the request.
  { id: 'openrouter/free', vision: true },
];

export const PRIMARY_MODEL = FREE_MODEL_CHAIN[0].id;

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
};

export type ChatOptions = {
  messages: ChatMessage[];
  /** Ask for a JSON object response (response_format: json_object). */
  json?: boolean;
  /** Only use models that accept images / documents. */
  vision?: boolean;
  maxTokens?: number;
  temperature?: number;
  /** Per-model timeout. */
  timeoutMs?: number;
  /** Stop trying further models after this much total time. */
  deadlineMs?: number;
  /** Extra OpenRouter request fields (e.g. plugins). */
  extra?: Record<string, unknown>;
};

export class AIUnavailableError extends Error {
  attempts: { model: string; error: string }[];
  constructor(attempts: { model: string; error: string }[]) {
    super('All AI models are busy right now. Please try again in a moment.');
    this.name = 'AIUnavailableError';
    this.attempts = attempts;
  }
}

export function isAIConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function getModelChain(vision: boolean): string[] {
  // OPENROUTER_MODELS="a/b:free,c/d:free" overrides the built-in chain.
  const override = process.env.OPENROUTER_MODELS?.split(',').map((m) => m.trim()).filter(Boolean);
  if (override?.length) return override;
  return FREE_MODEL_CHAIN.filter((m) => !vision || m.vision).map((m) => m.id);
}

function headers() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('AI service is not configured (OPENROUTER_API_KEY missing)');
  }
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://student.sulvatech.com',
    'X-Title': "Sulva's Studify",
  };
}

function buildBody(model: string, options: ChatOptions, stream: boolean) {
  return {
    model,
    messages: options.messages,
    stream,
    ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    // Keep reasoning traces out of the content we parse.
    reasoning: { exclude: true },
    ...options.extra,
  };
}

async function describeFailure(res: Response) {
  const body = await res.text().catch(() => '');
  return `HTTP ${res.status}: ${body.slice(0, 300)}`;
}

async function runChain<T>(
  options: ChatOptions,
  attempt: (model: string, signal: AbortSignal) => Promise<T>
): Promise<{ result: T; model: string }> {
  const chain = getModelChain(Boolean(options.vision));
  const timeoutMs = options.timeoutMs ?? 45_000;
  const deadline = Date.now() + (options.deadlineMs ?? 110_000);
  const attempts: { model: string; error: string }[] = [];

  for (const model of chain) {
    if (Date.now() > deadline) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, Math.max(1, deadline - Date.now())));
    try {
      const result = await attempt(model, controller.signal);
      return { result, model };
    } catch (error: any) {
      const message = controller.signal.aborted ? 'timed out' : error?.message || String(error);
      attempts.push({ model, error: message });
      console.warn(`[openrouter] ${model} failed, trying next model: ${message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  console.error('[openrouter] every model failed', attempts);
  throw new AIUnavailableError(attempts);
}

/** Plain chat completion. Returns the text and the model that produced it. */
export async function chatCompletion(options: ChatOptions): Promise<{ text: string; model: string }> {
  return chatCompletionWith(options, (text) => text);
}

/**
 * Chat completion whose output must pass `accept` (throw to reject it and fall back to the
 * next model). Used for JSON so a model that returns broken JSON doesn't fail the request.
 */
async function chatCompletionWith<T>(
  options: ChatOptions,
  accept: (text: string) => T
): Promise<{ text: string; value: T; model: string }> {
  const { result, model } = await runChain(options, async (model, signal) => {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(buildBody(model, options, false)),
      signal,
    });
    if (!res.ok) throw new Error(await describeFailure(res));

    const data = await res.json();
    if (data?.error) throw new Error(data.error.message || 'provider error');
    const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
    if (!text) throw new Error('empty response');
    return { text, value: accept(text) };
  });
  return { ...result, model };
}

/** Pulls the first complete JSON object/array out of model output (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    if (start === -1) throw new Error('no JSON found in response');
    const end = findJsonEnd(cleaned, start);
    if (end === -1) throw new Error('incomplete JSON in response');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function findJsonEnd(text: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** JSON completion. Optionally validates with a zod schema; invalid output falls back to the next model. */
export async function generateJson<T = any>(
  options: ChatOptions & { schema?: z.ZodType<T> }
): Promise<{ data: T; model: string }> {
  const { schema, ...rest } = options;
  const { value, model } = await chatCompletionWith(rest, (text) => {
    const parsed = extractJson(text);
    if (!schema) return parsed as T;
    const validated = schema.safeParse(parsed);
    if (!validated.success) throw new Error(`invalid JSON shape: ${validated.error.message.slice(0, 200)}`);
    return validated.data;
  });
  return { data: value, model };
}

async function* sseDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith('data:')) continue; // SSE comments / keep-alives
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        let parsed: any;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        if (parsed?.error) throw new Error(parsed.error.message || 'provider error');
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}

/** Drops anything before the first `{`/`[` and after its matching close. */
function createJsonTrimmer() {
  let started = false;
  let finished = false;
  let depth = 0;
  let inString = false;
  let escaped = false;
  return (chunk: string) => {
    let out = '';
    for (const ch of chunk) {
      if (finished) break;
      if (!started) {
        if (ch !== '{' && ch !== '[') continue;
        started = true;
      }
      out += ch;
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) finished = true;
      }
    }
    return out;
  };
}

/**
 * Streams a completion as plain text. Falls back to the next model until one produces its
 * first token; after that the stream is committed to that model.
 * With `jsonOnly`, text outside the top-level JSON value is dropped so code fences don't
 * break partial-JSON parsers on the client.
 */
export async function streamCompletion(
  options: ChatOptions & {
    jsonOnly?: boolean;
    onFinish?: (args: { text: string; model: string }) => Promise<void> | void;
  }
): Promise<{ stream: ReadableStream<Uint8Array>; model: string }> {
  const { result, model } = await runChain(
    { ...options, timeoutMs: options.timeoutMs ?? 40_000 },
    async (model, signal) => {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(buildBody(model, options, true)),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(await describeFailure(res));

      const deltas = sseDeltas(res.body);
      const first = await deltas.next();
      if (first.done) throw new Error('empty response');
      return { deltas, first: first.value };
    }
  );

  const encoder = new TextEncoder();
  const trim = options.jsonOnly ? createJsonTrimmer() : (chunk: string) => chunk;
  let pending: string | null = result.first;
  let fullText = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          let chunk: string;
          if (pending !== null) {
            chunk = pending;
            pending = null;
          } else {
            const next = await result.deltas.next();
            if (next.done) break;
            chunk = next.value;
          }
          const piece = trim(chunk);
          if (piece) {
            fullText += piece;
            controller.enqueue(encoder.encode(piece));
            return;
          }
        }
        await options.onFinish?.({ text: fullText, model });
        controller.close();
      } catch (error) {
        console.error(`[openrouter] stream from ${model} failed`, error);
        controller.error(error);
      }
    },
    cancel() {
      result.deltas.return(undefined).catch(() => undefined);
    },
  });

  return { stream, model };
}

/** Accepts Gemini-style ({ role: 'model', parts: [{ text }] }) or { role, content } history. */
export function toChatHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .map((msg: any): ChatMessage | null => {
      const text =
        typeof msg?.content === 'string'
          ? msg.content
          : Array.isArray(msg?.parts)
            ? msg.parts.map((p: any) => p?.text ?? '').join('')
            : '';
      if (!text) return null;
      return { role: msg?.role === 'user' ? 'user' : 'assistant', content: text };
    })
    .filter((m): m is ChatMessage => m !== null);
}

export function imagePart(base64OrDataUrl: string, mimeType = 'image/png'): ContentPart {
  const url = base64OrDataUrl.startsWith('data:') ? base64OrDataUrl : `data:${mimeType};base64,${base64OrDataUrl}`;
  return { type: 'image_url', image_url: { url } };
}

export function pdfPart(base64: string, filename = 'document.pdf'): ContentPart {
  return { type: 'file', file: { filename, file_data: `data:application/pdf;base64,${base64}` } };
}

/** OpenRouter plugin config for PDFs. mistral-ocr handles scanned pages (paid per page); cloudflare-ai is free but text-only. */
export function pdfPlugins() {
  return { plugins: [{ id: 'file-parser', pdf: { engine: process.env.OPENROUTER_PDF_ENGINE || 'mistral-ocr' } }] };
}
