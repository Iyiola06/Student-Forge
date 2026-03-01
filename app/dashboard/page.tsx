'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';
import { decodeAbbreviation, getDashboardInsights } from '@/lib/aiClient';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { profile, isLoading } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const readiness = profile?.exam_readiness_score || 0;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const progressPercent = Math.min((xp % 1000) / 10, 100);
  const xpToNext = 1000 - (xp % 1000);

  // Dynamic Date Logic
  const [daysToExam, setDaysToExam] = useState(14); // Default fallback
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // In a real app, this would be fetched from user settings/profile
    // For now, we simulate a countdown to a fixed date or just keep it dynamic
    const examDate = new Date(currentYear, 5, 15); // June 15th
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysToExam(diffDays > 0 ? diffDays : 14);
  }, [currentYear]);

  // AI Feature States
  const [abbrInput, setAbbrInput] = useState('');
  const [abbrResult, setAbbrResult] = useState<{ fullForm: string; definition: string } | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const [insights, setInsights] = useState<{ keyPoints: string[]; hotList: string[] } | null>(null);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);
  const [recentResource, setRecentResource] = useState<{ id: string, title: string } | null>(null);
  const [cardsDue, setCardsDue] = useState(0);

  useEffect(() => {
    async function fetchDueCards() {
      if (!profile) return;
      const supabase = createClient();
      const { count, error } = await supabase
        .from('flashcard_items')
        .select('id', { count: 'exact', head: true })
        .lte('next_review_at', new Date().toISOString());

      if (!error && count !== null) {
        setCardsDue(count);
      }
    }
    fetchDueCards();
  }, [profile]);

  useEffect(() => {
    async function fetchInsights() {
      if (!profile) return;
      setIsFetchingInsights(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('resources')
          .select('id, title, content')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setRecentResource(data[0]);
          // Use real content for insights if available, otherwise fallback to title
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
    fetchInsights();
  }, [profile]);

  const handleDecode = async () => {
    if (!abbrInput.trim()) return;
    setIsDecoding(true);
    try {
      const res = await decodeAbbreviation(abbrInput);
      setAbbrResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDecoding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex items-center justify-center">
        <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-8 px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full overflow-y-auto">
          {/* Welcome Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
              Welcome back, {firstName}!
            </h1>
            <p className="text-slate-500 dark:text-[#9c9cba] text-base font-normal leading-normal">
              Your exam is in {daysToExam} days. You&apos;re on track to crush it!
            </p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Exam Readiness Score */}
            <div className="flex flex-col p-5 bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm relative overflow-hidden group hover:border-[#ea580c]/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                  Exam Readiness
                </h3>
                <span className="material-symbols-outlined text-[#ea580c] bg-[#ea580c]/10 p-1.5 rounded-lg">
                  analytics
                </span>
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
                    className="text-[#ea580c]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeDasharray="351.86"
                    strokeDashoffset={351.86 * (1 - readiness / 100)}
                    strokeLinecap="round"
                    strokeWidth="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {readiness}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#9c9cba] uppercase font-bold">
                    Ready
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 dark:text-[#9c9cba] mt-2">
                Top 15% of students
              </p>
            </div>
            {/* Cards Mastered */}
            <div className="flex flex-col p-5 bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:border-[#ea580c]/50 transition-colors">
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
                <span className="text-sm font-medium text-green-500 mb-1">
                  Keep going!
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-2 mt-auto">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(((profile?.cards_mastered || 0) / 200) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            {/* Days Streak */}
            <div className="flex flex-col p-5 bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:border-[#ea580c]/50 transition-colors">
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
                <span className="text-sm font-medium text-orange-500 mb-1">
                  Personal Best!
                </span>
              </div>
              <div className="flex gap-1 mt-auto">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < (profile?.streak_days || 0) % 7 ? 'bg-orange-500' : 'bg-slate-200 dark:bg-[#2d2d3f]'}`}
                  ></div>
                ))}
              </div>
            </div>
            {/* Level & XP */}
            <div className="flex flex-col p-5 bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:border-[#ea580c]/50 transition-colors cursor-pointer group">
              <Link href="/leaderboard">
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
                    className="bg-purple-500 h-2 rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">{xpToNext} XP to Level {level + 1}</p>
              </Link>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/flashcards" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-[#ea580c] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252535] transition-all group shadow-sm shadow-[#ea580c]/20">
              <div className="bg-[#ea580c]/10 shrink-0 p-3 rounded-lg text-[#ea580c] group-hover:scale-110 transition-transform relative">
                <span className="material-symbols-outlined text-2xl">
                  style
                </span>
                {cardsDue > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="text-left w-full min-w-0">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                  Reviews Due
                </h3>
                <p className="text-[#ea580c] font-bold text-sm truncate">
                  {cardsDue > 0 ? `${cardsDue} cards waiting` : 'All caught up!'}
                </p>
              </div>
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252535] transition-all group">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 shrink-0 rounded-lg text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">
                  leaderboard
                </span>
              </div>
              <div className="text-left w-full min-w-0">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                  Leaderboard
                </h3>
                <p className="text-slate-500 dark:text-[#9c9cba] text-sm truncate">
                  You are #3 in your class
                </p>
              </div>
            </Link>
            <button className="flex items-center gap-4 p-4 bg-[#ea580c] text-white rounded-xl shadow-lg shadow-[#ea580c]/25 hover:bg-[#ea580c]/90 transition-all group">
              <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">
                  shuffle
                </span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Launch Shuffle Mode</h3>
                <p className="text-white/80 text-sm">
                  Mix topics for better retention
                </p>
              </div>
            </button>
            {recentResource ? (
              <Link href={`/resources`} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-[#ea580c]/30 rounded-xl hover:border-[#ea580c] transition-all group overflow-hidden">
                <div className="bg-[#ea580c]/10 shrink-0 p-3 rounded-lg text-[#ea580c] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">
                    play_arrow
                  </span>
                </div>
                <div className="text-left w-full min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                    Continue Learning
                  </h3>
                  <p className="text-slate-500 dark:text-[#9c9cba] text-sm truncate">
                    {recentResource.title}
                  </p>
                </div>
              </Link>
            ) : (
              <button disabled className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl opacity-70 cursor-not-allowed group">
                <div className="bg-slate-100 dark:bg-[#2d2d3f] shrink-0 p-3 rounded-lg text-slate-600 dark:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    history
                  </span>
                </div>
                <div className="text-left w-full min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                    Resume History
                  </h3>
                  <p className="text-slate-500 dark:text-[#9c9cba] text-sm truncate">
                    No recent activity
                  </p>
                </div>
              </button>
            )}
          </div>
          {/* Recommended Tools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Abbreviations Decoder */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined">translate</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Abbreviations Decoder
                </h3>
              </div>
              <p className="text-slate-500 dark:text-[#9c9cba] text-sm">
                Instantly expand complex acronyms found in your study materials.
              </p>
              <div className="mt-auto pt-4 space-y-4">
                {abbrResult && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-2">
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-1">{abbrResult.fullForm}</p>
                    <p className="text-slate-500 dark:text-[#9c9cba] text-xs">{abbrResult.definition}</p>
                  </div>
                )}
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#2d2d3f] rounded-lg py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
                    placeholder="e.g. DNA, ATP..."
                    type="text"
                    value={abbrInput}
                    onChange={(e) => setAbbrInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDecode()}
                  />
                  <button
                    onClick={handleDecode}
                    disabled={isDecoding}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ea580c] disabled:opacity-50"
                  >
                    {isDecoding ? (
                      <div className="size-4 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-lg">search</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* Key Points Spotlight */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Key Points Spotlight
                </h3>
              </div>
              <p className="text-slate-500 dark:text-[#9c9cba] text-sm">
                AI highlights the most critical concepts from your last uploaded PDF.
              </p>
              <div className="mt-auto pt-2 flex flex-wrap gap-2 text-center items-center justify-center min-h-[40px]">
                {isFetchingInsights ? (
                  <div className="flex gap-2 animate-pulse">
                    <div className="h-6 w-16 bg-slate-100 dark:bg-[#2d2d3f] rounded"></div>
                    <div className="h-6 w-20 bg-slate-100 dark:bg-[#2d2d3f] rounded"></div>
                    <div className="h-6 w-14 bg-slate-100 dark:bg-[#2d2d3f] rounded"></div>
                  </div>
                ) : insights?.keyPoints ? (
                  insights.keyPoints.map((kp, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-[#2d2d3f] text-xs font-medium rounded-md text-slate-600 dark:text-slate-300">
                      {kp}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No materials found</span>
                )}
              </div>
            </div>
            {/* Examiner's Hot List */}
            <div className="bg-gradient-to-br from-[#ea580c] to-[#1a1aeb] rounded-xl p-6 flex flex-col gap-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">
                  local_fire_department
                </span>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-lg text-white">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h3 className="text-lg font-bold">Examiner&apos;s Hot List</h3>
              </div>
              <div className="space-y-2 relative z-10">
                <p className="text-white/80 text-xs mb-2">
                  Topics predicted to appear in {currentYear}&apos;s exams based on past trends.
                </p>
                {isFetchingInsights ? (
                  <div className="space-y-2 opacity-30">
                    <div className="h-4 w-3/4 bg-white/20 rounded"></div>
                    <div className="h-4 w-1/2 bg-white/20 rounded"></div>
                  </div>
                ) : insights?.hotList ? (
                  insights.hotList.map((hot, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      {hot}
                    </div>
                  ))
                ) : (
                  <p className="text-white/80 text-sm">
                    Topics predicted based on past trends.
                  </p>
                )}
              </div>
              <button className="mt-auto w-full bg-white text-[#ea580c] py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors relative z-10 uppercase tracking-widest text-[10px]">
                {insights ? 'Analyze Trends' : 'View Predictions'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
