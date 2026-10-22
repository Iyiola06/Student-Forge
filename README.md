# Sulva's Studify

## AI setup (OpenRouter)

All AI features run through [OpenRouter](https://openrouter.ai) using free models, with automatic fallback
across 10 models (see `lib/ai/openrouter.ts`). If a model is rate limited, down, slow, or returns bad JSON,
the next one is tried.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | Key from https://openrouter.ai/keys |
| `OPENROUTER_MODELS` | no | Comma-separated model IDs to override the built-in fallback chain |

Every model used is free. PDFs are converted to Markdown in the student's browser (`lib/pdf`): text pages
are rebuilt from the PDF layout (headings, lists, paragraphs, no headers/footers) and scanned pages are
rendered and read by the free vision models through `/api/resources/ocr`. Nothing is sent to a paid OCR service.
