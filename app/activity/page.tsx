'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ActivityPage() {
    const { profile, isLoading: isProfileLoading } = useProfile();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('study_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setActivities(data);
            }
            setIsLoading(false);
        }

        fetchActivities();
    }, []);

    if (isProfileLoading) {
        return (
            <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex items-center justify-center">
                <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const getTimeAgo = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-[#1a1a24] border-b border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20 md:hidden">
                    <h1 className="font-bold text-white">StudyForge</h1>
                </header>
                {/* Main Content */}
                <main className="flex flex-1 flex-col px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full overflow-y-auto">
                    {/* Profile Header */}
                    <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden mb-8 flex-shrink-0">
                        <div className="h-32 bg-gradient-to-r from-[#ea580c] to-purple-600"></div>
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="flex items-end gap-6">
                                    <div className="size-32 rounded-full border-4 border-white dark:border-[#1b1b27] bg-white dark:bg-[#1b1b27] overflow-hidden shadow-lg relative">
                                        <Image
                                            alt="Profile"
                                            className="object-cover"
                                            src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                                            fill
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {profile?.full_name || 'Student'}
                                        </h1>
                                        <p className="text-slate-500 dark:text-[#9c9cba] capitalize">
                                            {profile?.role || 'Student'} • Level {profile?.level || 1}
                                        </p>
                                    </div>
                                </div>
                                <Link href="/settings">
                                    <button className="px-4 py-2 bg-white dark:bg-[#252535] border border-slate-200 dark:border-[#3b3b54] rounded-lg text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2d2d3f] transition-colors shadow-sm">
                                        Edit Profile
                                    </button>
                                </Link>
                            </div>
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-[#2d2d3f] pt-6">
                                <div className="text-center border-r border-slate-100 dark:border-[#2d2d3f]">
                                    <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                                        {profile?.resources_uploaded !== undefined ? profile.resources_uploaded : 0}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                                        PDFs Uploaded
                                    </span>
                                </div>
                                <div className="text-center border-r border-slate-100 dark:border-[#2d2d3f]">
                                    <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                                        {profile?.quizzes_taken !== undefined ? profile.quizzes_taken : 0}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                                        Quizzes Taken
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-[#ea580c]">
                                        {profile?.exam_readiness_score || 0}%
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                                        Exam Ready Score
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-[#2d2d3f] mb-8 flex-shrink-0">
                        <nav className="flex gap-8">
                            <Link
                                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                                href="/profile"
                            >
                                Badges & Achievements
                            </Link>
                            <Link
                                className="border-b-2 border-[#ea580c] pb-4 px-1 text-sm font-bold text-[#ea580c]"
                                href="/activity"
                            >
                                Activity
                            </Link>
                            <Link
                                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                                href="/past-questions?tab=my_submissions"
                            >
                                My Uploads
                            </Link>
                            <Link
                                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                                href="/history"
                            >
                                Study History
                            </Link>
                            <Link
                                className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-slate-500 dark:text-[#9c9cba] hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all"
                                href="/settings"
                            >
                                Settings
                            </Link>
                        </nav>
                    </div>
                    {/* Activity Feed */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
                        <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm max-w-2xl">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="size-6 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-10">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-[#3b3b54] mb-2">
                                        notifications_off
                                    </span>
                                    <p className="text-slate-500 dark:text-[#9c9cba]">No recent activity to show.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activities.map((activity, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="size-10 rounded-full bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center text-[#ea580c]">
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {activity.action_type.includes('upload') ? 'upload_file' : activity.action_type.includes('quiz') ? 'psychology' : 'history_toggle_off'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-900 dark:text-white text-sm">
                                                    <span className="font-semibold capitalize">{activity.action_type.replace(/_/g, ' ')}</span>
                                                    {activity.details?.title && ` - ${activity.details.title}`}
                                                </p>
                                                {activity.details?.xp_earned && (
                                                    <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                                                        +{activity.details.xp_earned} XP Earned
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 dark:text-[#9c9cba] mt-1">
                                                    {getTimeAgo(activity.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
