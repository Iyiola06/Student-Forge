import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const maxDuration = 60;

const MAX_CHARS = 25000;

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, type, difficulty, count, curriculum, topic, stream } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Validate content is real study material
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

        const trimmedContent = content.length > MAX_CHARS
            ? content.substring(0, MAX_CHARS) + '\n\n[CONTENT TRUNCATED FOR LENGTH LIMITS]'
            : content;

        let systemInstruction = "";
        let schema: any;

        switch (type) {
            case 'mcq':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 5} multiple-choice questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
${curriculum ? `Align the questions to the ${curriculum} curriculum standards.` : ''}
${topic ? `Focus the questions heavily on the topic of: ${topic}.` : ''}`;
                schema = z.array(z.object({
                    question: z.string(),
                    options: z.array(z.string()).describe("Provide exactly 4 distinct options including the correct answer."),
                    answer: z.string().describe("The exact string from options that is correct"),
                    explanation: z.string()
                }));
                break;

            case 'fill_in_gap':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 5} fill-in-the-gap questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
${curriculum ? `Align the questions to the ${curriculum} curriculum standards.` : ''}
${topic ? `Focus the questions heavily on the topic of: ${topic}.` : ''}`;
                schema = z.array(z.object({
                    sentence: z.string().describe("A factual sentence with a key term replaced by '___'. Example: The ___ is the powerhouse of the cell."),
                    answer: z.string().describe("The exact missing word(s)"),
                    hint: z.string().describe("A short contextual hint to help the student"),
                    explanation: z.string().describe("A pedagogical explanation of the concept being tested")
                }));
                break;

            case 'theory':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 3} theoretical or open-ended questions from the provided text. The difficulty should be ${difficulty || 'medium'}.
${curriculum ? `Align the questions to the ${curriculum} curriculum standards.` : ''}
${topic ? `Focus the topic specifically on: ${topic}.` : ''}`;
                schema = z.array(z.object({
                    question: z.string().describe("The open-ended question prompt"),
                    model_answer: z.string().describe("A comprehensive ideal answer paragraph"),
                    key_points: z.array(z.string()).describe("Key concepts that should be mentioned"),
                    explanation: z.string().describe("A breakdown of why the model answer is correct and what makes a good response")
                }));
                break;

            case 'flashcards':
                systemInstruction = `You are an expert educator. Generate exactly ${count || 10} study flashcards from the most important concepts in the provided text.`;
                schema = z.array(z.object({
                    front: z.string().describe("The term, concept name, or question to display on the front"),
                    back: z.string().describe("The concise definition or answer to display on the back")
                }));
                break;

            case 'exam_snapshot':
                systemInstruction = `You are an expert examiner preparing a student for a final test on the provided text. Extract the most critical information into an Exam Snapshot cheat sheet.`;
                schema = z.object({
                    abbreviations: z.array(z.object({ short: z.string(), full: z.string() })),
                    key_points: z.array(z.object({ point: z.string(), tag: z.string(), color: z.string() })),
                    hot_list: z.array(z.object({ question: z.string(), difficulty: z.string(), rationale: z.string() }))
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
        }

        const prompt = `Target Source Text:\n${trimmedContent}`;

        // Create the google model instance specifying our fastest model variant
        const model = google('gemini-3-flash-preview');

        if (stream) {
            // Using streaming response
            const streamResult = await streamObject({
                model,
                schema,
                system: systemInstruction,
                prompt,
            });
            return streamResult.toTextStreamResponse();
        } else {
            // Blocking response, keeping JSON contract intact
            const { object } = await generateObject({
                model,
                schema,
                system: systemInstruction,
                prompt,
            });

            // If it's MCQ, let's optionally shuffle the options here or leave it to client. 
            // Better to shuffle options
            if (type === 'mcq' && Array.isArray(object)) {
                object.forEach((q: any) => {
                    if (Array.isArray(q.options)) {
                        for (let i = q.options.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
                        }
                    }
                });
            }

            return NextResponse.json({ success: true, data: object });
        }

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        const errorMessage = error?.message || 'Failed to generate content';
        const status = errorMessage.includes('429') || errorMessage.includes('quota') ? 429 : 500;
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
