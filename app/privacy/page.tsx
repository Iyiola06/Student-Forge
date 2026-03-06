'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function PrivacyPolicyPage() {
    return (
        <div className="main-bg font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-[#1a5c2a] selection:text-white">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#2d2d45] px-10 py-4 bg-white dark:bg-[#1b1b2e]/50 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="relative size-10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Image
                            src="/logo-favicon.png"
                            alt="VUI Studify Logo"
                            width={40}
                            height={40}
                            className="object-contain rounded-full"
                            priority
                        />
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                        VUI Studify
                    </h2>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/signup">
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#1a5c2a] hover:bg-[#1a5c2a]/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-[#1a5c2a]/20">
                            Get Started
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow py-20 px-4 md:px-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card glass-card p-8 md:p-12 space-y-8"
                >
                    <div className="text-center md:text-left space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
                        <p className="text-slate-500 dark:text-[#9c9cba]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">1. Information We Collect</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We collect information you provide directly to us, such as when you create an account, upload study materials, or contact us for support. This may include your name, email address, and educational level.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">2. How We Use Information</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We use the information we collect to provide, maintain, and improve our services, including to generate personalized study materials and track your learning progress.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">3. Data Sharing and Disclosure</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We do not share your personal information with third parties except as described in this policy, such as with your consent or for legal reasons. We do not sell your personal data.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">4. AI Data Processing</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Your uploaded study notes and PDFs are processed by AI models to generate quizzes and summaries. We use secure API connections to these services (like Google Gemini) and do not use your private data to train public models.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">5. Data Security</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#1a5c2a]">6. Your Rights</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
                            </p>
                        </section>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-[#2d2d45] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">Concerned about your privacy? We're here to help.</p>
                        <Link href="/login" className="text-[#1a5c2a] font-bold hover:underline">Back to Login</Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-10 text-center text-slate-500 dark:text-slate-600 border-t border-slate-200 dark:border-[#2d2d45]">
                <p>Â© {new Date().getFullYear()} VUI Studify Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
