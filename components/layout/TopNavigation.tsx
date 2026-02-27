'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TopNavigation({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, isLoading } = useProfile();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Courses', href: '/resources' },
        { name: 'Leaderboard', href: '/leaderboard' },
        { name: 'Past Questions', href: '/past-questions' },
        { name: 'Profile', href: '/profile' },
    ];

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#3b3b54] px-4 sm:px-10 py-3 bg-white dark:bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="size-8 text-[#ea580c] flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">school</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                        StudyForge
                    </h2>
                </Link>
            </div>

            <div className="flex flex-1 justify-end gap-8 items-center">
                <div className="hidden md:flex items-center gap-9">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={
                                pathname === link.href
                                    ? 'text-slate-900 dark:text-white font-bold text-sm leading-normal border-b-2 border-[#ea580c]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-[#ea580c] dark:hover:text-white transition-colors text-sm font-medium leading-normal'
                            }
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {children}

                    <button className="bg-slate-100 dark:bg-[#252535] text-slate-900 dark:text-white p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-colors relative">
                        <span className="material-symbols-outlined text-[20px]">
                            notifications
                        </span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1b1b27]"></span>
                    </button>

                    <div className="group relative">
                        <div
                            className={`bg-cover bg-center bg-no-repeat rounded-full w-9 h-9 border-2 border-slate-200 dark:border-[#3b3b54] cursor-pointer ${isLoading ? 'animate-pulse bg-slate-200 dark:bg-slate-700' : ''
                                }`}
                            style={{
                                backgroundImage: profile?.avatar_url
                                    ? `url("${profile.avatar_url}")`
                                    : 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=fallback")',
                            }}
                        ></div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1b1b27] rounded-xl shadow-lg border border-slate-200 dark:border-[#2d2d3f] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <div className="p-3 border-b border-slate-100 dark:border-[#2d2d3f]">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {profile?.full_name || 'Student'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-[#9c9cba]">
                                    Level {profile?.level || 1}
                                </p>
                            </div>
                            <div className="p-1">
                                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] rounded-lg w-full text-left">
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                    Settings
                                </Link>
                                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg w-full text-left mt-1">
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
}
