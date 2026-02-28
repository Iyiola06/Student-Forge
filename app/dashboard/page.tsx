'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';

export default function DashboardPage() {
  const { profile, isLoading } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const readiness = profile?.exam_readiness_score || 0;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const progressPercent = Math.min((xp % 1000) / 10, 100);
  const xpToNext = 1000 - (xp % 1000);

  if (isLoading) {
    return (
      <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex items-center justify-center">
        <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
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
              Your exam is in 14 days. You&apos;re on track to crush it!
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/leaderboard" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252535] transition-all group">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">
                  leaderboard
                </span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Leaderboard
                </h3>
                <p className="text-slate-500 dark:text-[#9c9cba] text-sm">
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
            <button className="flex items-center gap-4 p-4 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl hover:bg-slate-50 dark:hover:bg-[#252535] transition-all group">
              <div className="bg-slate-100 dark:bg-[#2d2d3f] p-3 rounded-lg text-slate-600 dark:text-white group-hover:text-[#ea580c] transition-colors">
                <span className="material-symbols-outlined text-2xl">
                  history
                </span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Resume History
                </h3>
                <p className="text-slate-500 dark:text-[#9c9cba] text-sm">
                  Continue where you left off
                </p>
              </div>
            </button>
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
              <div className="mt-auto pt-4">
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#2d2d3f] rounded-lg py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
                    placeholder="e.g. DNA, ATP..."
                    type="text"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ea580c]">
                    <span className="material-symbols-outlined text-lg">
                      search
                    </span>
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
                AI highlights the most critical concepts from your last uploaded
                PDF.
              </p>
              <div className="mt-auto pt-2 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-100 dark:bg-[#2d2d3f] text-xs font-medium rounded-md text-slate-600 dark:text-slate-300">
                  Photosynthesis
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-[#2d2d3f] text-xs font-medium rounded-md text-slate-600 dark:text-slate-300">
                  Cellular Respiration
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-[#2d2d3f] text-xs font-medium rounded-md text-slate-600 dark:text-slate-300">
                  Mitosis
                </span>
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
              <p className="text-white/80 text-sm relative z-10">
                Topics predicted to appear in this year&apos;s exams based on past
                trends.
              </p>
              <button className="mt-auto w-full bg-white text-[#ea580c] py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors relative z-10">
                View Predictions
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
