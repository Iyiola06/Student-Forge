'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LeaderboardPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Sidebar Navigation */}
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2525f4]/10 text-[#2525f4] font-medium"
            href="/leaderboard"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span>Leaderboard</span>
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
          <div className="text-xs font-semibold text-slate-400 dark:text-[#6b6b8a] uppercase tracking-wider mb-2 mt-6 px-2">
            Personal
          </div>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Leaderboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#252535] px-3 py-1.5 rounded-full">
              <span className="text-sm font-bold text-[#2525f4]">Level 12</span>
              <div className="w-px h-4 bg-slate-300 dark:bg-[#3b3b54]"></div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">2,450 XP</span>
            </div>
            <div
              className="bg-cover bg-center bg-no-repeat rounded-full w-9 h-9 border-2 border-slate-200 dark:border-[#3b3b54]"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
              }}
            ></div>
          </div>
        </header>

        {/* Leaderboard Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-4 mb-12 pt-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="size-20 rounded-full border-4 border-slate-300 dark:border-slate-600 overflow-hidden">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWvxINhIexGAXnu4Ns3IbZUa5PjHvWsqArX5UebB00Ol5YRKll-fY4BkF2pvnGEB1I2oLRNoBithKJW5OHyk1xohOboakbW9GJpjpIHexaX47-6XevhottW4dsBJ_aFdnuRTzc5NLDFVoz1z94y-cxqO01pOmH23-XiZilm909rwK7YkMTzs-gLnbt5Ae1d80czYU_Lk8ugVpxPla58kr-R_ZSWfJey4o0jibCic808ySvMqsLIevJ4c1fSftRc7MbbG-UPIEQVYGX"
                      alt="User 2"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    2
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white">Alex M.</p>
                  <p className="text-sm text-[#2525f4] font-bold">2,890 XP</p>
                </div>
                <div className="h-24 w-20 bg-slate-200 dark:bg-[#252535] rounded-t-lg mt-2"></div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center z-10">
                <div className="relative mb-4">
                  <div className="size-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg shadow-yellow-400/20">
                    <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      SJ
                    </div>
                  </div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                    <span className="material-symbols-outlined text-4xl">crown</span>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    1
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white text-lg">Sarah J.</p>
                  <p className="text-sm text-[#2525f4] font-bold">3,150 XP</p>
                </div>
                <div className="h-32 w-24 bg-gradient-to-b from-yellow-100 to-white dark:from-yellow-900/20 dark:to-[#1b1b27] border-t border-x border-yellow-200 dark:border-yellow-900/30 rounded-t-lg mt-2 flex items-end justify-center pb-4">
                  <span className="text-4xl font-black text-yellow-400/20">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="size-20 rounded-full border-4 border-orange-300 dark:border-orange-700 overflow-hidden">
                     <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN"
                      alt="User 3"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    3
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 dark:text-white">You</p>
                  <p className="text-sm text-[#2525f4] font-bold">2,450 XP</p>
                </div>
                <div className="h-20 w-20 bg-orange-50 dark:bg-[#252535] rounded-t-lg mt-2"></div>
              </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Global Ranking</h3>
                <div className="flex gap-2">
                   <button className="px-3 py-1 text-xs font-bold bg-[#2525f4] text-white rounded-lg">Weekly</button>
                   <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded-lg transition-colors">All Time</button>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#2d2d3f]">
                {[4, 5, 6, 7, 8].map((rank) => (
                  <div key={rank} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-[#252535] transition-colors">
                    <span className="w-8 text-center font-bold text-slate-400">{rank}</span>
                    <div className="size-10 rounded-full bg-slate-200 dark:bg-[#2d2d3f]"></div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">Student {rank}</p>
                      <p className="text-xs text-slate-500 dark:text-[#9c9cba]">Level {15 - rank}</p>
                    </div>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{2400 - (rank * 50)} XP</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
