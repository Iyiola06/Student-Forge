'use client';

import Link from 'next/link';

export default function GamifierPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-6 py-2 bg-white dark:bg-[#101022] sticky top-0 z-50 h-14">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <Link
            className="size-8 text-[#2525f4] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252535] rounded-lg transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-2xl">
              arrow_back
            </span>
          </Link>
          <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight truncate">
            Chapter 4: Cellular Respiration.pdf
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-[#252535] rounded-lg p-1">
            <button className="px-3 py-1 bg-white dark:bg-[#1b1b27] text-slate-900 dark:text-white text-xs font-bold rounded shadow-sm">
              Read
            </button>
            <button className="px-3 py-1 text-slate-500 dark:text-[#9c9cba] hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors">
              Quiz
            </button>
            <button className="px-3 py-1 text-slate-500 dark:text-[#9c9cba] hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors">
              Flashcards
            </button>
          </div>
          <div
            className="size-8 rounded-full bg-cover bg-center border border-slate-200 dark:border-[#3b3b54]"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
            }}
          ></div>
        </div>
      </header>
      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: PDF Viewer */}
        <main className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0c0c16] relative overflow-hidden">
          {/* Toolbar */}
          <div className="h-12 border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-4 bg-white dark:bg-[#1b1b27]">
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded transition-colors">
                <span className="material-symbols-outlined text-xl">
                  zoom_out
                </span>
              </button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-12 text-center">
                100%
              </span>
              <button className="p-1.5 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded transition-colors">
                <span className="material-symbols-outlined text-xl">
                  zoom_in
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-[#2525f4] bg-[#2525f4]/10 rounded transition-colors" title="Text Mode">
                <span className="material-symbols-outlined text-xl">
                  article
                </span>
              </button>
              <button className="p-1.5 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded transition-colors" title="Night Mode">
                <span className="material-symbols-outlined text-xl">
                  dark_mode
                </span>
              </button>
              <button className="p-1.5 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded transition-colors" title="Focus Mode">
                <span className="material-symbols-outlined text-xl">
                  center_focus_strong
                </span>
              </button>
            </div>
          </div>
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-3xl mx-auto bg-white dark:bg-[#1b1b27] min-h-full shadow-lg p-12 text-slate-900 dark:text-slate-300 leading-relaxed">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                4.1 Overview of Cellular Respiration
              </h1>
              <p className="mb-4">
                Cellular respiration is the process by which cells derive energy
                from glucose. The chemical reaction for cellular respiration
                involves glucose and oxygen as inputs, and produces carbon
                dioxide, water, and energy (ATP) as outputs.
              </p>
              <div className="my-8 p-4 bg-slate-100 dark:bg-[#252535] rounded-lg border-l-4 border-[#2525f4]">
                <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (ATP + Heat)
                </p>
              </div>
              <p className="mb-4">
                There are three main stages of cellular respiration: glycolysis,
                the citric acid cycle (Krebs cycle), and oxidative
                phosphorylation.
              </p>
              {/* Inline Quiz Trigger */}
              <div className="my-8 border border-[#2525f4]/30 bg-[#2525f4]/5 rounded-xl p-6 relative group cursor-pointer hover:bg-[#2525f4]/10 transition-colors">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-[#2525f4] text-white p-1 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-lg">
                    quiz
                  </span>
                </div>
                <h4 className="font-bold text-[#2525f4] mb-2 ml-4">
                  Quick Check
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 ml-4">
                  What is the primary output of cellular respiration used for
                  energy?
                </p>
              </div>
              <p className="mb-4">
                Glycolysis occurs in the cytosol of the cell and breaks down
                glucose into two molecules of pyruvate.
              </p>
              <div className="h-64 bg-slate-200 dark:bg-[#2d2d3f] rounded-lg flex items-center justify-center mb-6">
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  [Diagram: Glycolysis Pathway]
                </span>
              </div>
              <p>
                The pyruvate then enters the mitochondrion, where it is oxidized
                to acetyl CoA, which enters the Citric Acid Cycle.
              </p>
            </div>
            {/* Floating "Did You Know" Card */}
            <div className="absolute bottom-8 right-8 w-64 bg-[#2525f4] text-white p-4 rounded-xl shadow-2xl shadow-[#2525f4]/40 animate-bounce cursor-pointer hover:animate-none">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-300">
                  lightbulb
                </span>
                <div>
                  <h5 className="font-bold text-sm mb-1">Did You Know?</h5>
                  <p className="text-xs text-white/90">
                    A single glucose molecule can yield up to 32 ATP molecules!
                  </p>
                </div>
                <button className="text-white/60 hover:text-white">
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
        {/* Right Panel: Gamification Sidebar */}
        <aside className="w-80 bg-white dark:bg-[#1b1b27] border-l border-slate-200 dark:border-[#2d2d3f] flex flex-col">
          {/* User Progress Header */}
          <div className="p-6 border-b border-slate-200 dark:border-[#2d2d3f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-[#9c9cba] uppercase">
                Current Level
              </span>
              <span className="text-xs font-bold text-[#2525f4]">
                Level 12
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              Scholar Novice
            </h3>
            <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-[#2525f4] to-cyan-400 h-3 rounded-full relative"
                style={{width: '70%'}}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#2525f4] rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-[#9c9cba]">
              <span>2,450 XP</span>
              <span>3,000 XP</span>
            </div>
          </div>
          {/* Badges / Achievements */}
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Unlockable Badges
            </h4>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="size-14 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500 border-2 border-yellow-500/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">
                    local_fire_department
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">
                  7 Day Streak
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="size-14 rounded-full bg-slate-100 dark:bg-[#2d2d3f] flex items-center justify-center text-slate-400 border-2 border-transparent grayscale group-hover:grayscale-0 transition-all">
                  <span className="material-symbols-outlined text-2xl">
                    psychology
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center">
                  Quiz Master
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="size-14 rounded-full bg-slate-100 dark:bg-[#2d2d3f] flex items-center justify-center text-slate-400 border-2 border-transparent grayscale group-hover:grayscale-0 transition-all">
                  <span className="material-symbols-outlined text-2xl">
                    timer
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center">
                  Speed Reader
                </span>
              </div>
            </div>
            {/* Leaderboard Snippet */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Class Leaderboard
              </h4>
              <Link href="/leaderboard" className="text-[10px] font-bold text-[#2525f4] hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#252535] transition-colors">
                <span className="font-bold text-slate-400 w-4">1</span>
                <div className="size-8 rounded-full bg-purple-500"></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Alex M.
                  </p>
                  <p className="text-[10px] text-slate-500">2,890 XP</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[#2525f4]/5 border border-[#2525f4]/20">
                <span className="font-bold text-[#2525f4] w-4">2</span>
                <div
                  className="size-8 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
                  }}
                ></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    You
                  </p>
                  <p className="text-[10px] text-slate-500">2,450 XP</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#252535] transition-colors">
                <span className="font-bold text-slate-400 w-4">3</span>
                <div className="size-8 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Sarah J.
                  </p>
                  <p className="text-[10px] text-slate-500">2,100 XP</p>
                </div>
              </div>
            </div>
          </div>
          {/* Boost Button */}
          <div className="p-6 border-t border-slate-200 dark:border-[#2d2d3f]">
            <button className="w-full py-3 bg-gradient-to-r from-[#2525f4] to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">bolt</span>
              Boost XP (2x)
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
