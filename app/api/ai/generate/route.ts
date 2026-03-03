import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MAX_CHARS = 25000; // Rough safety limit to prevent token overflows

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
        const { content, type, difficulty, count } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Validate content is real study material, not an error message
        const BLOCKED_PHRASES = [
            'text extraction is currently only supported',
            'failed to parse', 'could not extract',
            'not currently supported for text extraction'
        ];
        const lowerContent = content.toLowerCase();
        if (content.trim().length < 50) {
            return NextResponse.json(
                { error: 'Content is too short to generate meaningful questions. Please provide more study material (at least a paragraph).' },
                { status: 400 }
            );
        }
        if (BLOCKED_PHRASES.some((p: string) => lowerContent.includes(p))) {
            return NextResponse.json(
                { error: 'The stored content for this resource appears to be an error message, not study material. Please re-upload the file or paste the text manually.' },
                { status: 400 }
            );
        }

        if (!type) {
            return NextResponse.json({ error: 'Generation type is required' }, { status: 400 });
        }

        // Trim content if it's too long
        const trimmedContent = content.length > MAX_CHARS
            ? content.substring(0, MAX_CHARS) + '\n\n[CONTENT TRUNCATED FOR LENGTH LIMITS]'
            : content;

        // Initialize the model with JSON enforcement
        // We use gemini-2.5-flash as the new standard to prevent 404 errors from deprecated 1.5 endpoints.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        let systemInstruction = "";

        // Select the appropriate prompt template based on the requested type
        switch (type) {
            case 'mcq':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 5} multiple-choice questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
        
You must return a JSON array of objects adhering exactly to this structure:
[{
  "question": "The question stem",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The exact string from options that is correct",
  "explanation": "Why this answer is correct"
}]`;
                break;

            case 'fill_in_gap':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 5} fill-in-the-gap questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
        
You must return a JSON array of objects adhering exactly to this structure:
[{
  "sentence": "A factual sentence with a key term replaced by '___'. Example: The ___ is the powerhouse of the cell.",
  "answer": "The exact missing word(s)",
  "hint": "A short contextual hint to help the student"
}]`;
                break;

            case 'theory':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 3} theoretical or open-ended questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
        
You must return a JSON array of objects adhering exactly to this structure:
[{
  "question": "The open-ended question prompt",
  "model_answer": "A comprehensive ideal answer paragraph",
  "key_points": ["Key concept 1 that should be mentioned", "Key concept 2 that should be mentioned"]
}]`;
                break;

            case 'flashcards':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 10} study flashcards from the most important concepts in the provided text.
        
You must return a JSON array of objects adhering exactly to this structure:
[{
  "front": "The term, concept name, or question to display on the front",
  "back": "The concise definition or answer to display on the back"
}]`;
                break;

            case 'exam_snapshot':
                systemInstruction = `You are an expert examiner preparing a student for a final test on the provided text. Extract the most critical information into an Exam Snapshot cheat sheet.
        
You must return a single JSON object adhering exactly to this structure:
{
  "abbreviations": [
    { "short": "Abbreviation/Acronym", "full": "Full terminology" }
  ],
  "key_points": [
    { "point": "A concise critical fact", "tag": "Definition|Formula|Date|Concept|Person", "color": "blue|green|red|purple|orange" }
  ],
  "hot_list": [
    { "question": "A likely exam question", "difficulty": "Easy|Medium|Hard", "rationale": "Why examiners love this topic" }
  ]
}`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
        }

        const prompt = `System Instructions:
${systemInstruction}

Target Source Text:
${trimmedContent}`;

        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        try {
            // Because we set responseMimeType to application/json, 
            // the responseText should be raw, parseable JSON.
            const parsedData = JSON.parse(responseText);
            return NextResponse.json({ success: true, data: parsedData });
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON response:', responseText);
            return NextResponse.json(
                { error: 'AI returned malformed data', rawResult: responseText },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Gemini API Error:', error);

        // Handle specific quotas / auth errors if possible
        const errorMessage = error?.message || 'Failed to generate content';
        const status = errorMessage.includes('429') || errorMessage.includes('quota') ? 429 : 500;

        return NextResponse.json(
            { error: errorMessage },
            { status }
        );
    }
}
