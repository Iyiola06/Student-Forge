'use client';

import Link from 'next/link';

export default function ResourcesPage() {
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2525f4]/10 text-[#2525f4] font-medium"
            href="/resources"
          >
            <span className="material-symbols-outlined">library_books</span>
            <span>Resource Library</span>
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
        {/* User Profile Snippet */}
        <div className="p-4 border-t border-slate-200 dark:border-[#2d2d3f]">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-full bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_PrX8yOs64jgoF50R2Gdmak7Nq9XNBH6jrZGbcMeFZWiTc-RXHJIYwVod5RyMqvpXdyuCh67XqP8diyIZGjPdooGKAN9iNGBZXPBKwdB23Gl_zIV9531fy77kczue-ybewLFkxSWQMdUumyw1dvjOVV4QSWKgD582BzAkdewcGU2Q77mpv1aJco2awv_M5hlPCjjIrGKErnFpvl_jDnr7id6w0GMQFhPBYcB72xFQDQseoc8xqlWGGLMxg092WPdyPddhX5U-OjiN")',
              }}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Jane Doe
              </p>
              <p className="text-xs text-slate-500 dark:text-[#9c9cba] truncate">
                Student Account
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-[#111118] border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4]"
                placeholder="Search resources, topics, or authors..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 dark:text-[#9c9cba] hover:bg-slate-100 dark:hover:bg-[#252535] rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#1b1b27]"></span>
            </button>
            <button className="flex items-center gap-2 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#2525f4]/20">
              <span className="material-symbols-outlined text-[20px]">
                upload_file
              </span>
              <span>Upload PDF</span>
            </button>
          </div>
        </header>
        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Recently Viewed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recently Viewed
                </h2>
                <Link
                  className="text-sm font-medium text-[#2525f4] hover:underline"
                  href="#"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative p-4 flex items-end">
                    <span className="bg-white/90 dark:bg-[#1b1b27]/90 text-slate-900 dark:text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                      Biology
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
                      Advanced Cell Biology
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#9c9cba] mb-3">
                      Last viewed 2 hours ago • 45% Complete
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-1.5 mb-3">
                      <div
                        className="bg-[#2525f4] h-1.5 rounded-full"
                        style={{width: '45%'}}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <div className="size-6 rounded-full bg-slate-200 border-2 border-white dark:border-[#1b1b27]"></div>
                        <div className="size-6 rounded-full bg-slate-300 border-2 border-white dark:border-[#1b1b27]"></div>
                      </div>
                      <button className="text-slate-400 hover:text-[#2525f4]">
                        <span className="material-symbols-outlined">
                          more_horiz
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500 relative p-4 flex items-end">
                    <span className="bg-white/90 dark:bg-[#1b1b27]/90 text-slate-900 dark:text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                      Chemistry
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
                      Organic Chemistry 101
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#9c9cba] mb-3">
                      Last viewed yesterday • 12% Complete
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-1.5 mb-3">
                      <div
                        className="bg-[#2525f4] h-1.5 rounded-full"
                        style={{width: '12%'}}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <div className="size-6 rounded-full bg-slate-200 border-2 border-white dark:border-[#1b1b27]"></div>
                      </div>
                      <button className="text-slate-400 hover:text-[#2525f4]">
                        <span className="material-symbols-outlined">
                          more_horiz
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Main Library */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Library
                </h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-colors">
                    All
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-transparent text-slate-500 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors">
                    PDFs
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-transparent text-slate-500 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors">
                    Quizzes
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-[#252535] text-slate-500 dark:text-[#9c9cba]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Date Added</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#2d2d3f]">
                    <tr className="hover:bg-slate-50 dark:hover:bg-[#252535]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                              picture_as_pdf
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            Intro_to_Physics_Ch1.pdf
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        Physics
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        Oct 24, 2023
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        2.4 MB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-[#2525f4] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-[#252535]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                              description
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            History_Notes_WWII.docx
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        History
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        Oct 22, 2023
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        1.1 MB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-[#2525f4] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-[#252535]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                              quiz
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            Math_Quiz_Algebra.json
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        Mathematics
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        Oct 20, 2023
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                        15 KB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-[#2525f4] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
