import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SharedQuizClient from './SharedQuizClient';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function SharedQuizPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch quiz metadata
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

    if (quizError || !quiz) {
        return notFound();
    }

    // Fetch quiz questions
    const { data: questions, error: qError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('created_at', { ascending: true });

    if (qError || !questions) {
        return notFound();
    }

    // Reconstruct into the generatedData format
    const formattedData = questions.map(q => ({
        question: q.question_text,
        options: q.options || [],
        answer: q.correct_answer,
        explanation: q.explanation || ''
    }));

    return (
        <SharedQuizClient quiz={quiz} questions={formattedData} />
    );
}
