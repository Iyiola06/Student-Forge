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

        const { type, imageData, typedAnswer, question, context } = await request.json();

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let promptTokens: any[] = [];
        let promptText = `
        You are an expert examiner. Your task is to grade a student's answer to a specific question.
        
        Question: ${question}
        Subject Context: ${context}
        
        Provide a grading result in this JSON format:
        {
          "score": 0-100,
          "feedback": "Specific feedback on why the score was given",
          "correctAnswer": "The ideal model answer based on context",
          "isCorrect": boolean
        }
        `;

        if (type === 'handwritten' && imageData) {
            // Remove data:image/png;base64, prefix if present
            const base64Data = imageData.split(',')[1] || imageData;
            promptTokens = [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png"
                    }
                },
                `Analyze the handwritten answer in this image and grade it against the question: ${question}`
            ];
        } else {
            promptTokens = [`Student Typed Answer: ${typedAnswer}\n\n${promptText}`];
        }

        const result = await model.generateContent(promptTokens);
        return NextResponse.json(JSON.parse(result.response.text()));

    } catch (error: any) {
        console.error('Grading Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
