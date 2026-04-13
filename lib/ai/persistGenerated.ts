/* eslint-disable @typescript-eslint/no-explicit-any */
export async function persistGeneratedStudyOutput(params: {
  supabase: any;
  userId: string;
  resourceId?: string | null;
  type: 'mcq' | 'flashcards' | 'theory' | 'exam_snapshot';
  payload: any;
  topic?: string | null;
}) {
  const { supabase, userId, resourceId, type, payload, topic } = params;
  const topicLabel = topic || 'General';

  if (type === 'flashcards' && Array.isArray(payload) && payload.length) {
    const { data: deck } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        resource_id: resourceId ?? null,
        title: topic ? `${topic} Flashcards` : 'Generated Flashcards',
        subject: topicLabel,
      })
      .select('id')
      .single();

    const items = payload.map((card: any) => ({
      deck_id: deck.id,
      front_content: card.front,
      back_content: card.back,
      status: 'new',
      next_review_at: new Date().toISOString(),
    }));

    const { data: insertedItems } = await supabase
      .from('flashcard_items')
      .insert(items)
      .select('id,front_content,back_content');

    if (insertedItems?.length) {
      await supabase.from('review_items').insert(
        insertedItems.map((item: any) => ({
          user_id: userId,
          item_type: 'flashcard',
          source_id: item.id,
          source_resource_id: resourceId ?? null,
          source_topic: topicLabel,
          due_at: new Date().toISOString(),
          content_payload: {
            front: item.front_content,
            back: item.back_content,
            source_kind: 'generated_flashcard',
          },
        }))
      );
    }

    return { entityType: 'flashcards', entityId: deck.id };
  }

  if ((type === 'mcq' || type === 'theory') && Array.isArray(payload) && payload.length) {
    const { data: quiz } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        resource_id: resourceId ?? null,
        title: topic ? `${topic} Quiz` : 'Generated Practice Set',
        subject: topicLabel,
        difficulty: 'medium',
      })
      .select('id')
      .single();

    const questions = payload.map((question: any) => ({
      quiz_id: quiz.id,
      question_text: question.question,
      question_type: type === 'theory' ? 'theory' : 'multiple_choice',
      options: type === 'mcq' ? question.options ?? [] : [],
      correct_answer: question.answer || question.model_answer || '',
      explanation: question.explanation || null,
    }));

    const { data: insertedQuestions } = await supabase
      .from('quiz_questions')
      .insert(questions)
      .select('id,question_text,question_type,options,correct_answer,explanation');

    if (insertedQuestions?.length) {
      await supabase.from('review_items').insert(
        insertedQuestions.map((item: any) => ({
          user_id: userId,
          item_type: 'quiz_question',
          source_id: item.id,
          source_resource_id: resourceId ?? null,
          source_topic: topicLabel,
          due_at: new Date().toISOString(),
          content_payload: {
            question: item.question_text,
            options: item.options ?? [],
            answer: item.correct_answer,
            explanation: item.explanation,
            source_kind: type === 'theory' ? 'generated_theory' : 'generated_mcq',
          },
        }))
      );
    }

    return { entityType: 'quiz', entityId: quiz.id };
  }

  return null;
}
