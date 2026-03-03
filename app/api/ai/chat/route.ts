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

        const { userQuestion, title, content, fullText, history } = await request.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const contextPrompt = `
        You are a helpful AI study assistant. You are helping a student with a document titled "${title}".
        
        Document Snippet/Summary: ${content}
        Full Text Context: ${fullText.substring(0, 20000)}
        
        Question: ${userQuestion}
        `;

        const result = await chat.sendMessage(contextPrompt);
        const response = result.response.text();

        return NextResponse.json({ response });

    } catch (error: any) {
        console.error('Chat Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
