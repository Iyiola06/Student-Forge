import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MAX_CHARS = 25000;

export async function POST(request: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, level, format, focus } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const lowerContent = content.toLowerCase();
        if (content.trim().length < 50) {
            return NextResponse.json(
                { error: 'Content is too short to simplify. Please provide more study material.' },
                { status: 400 }
            );
        }

        const trimmedContent = content.length > MAX_CHARS
            ? content.substring(0, MAX_CHARS) + '\n\n[CONTENT TRUNCATED FOR LENGTH LIMITS]'
            : content;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const levelInstruction = level === 'child' ? "Explain this like I am 5 years old, using very simple words and analogies."
            : level === 'beginner' ? "Explain this simply, for a beginner or high school student who is new to the topic."
                : level === 'expert' ? "Provide a high-level summary suitable for an expert or university degree level."
                    : "Explain this clearly and concisely for a general audience.";

        const formatInstruction = format === 'bullets' ? "Provide the output entirely as bullet points."
            : format === 'analogy' ? "Focus heavily on real-world analogies to make the concept stick."
                : "Provide a well-structured paragraph-based explanation with a short summary at the start.";

        const focusInstruction = focus ? `Focus specifically on explaining the aspects related to: ${focus}.` : "";

        const systemInstruction = `You are an expert tutor. Your job is to simplify and explain the following text.
${levelInstruction}
${formatInstruction}
${focusInstruction}

Please output ONLY the explanation in markdown format. Do not include any meta-commentary like "Here is the simplified text:".

Text to simplify:
"""
${trimmedContent}
"""`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text().trim();

        return NextResponse.json({ result: responseText });

    } catch (error: any) {
        console.error('Simplify Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
