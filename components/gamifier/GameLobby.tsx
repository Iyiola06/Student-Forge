'use client';

import AppShell from '@/components/layout/AppShell';
import AppSection from '@/components/app/AppSection';
import AppEmptyState from '@/components/app/AppEmptyState';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { Profile } from '@/hooks/useProfile';
import { GameMode, GameSessionRecord, modeConfig, modeLabels } from '@/lib/gamifier/masteryArena';

interface GameLobbyProps {
    profile: Profile | null;
    resources: any[];
    activeSession: GameSessionRecord | null;
    onStartSession: (mode: GameMode, resourceId?: string) => void;
    onResumeSession: () => void;
    isLaunching: boolean;
}

const modeOrder: GameMode[] = ['quick_recall', 'exam_sprint', 'weak_spot_rescue'];

/** Shared look for each game mode (pastel tile + 3D icon). */
export const modeVisuals: Record<GameMode, { icon: Icon3DName; tone: string }> = {
    quick_recall: { icon: 'rocket', tone: 'pastel-sky' },
    exam_sprint: { icon: 'stopwatch', tone: 'pastel-peach' },
    weak_spot_rescue: { icon: 'target', tone: 'pastel-mint' },
};

const resourceTones = ['pastel-lavender', 'pastel-butter', 'pastel-blush', 'pastel-lime', 'pastel-sky', 'pastel-mint'];

/** Picks a friendly 3D icon for a subject name. */
export function subjectIcon(subject?: string | null): Icon3DName {
    const lower = (subject || '').toLowerCase();
    if (lower.includes('bio') || lower.includes('agric')) return 'dna';
    if (lower.includes('chem')) return 'test-tube';
    if (lower.includes('physics')) return 'bolt';
    if (lower.includes('math')) return 'abacus';
    if (lower.includes('history') || lower.includes('government') || lower.includes('civic')) return 'scroll';
    if (lower.includes('econ') || lower.includes('account') || lower.includes('commerce')) return 'money-bag';
    if (lower.includes('english') || lower.includes('literature')) return 'open-book';
    if (lower.includes('geo')) return 'globe';
    return 'books';
}

const feelRows: { icon: Icon3DName; title: string; copy: string }[] = [
    { icon: 'stopwatch', title: 'Short runs', copy: '2 to 5 minutes, built for "one more run."' },
    { icon: 'heart', title: 'Shields, not game over', copy: 'Mistakes cost a shield, so pressure stays fun.' },
    { icon: 'fire', title: 'Streak multiplier', copy: 'Correct streaks raise your multiplier and push the score climb.' },
    { icon: 'chart-up', title: 'Real progress', copy: 'Every run writes back mastery, XP and weak concepts for review.' },
];

const powerRows: { mode: GameMode; copy: string }[] = [
    { mode: 'quick_recall', copy: 'Due flashcards first, then notes and resource-based fallback prompts.' },
    { mode: 'exam_sprint', copy: 'Saved quizzes first, then exam-style rounds from the past-questions bank.' },
    { mode: 'weak_spot_rescue', copy: 'Recent misses and low-confidence material come before anything else.' },
];

