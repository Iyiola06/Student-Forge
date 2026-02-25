'use client';

import Link from 'next/link';

export default function SettingsPage() {
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#2525f4] dark:hover:text-white transition-colors group"
            href="/profile"
          >
            <span className="material-symbols-outlined group-hover:text-[#2525f4]">
              person
            </span>
            <span className="font-medium">Profile</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2525f4]/10 text-[#2525f4] font-medium"
            href="/settings"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <div className="flex items-center gap-4">
            <div
              className="bg-cover bg-center bg-no-repeat rounded-full w-9 h-9 border-2 border-slate-200 dark:border-[#3b3b54]"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
              }}
            ></div>
          </div>
        </header>
        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Account Settings */}
            <section className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#2d2d3f] pb-4">
                Account Settings
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white"
                      defaultValue="Jane"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white"
                      defaultValue="Doe"
                      type="text"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#2525f4] focus:outline-none dark:text-white"
                    defaultValue="jane.doe@university.edu"
                    type="email"
                  />
                </div>
                <div className="pt-4">
                  <button className="px-4 py-2 bg-[#2525f4] text-white font-bold rounded-lg hover:bg-[#2525f4]/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </section>
            {/* Preferences */}
            <section className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#2d2d3f] pb-4">
                Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Dark Mode
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Toggle dark theme for the interface
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input className="sr-only peer" type="checkbox" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2525f4]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Receive updates about your progress
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      defaultChecked
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2525f4]"></div>
                  </label>
                </div>
              </div>
            </section>
            {/* Danger Zone */}
            <section className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-6 border-b border-red-200 dark:border-red-900/30 pb-4">
                Danger Zone
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Delete Account
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
