'use client';

import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { modeVisuals } from '@/components/gamifier/GameLobby';
import { GameMode, modeLabels } from '@/lib/gamifier/masteryArena';

interface SessionResultsProps {
    summary: any;
    onReturn: () => void;
    onReplay: (mode: GameMode) => void;
}

export default function SessionResults({ summary, onReturn, onReplay }: SessionResultsProps) {
    const weakConcepts = summary?.weakConcepts || [];
    const mode: GameMode = summary?.mode && modeLabels[summary.mode as GameMode]
        ? summary.mode as GameMode
        : 'quick_recall';
    const masteryDelta = summary?.masteryDelta || 0;
    const sentToReview = summary?.sentToReview || 0;

    const stats: { label: string; value: string | number; icon: Icon3DName; tone: string; valueClass?: string }[] = [
        { label: 'Score', value: (summary?.totalScore || 0).toLocaleString(), icon: 'gem', tone: 'pastel-sky' },
        { label: 'Best streak', value: summary?.bestStreak || 0, icon: 'fire', tone: 'pastel-peach' },
        {
            label: 'Mastery',
            value: `${masteryDelta >= 0 ? '+' : ''}${masteryDelta}`,
            icon: 'chart-up',
            tone: 'pastel-mint',
            valueClass: masteryDelta >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]',
        },
        { label: 'Sent to review', value: sentToReview, icon: 'inbox', tone: 'pastel-lavender' },
    ];

    const xpRows: { label: string; value: number; icon: Icon3DName }[] = [
        { label: 'Session completion', value: summary?.completionXp || 0, icon: 'check' },
        { label: 'Accuracy bonus', value: summary?.accuracyBonusXp || 0, icon: 'target' },
        { label: 'Streak bonus', value: summary?.streakBonusXp || 0, icon: 'fire' },
        { label: 'Weak spot bonus', value: summary?.weakSpotBonusXp || 0, icon: 'flexed' },
        { label: 'First run today', value: summary?.dailyBonusXp || 0, icon: 'sun-cloud' },
    ];

    return (
        <div className="main-bg">
            <div className="review-focus-shell">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
                    {/* Celebration hero */}
                    <section className="glass-panel relative overflow-hidden px-5 py-8 text-center sm:px-10 sm:py-10">
                        <div className="pastel-butter pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden />
                        <div className="relative">
                            <div className="flex items-end justify-center gap-1 sm:gap-3">
                                <Icon3D name="party" size={56} className="-rotate-12 sm:size-[72px]" />
                                <Icon3D name="trophy" size={104} float priority className="sm:size-[128px]" />
                                <Icon3D name="glowing-star" size={56} className="rotate-12 sm:size-[72px]" />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <span className="pill-tag">
                                    <Icon3D name={modeVisuals[mode].icon} size={16} />
                                    {modeLabels[mode].title}
                                </span>
                                {summary?.personalBest ? (
                                    <span className="pill-tag">
                                        <Icon3D name="first-place" size={16} />
                                        Personal best
                                    </span>
                                ) : null}
                            </div>

                            <h1 className="display-md mx-auto mt-3 max-w-[22ch] text-balance break-words text-[var(--text-strong)]">
                                {summary?.topic || 'Session complete'}
                            </h1>
                            <p className="mx-auto mt-2 max-w-[48ch] text-[15px] leading-7 text-[var(--text-soft)]">
                                Score locked in. XP awarded. Mastery updated.
                            </p>

                            <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--card)] py-2 pr-6 pl-2 shadow-[var(--shadow-md)]">
                                <span className="icon-tile size-12 !rounded-full">
                                    <Icon3D name="coin" size={32} />
                                </span>
                                <span className="text-left">
                                    <span className="block font-display text-[30px] leading-none font-semibold text-[var(--text-strong)] sm:text-[36px]">
                                        +{(summary?.totalXp || 0).toLocaleString()}
                                    </span>
                                    <span className="block text-[12px] text-[var(--text-soft)]">XP earned</span>
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Stats */}
                    <section className="metric-strip">
                        {stats.map((stat) => (
                            <div key={stat.label} className={`relative min-w-0 overflow-hidden rounded-[24px] border border-[var(--line)] p-4 shadow-[var(--shadow-sm)] ${stat.tone}`}>
                                <Icon3D name={stat.icon} size={36} className="absolute top-3 right-3" />
                                <p className="pr-10 text-[12.5px] text-[var(--text-soft)]">{stat.label}</p>
                                <p className={`mt-4 truncate font-display text-[26px] font-semibold leading-none ${stat.valueClass || 'text-[var(--text-strong)]'}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </section>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* XP breakdown */}
                        <section className="glass-panel app-panel">
                            <p className="eyebrow">Where it came from</p>
                            <h2 className="panel-title mt-1">XP breakdown</h2>
                            <div className="app-list mt-4">
                                {xpRows.map((row) => (
                                    <div key={row.label} className="app-list-row !items-center !py-3">
                                        <Icon3D name={row.icon} size={24} className="shrink-0" />
                                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-body)]">{row.label}</span>
                                        <span className={`font-display text-sm font-semibold ${row.value > 0 ? 'text-[var(--text-strong)]' : 'text-[var(--text-faint)]'}`}>
                                            +{row.value}
                                        </span>
                                    </div>
                                ))}
                                <div className="app-list-row !items-center !py-3 bg-[var(--accent-softer)]">
                                    <Icon3D name="coin" size={24} className="shrink-0" />
                                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--text-strong)]">Total</span>
                                    <span className="font-display text-base font-semibold text-[var(--text-strong)]">+{summary?.totalXp || 0}</span>
                                </div>
                            </div>
                        </section>

                        {/* Weak concepts / review */}
                        <section className="glass-panel app-panel flex flex-col">
                            <p className="eyebrow">Spaced review</p>
                            <h2 className="panel-title mt-1">Weak concepts saved</h2>
                            {weakConcepts.length > 0 ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {weakConcepts.map((concept: string) => (
                                        <span
                                            key={concept}
                                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--warning-soft)] px-3 py-1.5 text-[13px] text-[var(--text-body)]"
                                        >
                                            <Icon3D name="seedling" size={16} className="shrink-0" />
                                            <span className="min-w-0 break-words">{concept}</span>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-[var(--success-soft)] p-4">
                                    <Icon3D name="hundred" size={36} className="shrink-0" />
                                    <p className="min-w-0 text-sm text-[var(--text-body)]">Clean run. No weak concepts were flagged this time.</p>
                                </div>
                            )}

                            <div className="min-h-5 flex-1" aria-hidden />
                            <div className="pastel-lavender flex items-start gap-4 rounded-[22px] border border-[var(--line)] p-4">
                                <Icon3D name="inbox" size={48} className="shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-display text-[22px] leading-tight font-semibold text-[var(--text-strong)]">
                                        {sentToReview} <span className="text-[15px] font-medium text-[var(--text-body)]">sent to review</span>
                                    </p>
                                    <p className="mt-1 text-[13px] leading-5 text-[var(--text-soft)]">
                                        {summary?.sentToReview
                                            ? `${summary.sentToReview} answers updated your spaced review queue. Misses come back right before you would forget them.`
                                            : 'Answers here update your spaced review queue.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 pb-6">
                        <button onClick={() => onReplay(mode)} className="primary-button !h-12 !px-6">
                            <Icon3D name="rocket" size={20} />
                            One more run
                        </button>
                        <button onClick={onReturn} className="secondary-button !h-12 !px-6">
                            Back to lobby
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