export default function GameLobby({
    profile,
    resources,
    activeSession,
    onStartSession,
    onResumeSession,
    isLaunching,
}: GameLobbyProps) {
    const featuredResources = resources.slice(0, 3);
    const firstName = (profile?.full_name || 'Student').split(' ')[0];

    const sidebar = (
        <>
            <AppSection eyebrow="The rules" title="How it feels">
                <div className="space-y-3">
                    {feelRows.map((row) => (
                        <div key={row.title} className="flex items-start gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--card-2)] p-3">
                            <span className="icon-tile size-11">
                                <Icon3D name={row.icon} size={28} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-strong)]">{row.title}</p>
                                <p className="mt-0.5 text-[13px] leading-5 text-[var(--text-soft)]">{row.copy}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </AppSection>

            <AppSection eyebrow="Under the hood" title="What powers the rounds">
                <div className="space-y-3">
                    {powerRows.map((row) => (
                        <div key={row.mode} className={`flex items-start gap-3 rounded-[20px] border border-[var(--line)] p-3 ${modeVisuals[row.mode].tone}`}>
                            <Icon3D name={modeVisuals[row.mode].icon} size={34} className="shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-strong)]">{modeLabels[row.mode].title}</p>
                                <p className="mt-0.5 text-[13px] leading-5 text-[var(--text-soft)]">{row.copy}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </AppSection>
        </>
    );

    return (
        <AppShell
            eyebrow="Practice"
            title="Quest Mode"
            description="Short, replayable recall runs that turn weak spots into visible progress."
            sidebar={sidebar}
        >
            <div className="workspace-stack">
                {/* Hero */}
                <section className="glass-panel app-panel relative overflow-hidden">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
                        <div className="min-w-0">
                            <span className="eyebrow-pill">
                                <Icon3D name="joystick" size={18} />
                                Mastery Arena
                            </span>
                            <h2 className="display-md mt-4 text-balance text-[var(--text-strong)]">
                                Fast study loops that feel <span className="torn-mark">replayable</span>
                            </h2>
                            <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-[var(--text-soft)]">
                                Pick a mode, jump into short recall rounds, protect your shields, and turn your weak areas into visible progress.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                {activeSession ? (
                                    <button onClick={onResumeSession} className="primary-button">
                                        <Icon3D name="joystick" size={20} />
                                        Resume {modeLabels[activeSession.mode].title}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartSession('quick_recall')}
                                        disabled={isLaunching}
                                        className="primary-button"
                                    >
                                        <Icon3D name="rocket" size={20} />
                                        {isLaunching ? 'Starting session...' : 'Start Quick Recall'}
                                    </button>
                                )}
                                <span className="metric-chip">
                                    <Icon3D name="stopwatch" size={16} />
                                    2 to 5 min a run
                                </span>
                            </div>
                            {activeSession ? (
                                <p className="mt-3 text-[13px] text-[var(--text-soft)]">
                                    Run in progress: <span className="font-medium text-[var(--text-body)]">{activeSession.topic}</span>
                                </p>
                            ) : null}
                        </div>

                        {/* Player card */}
                        <div className="pastel-lavender relative min-w-0 overflow-hidden rounded-[26px] border border-[var(--line)] p-4 sm:p-5">
                            <Icon3D name="trophy" size={72} float className="absolute top-3 right-3 sm:right-5" />
                            <div className="flex min-w-0 items-center gap-3 pr-20">
                                <div
                                    className="size-14 shrink-0 rounded-2xl border border-[var(--line)] bg-[var(--card)] bg-cover bg-center shadow-[var(--shadow-sm)]"
                                    style={{ backgroundImage: `url("${profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mastery-arena'}")` }}
                                />
                                <div className="min-w-0">
                                    <p className="truncate font-display text-[18px] font-semibold text-[var(--text-strong)]">
                                        {profile?.full_name || 'Student'}
                                    </p>
                                    <span className="pill-tag mt-1">
                                        <Icon3D name="crown" size={14} />
                                        Level {profile?.level || 1}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-4 text-[13px] text-[var(--text-soft)]">Ready for a run, {firstName}?</p>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {[
                                    { icon: 'glowing-star' as const, value: profile?.xp?.toLocaleString() || 0, label: 'XP' },
                                    { icon: 'fire' as const, value: profile?.streak_days || 0, label: 'Day streak' },
                                    { icon: 'books' as const, value: resources.length, label: 'Sources' },
                                ].map((stat) => (
                                    <div key={stat.label} className="min-w-0 rounded-[18px] border border-[var(--line)] bg-[var(--card)] px-2 py-3 text-center">
                                        <Icon3D name={stat.icon} size={26} className="mx-auto" />
                                        <p className="mt-1 truncate font-display text-[20px] font-semibold leading-tight text-[var(--text-strong)]">{stat.value}</p>
                                        <p className="truncate text-[11.5px] text-[var(--text-soft)]">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Modes */}
                <section className="glass-panel app-panel">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div className="min-w-0">
                            <p className="eyebrow">Two clicks to play</p>
                            <h2 className="panel-title mt-1">Choose your mode</h2>
                        </div>
                        <p className="text-[13px] text-[var(--text-soft)]">Your topic stays visible the whole run.</p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {modeOrder.map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onStartSession(mode)}
                                disabled={isLaunching}
                                className={`lift group relative flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-[var(--line)] p-5 text-left disabled:opacity-60 ${modeVisuals[mode].tone}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="pill-tag whitespace-nowrap">{modeLabels[mode].eyebrow}</span>
                                    <Icon3D name={modeVisuals[mode].icon} size={56} className="-mt-1 -mr-1 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                                </div>
                                <p className="mt-3 font-display text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
                                    {modeLabels[mode].title}
                                </p>
                                <p className="mt-1.5 flex-1 text-[13.5px] leading-6 text-[var(--text-soft)]">{modeLabels[mode].description}</p>
                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <span className="min-w-0 truncate text-[12px] text-[var(--text-soft)]">
                                        {modeConfig[mode].rounds} rounds · {modeConfig[mode].timer}s
                                    </span>
                                    <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-[var(--action)] px-3.5 text-[12.5px] font-medium text-[var(--action-ink)]">
                                        Play
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Materials */}
                <section className="glass-panel app-panel">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div className="min-w-0">
                            <p className="eyebrow">Recent sources</p>
                            <h2 className="panel-title mt-1">Play from your materials</h2>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {featuredResources.length > 0 ? featuredResources.map((resource, index) => (
                            <button
                                key={resource.id}
                                onClick={() => onStartSession('quick_recall', resource.id)}
                                disabled={isLaunching}
                                className={`lift flex min-w-0 flex-col rounded-[22px] border border-[var(--line)] p-4 text-left disabled:opacity-60 ${resourceTones[index % resourceTones.length]}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="pill-tag max-w-full truncate">{resource.subject || 'General'}</span>
                                    <Icon3D name={subjectIcon(resource.subject || resource.title)} size={44} className="shrink-0" />
                                </div>
                                <p className="mt-2 line-clamp-2 font-display text-[16px] font-semibold leading-snug text-[var(--text-strong)]">
                                    {resource.title}
                                </p>
                                <p className="mt-2 flex-1 text-[12.5px] leading-5 text-[var(--text-soft)]">
                                    Quick recall from this source, with fallback questions if the deck is thin.
                                </p>
                                <span className="mt-3 text-[12.5px] font-medium text-[var(--accent-strong)]">Start run</span>
                            </button>
                        )) : (
                            <AppEmptyState
                                icon="books"
                                title="No uploads yet"
                                description="You can still play using saved quizzes, flashcards and community fallbacks."
                                className="sm:col-span-2 xl:col-span-3"
                            />
                        )}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
