import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';
import {
    AdventureNode,
    RewardOption,
    createInitialRunState,
    rewardCatalog,
} from '@/lib/gamifier/adventure';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const requestSchema = z.object({
    resourceId: z.string().uuid().optional(),
    forceNew: z.boolean().optional(),
});

const generatedSchema = z.object({
    chapterTitle: z.string(),
    missionTitle: z.string(),
    introText: z.string(),
    mentorText: z.string(),
    recapTitle: z.string(),
    recapFacts: z.array(z.string()).min(3).max(4),
    battleQuestions: z.array(z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        answer: z.string(),
        explanation: z.string(),
    })).min(2).max(3),
    bossQuestions: z.array(z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        answer: z.string(),
        explanation: z.string(),
    })).min(3).max(4),
});

function safeJsonParse<T>(value: string): T | null {
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function buildFallbackPackage(subject: string, title: string, sourceLabel: string) {
    const promptBase = subject || title || 'General Study';
    return {
        chapterTitle: 'The Archive Frontier',
        missionTitle: `Operation ${promptBase}`,
        introText: `Signals from ${sourceLabel} suggest this sector contains high-yield exam material around ${promptBase}. Clear the route, stabilize your memory, and defeat the final examiner.`,
        mentorText: `Focus on definitions, cause-and-effect, and how ideas connect inside ${promptBase}. If you are unsure, eliminate weak options first and preserve your shields.`,
        recapTitle: `High-Yield Notes: ${promptBase}`,
        recapFacts: [
            `${promptBase} is easier to remember when you connect terms to their functions.`,
            `Examiners often test relationships, definitions, and common misconceptions in ${promptBase}.`,
            `Use contrast: what something is, what it is not, and why it matters.`,
        ],
        battleQuestions: [
            {
                prompt: `Which study move is most useful when revising ${promptBase}?`,
                options: [
                    'Actively recalling key ideas without looking',
                    'Only rereading without testing yourself',
                    'Skipping examples completely',
                    'Ignoring definitions and vocabulary',
                ],
                answer: 'Actively recalling key ideas without looking',
                explanation: 'Active recall improves retention and reveals what still needs work.',
            },
            {
                prompt: `What usually appears in strong exam answers on ${promptBase}?`,
                options: [
                    'Clear definitions with relevant examples',
                    'Unrelated facts with no structure',
                    'Only memorized headings',
                    'Very long answers without focus',
                ],
                answer: 'Clear definitions with relevant examples',
                explanation: 'High-quality answers are accurate, focused, and supported with examples.',
            },
        ],
        bossQuestions: [
            {
                prompt: `What is the best first step when a ${promptBase} question feels difficult?`,
                options: [
                    'Break it into smaller concepts',
                    'Skip all reasoning',
                    'Choose the longest option immediately',
                    'Rewrite the entire textbook from memory',
                ],
                answer: 'Break it into smaller concepts',
                explanation: 'Chunking reduces overload and makes the problem easier to solve.',
            },
            {
                prompt: `Why are examples powerful in ${promptBase} answers?`,
                options: [
                    'They show understanding, not just memorization',
                    'They replace the need for any concept',
                    'They make every answer automatically correct',
                    'They are only useful in creative writing',
                ],
                answer: 'They show understanding, not just memorization',
                explanation: 'Examples demonstrate application and deepen conceptual accuracy.',
            },
            {
                prompt: `What should you revise after getting a ${promptBase} answer wrong?`,
                options: [
                    'The concept, the trap, and why the right answer works',
                    'Nothing, because mistakes do not matter',
                    'Only the option letters',
                    'Only the timer behavior',
                ],
                answer: 'The concept, the trap, and why the right answer works',
                explanation: 'Reviewing both the right answer and the trap prevents repeated mistakes.',
            },
        ],
    };
}

async function generateStoryPackage(context: string, subject: string, sourceLabel: string) {
    if (!apiKey) {
        return buildFallbackPackage(subject, subject, sourceLabel);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const prompt = `You are designing a short tactical study adventure for a student.
Return valid JSON only with this structure:
{
  "chapterTitle": string,
  "missionTitle": string,
  "introText": string,
  "mentorText": string,
  "recapTitle": string,
  "recapFacts": string[],
  "battleQuestions": [{ "prompt": string, "options": string[], "answer": string, "explanation": string }],
  "bossQuestions": [{ "prompt": string, "options": string[], "answer": string, "explanation": string }]
}

Rules:
- Theme it as a sci-fi story adventure.
- Keep the writing exciting but concise.
- battleQuestions must have exactly 2 items.
- bossQuestions must have exactly 3 items.
- Each options array must contain exactly 4 distinct options.
- The answer must exactly match one option.
- Questions should be answerable from the source context, or from strong subject knowledge if the context is metadata only.
- recapFacts must have 3 short bullets.

Subject: ${subject}
Source label: ${sourceLabel}
Source context:
${context.slice(0, 12000)}`;

        const result = await model.generateContent(prompt);
        const parsed = safeJsonParse<z.infer<typeof generatedSchema>>(result.response.text().trim());
        const validated = parsed ? generatedSchema.safeParse(parsed) : null;
        if (validated?.success) return validated.data;
    } catch (error) {
        console.error('Failed to generate gamifier package:', error);
    }

    return buildFallbackPackage(subject, subject, sourceLabel);
}

function buildRewardChoices(): RewardOption[] {
    return [
        rewardCatalog.shield_boost,
        rewardCatalog.focus_bonus,
        rewardCatalog.time_warp,
    ];
}

function buildNodes(story: Awaited<ReturnType<typeof generateStoryPackage>>, sourceType: 'resource' | 'community' | 'hybrid'): AdventureNode[] {
    const battleOne = story.battleQuestions[0];
    const battleTwo = story.battleQuestions[1];

    return [
        {
            id: 'intro',
            nodeType: 'lore',
            title: story.chapterTitle,
            subtitle: story.missionTitle,
            contentSource: 'system',
            payload: {
                body: story.introText,
                objective: 'Clear the route, choose a path, and defeat the final examiner.',
            },
            nextNodeId: 'battle_alpha',
        },
        {
            id: 'battle_alpha',
            nodeType: 'battle',
            title: 'Encounter: Gatekeeper Drone',
            subtitle: 'First contact',
            contentSource: sourceType,
            payload: {
                enemyName: 'Gatekeeper Drone',
                enemyHealth: 100,
                question: battleOne,
                timerSeconds: 25,
            },
            nextNodeId: 'reward_cache',
        },
        {
            id: 'reward_cache',
            nodeType: 'reward',
            title: 'Artifact Cache',
            subtitle: 'Choose one tactical reward',
            contentSource: 'system',
            payload: {
                body: 'A cache drifts out of the debris field. Pick one upgrade for the rest of the mission.',
            },
            reward: buildRewardChoices(),
            nextNodeId: 'branch_decision',
        },
        {
            id: 'branch_decision',
            nodeType: 'choice',
            title: 'Crossroads in the Rift',
            subtitle: 'Pick your route',
            contentSource: 'system',
            payload: {
                prompt: 'One route offers tactical guidance. The other grants a compressed memory recap before the next fight.',
                options: [
                    {
                        id: 'mentor_route',
                        title: 'Mentor Route',
                        description: 'Gain energy and tactical insight before the next battle.',
                        nextNodeId: 'mentor_chamber',
                        reward: 'energy_surge',
                    },
                    {
                        id: 'recovery_route',
                        title: 'Recovery Route',
                        description: 'Restore shields and reinforce your key concepts.',
                        nextNodeId: 'recap_chamber',
                        reward: 'shield_boost',
                    },
                ],
            },
            branchMap: {
                mentor_route: 'mentor_chamber',
                recovery_route: 'recap_chamber',
            },
        },
        {
            id: 'mentor_chamber',
            nodeType: 'mentor',
            title: 'Mentor Broadcast',
            subtitle: 'Tactical insight',
            contentSource: sourceType,
            payload: {
                body: story.mentorText,
                bonusText: '+2 energy when you continue.',
            },
            nextNodeId: 'battle_elite',
        },
        {
            id: 'recap_chamber',
            nodeType: 'recap',
            title: story.recapTitle,
            subtitle: 'Memory compression',
            contentSource: sourceType,
            payload: {
                facts: story.recapFacts,
                bonusText: '+20 shields when you continue.',
            },
            nextNodeId: 'battle_elite',
        },
        {
            id: 'battle_elite',
            nodeType: 'battle',
            title: 'Encounter: Examiner Sentinel',
            subtitle: 'High-pressure clash',
            contentSource: sourceType,
            payload: {
                enemyName: 'Examiner Sentinel',
                enemyHealth: 120,
                question: battleTwo,
                timerSeconds: 22,
            },
            nextNodeId: 'boss_final',
        },
        {
            id: 'boss_final',
            nodeType: 'boss',
            title: 'Boss: Final Examiner',
            subtitle: 'Three-phase showdown',
            contentSource: 'hybrid',
            payload: {
                enemyName: 'Final Examiner',
                enemyHealth: 220,
                questions: story.bossQuestions,
                timerSeconds: 18,
            },
            nextNodeId: null,
        },
    ];
}

function hydrateRun(run: any, nodes: any[]) {
    return {
        ...run,
        current_state: run.current_state,
        nodes: nodes.map((node) => ({
            id: node.node_id,
            nodeType: node.node_type,
            title: node.title,
            subtitle: node.subtitle,
            contentSource: node.content_source,
            payload: node.payload,
            reward: node.reward,
            nextNodeId: node.next_node_id,
            branchMap: node.branch_map,
            completedAt: node.completed_at,
        })),
    };
}

export async function GET(request: Request) {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: run } = await supabase
        .from('game_runs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!run) return NextResponse.json({ run: null });

    const { data: nodes } = await supabase
        .from('game_run_nodes')
        .select('*')
        .eq('run_id', run.id)
        .order('node_order', { ascending: true });

    return NextResponse.json({ run: hydrateRun(run, nodes || []) });
}

export async function POST(request: Request) {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { resourceId, forceNew } = parsed.data;

    if (!forceNew) {
        const { data: existingRun } = await supabase
            .from('game_runs')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'in_progress')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingRun) {
            const { data: existingNodes } = await supabase
                .from('game_run_nodes')
                .select('*')
                .eq('run_id', existingRun.id)
                .order('node_order', { ascending: true });

            return NextResponse.json({ run: hydrateRun(existingRun, existingNodes || []), resumed: true });
        }
    }

    let selectedResource: any = null;
    if (resourceId) {
        const { data } = await supabase
            .from('resources')
            .select('id, title, subject, content, processing_status')
            .eq('id', resourceId)
            .eq('user_id', user.id)
            .maybeSingle();
        selectedResource = data;
    }

    if (!selectedResource) {
        const { data } = await supabase
            .from('resources')
            .select('id, title, subject, content, processing_status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        selectedResource = data;
    }

    let sourceContext = selectedResource?.content || '';
    let sourceSubject = selectedResource?.subject || selectedResource?.title || 'General Study';
    let sourceLabel = selectedResource?.title || 'Community Challenge';
    let sourceId: string | null = selectedResource?.id || null;
    let sourceType: 'resource' | 'community' = selectedResource?.content ? 'resource' : 'community';

    if (!sourceContext || sourceContext.trim().length < 80) {
        const { data: pastQuestion } = await supabase
            .from('past_questions')
            .select('id, subject, school_name, institution_type, description, year')
            .eq('is_approved', true)
            .ilike('subject', `%${sourceSubject}%`)
            .order('downloads', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (pastQuestion) {
            sourceType = 'community';
            sourceContext = [
                `Subject: ${pastQuestion.subject}`,
                `Institution: ${pastQuestion.school_name}`,
                `Type: ${pastQuestion.institution_type}`,
                `Year: ${pastQuestion.year}`,
                `Description: ${pastQuestion.description || 'No extra description provided.'}`,
            ].join('\n');
            sourceSubject = pastQuestion.subject;
            sourceLabel = `${pastQuestion.subject} Community Challenge`;
            sourceId = pastQuestion.id;
        } else {
            sourceContext = `Subject: ${sourceSubject}\nSource: ${sourceLabel}`;
        }
    }

    const story = await generateStoryPackage(sourceContext, sourceSubject, sourceLabel);
    const chapterId = story.chapterTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const nodes = buildNodes(story, sourceType === 'resource' ? 'hybrid' : 'community');
    const initialState = createInitialRunState(story.missionTitle, chapterId, nodes[0].id);

    const { data: run, error: runError } = await supabase
        .from('game_runs')
        .insert({
            user_id: user.id,
            status: 'in_progress',
            source_type: sourceType,
            source_id: sourceId,
            chapter_id: chapterId,
            mission_title: story.missionTitle,
            current_node_id: nodes[0].id,
            current_state: initialState,
            metadata: {
                sourceLabel,
                sourceSubject,
                chapterTitle: story.chapterTitle,
            },
        })
        .select('*')
        .single();

    if (runError || !run) {
        console.error(runError);
        return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
    }

    const { error: nodesError } = await supabase.from('game_run_nodes').insert(
        nodes.map((node, index) => ({
            run_id: run.id,
            node_id: node.id,
            node_order: index,
            node_type: node.nodeType,
            title: node.title,
            subtitle: node.subtitle || null,
            content_source: node.contentSource,
            payload: node.payload,
            reward: node.reward || null,
            next_node_id: node.nextNodeId || null,
            branch_map: node.branchMap || null,
        }))
    );

    if (nodesError) {
        console.error(nodesError);
        return NextResponse.json({ error: 'Failed to save mission nodes' }, { status: 500 });
    }

    return NextResponse.json({
        run: {
            ...run,
            current_state: initialState,
            nodes,
        },
    });
}
