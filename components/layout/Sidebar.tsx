'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const { profile, isLoading } = useProfile();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const menuLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
        { name: 'Resource Library', href: '/resources', icon: 'library_books' },
        { name: 'PDF Gamifier', href: '/gamifier', icon: 'sports_esports' },
        { name: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard' },
        { name: 'Past Questions', href: '/past-questions', icon: 'history_edu' },
        { name: 'Question Generator', href: '/generator', icon: 'psychology' },
        { name: 'Essay Grader', href: '/essay-grader', icon: 'grading' },
    ];

    const personalLinks = [
        { name: 'Study History', href: '/history', icon: 'history' },
        { name: 'Profile', href: '/profile', icon: 'person' },
        { name: 'Settings', href: '/settings', icon: 'settings' },
    ];

    const renderLinks = (links: any[]) => {
        return links.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                        ? 'bg-[#ea580c]/10 text-[#ea580c] font-medium'
                        : 'text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-[#252535] hover:text-[#ea580c] dark:hover:text-white'
                        }`}
                >
                    <span
                        className={`material-symbols-outlined ${isActive ? '' : 'group-hover:text-[#ea580c]'
                            }`}
                    >
                        {link.icon}
                    </span>
                    <span className={isActive ? '' : 'font-medium'}>{link.name}</span>
                </Link>
            );
        });
    };

    return (
        <>
            {/* Mobile Sticky Header */}
            <div className="md:hidden sticky top-0 left-0 w-full h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] px-6 flex items-center justify-between z-[45]">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="size-8 text-[#ea580c] flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">school</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
                        StudyForge
                    </h2>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 flex items-center justify-center"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1.5 bg-slate-100 dark:bg-[#1b1b27] rounded-lg border border-slate-200 dark:border-[#2d2d3f] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#252535] transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <span className="material-symbols-outlined text-[24px]">{isOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-[40] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 h-screen z-[50] w-64 bg-white dark:bg-[#1b1b27] border-r border-slate-200 dark:border-[#2d2d3f] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 pt-5 pl-14 md:pl-6 flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="size-8 text-[#ea580c] flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">school</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
                            StudyForge
                        </h2>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-400 dark:text-[#6b6b8a] uppercase tracking-wider mb-2 mt-2 px-2">
                        Menu
                    </div>
                    {renderLinks(menuLinks)}

                    <div className="text-xs font-semibold text-slate-400 dark:text-[#6b6b8a] uppercase tracking-wider mb-2 mt-6 px-2">
                        Personal
                    </div>
                    {renderLinks(personalLinks)}
                </nav>

                {/* User Profile Snippet */}
                <div className="p-4 border-t border-slate-200 dark:border-[#2d2d3f]">
                    <div className="flex items-center gap-3">
                        <div
                            className={`size-10 rounded-full bg-cover bg-center shrink-0 ${isLoading ? 'animate-pulse bg-slate-200 dark:bg-slate-700' : ''
                                }`}
                            style={{
                                backgroundImage: profile?.avatar_url
                                    ? `url("${profile.avatar_url}")`
                                    : 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=fallback")',
                            }}
                        ></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {profile?.full_name || 'Loading...'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-[#9c9cba] truncate">
                                {profile?.role || 'Student Account'}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Logout"
                        >
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
