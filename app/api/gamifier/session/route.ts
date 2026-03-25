import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    ChallengeType,
    GameMode,
    GameRound,
    GameSourceType,
    buildOptionSet,
    createInitialSessionState,
    createQuestionFromSentence,
    dedupeStrings,
    extractStudySentences,
    hydrateSessionRecord,
    modeConfig,
    slugifyTopic,
} from '@/lib/gamifier/masteryArena';

const requestSchema = z.object({
    mode: z.enum(['quick_recall', 'exam_sprint', 'weak_spot_rescue']).default('quick_recall'),
    resourceId: z.string().uuid().optional(),
    forceNew: z.boolean().optional(),
});

interface ResourceRecord {
    id: string;
    title: string;
    subject: string | null;
    content: string | null;
    processing_status?: string | null;
}

interface FlashDeckRecord {
    id: string;
    title: string;
    subject: string | null;
    resource_id: string | null;
}

interface FlashItemRecord {
    id: string;
    deck_id: string;
    front_content: string;
    back_content: string;
    status: string | null;
    next_review_at: string | null;
}

interface QuizRecord {
    id: string;
    title: string;
    subject: string | null;
    difficulty: string | null;
    resource_id: string | null;
}

interface QuizQuestionRecord {
    id: string;
    quiz_id: string;
    question_text: string;
    options: string[] | null;
    correct_answer: string;
    explanation: string | null;
}

interface PastQuestionRecord {
    id: string;
    subject: string;
    school_name?: string | null;
    institution_type?: string | null;
    course_code?: string | null;
    year?: number | null;
    description?: string | null;
}

function randomId(prefix: string, index: number) {
    return `${prefix}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`;
}

function trimTopic(value?: string | null) {
    return (value || '').trim() || 'General Study';
}

function pickResourceContext(resources: ResourceRecord[], resourceId?: string) {
    const selected = resourceId
        ? resources.find((resource) => resource.id === resourceId) || null
        : resources[0] || null;

    return {
        resource: selected,
        topic: trimTopic(selected?.title || selected?.subject || 'General Study'),
        subject: trimTopic(selected?.subject || selected?.title || 'General Study'),
    };
}

function createFlashRound(
    item: FlashItemRecord,
    deck: FlashDeckRecord | undefined,
    allBacks: string[],
    roundOrder: number,
    challengeType: ChallengeType = 'flash'
): GameRound {
    const subject = trimTopic(deck?.subject || deck?.title || 'General Study');
    const topic = trimTopic(deck?.title || subject);
    return {
        roundId: randomId(challengeType, roundOrder),
        roundOrder,
        challengeType,
        topic,
        subject,
        sourceType: 'flashcards',
        payload: {
            prompt: item.front_content,
            options: buildOptionSet(
                item.back_content,
                allBacks.filter((value) => value !== item.back_content),
                'Alt recall'
            ),
            answer: item.back_content,
            explanation: item.back_content,
            sourceLabel: deck?.title || 'Flashcard deck',
            difficulty: challengeType === 'boss' ? 'hard' : 'easy',
        },
    };
}

function createMcqRound(
    question: QuizQuestionRecord,
    quiz: QuizRecord | undefined,
    roundOrder: number,
    challengeType: ChallengeType = 'mcq'
): GameRound {
    const options = Array.isArray(question.options)
        ? dedupeStrings(question.options)
        : [];
    const fallbackOptions = buildOptionSet(
        question.correct_answer,
        options.filter((option) => option !== question.correct_answer),
        'Option'
    );
    const subject = trimTopic(quiz?.subject || quiz?.title || 'General Study');
    const topic = trimTopic(quiz?.title || subject);

    return {
        roundId: randomId(challengeType, roundOrder),
        roundOrder,
        challengeType,
        topic,
        subject,
        sourceType: 'quizzes',
        payload: {
            prompt: question.question_text,
            options: fallbackOptions,
            answer: question.correct_answer,
            explanation: question.explanation || question.correct_answer,
            sourceLabel: quiz?.title || 'Saved quiz',
            difficulty: challengeType === 'boss' ? 'hard' : ((quiz?.difficulty as any) || 'medium'),
        },
    };
}

