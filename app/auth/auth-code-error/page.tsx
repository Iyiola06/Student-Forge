import Link from 'next/link';

export default function AuthErrorPage() {
    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1b1b27] rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#2d2d3f] p-8 text-center">
                <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Authentication Error
                </h2>
                <p className="text-sm text-slate-500 dark:text-[#9c9cba] mb-8">
                    Something went wrong during sign-in. The link may have expired or already been used.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-12 px-6 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white font-medium rounded-lg transition-colors shadow-lg shadow-[#2525f4]/25"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
