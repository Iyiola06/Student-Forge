'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const errorMsg = searchParams.get('error') || 'The link may have expired or already been used.';

    return (
        <div className="main-bg font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md premium-card glass-card p-8 text-center">
                <div className="relative size-16 flex items-center justify-center mx-auto mb-6">
                    <Image
                        src="/images/logo.png"
                        alt="StudyForge Logo"
                        width={64}
                        height={64}
                        className="object-contain"
                    />
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Authentication Error
                </h2>
                <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-8">
                    {errorMsg}
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-12 px-6 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-medium rounded-lg transition-colors shadow-lg shadow-[#ea580c]/25"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense>
            <AuthErrorContent />
        </Suspense>
    );
}
