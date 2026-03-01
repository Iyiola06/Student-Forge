'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { BADGES } from '@/lib/constants/badges';

export default function ProfilePage() {
  const { profile, isLoading } = useProfile();

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
        <main className="flex flex-1 flex-col px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full">
          {/* Profile Header */}
          <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-[#ea580c] to-purple-600"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end gap-6">
                  <div className="size-32 rounded-full border-4 border-white dark:border-[#1b1b27] bg-white dark:bg-[#1b1b27] overflow-hidden shadow-lg relative">
                    <Image
                      alt="Profile"
                      className="object-cover"
                      src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                      fill
                    />
                  </div>
                  <div className="mb-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {profile?.full_name || 'Student'}
                    </h1>
                    <p className="text-slate-500 dark:text-[#9c9cba] capitalize">
                      {profile?.role || 'Student'} • Level {profile?.level || 1}
                    </p>
                  </div>
                </div>
                <Link href="/settings">
                  <button className="px-4 py-2 bg-white dark:bg-[#252535] border border-slate-200 dark:border-[#3b3b54] rounded-lg text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors shadow-sm">
                    Edit Profile
                  </button>
                </Link>
              </div>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-[#2d2d3f] pt-6">
                <div className="text-center border-r border-slate-100 dark:border-[#2d2d3f]">
                  <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                    {profile?.resources_uploaded !== undefined ? profile.resources_uploaded : 0}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                    PDFs Uploaded
                  </span>
                </div>
                <div className="text-center border-r border-slate-100 dark:border-[#2d2d3f]">
                  <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                    {profile?.quizzes_taken !== undefined ? profile.quizzes_taken : 0}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                    Quizzes Taken
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-[#ea580c]">
                    {profile?.exam_readiness_score || 0}%
                  </span>
                  <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                    Exam Ready Score
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-[#2d2d3f] mb-8">
            <nav className="flex gap-8">
              <Link
                className="border-b-2 border-[#ea580c] pb-4 px-1 text-sm font-bold text-[#ea580c]"
                href="/profile"
              >
                Badges & Achievements
              </Link>
              <Link
                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                href="/activity"
              >
                Activity
              </Link>
              <Link
                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                href="/past-questions?tab=my_submissions"
              >
                My Uploads
              </Link>
              <Link
                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                href="/history"
              >
                Study History
              </Link>
              <Link
                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                href="/settings"
              >
                Settings
              </Link>
            </nav>
          </div>
          {/* Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {BADGES.map((badge) => {
              const isUnlocked = profile?.badges?.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col items-center text-center transition-all group ${isUnlocked ? 'hover:shadow-lg hover:border-[#ea580c]/50' : 'grayscale opacity-70'}`}
                >
                  <div className={`size-20 rounded-full flex items-center justify-center border-4 mb-4 transition-transform ${isUnlocked ? 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/20 group-hover:scale-110' : 'bg-slate-200 dark:bg-[#2d2d3f] text-slate-400 border-slate-300 dark:border-[#3b3b54]'}`}>
                    <span className="material-symbols-outlined text-4xl">
                      {isUnlocked ? badge.icon : 'lock'}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    {badge.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-[#9c9cba] leading-tight">
                    {badge.desc}
                  </p>
                  {!isUnlocked && (
                    <div className="mt-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Locked</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
