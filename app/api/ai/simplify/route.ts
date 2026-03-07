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

Please output your response as valid JSON using this EXACT structure:
{
  "result": "The markdown string of your explanation here.",
  "youtube_topics": ["Specific search query 1", "Specific search query 2", "Specific search query 3"]
}

The "youtube_topics" should be 2 to 3 very specific search queries that a user could type into YouTube to find a video explaining the core concepts you just summarized. Keep the queries concise (under 5 words).
Do NOT wrap the JSON in markdown code blocks (\`\`\`json). Return exactly the raw stringified JSON object.

Text to simplify:
"""
${trimmedContent}
"""`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text().trim();

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''));
        } catch (e) {
            // Fallback in case the model failed to output valid JSON
            console.error('Failed to parse Gemini output as JSON', responseText);
            parsedOutput = {
                result: responseText,
                youtube_topics: []
            };
        }

        return NextResponse.json(parsedOutput);

    } catch (error: any) {
        console.error('Simplify Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
