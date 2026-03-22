'use client';

import { Profile } from '@/hooks/useProfile';
import { GameMode, GameSessionRecord, getTopicTheme, modeLabels } from '@/lib/gamifier/masteryArena';

interface GameLobbyProps {
    profile: Profile | null;
    resources: any[];
    activeSession: GameSessionRecord | null;
    onStartSession: (mode: GameMode, resourceId?: string) => void;
    onResumeSession: () => void;
    isLaunching: boolean;
}

const modeOrder: GameMode[] = ['quick_recall', 'exam_sprint', 'weak_spot_rescue'];

export default function GameLobby({
    profile,
    resources,
    activeSession,
    onStartSession,
    onResumeSession,
    isLaunching,
}: GameLobbyProps) {
    const featuredResources = resources.slice(0, 3);
    const theme = getTopicTheme(activeSession?.subject || featuredResources[0]?.subject || 'General Study');

    return (
        <div className="relative min-h-[100dvh] overflow-hidden bg-[#0a0c12] text-white">
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(10,12,18,0.15),rgba(10,12,18,0.96))]" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
                <div className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-slate-300">Mastery Arena</p>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-[0.95]">
                            Fast study loops
                            <span className={`block ${theme.accent}`}>that actually feel replayable</span>
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                            Pick a mode, jump into short recall rounds, protect your shields, and turn your weak areas into visible progress.
                        </p>
                    </div>

                    <div className={`rounded-[2rem] border ${theme.border} bg-[#11141d]/75 p-6 backdrop-blur-xl ${theme.pulse}`}>
                        <div className="mb-6 flex items-center gap-4">
                            <div
                                className="size-16 rounded-2xl border border-white/15 bg-cover bg-center"
                                style={{ backgroundImage: `url("${profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mastery-arena'}")` }}
                            />
                            <div>
                                <div className="text-lg font-black">{profile?.full_name || 'Student'}</div>
                                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Level {profile?.level || 1}</div>
                            </div>
                        </div>

                        <div className="mb-6 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                                <div className="text-xl font-black text-orange-300">{profile?.xp?.toLocaleString() || 0}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">XP</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                                <div className="text-xl font-black text-emerald-300">{profile?.streak_days || 0}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Daily Streak</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                                <div className="text-xl font-black text-sky-300">{resources.length}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Sources</div>
                            </div>
                        </div>

                        {activeSession ? (
                            <button
                                onClick={onResumeSession}
                                className="w-full rounded-2xl bg-white px-5 py-4 font-black text-[#0a0c12] transition hover:bg-slate-100"
                            >
                                Resume {modeLabels[activeSession.mode].title}
                            </button>
                        ) : (
                            <button
                                onClick={() => onStartSession('quick_recall')}
                                disabled={isLaunching}
                                className="w-full rounded-2xl bg-[#f97316] px-5 py-4 font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                            >
                                {isLaunching ? 'Starting Session...' : 'Start Quick Recall'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
                    <div className="rounded-[2rem] border border-white/10 bg-[#11141d]/70 p-6 backdrop-blur-xl sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black">Choose Your Mode</h2>
                            <p className="mt-1 text-sm text-slate-400">Two clicks to play. Topic stays visible the whole time.</p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {modeOrder.map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => onStartSession(mode)}
                                    disabled={isLaunching}
                                    className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 text-left transition hover:-translate-y-1 hover:border-white/25"
                                >
                                    <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${theme.badge}`}>
                                        {modeLabels[mode].eyebrow}
                                    </div>
                                    <div className="mb-2 text-xl font-black">{modeLabels[mode].title}</div>
                                    <p className="text-sm leading-relaxed text-slate-400">{modeLabels[mode].description}</p>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-black">Play From Your Materials</h3>
                                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent sources</div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {featuredResources.length > 0 ? featuredResources.map((resource) => {
                                    const resourceTheme = getTopicTheme(resource.subject || resource.title || 'General Study');
                                    return (
                                        <button
                                            key={resource.id}
                                            onClick={() => onStartSession('quick_recall', resource.id)}
                                            disabled={isLaunching}
                                            className={`rounded-[1.4rem] border ${resourceTheme.border} bg-[#0f1219] p-5 text-left transition hover:-translate-y-1`}
                                        >
                                            <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${resourceTheme.badge}`}>
                                                {resource.subject || 'General'}
                                            </div>
                                            <div className="text-lg font-black leading-tight">{resource.title}</div>
                                            <p className="mt-3 text-sm text-slate-400">
                                                Launch quick recall from this source with fallback questions if the deck is thin.
                                            </p>
                                        </button>
                                    );
                                }) : (
                                    <div className="rounded-[1.5rem] border border-white/10 bg-[#0f1219] p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                                        No uploaded resources yet. You can still play using saved quizzes, flashcards, and community fallbacks.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-white/10 bg-[#11141d]/70 p-6 backdrop-blur-xl">
                            <h3 className="mb-4 text-lg font-black">How It Feels</h3>
                            <div className="space-y-3 text-sm text-slate-300">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Short sessions: 2 to 5 minutes, built for “one more run.”</div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Mistakes cost shields, not your whole flow, so pressure stays fun.</div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Correct streaks raise your multiplier and push the score climb.</div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Every run writes back mastery, XP, and weak concepts for review.</div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-[#11141d]/70 p-6 backdrop-blur-xl">
                            <h3 className="mb-4 text-lg font-black">What Powers The Rounds</h3>
                            <div className="grid gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="font-black text-sky-300">Quick Recall</div>
                                    <div className="mt-1 text-sm text-slate-400">Due flashcards first, then notes and resource-based fallback prompts.</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="font-black text-orange-300">Exam Sprint</div>
                                    <div className="mt-1 text-sm text-slate-400">Saved quizzes first, then exam-style rounds built from the past-questions bank.</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="font-black text-emerald-300">Weak Spot Rescue</div>
                                    <div className="mt-1 text-sm text-slate-400">Recent misses and low-confidence material are prioritized before anything else.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
