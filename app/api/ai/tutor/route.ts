import { NextResponse } from 'next/server';
import { chatCompletion, isAIConfigured, toChatHistory } from '@/lib/ai/openrouter';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';
import { recordStudyActivity } from '@/lib/progress/server';

const TUTOR_SYSTEM_INSTRUCTION = `You are Sulva’s Studify AI Tutor, a brilliant, patient, and encouraging study companion for students.

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
Always be warm, supportive, and academically rigorous.

Teaching principles you follow:
- Prefer active recall over passive reading: after explaining, ask one short check question.
- Build on what the student already knows and connect new ideas to familiar ones.
- Correct misconceptions gently but clearly, saying exactly what was wrong and why.
- When study material is provided, ground your answers in it and say when you go beyond it.`;

const MODE_INSTRUCTIONS: Record<string, string> = {
  explain: '',
  socratic: `MODE: Socratic guide.
- Do NOT give the final answer straight away. Ask ONE guiding question at a time that moves the student one step closer.
- When they answer, acknowledge what is right, nudge what is off, and ask the next question.
- Give a small hint if they are stuck twice. Reveal the full answer only if they ask for it or after several attempts, then summarise the reasoning in 2-3 bullet points.
- Keep each turn short (under 120 words).`,
  quiz: `MODE: Quiz master.
- Ask exactly ONE question per turn, then stop and wait. Mix formats: multiple choice (A-D), short answer and "explain why".
- If a topic or study material is given, take questions from it; start easy and get harder as they answer correctly.
- When the student answers: say Correct/Incorrect first, give the right answer and a one-paragraph explanation, then ask the next question.
- Every 5 questions, give a mini scorecard (e.g. "4/5") and name the concept they should revise.
- Never reveal the answer in the same message as the question.`,
};

export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

    const billing = await requireCredits(request, 'ai_tutor');
    if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

    const { message, history, context, mode } = await request.json();
    const modeInstruction = MODE_INSTRUCTIONS[typeof mode === 'string' ? mode : 'explain'] ?? '';

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let fullMessage = message;
    if (context) {
      fullMessage = `[The student has the following study material loaded as context]\n\n${String(context).substring(0, 15000)}\n\n---\n\nStudent's question: ${message}`;
    }

    const { text: reply, model } = await chatCompletion({
      messages: [
        { role: 'system', content: modeInstruction ? `${TUTOR_SYSTEM_INSTRUCTION}\n\n${modeInstruction}` : TUTOR_SYSTEM_INSTRUCTION },
        ...toChatHistory(history),
        { role: 'user', content: fullMessage },
      ],
      maxTokens: 2048,
      temperature: 0.7,
    });

    await finalizeAiUsage({
      supabase: billing.supabase,
      userId: billing.user.id,
      feature: 'ai_tutor',
      source: 'ai_tutor',
      modelName: model,
      inputSize: fullMessage.length,
      outputSize: reply.length,
      metadata: {
        historyCount: Array.isArray(history) ? history.length : 0,
        hasContext: Boolean(context),
        mode: typeof mode === 'string' ? mode : 'explain',
      },
    });
    await recordStudyActivity(billing.supabase, billing.user.id);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Tutor Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 });
  }
}
