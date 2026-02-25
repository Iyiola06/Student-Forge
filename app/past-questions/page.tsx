'use client';

import Link from 'next/link';

export default function PastQuestionsPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Top Navigation (Reused from Dashboard) */}
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
              className="text-slate-900 dark:text-white font-bold text-sm leading-normal border-b-2 border-[#2525f4]"
              href="/past-questions"
            >
              Past Questions
            </Link>
            <Link
              className="text-slate-600 dark:text-slate-400 hover:text-[#2525f4] dark:hover:text-white transition-colors text-sm font-medium leading-normal"
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Past Questions Bank
            </h1>
            <p className="text-slate-500 dark:text-[#9c9cba]">
              Access thousands of past exam papers to practice and prepare.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                className="h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4] w-64"
                placeholder="Search by subject, year..."
                type="text"
              />
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select className="h-10 px-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-[#2525f4]">
            <option>All Exam Bodies</option>
            <option>WAEC</option>
            <option>NECO</option>
            <option>JAMB</option>
            <option>GCE</option>
          </select>
          <select className="h-10 px-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-[#2525f4]">
            <option>All Years</option>
            <option>2023</option>
            <option>2022</option>
            <option>2021</option>
            <option>2020</option>
          </select>
          <select className="h-10 px-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-[#2525f4]">
            <option>All Subjects</option>
            <option>Mathematics</option>
            <option>English Language</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>Biology</option>
          </select>
        </div>
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 hover:shadow-lg transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg">
                <span className="font-bold text-xl">WAEC</span>
              </div>
              <span className="px-2 py-1 bg-slate-100 dark:bg-[#252535] text-xs font-bold rounded text-slate-600 dark:text-slate-300">
                2023
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
              Mathematics
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-4">
              May/June Senior School Certificate Examination
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-[#2d2d3f]">
              <span className="text-xs text-slate-400 font-medium">
                PDF • 2.4 MB
              </span>
              <button className="text-[#2525f4] hover:bg-[#2525f4]/10 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 hover:shadow-lg transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-3 rounded-lg">
                <span className="font-bold text-xl">JAMB</span>
              </div>
              <span className="px-2 py-1 bg-slate-100 dark:bg-[#252535] text-xs font-bold rounded text-slate-600 dark:text-slate-300">
                2023
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
              Physics
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-4">
              Unified Tertiary Matriculation Examination
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-[#2d2d3f]">
              <span className="text-xs text-slate-400 font-medium">
                CBT • Interactive
              </span>
              <button className="text-[#2525f4] hover:bg-[#2525f4]/10 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 hover:shadow-lg transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 p-3 rounded-lg">
                <span className="font-bold text-xl">NECO</span>
              </div>
              <span className="px-2 py-1 bg-slate-100 dark:bg-[#252535] text-xs font-bold rounded text-slate-600 dark:text-slate-300">
                2022
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
              English Language
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-4">
              June/July Senior School Certificate Examination
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-[#2d2d3f]">
              <span className="text-xs text-slate-400 font-medium">
                PDF • 1.8 MB
              </span>
              <button className="text-[#2525f4] hover:bg-[#2525f4]/10 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
