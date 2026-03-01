import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SharedFlashcardClient from './SharedFlashcardClient';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function SharedFlashcardPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: deck, error: deckError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', id)
        .single();

    if (deckError || !deck) {
        return notFound();
    }

    const { data: items, error: iError } = await supabase
        .from('flashcard_items')
        .select('*')
        .eq('deck_id', id)
        .order('created_at', { ascending: true });

    if (iError || !items) {
        return notFound();
    }

    const flashcards = items.map(item => ({
        front: item.front_content,
        back: item.back_content
    }));

    return (
        <SharedFlashcardClient deck={deck} flashcards={flashcards} />
    );
}