function createResourceRounds(resource: ResourceRecord, startOrder: number, maxRounds: number) {
    const subject = trimTopic(resource.subject || resource.title);
    const topic = trimTopic(resource.title || resource.subject);
    const sentences = extractStudySentences(resource.content || '', maxRounds + 3);
    const rounds: GameRound[] = [];

    sentences.slice(0, maxRounds).forEach((sentence) => {
        const generated = createQuestionFromSentence(sentence);
        if (!generated) return;

        const challengeType: ChallengeType = rounds.length % 3 === 2 ? 'recap' : 'gap';
        const distractorWords = extractStudySentences(resource.content || '', 6)
            .flatMap((entry) => entry.split(/\s+/))
            .filter((word) => word.length > 4);

        rounds.push({
            roundId: randomId(challengeType, startOrder + rounds.length),
            roundOrder: startOrder + rounds.length,
            challengeType,
            topic,
            subject,
            sourceType: 'resources',
            payload: {
                prompt: challengeType === 'recap'
                    ? 'Which option best completes this key idea?'
                    : generated.prompt,
                content: challengeType === 'recap' ? sentence : undefined,
                options: buildOptionSet(generated.answer, distractorWords, 'Keyword'),
                answer: generated.answer,
                explanation: generated.explanation,
                sourceLabel: resource.title,
                difficulty: 'medium',
            },
        });
    });

    return rounds;
}

function createPastQuestionRound(pastQuestion: PastQuestionRecord, roundOrder: number, challengeType: ChallengeType = 'mcq'): GameRound {
    const subject = trimTopic(pastQuestion.subject);
    const topic = trimTopic(pastQuestion.course_code || pastQuestion.subject);
    const descriptor = dedupeStrings([
        pastQuestion.description || '',
        pastQuestion.school_name || '',
        pastQuestion.institution_type || '',
    ])[0] || `${subject} exam prep`;

    const prompt = `Which revision move is most likely to help with ${subject} questions from ${pastQuestion.school_name || 'the community bank'}?`;
    const answer = `Practice ${subject} with timed questions and review the explanation after each miss.`;

    return {
        roundId: randomId(challengeType, roundOrder),
        roundOrder,
        challengeType,
        topic,
        subject,
        sourceType: 'past_questions',
        payload: {
            prompt,
            content: `${subject} • ${descriptor}${pastQuestion.year ? ` • ${pastQuestion.year}` : ''}`,
            options: buildOptionSet(answer, [
                `Only reread ${subject} notes without checking understanding.`,
                `Skip weak areas and focus only on easy ${subject} questions.`,
                `Memorize random facts without using timed practice.`,
            ], 'Plan'),
            answer,
            explanation: 'Timed practice plus error review is what makes past-question prep useful.',
            sourceLabel: `${pastQuestion.subject} bank`,
            difficulty: challengeType === 'boss' ? 'hard' : 'medium',
        },
    };
}

function createFallbackRounds(topic: string, subject: string, startOrder: number, maxRounds: number, sourceType: GameSourceType = 'ai_fallback'): GameRound[] {
    const prompts = [
        `Which study move gives the strongest retention for ${topic}?`,
        `What should you do right after missing a ${subject} question?`,
        `Which answer style usually scores better in ${subject}?`,
        `What is the smartest way to revise ${topic} under time pressure?`,
        `How do you turn weak understanding in ${subject} into recall?`,
        `What should you compare when revising ${topic}?`,
    ];
    const answers = [
        'Test yourself before rereading and check what you missed.',
        'Review the concept, the trap, and why the correct answer fits.',
        'Use accurate definitions with a clear supporting example.',
        'Work in short timed bursts and mark your mistakes fast.',
        'Rebuild the idea in your own words, then test it again.',
        'Compare what the concept is, what it is not, and why it matters.',
    ];

    return prompts.slice(0, maxRounds).map((prompt, index) => {
        const answer = answers[index % answers.length];
        const challengeType: ChallengeType = index === maxRounds - 1 ? 'boss' : index % 2 === 0 ? 'flash' : 'recap';
        const difficulty: 'hard' | 'medium' = challengeType === 'boss' ? 'hard' : 'medium';
        return {
            roundId: randomId(challengeType, startOrder + index),
            roundOrder: startOrder + index,
            challengeType,
            topic,
            subject,
            sourceType,
            payload: {
                prompt,
                options: buildOptionSet(answer, answers.filter((value) => value !== answer), 'Fallback'),
                answer,
                explanation: answer,
                sourceLabel: `${subject} fallback`,
                difficulty,
            },
        };
    });
}

function ensureBossRound(rounds: GameRound[]) {
    if (!rounds.length) return rounds;
    const next = [...rounds];
    const bossIndex = Math.min(next.length - 1, 4);
    next[bossIndex] = {
        ...next[bossIndex],
        challengeType: 'boss',
        payload: {
            ...next[bossIndex].payload,
            difficulty: 'hard',
        },
    };
    return next.map((round, index) => ({ ...round, roundOrder: index }));
}

