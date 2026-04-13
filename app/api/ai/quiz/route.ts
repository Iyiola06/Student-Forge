import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MAX_CHARS = 30000;

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'AI Service key is missing' }, { status: 500 });
    }

    const billing = await requireCredits(request, 'ai_quiz');
    if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

    const { sourceText, mode, count } = await request.json();
    if (!sourceText) return NextResponse.json({ error: 'Source text is required' }, { status: 400 });

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        You are an expert academic tutor. Generate a high-quality study quiz based on the provided text.
        
        Quiz Mode: ${mode || 'mcq'}
        Question Count: ${count || 5}
        
        Return a single JSON object with this structure:
        {
          "title": "A catchy title for this quiz",
          "questions": [
            {
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ
              "answer": "The correct answer string",
              "explanation": "Brief pedagogical explanation"
            }
          ]
        }

        Source Text:
        ${sourceText.substring(0, MAX_CHARS)}
        `;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    if ((mode || 'mcq') === 'mcq' && parsedData.questions && Array.isArray(parsedData.questions)) {
      parsedData.questions.forEach((q: any) => {
        if (Array.isArray(q.options)) {
          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
        }
      });
    }

    await finalizeAiUsage({
      supabase: billing.supabase,
      userId: billing.user.id,
      feature: 'ai_quiz',
      source: 'ai_quiz',
      modelName: 'gemini-3-flash-preview',
      inputSize: sourceText.length,
      outputSize: Array.isArray(parsedData.questions) ? parsedData.questions.length : 0,
      metadata: {
        mode: mode || 'mcq',
        count: count || 5,
      },
    });

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Quiz Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
