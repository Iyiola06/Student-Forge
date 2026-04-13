import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
  try {
    if (!apiKey) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

    const billing = await requireCredits(request, 'ai_blueprint');
    if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

    const { sourceText } = await request.json();
    if (!sourceText) return NextResponse.json({ error: 'Source text required' }, { status: 400 });

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        As a Master Academic Strategist, analyze the following text and generate a structured "Study Blueprint".
        The blueprint should break the content into logical, manageable chapters.
        
        Return exactly this JSON structure:
        {
          "title": "Document Title",
          "overallSummary": "A concise overview of the entire subject",
          "chapters": [
            {
              "title": "Chapter Heading",
              "summary": "What this section covers",
              "keyPoints": ["Bullet point 1", "Bullet point 2"]
            }
          ],
          "estimatedStudyTimeMinutes": 45
        }

        Text:
        ${sourceText.substring(0, 30000)}
        `;

    const result = await model.generateContent(prompt);
    const payload = JSON.parse(result.response.text());

    await finalizeAiUsage({
      supabase: billing.supabase,
      userId: billing.user.id,
      feature: 'ai_blueprint',
      source: 'ai_blueprint',
      modelName: 'gemini-3-flash-preview',
      inputSize: sourceText.length,
      outputSize: JSON.stringify(payload).length,
      metadata: {
        chapterCount: Array.isArray(payload.chapters) ? payload.chapters.length : 0,
      },
    });

    return NextResponse.json(payload);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