async function fetchData(supabase: SupabaseClient, userId: string, resourceId?: string) {
    const [resourcesResult, flashDecksResult, quizzesResult, masteryResult] = await Promise.all([
        supabase
            .from('resources')
            .select('id, title, subject, content, processing_status')
            .eq('user_id', userId)
            .order('last_accessed_at', { ascending: false }),
        supabase
            .from('flashcards')
            .select('id, title, subject, resource_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('quizzes')
            .select('id, title, subject, difficulty, resource_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('game_mastery')
            .select('topic_key, topic, subject, mastery_score, updated_at')
            .eq('user_id', userId)
            .order('mastery_score', { ascending: true })
            .limit(8),
    ]);

    const resources = (resourcesResult.data || []) as ResourceRecord[];
    const flashDecks = ((flashDecksResult.data || []) as FlashDeckRecord[])
        .filter((deck) => !resourceId || deck.resource_id === resourceId);
    const quizzes = ((quizzesResult.data || []) as QuizRecord[])
        .filter((quiz) => !resourceId || quiz.resource_id === resourceId);
    const mastery = masteryResult.data || [];

    const [flashItemsResult, quizQuestionsResult] = await Promise.all([
        flashDecks.length
            ? supabase
                .from('flashcard_items')
                .select('id, deck_id, front_content, back_content, status, next_review_at')
                .in('deck_id', flashDecks.map((deck) => deck.id))
                .order('next_review_at', { ascending: true })
                .limit(30)
            : Promise.resolve({ data: [] as any[] } as any),
        quizzes.length
            ? supabase
                .from('quiz_questions')
                .select('id, quiz_id, question_text, options, correct_answer, explanation')
                .in('quiz_id', quizzes.map((quiz) => quiz.id))
                .limit(40)
            : Promise.resolve({ data: [] as any[] } as any),
    ]);

    const resourceContext = pickResourceContext(resources, resourceId);
    const subjectFilter = resourceContext.subject === 'General Study' ? undefined : resourceContext.subject;

    const [pastQuestionsResult, recentSessionsResult] = await Promise.all([
        subjectFilter
            ? supabase
                .from('past_questions')
                .select('id, subject, school_name, institution_type, course_code, year, description')
                .eq('is_approved', true)
                .ilike('subject', `%${subjectFilter}%`)
                .order('downloads', { ascending: false })
                .limit(10)
            : supabase
                .from('past_questions')
                .select('id, subject, school_name, institution_type, course_code, year, description')
                .eq('is_approved', true)
                .order('downloads', { ascending: false })
                .limit(10),
        supabase
            .from('game_sessions')
            .select('id')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(6),
    ]);

    const recentSessionIds = (recentSessionsResult.data || []).map((session) => session.id);
    const recentMissesResult = recentSessionIds.length
        ? await supabase
            .from('game_session_rounds')
            .select('topic, subject, source_type, payload, result, completed_at')
            .in('session_id', recentSessionIds)
            .not('result', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(20)
        : { data: [] as any[] };

    return {
        resources,
        flashDecks,
        flashItems: (flashItemsResult.data || []) as FlashItemRecord[],
        quizzes,
        quizQuestions: (quizQuestionsResult.data || []) as QuizQuestionRecord[],
        pastQuestions: (pastQuestionsResult.data || []) as PastQuestionRecord[],
        mastery,
        recentMisses: (recentMissesResult.data || []) as any[],
        resourceContext,
    };
}

function buildRoundsForMode(mode: GameMode, data: Awaited<ReturnType<typeof fetchData>>) {
    const { rounds: targetRounds, timer } = modeConfig[mode];
    const flashDeckById = new Map(data.flashDecks.map((deck) => [deck.id, deck]));
    const quizById = new Map(data.quizzes.map((quiz) => [quiz.id, quiz]));
    const topic = trimTopic(data.resourceContext.topic || data.mastery[0]?.topic || data.pastQuestions[0]?.subject || 'General Study');
    const subject = trimTopic(data.resourceContext.subject || data.mastery[0]?.subject || data.pastQuestions[0]?.subject || 'General Study');

    let rounds: GameRound[] = [];

    if (mode === 'quick_recall') {
        const dueItems = data.flashItems.filter((item) => item.status !== 'mastered').slice(0, targetRounds);
        const backs = data.flashItems.map((item) => item.back_content);
        rounds = dueItems.map((item, index) => createFlashRound(item, flashDeckById.get(item.deck_id), backs, index));
        if (rounds.length < targetRounds && data.resourceContext.resource?.content) {
            rounds.push(...createResourceRounds(data.resourceContext.resource, rounds.length, targetRounds - rounds.length));
        }
    }

    if (mode === 'exam_sprint') {
        rounds = data.quizQuestions.slice(0, targetRounds).map((question, index) => createMcqRound(question, quizById.get(question.quiz_id), index));
        if (rounds.length < targetRounds) {
            rounds.push(...data.pastQuestions.slice(0, targetRounds - rounds.length).map((item, index) => createPastQuestionRound(item, rounds.length + index)));
        }
        if (rounds.length < targetRounds && data.resourceContext.resource?.content) {
            rounds.push(...createResourceRounds(data.resourceContext.resource, rounds.length, targetRounds - rounds.length));
        }
    }

    if (mode === 'weak_spot_rescue') {
        rounds = data.recentMisses
            .filter((entry) => entry?.result?.correct === false)
            .slice(0, targetRounds)
            .map((entry, index) => ({
                roundId: randomId('flash', index),
                roundOrder: index,
                challengeType: index === targetRounds - 1 ? 'boss' : ('flash' as ChallengeType),
                topic: trimTopic(entry.topic || topic),
                subject: trimTopic(entry.subject || subject),
                sourceType: (entry.source_type || 'ai_fallback') as GameSourceType,
                payload: {
                    ...(entry.payload || {}),
                    sourceLabel: (entry.payload?.sourceLabel as string) || 'Recent miss',
                    difficulty: index === targetRounds - 1 ? 'hard' : (entry.payload?.difficulty || 'medium'),
                },
            }));

        if (rounds.length < targetRounds) {
            const backs = data.flashItems.map((item) => item.back_content);
            const extra = data.flashItems
                .filter((item) => item.status !== 'mastered')
                .slice(0, targetRounds - rounds.length)
                .map((item, index) => createFlashRound(item, flashDeckById.get(item.deck_id), backs, rounds.length + index));
            rounds.push(...extra);
        }
        if (rounds.length < targetRounds && data.resourceContext.resource?.content) {
            rounds.push(...createResourceRounds(data.resourceContext.resource, rounds.length, targetRounds - rounds.length));
        }
    }

    if (rounds.length < targetRounds) {
        rounds.push(...createFallbackRounds(topic, subject, rounds.length, targetRounds - rounds.length));
    }

    const finalRounds = ensureBossRound(rounds.slice(0, targetRounds));
    return {
        rounds: finalRounds,
        timer,
        topic: finalRounds[0]?.topic || topic,
        subject: finalRounds[0]?.subject || subject,
        sourceType: finalRounds[0]?.sourceType || 'ai_fallback',
        sourceId: data.resourceContext.resource?.id || data.flashDecks[0]?.resource_id || data.quizzes[0]?.resource_id || data.pastQuestions[0]?.id || null,
    };
}

export async function GET(request: Request) {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!session) return NextResponse.json({ session: null });

    const { data: rounds } = await supabase
        .from('game_session_rounds')
        .select('*')
        .eq('session_id', session.id)
        .order('round_order', { ascending: true });

    return NextResponse.json({ session: hydrateSessionRecord(session, rounds || []) });
}

export async function POST(request: Request) {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { mode, resourceId, forceNew } = parsed.data;

    if (!forceNew) {
        const { data: existingSession } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'in_progress')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingSession) {
            const { data: existingRounds } = await supabase
                .from('game_session_rounds')
                .select('*')
                .eq('session_id', existingSession.id)
                .order('round_order', { ascending: true });

            return NextResponse.json({
                session: hydrateSessionRecord(existingSession, existingRounds || []),
                resumed: true,
            });
        }
    }

    const data = await fetchData(supabase, user.id, resourceId);
    const sessionBuild = buildRoundsForMode(mode, data);
    const topicKey = slugifyTopic(sessionBuild.topic);
    const initialState = createInitialSessionState(
        sessionBuild.topic,
        sessionBuild.subject,
        sessionBuild.sourceType,
        sessionBuild.timer
    );

    const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
            user_id: user.id,
            mode,
            status: 'in_progress',
            topic: sessionBuild.topic,
            subject: sessionBuild.subject,
            source_type: sessionBuild.sourceType,
            source_id: sessionBuild.sourceId,
            current_round: 0,
            current_state: initialState,
            score: 0,
            best_streak: 0,
        })
        .select('*')
        .single();

    if (sessionError || !session) {
        console.error(sessionError);
        return NextResponse.json({ error: 'Failed to create game session' }, { status: 500 });
    }

    const { error: roundsError } = await supabase.from('game_session_rounds').insert(
        sessionBuild.rounds.map((round) => ({
            session_id: session.id,
            round_id: round.roundId,
            round_order: round.roundOrder,
            challenge_type: round.challengeType,
            topic: round.topic,
            subject: round.subject,
            source_type: round.sourceType,
            payload: round.payload,
        }))
    );

    if (roundsError) {
        console.error(roundsError);
        return NextResponse.json({ error: 'Failed to save game rounds' }, { status: 500 });
    }

    await supabase.from('game_mastery').upsert({
        user_id: user.id,
        topic_key: topicKey,
        topic: sessionBuild.topic,
        subject: sessionBuild.subject,
        last_mode: mode,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic_key' });

    return NextResponse.json({
        session: {
            ...session,
            current_state: initialState,
            rounds: sessionBuild.rounds,
        },
    });
}
