'use client';

import Link from 'next/link';

export default function HistoryPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Sidebar Navigation (Reused) */}
      <aside className="w-64 bg-white dark:bg-[#1b1b27] border-r border-slate-200 dark:border-[#2d2d3f] flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 text-[#2525f4] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
            StudyForge
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 dark:text-[#6b6b8a] uppercase tracking-wider mb-2 mt-4 px-2">
            Menu
          </div>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/dashboard"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              dashboard
            </span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/resources"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              library_books
            </span>
            <span className="font-medium">Resource Library</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/gamifier"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              sports_esports
            </span>
            <span className="font-medium">PDF Gamifier</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/past-questions"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              history_edu
            </span>
            <span className="font-medium">Past Questions</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/generator"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              psychology
            </span>
            <span className="font-medium">Question Generator</span>
          </Link>
          <div className="text-xs font-semibold text-slate-400 dark:text-[#6b6b8a] uppercase tracking-wider mb-2 mt-6 px-2">
            Personal
          </div>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2525f4]/10 text-[#2525f4] font-medium"
            href="/history"
          >
            <span className="material-symbols-outlined">history</span>
            <span>Study History</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/profile"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              person
            </span>
            <span className="font-medium">Profile</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/settings"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              settings
            </span>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Study History
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                className="h-9 pl-9 pr-4 rounded-lg bg-slate-100 dark:bg-[#111118] border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4]"
                placeholder="Search history..."
                type="text"
              />
            </div>
            <button className="p-2 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded-full transition-colors relative">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </header>
        {/* Timeline Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-[#2d2d3f]"></div>
            {/* Timeline Items */}
            <div className="space-y-8">
              {/* Item 1: Today */}
              <div className="relative pl-20">
                <div className="absolute left-0 top-0 w-16 text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Today
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    10:30 AM
                  </span>
                </div>
                <div className="absolute left-[30px] top-1.5 w-4 h-4 rounded-full bg-[#2525f4] border-4 border-white dark:border-[#101022] shadow-sm z-10"></div>
                <div className="bg-white dark:bg-[#1b1b27] p-4 rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">quiz</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Completed Quiz: Cellular Respiration
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                          Biology • Chapter 4
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded">
                      Score: 85%
                    </span>
                  </div>
                </div>
              </div>
              {/* Item 2: Yesterday */}
              <div className="relative pl-20">
                <div className="absolute left-0 top-0 w-16 text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Yesterday
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    4:15 PM
                  </span>
                </div>
                <div className="absolute left-[30px] top-1.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-[#101022] shadow-sm z-10"></div>
                <div className="bg-white dark:bg-[#1b1b27] p-4 rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">
                          menu_book
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Read: Intro to Physics
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                          Physics • Chapter 1 • 45 mins
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Item 3: Oct 22 */}
              <div className="relative pl-20">
                <div className="absolute left-0 top-0 w-16 text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Oct 22
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    9:00 AM
                  </span>
                </div>
                <div className="absolute left-[30px] top-1.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-[#101022] shadow-sm z-10"></div>
                <div className="bg-white dark:bg-[#1b1b27] p-4 rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">
                          assignment
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Uploaded Assignment: History Essay
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                          History • WWII
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Item 4: Oct 20 */}
              <div className="relative pl-20">
                <div className="absolute left-0 top-0 w-16 text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Oct 20
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    2:30 PM
                  </span>
                </div>
                <div className="absolute left-[30px] top-1.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-[#101022] shadow-sm z-10"></div>
                <div className="bg-white dark:bg-[#1b1b27] p-4 rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">
                          play_circle
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Watched Video: Algebra Basics
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                          Mathematics • Algebra • 15 mins
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Load More */}
            <div className="text-center mt-8">
              <button className="px-4 py-2 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm font-medium text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] transition-colors">
                Load More History
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
