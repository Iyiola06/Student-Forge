# Sulva's Studify

## AI setup (OpenRouter)

All AI features run through [OpenRouter](https://openrouter.ai) using free models, with automatic fallback
across 10 models (see `lib/ai/openrouter.ts`). If a model is rate limited, down, slow, or returns bad JSON,
the next one is tried.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | Key from https://openrouter.ai/keys |
| `OPENROUTER_MODELS` | no | Comma-separated model IDs to override the built-in fallback chain |
| `OPENROUTER_PDF_ENGINE` | no | PDF engine for scanned PDFs: `mistral-ocr` (default, paid per page) or `cloudflare-ai` (free, text-based PDFs only) |
