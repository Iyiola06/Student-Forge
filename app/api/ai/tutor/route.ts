import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const TUTOR_SYSTEM_INSTRUCTION = `You are Sulva's Studify AI Tutor, a brilliant, patient, and encouraging study companion for students.

Your core behaviors:
- Explain concepts clearly using analogies and examples
- Break complex topics into digestible steps
- Ask guiding questions to help students think critically
- Celebrate progress and encourage persistence
- Use markdown formatting for better readability (bold, lists, code blocks for formulas)
- Keep responses focused and concise (aim for 2-4 paragraphs unless more detail is requested)
- If you don't know something, say so honestly
- When appropriate, suggest related topics the student should explore

You support subjects like Biology, Chemistry, Physics, Mathematics, English, History, Economics, and more.
Always be warm, supportive, and academically rigorous.`;

export async function POST(request: Request) {
  try {
    if (!apiKey) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

    const billing = await requireCredits(request, 'ai_tutor');
    if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

    const { message, history, context } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
    });

    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    let fullMessage = message;
    if (context) {
      fullMessage = `[The student has the following study material loaded as context]\n\n${String(context).substring(0, 15000)}\n\n---\n\nStudent's question: ${message}`;
    }

    const result = await chat.sendMessage(fullMessage);
    const reply = result.response.text();

    await finalizeAiUsage({
      supabase: billing.supabase,
      userId: billing.user.id,
      feature: 'ai_tutor',
      source: 'ai_tutor',
      modelName: 'gemini-3-flash-preview',
      inputSize: fullMessage.length,
      outputSize: reply.length,
      metadata: {
        historyCount: Array.isArray(history) ? history.length : 0,
        hasContext: Boolean(context),
      },
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Tutor Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 });
  }
}
