'use client';

import Link from 'next/link';
import {motion} from 'motion/react';

export default function LandingPage() {
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-4 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 text-[#2525f4] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
            StudyForge
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-slate-600 dark:text-slate-300 hover:text-[#2525f4] dark:hover:text-[#2525f4] transition-colors text-sm font-medium leading-normal hidden sm:block"
            href="/login"
          >
            Log In
          </Link>
          <Link href="/signup">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#2525f4] hover:bg-[#2525f4]/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-[#2525f4]/20">
              <span className="truncate">Get Started</span>
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#2525f4]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>

        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2525f4]/10 text-[#2525f4] text-sm font-medium mb-4 border border-[#2525f4]/20">
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            <span>The Future of Learning is Here</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Master Your Exams with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2525f4] to-purple-600">
              AI-Powered Study Tools
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Generate quizzes from your notes, track your progress with gamified
            learning, and access thousands of past questions. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/signup">
              <button className="h-14 px-8 rounded-xl bg-[#2525f4] hover:bg-[#2525f4]/90 text-white font-bold text-lg shadow-xl shadow-[#2525f4]/30 transition-all hover:scale-105 flex items-center gap-2">
                Start Learning for Free
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Link>
            <Link href="/resources">
              <button className="h-14 px-8 rounded-xl bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] hover:bg-slate-50 dark:hover:bg-[#252535] text-slate-900 dark:text-white font-bold text-lg transition-all hover:scale-105 flex items-center gap-2">
                <span className="material-symbols-outlined">play_circle</span>
                Watch Demo
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{delay: 0.1}}
            className="bg-white dark:bg-[#1b1b27] p-8 rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              AI Question Generator
            </h3>
            <p className="text-slate-500 dark:text-[#9c9cba]">
              Upload your PDFs or notes and let our AI generate practice
              questions, flashcards, and summaries instantly.
            </p>
          </motion.div>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{delay: 0.2}}
            className="bg-white dark:bg-[#1b1b27] p-8 rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">
                sports_esports
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Gamified Learning
            </h3>
            <p className="text-slate-500 dark:text-[#9c9cba]">
              Earn XP, unlock badges, and climb the leaderboard as you study.
              Make learning addictive and fun.
            </p>
          </motion.div>
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{delay: 0.3}}
            className="bg-white dark:bg-[#1b1b27] p-8 rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">
                history_edu
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Past Questions Bank
            </h3>
            <p className="text-slate-500 dark:text-[#9c9cba]">
              Access a vast library of past exam papers from WAEC, NECO, JAMB,
              and more. Practice with real questions.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#1b1b27] border-t border-slate-200 dark:border-[#2d2d3f] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Logo and Copyright */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-[#2525f4] text-2xl">
                  school
                </span>
                <span className="font-bold text-lg">StudyForge</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                © 2023 StudyForge Inc. All rights reserved.
              </p>
            </div>

            {/* Dev Links (Sitemap) */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Site Map
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Link href="/login" className="hover:text-[#2525f4] transition-colors">Login</Link>
                <Link href="/signup" className="hover:text-[#2525f4] transition-colors">Signup</Link>
                <Link href="/dashboard" className="hover:text-[#2525f4] transition-colors">Dashboard</Link>
                <Link href="/resources" className="hover:text-[#2525f4] transition-colors">Resources</Link>
                <Link href="/gamifier" className="hover:text-[#2525f4] transition-colors">Gamifier</Link>
                <Link href="/history" className="hover:text-[#2525f4] transition-colors">History</Link>
                <Link href="/generator" className="hover:text-[#2525f4] transition-colors">Generator</Link>
                <Link href="/past-questions" className="hover:text-[#2525f4] transition-colors">Past Questions</Link>
                <Link href="/profile" className="hover:text-[#2525f4] transition-colors">Profile</Link>
                <Link href="/settings" className="hover:text-[#2525f4] transition-colors">Settings</Link>
                <Link href="/forgot-password" className="hover:text-[#2525f4] transition-colors">Forgot Password</Link>
                <Link href="/reset-password" className="hover:text-[#2525f4] transition-colors">Reset Password</Link>
                <Link href="/verify-email" className="hover:text-[#2525f4] transition-colors">Verify Email</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
