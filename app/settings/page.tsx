'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { pushService } from '@/lib/pushService';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { getCreditBundles, formatNairaFromKobo } from '@/lib/billing/config';

export default function SettingsPage() {
  const { profile, isLoading, mutate } = useProfile();
  const { wallet, mutate: mutateWallet } = useWallet();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [purchasingBundleId, setPurchasingBundleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: '',
    examDate: '',
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    // Initialize theme from document or localStorage
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);

    const notifs = localStorage.getItem('emailNotifications');
    if (notifs !== null) {
      setEmailNotifications(notifs === 'true');
    }

    // Check push notification status
    const checkPushStatus = async () => {
      const subscription = await pushService.getSubscription();
      setPushNotifications(!!subscription);
    };
    checkPushStatus();

    // Register service worker
    pushService.registerServiceWorker();
  }, []);

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').split(' ');
      setFormData({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback',
        examDate: profile.exam_date || '',
      });
    }
  }, [profile]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleNotifications = () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    localStorage.setItem('emailNotifications', String(newVal));
  };

  const handlePushToggle = async () => {
    const newVal = !pushNotifications;
    setIsSaving(true);
    try {
      if (newVal) {
        // Request permission and subscribe
        const NotificationAPI = typeof window !== 'undefined' ? (window as any).Notification : null;

        if (!NotificationAPI) {
          toast.warning('Push notifications are not supported in this browser.');
          return;
        }

        const permission = await NotificationAPI.requestPermission();
        if (permission !== 'granted') {
          toast.warning('Permission for notifications was denied.');
          return;
        }
        await pushService.subscribeUser();
        setPushNotifications(true);
      } else {
        // Unsubscribe
        await pushService.unsubscribeUser();
        setPushNotifications(false);
      }
    } catch (err: any) {
      console.error('Push toggle error:', err);
      toast.error(`Failed to update push notifications: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.warning('No email associated with this account.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email!');
    } catch (err: any) {
      toast.error(`Error sending reset link: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id, // Explicitly provide ID for upsert
          full_name: fullName,
          avatar_url: formData.avatarUrl,
          exam_date: formData.examDate || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      toast.success('Profile updated successfully!');
      mutate?.();
    } catch (err: any) {
      toast.error(`Error updating profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const supabase = createClient();
            const { error } = await supabase
              .from('profiles')
              .update({ avatar_url: dataUrl })
              .eq('id', profile.id);

            if (error) throw error;

            setFormData({ ...formData, avatarUrl: dataUrl });
            toast.success('Avatar generated securely!');
          } catch (err: any) {
            toast.error(`Error: ${err.message}`);
          } finally {
            setIsUploadingAvatar(false);
            event.target.value = '';
          }
        };
        img.onerror = () => {
          toast.error('Failed to process image');
          setIsUploadingAvatar(false);
          event.target.value = '';
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploadingAvatar(false);
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c06e8e',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=b6f4e3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=f4e3b6',
  ];
  const bundles = getCreditBundles();

  const handleBuyCredits = async (bundleId: string) => {
    setPurchasingBundleId(bundleId);
    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      toast.error(error.message || 'Unable to launch checkout');
    } finally {
      setPurchasingBundleId(null);
    }
  };

  return (
    <div className="main-bg font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#1a5c2a] selection:text-white">
      <Sidebar />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">
        {/* Header */}

        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <section className="overflow-hidden rounded-[1.75rem] border border-[#1a5c2a]/15 bg-[radial-gradient(circle_at_top_left,_rgba(40,112,67,0.24),_transparent_35%),linear-gradient(135deg,#08140d,#10281a_55%,#132b1f)] p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200/75">
                      Study Wallet
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      {wallet?.balance ?? profile?.credit_balance ?? 0} credits available
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-emerald-50/75">
                      Every new and existing web account gets 1,000 credits. Paid top-ups last 6 months and power AI generation, tutoring, grading, and simplification.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <div className="font-bold">Next expiry</div>
                    <div className="mt-1 text-white/75">
                      {wallet?.nextExpiry || profile?.next_credit_expiry
                        ? new Date((wallet?.nextExpiry || profile?.next_credit_expiry) as string).toLocaleDateString()
                        : 'No active expiry'}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {bundles.map((bundle) => (
                    <div key={bundle.id} className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-md">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200/75">
                        {bundle.name}
                      </p>
                      <div className="mt-3 text-3xl font-black">{bundle.credits.toLocaleString()}</div>
                      <div className="mt-1 text-sm text-white/75">{bundle.tagline}</div>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-lg font-bold">{formatNairaFromKobo(bundle.amountKobo)}</span>
                        <button
                          onClick={() => handleBuyCredits(bundle.id)}
                          disabled={purchasingBundleId === bundle.id}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#10281a] transition hover:bg-emerald-50 disabled:opacity-50"
                        >
                          {purchasingBundleId === bundle.id ? 'Opening...' : 'Buy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Upcoming Expiry Lots</h3>
                      <button
                        onClick={() => mutateWallet()}
                        className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/70"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(wallet?.grants ?? []).slice(0, 4).map((grant) => (
                        <div key={grant.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
                          <div>
                            <div className="font-bold">{grant.credits_remaining} credits left</div>
                            <div className="text-white/60">
                              {grant.source.replace(/_/g, ' ')} • expires {new Date(grant.expires_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                            {grant.credits_awarded} issued
                          </span>
                        </div>
                      ))}
                      {wallet?.grants?.length === 0 && (
                        <p className="text-sm text-white/65">No credit lots found yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
                    <h3 className="text-lg font-bold">Recent Credit Activity</h3>
                    <div className="mt-4 space-y-3">
                      {(wallet?.transactions ?? []).slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
                          <div>
                            <div className="font-bold">{tx.description || tx.source.replace(/_/g, ' ')}</div>
                            <div className="text-white/60">
                              {new Date(tx.created_at).toLocaleString()}
                            </div>
                          </div>
                          <span className={`font-black ${tx.amount < 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      ))}
                      {wallet?.transactions?.length === 0 && (
                        <p className="text-sm text-white/65">Your credit ledger will appear here after signup or purchase.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Account Settings */}
            <section className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#2d2d3f] pb-4">
                Account Settings
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#1a5c2a] focus:outline-none dark:text-white"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#1a5c2a] focus:outline-none dark:text-white"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Examination Date
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#1a5c2a] focus:outline-none dark:text-white"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    type="date"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#9c9cba]">
                    Setting your exam date allows us to personalize your study plan and reminders.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <input
                      className="flex-1 rounded-lg text-slate-500 border border-slate-300 dark:border-[#2d2d3f] bg-slate-100 dark:bg-[#252535] p-2.5 text-sm outline-none dark:text-slate-400 cursor-not-allowed"
                      defaultValue="Linked via Authentication"
                      disabled
                      type="text"
                    />
                    <button onClick={handlePasswordReset} className="px-4 py-2 bg-slate-200 dark:bg-[#2d2d3f] text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-[#3b3b54] transition-colors whitespace-nowrap">
                      Reset Password
                    </button>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Choose Avatar
                  </label>
                  <div className="flex flex-wrap gap-4 items-center">
                    {avatarOptions.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setFormData({ ...formData, avatarUrl: url })}
                        className={`size-14 rounded-full border-4 overflow-hidden shadow-sm transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#1a5c2a] scale-110' : 'border-transparent'}`}
                      >
                        <img src={url} alt={`Avatar option ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <div className="relative size-14 rounded-full border-2 border-dashed border-slate-300 dark:border-[#3b3b54] bg-slate-50 dark:bg-[#1a1a24] hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors flex items-center justify-center cursor-pointer overflow-hidden group">
                      {isUploadingAvatar ? (
                        <div className="size-5 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-[#1a5c2a]">add_a_photo</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        title="Upload Custom Avatar"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 bg-[#1a5c2a] text-white font-bold rounded-lg hover:bg-[#1a5c2a]/90 transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </section>
            {/* Preferences */}
            <section className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#2d2d3f] pb-4">
                Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Dark Mode
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Toggle dark theme for the interface
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input className="sr-only peer" type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1a5c2a]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Receive updates about your progress
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={toggleNotifications}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1a5c2a]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Receive daily reminders on your device
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      checked={pushNotifications}
                      onChange={handlePushToggle}
                      disabled={isSaving}
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1a5c2a]"></div>
                  </label>
                </div>
                {pushNotifications && (
                  <div className="pt-2 pl-0">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/push/test', { method: 'POST' });
                          const data = await res.json();
                          if (res.ok) {
                            toast.success(`Test notification sent! (${data.count} device${data.count !== 1 ? 's' : ''})`);
                          } else {
                            toast.error(data.error || 'Failed to send test notification');
                          }
                        } catch (err: any) {
                          toast.error('Failed to reach notification server');
                        }
                      }}
                      className="px-4 py-2 bg-[#1a5c2a]/10 text-[#1a5c2a] font-bold rounded-lg hover:bg-[#1a5c2a]/20 transition-colors text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                      Send Test Notification
                    </button>
                  </div>
                )}
              </div>
            </section>
            {/* Danger Zone */}
            <section className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-6 border-b border-red-200 dark:border-red-900/30 pb-4">
                Danger Zone
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Delete Account
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!window.confirm('Are you absolutely sure? This will permanently delete your account and all your data. This action cannot be undone.')) return;
                    try {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      // Delete profile data first
                      await supabase.from('profiles').delete().eq('id', user.id);
                      await supabase.from('resources').delete().eq('user_id', user.id);
                      await supabase.from('flashcards').delete().eq('user_id', user.id);
                      await supabase.from('study_history').delete().eq('user_id', user.id);
                      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
                      // Sign out
                      await supabase.auth.signOut();
                      toast.success('Account deleted. Goodbye!');
                      router.push('/');
                    } catch (err: any) {
                      toast.error(`Failed to delete account: ${err.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
