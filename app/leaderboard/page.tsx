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
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      const supabase = createClient();

      if (timeframe === 'all') {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, level, xp')
          .order('xp', { ascending: false })
          .limit(50);
        if (data) setUsers(data);
      } else {
        const res = await fetch('/api/leaderboard/weekly');
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      }

      setIsLoading(false);
    }
    fetchLeaderboard();
  }, [timeframe]);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  const getAvatar = (url?: string) => url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
  const getName = (id: string, name?: string) => {
    if (id === profile?.id) return 'You';
    return name || 'Student';
  };

  return (
    <div className="bg-[#050510] font-display min-h-screen flex flex-col md:flex-row antialiased relative overflow-hidden">
      {/* Background Starfield */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)', background: `radial-gradient(circle at center, #1e1b4b 0%, #050510 100%)` }}>
        <div className="stars-container absolute inset-0 opacity-40" style={{ boxShadow: '0 0 1px #fff, 0 0 2px #fff' }}></div>
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-10 pb-4 md:px-12 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#38bdf8] to-[#7c3aed] tracking-tighter">
                GALACTIC RANKS
              </h1>
              <p className="text-[10px] font-black text-[#ea580c] uppercase tracking-[0.5em] mt-1">Season 1: The Nebula Dawn</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#101022]/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-[#2d2d3f] shadow-2xl">
                <span className="material-symbols-outlined text-[#ea580c]">military_tech</span>
                <span className="text-sm font-black text-white">Lvl {profile?.level || 1}</span>
                <div className="w-px h-6 bg-[#2d2d3f]"></div>
                <span className="text-sm font-black text-[#38bdf8]">{(profile?.xp || 0).toLocaleString()} <span className="text-[10px] text-slate-500">FUEL</span></span>
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
                    <div className="flex justify-center items-end gap-2 md:gap-8 mb-16 pt-16 relative">
                      {/* 2nd Place */}
                      {top3[1] ? (
                        <div className="flex flex-col items-center group">
                          <div className="relative mb-6">
                            <div className="size-20 md:size-24 rounded-3xl border-4 border-slate-400/50 overflow-hidden bg-[#101022] rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-[0_0_30px_rgba(148,163,184,0.2)]">
                              <Image
                                src={getAvatar(top3[1].avatar_url)}
                                alt="Rank 2"
                                fill
                                className="object-cover scale-110"
                              />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-400 text-[#050510] text-[10px] font-black px-4 py-1 rounded-full shadow-xl">
                              RANK 02
                            </div>
                          </div>
                          <div className="text-center w-32">
                            <p className="font-black text-white truncate text-lg tracking-tighter">{getName(top3[1].id, top3[1].full_name)}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{top3[1].xp?.toLocaleString()} fuel</p>
                          </div>
                          <div className="h-24 md:h-32 w-20 md:w-28 bg-gradient-to-b from-slate-400/20 to-transparent border-t-4 border-slate-400 rounded-t-3xl mt-4 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      ) : (
                        <div className="w-20 md:w-28"></div>
                      )}

                      {/* 1st Place */}
                      {top3[0] && (
                        <div className="flex flex-col items-center z-10 group -mt-10">
                          <div className="relative mb-8">
                            {/* Crown/Apex Ring */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                              <span className="material-symbols-outlined text-6xl text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">workspace_premium</span>
                            </div>

                            <div className="size-28 md:size-36 rounded-[2.5rem] border-4 border-yellow-500 overflow-hidden bg-[#101022] shadow-[0_0_60px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-700">
                              <Image
                                src={getAvatar(top3[0].avatar_url)}
                                alt="Rank 1"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 text-xs font-black px-6 py-1.5 rounded-full shadow-2xl tracking-[0.2em]">
                              APEX
                            </div>
                          </div>
                          <div className="text-center w-40">
                            <p className="text-2xl font-black text-white tracking-tighter">{getName(top3[0].id, top3[0].full_name)}</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-[9px] font-black text-yellow-500 uppercase">Grand Marshal</span>
                              <p className="text-sm text-[#ea580c] font-black">{top3[0].xp?.toLocaleString()} <span className="text-[10px]">FUEL</span></p>
                            </div>
                          </div>
                          <div className="h-40 md:h-52 w-28 md:w-36 bg-gradient-to-b from-yellow-500/30 via-yellow-500/5 to-transparent border-t-4 border-yellow-500 rounded-t-[3rem] mt-6 shadow-[0_-20px_40px_rgba(234,179,8,0.1)]"></div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {top3[2] ? (
                        <div className="flex flex-col items-center group">
                          <div className="relative mb-6">
                            <div className="size-20 md:size-24 rounded-3xl border-4 border-orange-600/50 overflow-hidden bg-[#101022] -rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                              <Image
                                src={getAvatar(top3[2].avatar_url)}
                                alt="Rank 3"
                                fill
                                className="object-cover scale-110"
                              />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-xl">
                              RANK 03
                            </div>
                          </div>
                          <div className="text-center w-32">
                            <p className="font-black text-white truncate text-lg tracking-tighter">{getName(top3[2].id, top3[2].full_name)}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{top3[2].xp?.toLocaleString()} fuel</p>
                          </div>
                          <div className="h-16 md:h-24 w-20 md:w-28 bg-gradient-to-b from-orange-600/20 to-transparent border-t-4 border-orange-600 rounded-t-3xl mt-4 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      ) : (
                        <div className="w-20 md:w-28"></div>
                      )}
                    </div>
                  )}

                  {/* List */}
                  <div className="bg-[#101022]/40 backdrop-blur-xl rounded-[2rem] border border-[#2d2d3f] overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-[#2d2d3f] flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#ea580c]/10 border border-[#ea580c]/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#ea580c]">rocket_launch</span>
                        </div>
                        <div>
                          <h3 className="font-black text-white text-xl tracking-tight uppercase">Galaxy Core</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Synchronization Active</p>
                        </div>
                      </div>

                      <div className="flex bg-[#0c0c16] p-1.5 rounded-2xl border border-[#2d2d3f]">
                        <button
                          onClick={() => setTimeframe('all')}
                          className={`px-8 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${timeframe === 'all' ? 'bg-[#ea580c] text-white shadow-lg shadow-[#ea580c]/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Eternity
                        </button>
                        <button
                          onClick={() => setTimeframe('weekly')}
                          className={`px-8 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${timeframe === 'weekly' ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Seven Suns
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-[#2d2d3f]">
                      {others.length > 0 ? others.map((user, index) => {
                        const rank = index + 4;
                        const isMe = user.id === profile?.id;
                        return (
                          <div key={user.id} className={`flex items-center gap-6 p-6 transition-all group ${isMe ? 'bg-[#ea580c]/10 relative' : 'hover:bg-white/5'}`}>
                            {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ea580c]"></div>}

                            <span className={`w-8 text-center font-black text-xl tabular-nums ${isMe ? 'text-[#ea580c]' : (rank < 10 ? 'text-slate-500' : 'text-slate-700')}`}>{rank}</span>

                            <div className="size-14 rounded-2xl bg-[#0c0c16] overflow-hidden relative border border-[#2d2d3f] group-hover:border-[#38bdf8] transition-colors">
                              <Image
                                src={getAvatar(user.avatar_url)}
                                alt="User avatar"
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-white text-lg tracking-tight truncate">{getName(user.id, user.full_name)}</p>
                                {rank < 10 && <span className="material-symbols-outlined text-[#38bdf8] text-sm">verified</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#ea580c] uppercase">Lvl {user.level || 1}</span>
                                <span className="text-[10px] text-slate-600 font-bold">•</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{rank < 20 ? 'Elite Pilot' : 'Space Cadet'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`text-xl font-black tabular-nums transition-colors ${isMe ? 'text-[#ea580c]' : 'text-white'}`}>
                                {user.xp?.toLocaleString()}
                              </span>
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Quantum Fuel</div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="p-20 text-center text-slate-500">
                          <span className="material-symbols-outlined text-5xl mb-4 text-[#2d2d3f]">search_off</span>
                          <p className="text-xs font-black uppercase tracking-[0.3em]">No Cosmic Signals Detected</p>
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
