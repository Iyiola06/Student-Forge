'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Top Navigation (Reused) */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-3 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 text-[#2525f4] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            StudyForge
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8 items-center">
          <div className="hidden md:flex items-center gap-9">
            <Link
              className="text-slate-600 dark:text-slate-400 hover:text-[#2525f4] dark:hover:text-white transition-colors text-sm font-medium leading-normal"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-400 hover:text-[#2525f4] dark:hover:text-white transition-colors text-sm font-medium leading-normal"
              href="/resources"
            >
              Courses
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-400 hover:text-[#2525f4] dark:hover:text-white transition-colors text-sm font-medium leading-normal"
              href="/leaderboard"
            >
              Leaderboard
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-400 hover:text-[#2525f4] dark:hover:text-white transition-colors text-sm font-medium leading-normal"
              href="/generator"
            >
              Study Tools
            </Link>
            <Link
              className="text-slate-900 dark:text-white font-bold text-sm leading-normal border-b-2 border-[#2525f4]"
              href="/profile"
            >
              Profile
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="bg-cover bg-center bg-no-repeat rounded-full w-9 h-9 border-2 border-slate-200 dark:border-[#3b3b54]"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
              }}
            ></div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex flex-1 flex-col px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full">
        {/* Profile Header */}
        <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-[#2525f4] to-purple-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="flex items-end gap-6">
                <div className="size-32 rounded-full border-4 border-white dark:border-[#1b1b27] bg-white dark:bg-[#1b1b27] overflow-hidden shadow-lg relative">
                  <Image
                    alt="Profile"
                    className="object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN"
                    fill
                  />
                </div>
                <div className="mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Jane Doe
                  </h1>
                  <p className="text-slate-500 dark:text-[#9c9cba]">
                    Undergraduate Student • Biology Major
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
                  142
                </span>
                <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                  PDFs Uploaded
                </span>
              </div>
              <div className="text-center border-r border-slate-100 dark:border-[#2d2d3f]">
                <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                  1,250
                </span>
                <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                  Questions Generated
                </span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-[#2525f4]">
                  78%
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
              className="border-b-2 border-[#2525f4] pb-4 px-1 text-sm font-bold text-[#2525f4]"
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
              href="#"
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
  );
}
