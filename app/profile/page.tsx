'use client';

import Link from 'next/link';
import Image from 'next/image';
import AppShell from '@/components/layout/AppShell';
import { useProfile } from '@/hooks/useProfile';
import { BADGES } from '@/lib/constants/badges';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { profile, isLoading, mutate } = useProfile();

  const handleTitleChange = async (title: string) => {
    if (!profile) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ active_title: title || null })
      .eq('id', profile.id);
    if (error) {
      toast.error('Failed to update title');
    } else {
      toast.success('Title updated!');
      mutate?.();
    }
  };

  const handleThemeChange = async (theme: string) => {
    if (!profile) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ active_theme: theme })
      .eq('id', profile.id);
    if (error) {
      toast.error('Failed to update theme');
    } else {
      toast.success(`Theme set to ${theme}!`);
      mutate?.();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f5f9fe] dark:bg-[#070d1a] font-display min-h-screen flex items-center justify-center">
        <div className="size-10 border-4 border-[#2f7fd3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AppShell
      eyebrow="Profile"
      title="Profile"
      description="Manage your identity, achievements, and presentation settings in one place."
    >
        <main className="flex flex-1 flex-col w-full">
          {/* Profile Header */}
          <div className="bg-white dark:bg-[#070d1a]/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-[#1d2a42] overflow-hidden mb-8 shadow-xl dark:shadow-2xl relative">
            <div className="sky-bg h-48 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at top right, #ffffff 0%, transparent 60%)' }}></div>
              <div className="absolute inset-0 stars-container opacity-20"></div>
            </div>
            <div className="px-10 pb-10">
              <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 md:-mt-12 mb-6 gap-4">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
                  <div className="size-32 rounded-full border-4 border-white dark:border-[#0f192c] bg-white dark:bg-[#0f192c] overflow-hidden shadow-lg relative">
                    <Image
                      alt="Profile"
                      className="object-cover"
                      src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                      fill
                      unoptimized={profile?.avatar_url?.includes('dicebear.com') || !profile?.avatar_url}
                    />
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex flex-col md:flex-row items-center gap-2 md:gap-3">
                      {profile?.full_name || 'Student'}
                      {profile?.active_title && (
                        <span className="text-[10px] bg-[#2f7fd3]/20 text-[#2f7fd3] border border-[#2f7fd3]/40 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                          {profile.active_title}
                        </span>
                      )}
                    </h1>
                    <p className="text-[#38bdf8] font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">
                      {profile?.role || 'Student'} • Level {profile?.level || 1}
                    </p>
                  </div>
                </div>
                <Link href="/settings">
                  <button className="px-6 py-2.5 bg-white dark:bg-[#13203a] border border-slate-200 dark:border-[#24344f] rounded-xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1d2a42] transition-all shadow-sm active:scale-95">
                    Edit Profile
                  </button>
                </Link>
              </div>
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 border-t border-slate-100 dark:border-[#1d2a42] pt-10">
                <div className="flex flex-col items-center border-r border-slate-100 dark:border-[#1d2a42]">
                  <span className="material-symbols-outlined text-[#38bdf8] mb-2">rocket_launch</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {profile?.resources_uploaded || 0}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-center font-black text-slate-500 uppercase tracking-widest mt-1 px-2">Resources Uploaded</span>
                </div>
                <div className="flex flex-col items-center md:border-r border-slate-100 dark:border-[#1d2a42]">
                  <span className="material-symbols-outlined text-[#7c3aed] mb-2">military_tech</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {profile?.boss_wins || 0}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-center font-black text-slate-500 uppercase tracking-widest mt-1 px-2">Challenges Completed</span>
                </div>
                <div className="flex flex-col items-center border-r border-slate-100 dark:border-[#1d2a42] md:border-r-0 lg:border-r">
                  <span className="material-symbols-outlined text-[#38bdf8] mb-2">auto_stories</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {profile?.quizzes_taken || 0}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-center font-black text-slate-500 uppercase tracking-widest mt-1 px-2">Quizzes Taken</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-[#2f7fd3] mb-2">diamond</span>
                  <span className="text-2xl md:text-3xl font-black text-[#2f7fd3]">
                    {(profile?.xp || 0).toLocaleString()}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-center font-black text-slate-500 uppercase tracking-widest mt-1 px-2">Total XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Badges Section */}
              <section className="bg-white dark:bg-[#070d1a]/40 backdrop-blur-xl border border-slate-200 dark:border-[#1d2a42] rounded-[2rem] p-8 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Badges & achievements</h2>
                  <span className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em]">{profile?.badges?.length || 0} / {BADGES.length} UNLOCKED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {BADGES.map((badge) => {
                    const isUnlocked = profile?.badges?.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`bg-slate-50 dark:bg-[#070d1a]/50 rounded-2xl border transition-all p-4 flex flex-col items-center text-center group ${isUnlocked ? 'border-[#2f7fd3]/30 hover:border-[#2f7fd3] shadow-lg shadow-[#2f7fd3]/5' : 'border-slate-100 dark:border-[#1d2a42] grayscale opacity-40'}`}
                      >
                        <div className={`size-14 rounded-full flex items-center justify-center border-2 mb-3 transition-transform ${isUnlocked ? 'bg-[#2f7fd3]/10 text-[#2f7fd3] border-[#2f7fd3]/20 group-hover:scale-110' : 'bg-white dark:bg-[#070d1a] text-slate-300 dark:text-slate-700 border-slate-100 dark:border-[#1d2a42]'}`}>
                          <span className="material-symbols-outlined text-2xl">
                            {isUnlocked ? badge.icon : 'lock'}
                          </span>
                        </div>
                        <h3 className="font-black text-[10px] mb-1 text-slate-800 dark:text-white uppercase truncate w-full">
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
              <section className="bg-white dark:bg-[#070d1a]/40 backdrop-blur-xl border border-slate-200 dark:border-[#1d2a42] rounded-[2rem] p-8 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase mb-6">Profile customization</h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Title</label>
                      <span className="text-[10px] font-black text-[#38bdf8] uppercase tracking-widest">{(profile?.unlocked_titles?.length || 0)} Found</span>
                    </div>
                    <select
                      className="w-full bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-[#1d2a42] text-slate-900 dark:text-white rounded-xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-[#2f7fd3] outline-none"
                      value={profile?.active_title || ''}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    >
                      <option value="">No Title</option>
                      {profile?.unlocked_titles?.map((t: string) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Theme</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Standard', 'Nebula', 'Eclipse', 'Void', 'Nova', 'Supernova'].map(t => (
                        <button
                          key={t}
                          onClick={() => handleThemeChange(t)}
                          className={`py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-2 group transition-all ${profile?.active_theme === t ? 'border-[#2f7fd3] bg-[#2f7fd3]/5' : 'border-slate-100 dark:border-[#1d2a42] bg-slate-50 dark:bg-[#070d1a] hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <div className={`size-4 rounded-full ${t === 'Standard' ? 'bg-slate-400' :
                            t === 'Nebula' ? 'bg-purple-500 shadow-[0_0_10px_purple]' :
                              t === 'Eclipse' ? 'bg-[#38bdf8] shadow-[0_0_10px_cyan]' :
                                'bg-red-500 shadow-[0_0_10px_red]'
                            }`} />
                          <span className="text-[8px] font-black text-slate-700 dark:text-white uppercase tracking-tighter">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Ship Stats Section */}
              <section className="bg-gradient-to-br from-[#10264a] to-[#070d1a] border border-[#1d2a42] rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 size-32 bg-[#2f7fd3]/5 rounded-full blur-3xl" />
                <h2 className="text-xl font-black text-white tracking-widest uppercase mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#2f7fd3]">rocket</span>
                  Study status
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>Hull Integrity</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full h-1 bg-[#070d1a] rounded-full">
                      <div className="h-full w-full bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>Energy Reserves</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full h-1 bg-[#070d1a] rounded-full">
                      <div className="h-full w-[78%] bg-[#38bdf8] rounded-full shadow-[0_0_10px_#38bdf8]" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
    </AppShell>
  );
}
