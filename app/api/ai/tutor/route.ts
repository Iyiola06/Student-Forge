import { after, NextResponse } from 'next/server';
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

    const { message, history, context, mode, resourceId } = await request.json();
    const modeInstruction = MODE_INSTRUCTIONS[typeof mode === 'string' ? mode : 'explain'] ?? '';

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = billing.supabase;
    const userId = billing.user.id;

    // Study material: loaded on the server from the student's own library.
    let material: string | null = context ? String(context) : null;
    if (!material && typeof resourceId === 'string' && resourceId) {
      const { data: resource } = await supabase.from('resources').select('title,content').eq('id', resourceId).eq('user_id', userId).maybeSingle();
      if (resource?.content) material = `Title: ${resource.title}\n\n${resource.content}`;
    }

    // What the tutor remembers about this student, plus where they are weakest right now.
    const [{ data: memory }, { data: weakTopics }] = await Promise.all([
      supabase.from('learner_memory').select('notes').eq('user_id', userId).maybeSingle(),
      supabase.from('topic_mastery').select('topic_label,mastery_score').eq('user_id', userId).order('mastery_score', { ascending: true }).limit(3),
    ]);
    const memoryNotes = String(memory?.notes || '').trim();
    const weakList = (weakTopics ?? []).filter((t: any) => t.mastery_score < 70).map((t: any) => `${t.topic_label} (${t.mastery_score}%)`);
    const learnerContext = [
      memoryNotes ? `What you remember about this student from earlier sessions:\n${memoryNotes}` : '',
      weakList.length ? `Their weakest topics right now: ${weakList.join(', ')}. Weave these in when relevant.` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    let fullMessage = message;
    if (material) {
      fullMessage = `[The student has the following study material loaded as context]\n\n${material.substring(0, 15000)}\n\n---\n\nStudent's question: ${message}`;
    }

    const { text: reply, model } = await chatCompletion({
      messages: [
        { role: 'system', content: [TUTOR_SYSTEM_INSTRUCTION, modeInstruction, learnerContext].filter(Boolean).join('\n\n') },
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
        hasContext: Boolean(material),
        mode: typeof mode === 'string' ? mode : 'explain',
      },
    });
    await recordStudyActivity(supabase, userId);

    // Every few exchanges, refresh the tutor's notes about the student in the background.
    const turns = Array.isArray(history) ? history.length : 0;
    if (turns >= 4 && turns % 6 === 4) {
      after(async () => {
        try {
          const transcript = [...toChatHistory(history).slice(-8), { role: 'user', content: message }, { role: 'assistant', content: reply }]
            .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${String(m.content).slice(0, 600)}`)
            .join('\n');
          const { text: notes } = await chatCompletion({
            maxTokens: 300,
            temperature: 0.2,
            messages: [
              {
                role: 'system',
                content:
                  'You maintain short private notes a tutor keeps about one student. Merge the existing notes with what this conversation reveals. ' +
                  'Keep: subjects and exams they are preparing for, concepts they have mastered, misconceptions and recurring mistakes, and how they like to learn. ' +
                  'Max 120 words, plain bullet points, no greetings. Never store personal data beyond study needs.',
              },
              { role: 'user', content: `Existing notes:\n${memoryNotes || '(none)'}\n\nRecent conversation:\n${transcript}\n\nUpdated notes:` },
            ],
          });
          await supabase.from('learner_memory').upsert({ user_id: userId, notes: notes.slice(0, 1500), updated_at: new Date().toISOString() });
        } catch (memoryError) {
          console.warn('[tutor] memory update skipped', memoryError);
        }
      });
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Tutor Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 });
  }
}
