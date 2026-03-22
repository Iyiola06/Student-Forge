export type AdventureNodeType =
    | 'lore'
    | 'battle'
    | 'reward'
    | 'choice'
    | 'mentor'
    | 'recap'
    | 'boss';

export type AbilityId = 'scan' | 'guard' | 'finisher';

export type RewardId =
    | 'shield_boost'
    | 'double_xp'
    | 'time_warp'
    | 'focus_bonus'
    | 'second_chance'
    | 'energy_surge';

export interface BattleQuestion {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface StoryChoiceOption {
    id: string;
    title: string;
    description: string;
    nextNodeId: string;
    reward?: RewardId;
    heal?: number;
}

export interface RewardOption {
    id: RewardId;
    title: string;
    description: string;
}

export interface AdventureNode {
    id: string;
    nodeType: AdventureNodeType;
    title: string;
    subtitle?: string;
    contentSource: 'resource' | 'community' | 'hybrid' | 'system';
    payload: Record<string, any>;
    reward?: RewardOption[] | null;
    nextNodeId?: string | null;
    branchMap?: Record<string, string> | null;
    completedAt?: string | null;
}

export interface ActiveEffects {
    doubleXpCharges: number;
    focusBonusCharges: number;
    timeWarpCharges: number;
    guardActive: boolean;
    secondChance: boolean;
}

export interface AdventureRunState {
    health: number;
    shields: number;
    energy: number;
    combo: number;
    streak: number;
    maxStreak: number;
    xpBank: number;
    currentNodeId: string;
    completedNodeIds: string[];
    unlockedRewards: RewardId[];
    activeEffects: ActiveEffects;
    selectedBranch?: string | null;
    missionTitle: string;
    chapterId: string;
    objective: string;
    correctAnswers: number;
    wrongAnswers: number;
    battlesWon: number;
    usedAbilities: number;
    nodeXp: number;
}

export interface AdventureRunRecord {
    id: string;
    user_id: string;
    status: 'in_progress' | 'completed' | 'failed';
    source_type: string;
    source_id: string | null;
    chapter_id: string;
    mission_title: string;
    current_node_id: string;
    current_state: AdventureRunState;
    metadata?: Record<string, any>;
    started_at: string;
    finished_at?: string | null;
    nodes: AdventureNode[];
}

export const rewardCatalog: Record<RewardId, RewardOption> = {
    shield_boost: {
        id: 'shield_boost',
        title: 'Shield Battery',
        description: '+25 shields instantly and tougher recovery after mistakes.',
    },
    double_xp: {
        id: 'double_xp',
        title: 'Quantum Ledger',
        description: 'Double the XP from your next battle or boss node.',
    },
    time_warp: {
        id: 'time_warp',
        title: 'Time Warp',
        description: 'Adds 8 seconds to your next timed encounter.',
    },
    focus_bonus: {
        id: 'focus_bonus',
        title: 'Focus Lens',
        description: 'Your next correct answer hits much harder.',
    },
    second_chance: {
        id: 'second_chance',
        title: 'Phoenix Core',
        description: 'Revive once if the mission would fail.',
    },
    energy_surge: {
        id: 'energy_surge',
        title: 'Energy Surge',
        description: '+2 energy immediately for tactical abilities.',
    },
};

export const missionXpConfig = {
    nodeCompletion: 15,
    battleWin: 40,
    bossWin: 150,
    missionComplete: 100,
    streakBonus: 30,
    firstTimeUnlock: 75,
};

export function createInitialRunState(missionTitle: string, chapterId: string, firstNodeId: string): AdventureRunState {
    return {
        health: 100,
        shields: 50,
        energy: 2,
        combo: 0,
        streak: 0,
        maxStreak: 0,
        xpBank: 0,
        currentNodeId: firstNodeId,
        completedNodeIds: [],
        unlockedRewards: [],
        activeEffects: {
            doubleXpCharges: 0,
            focusBonusCharges: 0,
            timeWarpCharges: 0,
            guardActive: false,
            secondChance: false,
        },
        selectedBranch: null,
        missionTitle,
        chapterId,
        objective: 'Clear the route and defeat the final examiner.',
        correctAnswers: 0,
        wrongAnswers: 0,
        battlesWon: 0,
        usedAbilities: 0,
        nodeXp: 0,
    };
}

export function getNodeById(nodes: AdventureNode[], nodeId: string) {
    return nodes.find((node) => node.id === nodeId) || null;
}

export function getNextNodeLabel(nodes: AdventureNode[], currentNodeId: string) {
    const currentNode = getNodeById(nodes, currentNodeId);
    if (!currentNode) return 'Unknown sector';
    if (currentNode.nodeType === 'choice') return 'Branching route';

    const nextId = currentNode.nextNodeId;
    const nextNode = nextId ? getNodeById(nodes, nextId) : null;
    if (!nextNode) return 'Mission end';
    return `${nextNode.nodeType.toUpperCase()}: ${nextNode.title}`;
}

export function applyRewardToState(state: AdventureRunState, rewardId: RewardId): AdventureRunState {
    const nextState: AdventureRunState = {
        ...state,
        unlockedRewards: state.unlockedRewards.includes(rewardId)
            ? state.unlockedRewards
            : [...state.unlockedRewards, rewardId],
        activeEffects: { ...state.activeEffects },
    };

    switch (rewardId) {
        case 'shield_boost':
            nextState.shields = Math.min(100, nextState.shields + 25);
            break;
        case 'double_xp':
            nextState.activeEffects.doubleXpCharges += 1;
            break;
        case 'time_warp':
            nextState.activeEffects.timeWarpCharges += 1;
            break;
        case 'focus_bonus':
            nextState.activeEffects.focusBonusCharges += 1;
            break;
        case 'second_chance':
            nextState.activeEffects.secondChance = true;
            break;
        case 'energy_surge':
            nextState.energy = Math.min(5, nextState.energy + 2);
            break;
        default:
            break;
    }

    return nextState;
}

export function awardNodeXp(state: AdventureRunState, baseXp: number) {
    const multiplier = state.activeEffects.doubleXpCharges > 0 ? 2 : 1;
    return {
        xpAwarded: baseXp * multiplier,
        consumedDoubleXp: multiplier > 1,
    };
}
