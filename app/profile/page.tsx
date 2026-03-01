'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { BADGES } from '@/lib/constants/badges';

export default function ProfilePage() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex items-center justify-center">
        <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content */}
        <main className="flex flex-1 flex-col px-4 sm:px-10 py-8 max-w-[1440px] mx-auto w-full">
          {/* Profile Header */}
          <div className="bg-[#101022]/60 backdrop-blur-xl rounded-[2rem] border border-[#2d2d3f] overflow-hidden mb-8 shadow-2xl relative">
            <div className="h-48 bg-gradient-to-r from-[#ea580c] via-purple-900 to-[#050510] relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at top right, #38bdf8 0%, transparent 70%)' }}></div>
              <div className="absolute inset-0 stars-container opacity-20"></div>
            </div>
            <div className="px-10 pb-10">
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
                    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                      {profile?.full_name || 'Student'}
                      {profile?.active_title && (
                        <span className="text-[10px] bg-[#ea580c]/20 text-[#ea580c] border border-[#ea580c]/40 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                          {profile.active_title}
                        </span>
                      )}
                    </h1>
                    <p className="text-[#38bdf8] font-bold uppercase tracking-[0.3em] text-xs">
                      {profile?.role || 'Student'} • Fleet Rank {profile?.level || 1}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#2d2d3f] pt-10">
                <div className="flex flex-col items-center border-r border-[#2d2d3f]">
                  <span className="material-symbols-outlined text-[#38bdf8] mb-2">rocket_launch</span>
                  <span className="text-3xl font-black text-white">
                    {profile?.resources_uploaded || 0}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Planets Conquered</span>
                </div>
                <div className="flex flex-col items-center border-r border-[#2d2d3f]">
                  <span className="material-symbols-outlined text-[#7c3aed] mb-2">military_tech</span>
                  <span className="text-3xl font-black text-white">
                    {profile?.boss_wins || 0}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Beasts Slayed</span>
                </div>
                <div className="flex flex-col items-center md:border-r border-[#2d2d3f]">
                  <span className="material-symbols-outlined text-[#38bdf8] mb-2">auto_stories</span>
                  <span className="text-3xl font-black text-white">
                    {profile?.quizzes_taken || 0}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Data Scans</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-[#ea580c] mb-2">diamond</span>
                  <span className="text-3xl font-black text-[#ea580c]">
                    {(profile?.xp || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Fuel</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Badges Section */}
              <section className="bg-[#101022]/40 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-white tracking-widest uppercase">Ribbons & Commendations</h2>
                  <span className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em]">{profile?.badges?.length || 0} / {BADGES.length} UNLOCKED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {BADGES.map((badge) => {
                    const isUnlocked = profile?.badges?.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`bg-[#0c0c16]/50 rounded-2xl border transition-all p-4 flex flex-col items-center text-center group ${isUnlocked ? 'border-[#ea580c]/30 hover:border-[#ea580c] shadow-lg shadow-[#ea580c]/5' : 'border-[#2d2d3f] grayscale opacity-40'}`}
                      >
                        <div className={`size-14 rounded-full flex items-center justify-center border-2 mb-3 transition-transform ${isUnlocked ? 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/20 group-hover:scale-110' : 'bg-[#101022] text-slate-700 border-[#2d2d3f]'}`}>
                          <span className="material-symbols-outlined text-2xl">
                            {isUnlocked ? badge.icon : 'lock'}
                          </span>
                        </div>
                        <h3 className="font-black text-[10px] mb-1 text-white uppercase truncate w-full">
                          {badge.name}
                        </h3>
                        <p className="text-[8px] text-slate-500 font-bold leading-tight">
                          {badge.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Customization Section */}
              <section className="bg-[#101022]/40 backdrop-blur-xl border border-[#2d2d3f] rounded-[2rem] p-8">
                <h2 className="text-xl font-black text-white tracking-widest uppercase mb-6">Galactic Identity</h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Title</label>
                      <span className="text-[10px] font-black text-[#38bdf8] uppercase tracking-widest">{(profile?.unlocked_titles?.length || 0)} Found</span>
                    </div>
                    <select className="w-full bg-[#0c0c16] border border-[#2d2d3f] text-white rounded-xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-[#ea580c] outline-none">
                      <option value="">No Title</option>
                      {profile?.unlocked_titles?.map((t: string) => (
                        <option key={t} value={t} selected={profile.active_title === t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fleet Theme</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Standard', 'Nebula', 'Eclipse', 'Void', 'Nova', 'Supernova'].map(t => (
                        <button
                          key={t}
                          className={`py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-2 group transition-all ${profile?.active_theme === t ? 'border-[#ea580c] bg-[#ea580c]/5' : 'border-[#2d2d3f] bg-[#0c0c16] hover:border-slate-600'}`}
                        >
                          <div className={`size-4 rounded-full ${t === 'Standard' ? 'bg-slate-400' :
                              t === 'Nebula' ? 'bg-purple-500 shadow-[0_0_10px_purple]' :
                                t === 'Eclipse' ? 'bg-[#38bdf8] shadow-[0_0_10px_cyan]' :
                                  'bg-red-500 shadow-[0_0_10px_red]'
                            }`} />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Ship Stats Section */}
              <section className="bg-gradient-to-br from-[#1e1b4b] to-[#0c0c16] border border-[#2d2d3f] rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 size-32 bg-[#ea580c]/5 rounded-full blur-3xl" />
                <h2 className="text-xl font-black text-white tracking-widest uppercase mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ea580c]">rocket</span>
                  Vessel Status
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>Hull Integrity</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full h-1 bg-[#050510] rounded-full">
                      <div className="h-full w-full bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>Energy Reserves</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full h-1 bg-[#050510] rounded-full">
                      <div className="h-full w-[78%] bg-[#38bdf8] rounded-full shadow-[0_0_10px_#38bdf8]" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
