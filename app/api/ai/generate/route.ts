import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { recordCreditEvent, requireCredits } from '@/lib/billing/server';
import { createAdminClient } from '@/lib/billing/server';
import { trackServerEvent } from '@/lib/analytics/server';
import { persistGeneratedStudyOutput } from '@/lib/ai/persistGenerated';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CHARS = 25000;
const MODEL_NAME = 'gemini-3-flash-preview';

export async function POST(request: Request) {
  let billingUserId: string | null = null;
  let jobId: string | null = null;

  try {
    const billing = await requireCredits(request, 'ai_generate');
    if (!billing.ok) return NextResponse.json(billing.body, { status: billing.status });
    billingUserId = billing.user.id;

    const body = await request.json();
    const { content, type, difficulty, count, curriculum, topic, stream, resourceId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const BLOCKED_PHRASES = [
      'text extraction is currently only supported',
      'failed to parse',
      'could not extract',
      'not currently supported for text extraction',
    ];
    const lowerContent = content.toLowerCase();
    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Content is too short to generate meaningful questions. Please provide more study material.' },
        { status: 400 }
      );
    }
    if (BLOCKED_PHRASES.some((phrase: string) => lowerContent.includes(phrase))) {
      return NextResponse.json(
        { error: 'The stored content for this resource appears to be an error message, not study material.' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json({ error: 'Generation type is required' }, { status: 400 });
    }

    const trimmedContent =
      content.length > MAX_CHARS ? `${content.substring(0, MAX_CHARS)}\n\n[CONTENT TRUNCATED FOR LENGTH LIMITS]` : content;

    let systemInstruction = '';
    let schema: z.ZodTypeAny;

    switch (type) {
      case 'mcq':
        systemInstruction = `You are an expert educator. Generate exactly ${count || 5} multiple-choice questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
${curriculum ? `Align the questions to the ${curriculum} curriculum standards.` : ''}
${topic ? `Focus the questions heavily on the topic of: ${topic}.` : ''}`;
        schema = z.array(
          z.object({
            question: z.string(),
            options: z.array(z.string()).describe('Provide exactly 4 distinct options including the correct answer.'),
            answer: z.string().describe('The exact string from options that is correct'),
            explanation: z.string(),
          })
        );
        break;
      case 'theory':
        systemInstruction = `You are an expert educator. Generate exactly ${count || 3} theoretical or open-ended questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
${curriculum ? `Align the questions to the ${curriculum} curriculum standards.` : ''}
${topic ? `Focus the topic specifically on: ${topic}.` : ''}`;
        schema = z.array(
          z.object({
            question: z.string(),
            model_answer: z.string(),
            key_points: z.array(z.string()),
            explanation: z.string(),
          })
        );
        break;
      case 'flashcards':
        systemInstruction = `You are an expert educator. Generate exactly ${count || 10} study flashcards from the most important concepts in the provided text.`;
        schema = z.array(
          z.object({
            front: z.string(),
            back: z.string(),
          })
        );
        break;
      case 'exam_snapshot':
        systemInstruction = 'You are an expert examiner preparing a student for a final test on the provided text. Extract the most critical information into an Exam Snapshot cheat sheet.';
        schema = z.object({
          abbreviations: z.array(z.object({ short: z.string(), full: z.string() })),
          key_points: z.array(z.object({ point: z.string(), tag: z.string(), color: z.string() })),
          hot_list: z.array(z.object({ question: z.string(), difficulty: z.string(), rationale: z.string() })),
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: job } = await admin
      .from('generation_jobs')
      .insert({
        user_id: billing.user.id,
        resource_id: resourceId ?? null,
        source_type: resourceId ? 'resource' : 'pasted_text',
        output_type: type,
        status: stream ? 'processing' : 'queued',
        model_name: MODEL_NAME,
        difficulty: difficulty ?? null,
        requested_count: count ?? null,
        topic: topic ?? null,
        curriculum: curriculum ?? null,
        input_chars: trimmedContent.length,
        credits_charged: billing.cost,
        estimated_provider_cost: 0.18,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    jobId = job?.id ?? null;

    await trackServerEvent({
      userId: billing.user.id,
      eventName: 'generation_started',
      idempotencyKey: `generation-started:${jobId ?? `${billing.user.id}:${Date.now()}`}`,
      properties: {
        type,
        resourceId: resourceId ?? null,
        inputChars: trimmedContent.length,
      },
    });

    const prompt = `Target Source Text:\n${trimmedContent}`;
    const model = google(MODEL_NAME);

    if (stream) {
      const streamResult = await streamObject({
        model,
        schema,
        system: systemInstruction,
        prompt,
        onFinish: async ({ object }) => {
          const outputItems = Array.isArray(object) ? object.length : object ? 1 : 0;
          if (jobId) {
            await admin
              .from('generation_jobs')
              .update({
                status: 'completed',
                output_items: outputItems,
                response_payload: object,
                completed_at: new Date().toISOString(),
              })
              .eq('id', jobId);
          }

          const persisted = await persistGeneratedStudyOutput({
            supabase: billing.supabase,
            userId: billing.user.id,
            resourceId: resourceId ?? null,
            type,
            payload: object,
            topic: topic ?? null,
          });

          await recordCreditEvent({
            supabase: billing.supabase,
            userId: billing.user.id,
            eventType: billing.eventType,
            source: 'ai_generate',
            amount: -billing.cost,
            modelName: MODEL_NAME,
            inputSize: trimmedContent.length,
            outputSize: outputItems,
            estimatedProviderCost: 0.18,
            metadata: {
              type,
              resourceId: resourceId ?? null,
              persisted,
            },
          });

          await trackServerEvent({
            userId: billing.user.id,
            eventName: 'generation_completed',
            idempotencyKey: `generation-completed:${jobId ?? `${billing.user.id}:${type}`}`,
            properties: { type, outputItems },
          });
        },
      });

      return streamResult.toTextStreamResponse();
    }

    const { object } = await generateObject({
      model,
      schema,
      system: systemInstruction,
      prompt,
    });

    if (type === 'mcq' && Array.isArray(object)) {
      object.forEach((question: any) => {
        if (Array.isArray(question.options)) {
          for (let i = question.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
          }
        }
      });
    }

    const outputItems = Array.isArray(object) ? object.length : object ? 1 : 0;
    const persisted = await persistGeneratedStudyOutput({
      supabase: billing.supabase,
      userId: billing.user.id,
      resourceId: resourceId ?? null,
      type,
      payload: object,
      topic: topic ?? null,
    });

    if (jobId) {
      await admin
        .from('generation_jobs')
        .update({
          status: 'completed',
          output_items: outputItems,
          response_payload: object,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    await recordCreditEvent({
      supabase: billing.supabase,
      userId: billing.user.id,
      eventType: billing.eventType,
      source: 'ai_generate',
      amount: -billing.cost,
      modelName: MODEL_NAME,
      inputSize: trimmedContent.length,
      outputSize: outputItems,
      estimatedProviderCost: 0.18,
      metadata: {
        type,
        resourceId: resourceId ?? null,
        persisted,
      },
    });

    await trackServerEvent({
      userId: billing.user.id,
      eventName: 'generation_completed',
      idempotencyKey: `generation-completed:${jobId ?? `${billing.user.id}:${type}`}`,
      properties: { type, outputItems },
    });

    return NextResponse.json({ success: true, data: object, jobId, persisted });
  } catch (error: any) {
    if (jobId) {
      const admin = createAdminClient();
      await admin
        .from('generation_jobs')
        .update({
          status: 'failed',
          failure_message: error?.message || 'Generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
    return NextResponse.json({ error: error?.message || 'Failed to generate content' }, { status: 500 });
  }
}
