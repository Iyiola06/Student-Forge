import { NextResponse } from 'next/server';
import { generateJson, imagePart, isAIConfigured, type ChatMessage } from '@/lib/ai/openrouter';
import { requireCredits } from '@/lib/billing/server';
import { finalizeAiUsage } from '@/lib/ai/usage';
import { recordStudyActivity } from '@/lib/progress/server';

export async function POST(request: Request) {
    try {
        if (!isAIConfigured()) return NextResponse.json({ error: 'AI Service key missing' }, { status: 500 });

        const billing = await requireCredits(request, 'ai_grade');
        if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });

        const {
            type,
            imageData,
            typedAnswer,
            question,
            context,
            maxScore = 100,
        } = await request.json();

        const safeMaxScore = Number.isFinite(Number(maxScore))
            ? Math.max(1, Math.min(100, Number(maxScore)))
            : 100;

        let message: ChatMessage;
        const promptText = `
        You are an expert examiner. Grade the student's answer to the question below.

        Question: ${question}
        Subject Context: ${context}
        Score Range: 0 to ${safeMaxScore}

        Very important rules:
        - Do not require the student to match the model answer word-for-word.
        - Reward correct paraphrasing, partial understanding, and relevant points.
        - Penalize factual errors, missing key points, weak structure, and vagueness.
        - "feedback" should explain the score clearly.
        - "improvements" should be 2 to 4 short, specific ways to improve the answer.
        - "strengths" should be 0 to 3 short points.
        - "isCorrect" should be true only if the answer is mostly correct overall.

        Return valid JSON only in this exact format:
        {
          "score": number,
          "maxScore": ${safeMaxScore},
          "feedback": "string",
          "correctAnswer": "string",
          "improvements": ["string"],
          "strengths": ["string"],
          "isCorrect": boolean
        }
        `;

        const isHandwritten = type === 'handwritten' && Boolean(imageData);
        if (isHandwritten) {
            message = {
                role: 'user',
                content: [
                    imagePart(imageData),
                    { type: 'text', text: `Analyze the handwritten answer in this image and grade it against the question.\n\n${promptText}` },
                ],
            };
        } else {
            message = { role: 'user', content: `Student Typed Answer: ${typedAnswer}\n\n${promptText}` };
        }

        const { data: parsed, model } = await generateJson({
            messages: [message],
            json: true,
            vision: isHandwritten,
        });
        const score = Math.max(0, Math.min(safeMaxScore, Number(parsed.score) || 0));

        const payload = {
            score,
            maxScore: safeMaxScore,
            feedback: parsed.feedback || 'No feedback provided.',
            correctAnswer: parsed.correctAnswer || 'No model answer provided.',
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            isCorrect: typeof parsed.isCorrect === 'boolean'
                ? parsed.isCorrect
                : score >= Math.ceil(safeMaxScore * 0.6),
        };

        await finalizeAiUsage({
            supabase: billing.supabase,
            userId: billing.user.id,
            feature: 'ai_grade',
            source: 'ai_grade',
            modelName: model,
            inputSize: `${question || ''}${context || ''}${typedAnswer || ''}`.length,
            outputSize: JSON.stringify(payload).length,
            metadata: {
                type,
                maxScore: safeMaxScore,
                hasImage: Boolean(imageData),
            },
        });

        // Keep a history of graded answers so students can see their writing improve.
        const { data: saved } = await billing.supabase
            .from('essay_submissions')
            .insert({
                user_id: billing.user.id,
                question: String(question || '').slice(0, 2000),
                context: context ? String(context).slice(0, 500) : null,
                answer_text: typedAnswer ? String(typedAnswer).slice(0, 20000) : null,
                was_handwritten: type === 'handwritten' && Boolean(imageData),
                score,
                max_score: safeMaxScore,
                feedback: {
                    feedback: payload.feedback,
                    correctAnswer: payload.correctAnswer,
                    improvements: payload.improvements,
                    strengths: payload.strengths,
                    isCorrect: payload.isCorrect,
                },
            })
            .select('id')
            .maybeSingle();
        await recordStudyActivity(billing.supabase, billing.user.id);

        return NextResponse.json({ ...payload, submissionId: saved?.id ?? null });

    } catch (error: any) {
        console.error('Grading Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
