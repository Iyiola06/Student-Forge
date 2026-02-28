'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';

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
            {/* Badge 1 */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow group">
              <div className="size-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500 border-4 border-yellow-500/20 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">
                  local_fire_department
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                7 Day Streak
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                Studied for 7 consecutive days
              </p>
            </div>
            {/* Badge 2 */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow group">
              <div className="size-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 border-4 border-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">
                  psychology
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Quiz Master
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                Scored 100% on 5 quizzes
              </p>
            </div>
            {/* Badge 3 */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow group">
              <div className="size-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 border-4 border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">
                  menu_book
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Bookworm
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                Read 500 pages of material
              </p>
            </div>
            {/* Badge 4 (Locked) */}
            <div className="bg-slate-50 dark:bg-[#1b1b27]/50 rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 flex flex-col items-center text-center grayscale opacity-70">
              <div className="size-20 rounded-full bg-slate-200 dark:bg-[#2d2d3f] flex items-center justify-center text-slate-400 border-4 border-slate-300 dark:border-[#3b3b54] mb-4">
                <span className="material-symbols-outlined text-4xl">lock</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Speed Reader
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                Read 100 pages in 1 hour
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
