'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LeaderboardPage() {
  const { profile } = useProfile();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, level, xp')
        .order('xp', { ascending: false })
        .limit(50);

      if (data) setUsers(data);
      setIsLoading(false);
    }
    fetchLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  const getAvatar = (url?: string) => url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
  const getName = (id: string, name?: string) => {
    if (id === profile?.id) return 'You';
    return name || 'Student';
  };

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-6 pb-2 md:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Leaderboard
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#252535] px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2d3f]">
                <span className="text-sm font-bold text-[#ea580c]">Level {profile?.level || 1}</span>
                <div className="w-px h-4 bg-slate-300 dark:bg-[#3b3b54]"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{(profile?.xp || 0).toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Leaderboard Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {isLoading ? (
                <div className="py-20 flex justify-center items-center gap-3 text-slate-500 dark:text-[#9c9cba]">
                  <div className="size-6 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                  Fetching real-time rankings...
                </div>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {top3.length > 0 && (
                    <div className="flex justify-center items-end gap-2 md:gap-4 mb-12 pt-8">
                      {/* 2nd Place */}
                      {top3[1] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="size-16 md:size-20 rounded-full border-4 border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-200">
                              <Image
                                src={getAvatar(top3[1].avatar_url)}
                                alt="User 2"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                              2
                            </div>
                          </div>
                          <div className="text-center w-24">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{getName(top3[1].id, top3[1].full_name)}</p>
                            <p className="text-sm text-[#ea580c] font-bold">{top3[1].xp?.toLocaleString()} XP</p>
                          </div>
                          <div className="h-20 md:h-24 w-16 md:w-20 bg-slate-200 dark:bg-[#252535] rounded-t-lg mt-2"></div>
                        </div>
                      ) : (
                        <div className="w-16 md:w-20"></div>
                      )}

                      {/* 1st Place */}
                      {top3[0] && (
                        <div className="flex flex-col items-center z-10 w-24 md:w-32">
                          <div className="relative mb-4">
                            <div className="size-20 md:size-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg shadow-yellow-400/20 bg-slate-200">
                              <Image
                                src={getAvatar(top3[0].avatar_url)}
                                alt="User 1"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                              <span className="material-symbols-outlined text-4xl">crown</span>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                              1
                            </div>
                          </div>
                          <div className="text-center w-full px-1">
                            <p className="font-bold text-slate-900 dark:text-white text-base md:text-lg truncate">{getName(top3[0].id, top3[0].full_name)}</p>
                            <p className="text-sm text-[#ea580c] font-bold">{top3[0].xp?.toLocaleString()} XP</p>
                          </div>
                          <div className="h-28 md:h-32 w-20 md:w-24 bg-gradient-to-b from-yellow-100 to-white dark:from-yellow-900/20 dark:to-[#1b1b27] border-t border-x border-yellow-200 dark:border-yellow-900/30 rounded-t-lg mt-2 flex items-end justify-center pb-4">
                            <span className="text-4xl font-black text-yellow-400/20">1</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {top3[2] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="size-16 md:size-20 rounded-full border-4 border-orange-300 dark:border-orange-700 overflow-hidden bg-slate-200">
                              <Image
                                src={getAvatar(top3[2].avatar_url)}
                                alt="User 3"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                              3
                            </div>
                          </div>
                          <div className="text-center w-24">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{getName(top3[2].id, top3[2].full_name)}</p>
                            <p className="text-sm text-[#ea580c] font-bold">{top3[2].xp?.toLocaleString()} XP</p>
                          </div>
                          <div className="h-16 md:h-20 w-16 md:w-20 bg-orange-50 dark:bg-[#252535] rounded-t-lg mt-2"></div>
                        </div>
                      ) : (
                        <div className="w-16 md:w-20"></div>
                      )}
                    </div>
                  )}

                  {/* List */}
                  <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white">Global Ranking</h3>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs font-bold bg-[#ea580c] text-white rounded-lg">All Time</button>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#2d2d3f]">
                      {others.length > 0 ? others.map((user, index) => {
                        const rank = index + 4;
                        const isMe = user.id === profile?.id;
                        return (
                          <div key={user.id} className={`flex items-center gap-4 p-4 transition-colors ${isMe ? 'bg-[#ea580c]/5' : 'hover:bg-slate-50 dark:hover:bg-slate-100 dark:bg-[#252535]'}`}>
                            <span className={`w-8 text-center font-bold ${isMe ? 'text-[#ea580c]' : 'text-slate-500 dark:text-slate-400'}`}>{rank}</span>
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-[#2d2d3f] overflow-hidden relative border border-slate-200 dark:border-[#3b3b54]">
                              <Image
                                src={getAvatar(user.avatar_url)}
                                alt="User avatar"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{getName(user.id, user.full_name)}</p>
                              <p className="text-xs text-slate-500 dark:text-[#9c9cba]">Level {user.level || 1}</p>
                            </div>
                            <span className={`font-bold ${isMe ? 'text-[#ea580c]' : 'text-slate-600 dark:text-slate-300'}`}>
                              {user.xp?.toLocaleString()} XP
                            </span>
                          </div>
                        );
                      }) : (
                        <div className="p-8 text-center text-slate-500 dark:text-[#9c9cba]">
                          No other users found on the leaderboard.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
