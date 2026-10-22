import { NextResponse } from 'next/server';
import { chatCompletion, isAIConfigured, toChatHistory } from '@/lib/ai/openrouter';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';

export async function POST(request: Request) {
    try {
        if (!isAIConfigured()) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

        const billing = await requireCredits(request, 'ai_chat');
        if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

        const { userQuestion, title, content, fullText, history } = await request.json();

        const contextPrompt = `
        You are a helpful AI study assistant. You are helping a student with a document titled "${title}".
        
        Document Snippet/Summary: ${content}
        Full Text Context: ${String(fullText || '').substring(0, 20000)}
        
        Question: ${userQuestion}
        `;

        const { text: response, model } = await chatCompletion({
            messages: [...toChatHistory(history), { role: 'user', content: contextPrompt }],
            maxTokens: 1000,
        });

        await finalizeAiUsage({
            supabase: billing.supabase,
            userId: billing.user.id,
            feature: 'ai_chat',
            source: 'ai_chat',
            modelName: model,
            inputSize: contextPrompt.length,
            outputSize: response.length,
            metadata: {
                title,
                historyCount: Array.isArray(history) ? history.length : 0,
            },
        });

        return NextResponse.json({ response });

    } catch (error: any) {
        console.error('Chat Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
