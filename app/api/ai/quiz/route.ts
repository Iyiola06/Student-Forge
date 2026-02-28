import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MAX_CHARS = 30000;

export async function POST(request: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: 'AI Service key is missing' }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { sourceText, mode, count } = await request.json();
        if (!sourceText) return NextResponse.json({ error: 'Source text is required' }, { status: 400 });

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
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
        return NextResponse.json(JSON.parse(result.response.text()));

    } catch (error: any) {
        console.error('Quiz Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
