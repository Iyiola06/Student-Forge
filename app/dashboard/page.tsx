'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';
import { getDashboardInsights } from '@/lib/aiClient';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { profile, isLoading } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const progressPercent = Math.min((xp % 1000) / 10, 100);
  const xpToNext = 1000 - (xp % 1000);

  // Dynamic Date Logic
  const [daysToExam, setDaysToExam] = useState(14);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (profile?.exam_date) {
      const examDate = new Date(profile.exam_date);
      const today = new Date();
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExam(diffDays > 0 ? diffDays : 0);
    } else {
      const examDate = new Date(currentYear, 5, 15);
      const today = new Date();
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExam(diffDays > 0 ? diffDays : 14);
    }
  }, [profile, currentYear]);

  // AI & Data States
  const [insights, setInsights] = useState<{ keyPoints: string[]; hotList: string[] } | null>(null);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);
  const [recentResource, setRecentResource] = useState<{ id: string, title: string } | null>(null);

  // Review Due State
  const [cardsDue, setCardsDue] = useState(0);
  const [overdue24h, setOverdue24h] = useState(false);

  // Readiness Stats
  const [totalCards, setTotalCards] = useState(0);
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [generatedReadiness, setGeneratedReadiness] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      const supabase = createClient();

      // Fetch Due Cards
      const now = new Date();
      const { count: dueCount } = await supabase
        .from('flashcard_items')
        .select('id, next_review_at', { count: 'exact' })
        .lte('next_review_at', now.toISOString());

      if (dueCount !== null) setCardsDue(dueCount);

      // Check for >24h overdue
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { count: overdueCount } = await supabase
        .from('flashcard_items')
        .select('id', { count: 'exact', head: true })
        .lte('next_review_at', yesterday.toISOString());

      if (overdueCount && overdueCount > 0) setOverdue24h(true);

      // Fetch totals for readiness formula
      const { count: totalCardsCount } = await supabase
        .from('flashcard_items')
        .select('id', { count: 'exact', head: true });

      if (totalCardsCount !== null) setTotalCards(totalCardsCount);

      // Calculate new Exam Readiness:
      // (cards mastered / total cards created) * 40% + (quizzes taken approx) * 40% + (streak) * 20%
      const cardsMastered = profile.cards_mastered || 0;
      const cardScore = totalCardsCount ? Math.min((cardsMastered / totalCardsCount) * 40, 40) : 0;

      const quizzes = profile.quizzes_taken || 0;
      setQuizzesTaken(quizzes);
      const quizScore = Math.min((quizzes / 10) * 40, 40); // 10 quizzes maxes this out for MVP

      const streak = profile.streak_days || 0;
      const streakScore = Math.min((streak / 7) * 20, 20); // 7 day streak maxes this out

      const newReadiness = Math.round(cardScore + quizScore + streakScore);
      setGeneratedReadiness(newReadiness);

      // Fetch Recent Resource & Insights
      setIsFetchingInsights(true);
      try {
        const { data } = await supabase
          .from('resources')
          .select('id, title, content')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setRecentResource(data[0]);
          const context = data[0].content && data[0].content.length > 50
            ? data[0].content.substring(0, 3000)
            : `User is studying: ${data[0].title}`;
          const res = await getDashboardInsights(context);
          setInsights(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsFetchingInsights(false);
      }
    }
    fetchData();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="main-bg font-display min-h-screen flex items-center justify-center">
        <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine Primary Smart CTA
  let smartCTA = null;
  if (!recentResource && generatedReadiness === 0) {
    smartCTA = (
      <div className="bg-gradient-to-r from-blue-600 to-[#7c3aed] rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
            <span className="text-3xl">👋</span> You haven't studied anything yet!
          </h2>
          <p className="text-blue-100 font-medium">
            Upload a PDF document or pick a past question to get your exam preparation started.
          </p>
        </div>
        <Link href="/generator" className="shrink-0 px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg shadow-black/10">
          Upload PDF Now
        </Link>
      </div>
    );
  } else if (cardsDue > 0) {
    smartCTA = (
      <Link href="/flashcards" className={`block rounded-2xl p-6 text-white shadow-xl mb-8 transition-transform hover:-translate-y-1 ${overdue24h ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/30 ring-4 ring-red-500/50 blink-shadow' : 'bg-gradient-to-r from-[#ea580c] to-orange-500 shadow-orange-500/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-3xl">style</span>
              <h2 className="text-2xl font-black">Reviews Due ({cardsDue})</h2>
              {overdue24h && <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full animate-pulse uppercase tracking-wider">Urgent &gt; 24h</span>}
            </div>
            <p className="text-white/90 font-medium">
              You have {cardsDue} flashcards scheduled for review. Keep your memory sharp!
            </p>
          </div>
          <span className="material-symbols-outlined text-4xl opacity-50">arrow_forward_ios</span>
        </div>
      </Link>
    );
  } else if (profile && profile.streak_days > 0 && profile.streak_days < 3) {
    smartCTA = (
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">local_fire_department</span> Keep Your Streak Alive!
          </h2>
          <p className="text-orange-50 font-medium">
            You're on a {profile.streak_days}-day streak. Complete a quick study session to protect it.
          </p>
        </div>
        <Link href={recentResource ? `/resources` : `/generator`} className="shrink-0 px-8 py-3.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg shadow-black/10">
          Start Session
        </Link>
      </div>
    );
  }

  return (
    <div className="main-bg flex flex-col md:flex-row antialiased selection:bg-[#ea580c] selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex flex-1 flex-col px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full md:overflow-y-auto">

          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
              Welcome back, {firstName}!
            </h1>
            <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-normal">
              Your exam is in {daysToExam} days. You&apos;re on track to crush it!
            </p>
          </div>

          {/* Smart Primary CTA */}
          {smartCTA}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Exam Readiness Score - with Tooltip */}
            <div className="premium-card flex flex-col p-5 relative group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                  Exam Readiness
                </h3>
                <div className="relative cursor-help">
                  <span className="material-symbols-outlined text-[#ea580c] bg-[#ea580c]/10 p-1.5 rounded-lg">
                    info
                  </span>
                  <div className="absolute right-0 top-10 w-64 p-4 bg-slate-900 text-white text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    <div className="font-bold text-sm mb-2 text-[#ea580c]">Score Calculation</div>
                    <div className="space-y-2 opacity-90">
                      <div className="flex justify-between"><span>Cards Mastered:</span> <span>40%</span></div>
                      <div className="flex justify-between"><span>Quiz Accuracy:</span> <span>40%</span></div>
                      <div className="flex justify-between"><span>Streak Consistency:</span> <span>20%</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center relative h-32 w-32 mx-auto">
                {/* Gauge SVG */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-slate-200 dark:text-[#2d2d3f]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                  ></circle>
                  <circle
                    className="text-[#ea580c] transition-all duration-1000 ease-out"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeDasharray="351.86"
                    strokeDashoffset={351.86 * (1 - generatedReadiness / 100)}
                    strokeLinecap="round"
                    strokeWidth="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {generatedReadiness}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cards Mastered */}
            <div className="premium-card flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 dark:text-[#9c9cba] text-sm font-medium leading-tight">
                  Cards Mastered
                </h3>
                <span className="material-symbols-outlined text-green-500 bg-green-500/10 p-1.5 rounded-lg">
                  check_circle
                </span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {profile?.cards_mastered || 0}
                </span>
                <span className="text-sm font-medium text-slate-400 mb-1">
                  / {totalCards}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-2 mt-auto">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: totalCards ? `${((profile?.cards_mastered || 0) / totalCards) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Days Streak */}
            <div className="premium-card flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 dark:text-[#9c9cba] text-sm font-medium leading-tight">
                  Days Streak
                </h3>
                <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-1.5 rounded-lg">
                  local_fire_department
                </span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {profile?.streak_days || 0}
                </span>
              </div>
              <div className="flex gap-1 mt-auto">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${i < (profile?.streak_days || 0) % 7 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-[#2d2d3f]'}`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Level & XP */}
            <Link href="/leaderboard" className="premium-card flex flex-col p-5 cursor-pointer group hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 dark:text-[#9c9cba] text-sm font-medium leading-tight">
                  Level {level}
                </h3>
                <span className="material-symbols-outlined text-purple-500 bg-purple-500/10 p-1.5 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  military_tech
                </span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {xp.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-purple-500 mb-1">
                  XP
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-2 mt-auto">
                <div
                  className="bg-purple-500 h-2 rounded-full relative transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right">{xpToNext} XP to Level {level + 1}</p>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Continue Learning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentResource ? (
                  <Link href={`/resources`} className="flex items-center gap-4 p-5 bg-white dark:bg-[#1b1b27] border border-[#ea580c]/30 rounded-2xl hover:border-[#ea580c] transition-all group overflow-hidden shadow-sm">
                    <div className="bg-[#ea580c]/10 shrink-0 p-4 rounded-xl text-[#ea580c] group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">play_arrow</span>
                    </div>
                    <div className="text-left w-full min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                        Resume Reading
                      </h3>
                      <p className="text-slate-500 dark:text-[#9c9cba] text-sm truncate">
                        {recentResource.title}
                      </p>
                    </div>
                  </Link>
                ) : null}

                <Link href="/generator" className="flex items-center gap-4 p-5 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-2xl hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#252535] transition-all group shadow-sm">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 shrink-0 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <div className="text-left w-full min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                      Generate Practice
                    </h3>
                    <p className="text-slate-500 dark:text-[#9c9cba] text-sm truncate">
                      Upload PDF to create quiz
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Examiner's Hot List Sidebar */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 flex flex-col h-full text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <span className="material-symbols-outlined text-[120px]">local_fire_department</span>
                </div>
                <div className="flex items-center gap-3 relative z-10 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg text-orange-400">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <h3 className="text-xl font-bold">Examiner&apos;s Hot List</h3>
                </div>
                <div className="space-y-4 relative z-10 flex-1">
                  <p className="text-indigo-200 text-sm mb-4">
                    Topics predicted to appear in exams based on your recently studied materials.
                  </p>
                  {isFetchingInsights ? (
                    <div className="space-y-3 opacity-50">
                      <div className="h-4 w-3/4 bg-white/20 rounded-full"></div>
                      <div className="h-4 w-full bg-white/20 rounded-full"></div>
                      <div className="h-4 w-5/6 bg-white/20 rounded-full"></div>
                    </div>
                  ) : insights?.hotList && insights.hotList.length > 0 ? (
                    <div className="space-y-3">
                      {insights.hotList.map((hot, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="material-symbols-outlined text-orange-400 text-lg mt-0.5">star</span>
                          <span className="text-sm font-medium leading-snug">{hot}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 border-dashed">
                      <p className="text-indigo-300 text-sm">Upload a document to see AI-predicted exam topics.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
