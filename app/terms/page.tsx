'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function TermsOfServicePage() {
    return (
        <div className="main-bg font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-[#ea580c] selection:text-white">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#2d2d45] px-10 py-4 bg-white dark:bg-[#1b1b2e]/50 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="relative size-10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Image
                            src="/logo-favicon.png"
                            alt="Vui Studify Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                        Vui Studify
                    </h2>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/signup">
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#ea580c] hover:bg-[#ea580c]/90 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-[#ea580c]/20">
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
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
                        <p className="text-slate-500 dark:text-[#9c9cba]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">1. Acceptance of Terms</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                By accessing and using Vui Studify, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">2. Description of Service</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Vui Studify provides an AI-powered study platform including quiz generation, flashcards, and gamified learning tools. We reserve the right to modify or discontinue any part of the service at any time.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">3. User Responsibilities</h2>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 space-y-2">
                                <li>You must be at least 13 years old to use this service.</li>
                                <li>You are responsible for maintaining the security of your account and password.</li>
                                <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
                                <li>You must not upload content that violates copyright or intellectual property rights.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">4. Intellectual Property</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                The Vui Studify name, logo, and all related content and technology are the exclusive property of Vui Studify Inc. You retain ownership of any content you upload, but grant us a license to use it to provide our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">5. Limitation of Liability</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Vui Studify is provided "as is" without any warranties. We shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-[#ea580c]">6. Governing Law</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Vui Studify Inc. operates.
                            </p>
                        </section>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-[#2d2d45] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500 dark:text-[#9c9cba]">Questions about our terms? Contact us.</p>
                        <Link href="/login" className="text-[#ea580c] font-bold hover:underline">Back to Login</Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-10 text-center text-slate-500 dark:text-slate-600 border-t border-slate-200 dark:border-[#2d2d45]">
                <p>© {new Date().getFullYear()} Vui Studify Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
