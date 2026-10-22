import { NextRequest, NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/openrouter';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';

export async function POST(req: NextRequest) {
    try {
        const billing = await requireCredits(req, 'ai_dashboard');
        if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

        const { action, acronym, context, sourceText } = await req.json();

        if (action === 'decode') {
            const prompt = `Expand the following abbreviation or acronym: "${acronym}". 
      Context (if any): "${context}". 
      Provide the full form and a very brief definition (max 15 words) in JSON format: 
      { "fullForm": "...", "definition": "..." }`;

            const { data: payload, model } = await generateJson({
                messages: [{ role: 'user', content: prompt }],
                json: true,
            });
            await finalizeAiUsage({
                supabase: billing.supabase,
                userId: billing.user.id,
                feature: 'ai_dashboard',
                source: 'ai_dashboard',
                modelName: model,
                inputSize: `${acronym || ''}${context || ''}`.length,
                outputSize: JSON.stringify(payload).length,
                metadata: { action },
            });
            return NextResponse.json(payload);
        }

        if (action === 'insights') {
            const prompt = `Based on the following study material, provide:
      1. 3-5 shortest possible key points (max 3 words each).
      2. 3 likely exam topics (max 2 words each).
      Material: ${String(sourceText || '').substring(0, 4000)}
      Return in JSON format: 
      { "keyPoints": ["...", "..."], "hotList": ["...", "..."] }`;

            const { data: payload, model } = await generateJson({
                messages: [{ role: 'user', content: prompt }],
                json: true,
            });
            await finalizeAiUsage({
                supabase: billing.supabase,
                userId: billing.user.id,
                feature: 'ai_dashboard',
                source: 'ai_dashboard',
                modelName: model,
                inputSize: sourceText?.length ?? 0,
                outputSize: JSON.stringify(payload).length,
                metadata: { action },
            });
            return NextResponse.json(payload);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Dashboard AI Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
