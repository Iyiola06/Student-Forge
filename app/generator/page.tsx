'use client';

import Link from 'next/link';

export default function GeneratorPage() {
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
            href="/leaderboard"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              leaderboard
            </span>
            <span className="font-medium">Leaderboard</span>
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2525f4]/10 text-[#2525f4] font-medium"
            href="/generator"
          >
            <span className="material-symbols-outlined">psychology</span>
            <span>Question Generator</span>
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
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            AI Question Generator
          </h1>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#2525f4]/20">
              <span className="material-symbols-outlined text-[20px]">
                auto_awesome
              </span>
              <span>Generate New</span>
            </button>
          </div>
        </header>
        {/* Generator Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex gap-8">
          {/* Left Panel: Configuration */}
          <div className="flex-1 max-w-2xl space-y-6">
            {/* Upload / Input Section */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2525f4]">
                  upload_file
                </span>
                Source Material
              </h2>
              <div className="border-2 border-dashed border-slate-300 dark:border-[#2d2d3f] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#2525f4] hover:bg-slate-50 dark:hover:bg-[#252535] transition-all cursor-pointer group">
                <div className="bg-slate-100 dark:bg-[#2d2d3f] p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 group-hover:text-[#2525f4]">
                    cloud_upload
                  </span>
                </div>
                <p className="text-slate-900 dark:text-white font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                  PDF, DOCX, or TXT (Max 10MB)
                </p>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Or paste text directly:
                </label>
                <textarea
                  className="w-full h-32 rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-3 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white"
                  placeholder="Paste your study notes here..."
                ></textarea>
              </div>
            </div>
            {/* Settings Section */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2525f4]">
                  tune
                </span>
                Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Question Type
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white">
                    <option>Multiple Choice</option>
                    <option>True / False</option>
                    <option>Short Answer</option>
                    <option>Fill in the Blanks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex bg-slate-100 dark:bg-[#111118] rounded-lg p-1">
                    <button className="flex-1 py-1.5 text-xs font-medium rounded bg-white dark:bg-[#2d2d3f] text-slate-900 dark:text-white shadow-sm">
                      Easy
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-medium rounded text-slate-500 dark:text-[#9c9cba] hover:text-slate-900 dark:hover:text-white">
                      Medium
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-medium rounded text-slate-500 dark:text-[#9c9cba] hover:text-slate-900 dark:hover:text-white">
                      Hard
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Questions
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white"
                    defaultValue="10"
                    max="50"
                    min="1"
                    type="number"
                  />
                </div>
              </div>
              <button className="w-full mt-6 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-[#2525f4]/25 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                Generate Questions
              </button>
            </div>
          </div>
          {/* Right Panel: Preview / Output */}
          <div className="w-96 flex flex-col gap-6">
            {/* Recent Generations */}
            <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Recent Generations
              </h2>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#252535] border border-slate-200 dark:border-[#2d2d3f] hover:border-[#2525f4] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2525f4]">
                      Biology Quiz 1
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-[#9c9cba]">
                      2h ago
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    10 Questions • Multiple Choice
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#252535] border border-slate-200 dark:border-[#2d2d3f] hover:border-[#2525f4] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2525f4]">
                      History Flashcards
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-[#9c9cba]">
                      Yesterday
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                    15 Items • Flashcards
                  </p>
                </div>
              </div>
            </div>
            {/* Preview Placeholder */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#252535] dark:to-[#1b1b27] rounded-xl border border-dashed border-slate-300 dark:border-[#2d2d3f] p-6 flex flex-col items-center justify-center text-center h-64">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                preview
              </span>
              <p className="text-slate-500 dark:text-[#9c9cba] font-medium">
                Generated questions will appear here
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
