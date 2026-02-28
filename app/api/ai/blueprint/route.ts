import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
    try {
        if (!apiKey) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { sourceText } = await request.json();
        if (!sourceText) return NextResponse.json({ error: 'Source text required' }, { status: 400 });

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
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
        return NextResponse.json(JSON.parse(result.response.text()));

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
