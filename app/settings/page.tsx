'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useProfile } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { createClient } from '@/lib/supabase/client';
import { pushService } from '@/lib/pushService';
import { formatNairaFromKobo, getCreditBundles } from '@/lib/billing/config';
import { applyTheme, readThemeFromDom, THEME_CHANGE_EVENT } from '@/lib/theme';

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
    const syncTheme = () => {
      setIsDarkMode(readThemeFromDom() === 'dark');
    };

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);

    const notifs = localStorage.getItem('emailNotifications');
    if (notifs !== null) {
      setEmailNotifications(notifs === 'true');
    }

    const checkPushStatus = async () => {
      const subscription = await pushService.getSubscription();
      setPushNotifications(!!subscription);
    };

    checkPushStatus();
    pushService.registerServiceWorker();

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme as EventListener);
    };
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
    const nextDark = !isDarkMode;
    applyTheme(nextDark ? 'dark' : 'light');
    setIsDarkMode(nextDark);
  };

  const toggleNotifications = () => {
    const nextValue = !emailNotifications;
    setEmailNotifications(nextValue);
    localStorage.setItem('emailNotifications', String(nextValue));
  };

  const handlePushToggle = async () => {
    setIsSaving(true);
    try {
      if (!pushNotifications) {
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
        await pushService.unsubscribeUser();
        setPushNotifications(false);
      }
    } catch (error: any) {
      toast.error(`Failed to update push notifications: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.warning('No email associated with this account.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(`Error sending reset link: ${error.message}`);
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
        .upsert(
          {
            id: profile.id,
            full_name: fullName,
            avatar_url: formData.avatarUrl,
            exam_date: formData.examDate || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
      toast.success('Profile updated successfully.');
      mutate?.();
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
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
      reader.onload = (loadEvent) => {
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
            } else if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const supabase = createClient();
            const { error } = await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', profile.id);
            if (error) throw error;

            setFormData((current) => ({ ...current, avatarUrl: dataUrl }));
            toast.success('Avatar updated.');
          } catch (error: any) {
            toast.error(`Error: ${error.message}`);
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
        img.src = loadEvent.target?.result as string;
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploadingAvatar(false);
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
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

  const bundles = getCreditBundles().slice(0, 3);

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
    <AppShell
      eyebrow="Settings"
      title="Account and preferences"
      actions={
        <button onClick={handleSave} disabled={isSaving || isLoading} className="primary-button disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      }
    >
      <div className="workspace-stack">
        <section className="metric-strip">
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Credits</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{wallet?.balance ?? profile?.credit_balance ?? 0}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Current wallet balance.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Next expiry</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              {wallet?.nextExpiry || profile?.next_credit_expiry
                ? new Date((wallet?.nextExpiry || profile?.next_credit_expiry) as string).toLocaleDateString()
                : 'None'}
            </p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Top-ups and grants expire by lot.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Theme</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{isDarkMode ? 'Dark' : 'Light'}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Switch any time.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Push</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{pushNotifications ? 'On' : 'Off'}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Daily reminders on your device.</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Account</p>
            <h2 className="panel-title mt-2">Profile details</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">First name</span>
                <input
                  className="h-11 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={formData.firstName}
                  onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                  type="text"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Last name</span>
                <input
                  className="h-11 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={formData.lastName}
                  onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                  type="text"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Examination date</span>
                <input
                  className="h-11 w-full rounded-2xl border border-black/8 bg-white/72 px-4 text-sm outline-none focus:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={formData.examDate}
                  onChange={(event) => setFormData({ ...formData, examDate: event.target.value })}
                  type="date"
                />
              </label>
              <div className="self-end">
                <button onClick={handlePasswordReset} className="secondary-button">
                  Reset password
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">Choose avatar</p>
              <div className="flex flex-wrap gap-3">
                {avatarOptions.map((url, index) => (
                  <button
                    key={url}
                    onClick={() => setFormData({ ...formData, avatarUrl: url })}
                    className={`overflow-hidden rounded-full border-2 transition ${formData.avatarUrl === url ? 'border-[#163f73] shadow-[0_10px_24px_rgba(22,63,115,0.16)]' : 'border-transparent opacity-75 hover:opacity-100'}`}
                  >
                    <img src={url} alt={`Avatar option ${index + 1}`} className="size-12 object-cover" />
                  </button>
                ))}

                <label className="flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-black/10 bg-white/55 transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                  {isUploadingAvatar ? (
                    <span className="size-5 rounded-full border-2 border-[#163f73] border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">add_a_photo</span>
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} className="hidden" />
                </label>
              </div>
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Wallet</p>
            <h2 className="panel-title mt-2">Quick top-up</h2>

            <div className="mt-4 app-list">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="app-list-row items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{bundle.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                      {bundle.credits.toLocaleString()} credits • {bundle.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-950 dark:text-white">{formatNairaFromKobo(bundle.amountKobo)}</span>
                    <button onClick={() => handleBuyCredits(bundle.id)} disabled={purchasingBundleId === bundle.id} className="primary-button !h-9 !rounded-xl !px-3 disabled:opacity-60">
                      {purchasingBundleId === bundle.id ? 'Opening...' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 app-list">
              {(wallet?.transactions ?? []).slice(0, 4).map((tx) => (
                <div key={tx.id} className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{tx.description || tx.source.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <span className={tx.amount < 0 ? 'text-sm font-black text-amber-600 dark:text-amber-300' : 'text-sm font-black text-emerald-600 dark:text-emerald-300'}>
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount}
                  </span>
                </div>
              ))}
              {wallet?.transactions?.length === 0 ? <div className="app-list-row text-[13px] text-slate-500 dark:text-slate-400">Your credit ledger will appear here after signup or purchase.</div> : null}
            </div>

            <div className="mt-4">
              <button onClick={() => mutateWallet()} className="secondary-button">
                Refresh wallet
              </button>
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Preferences</p>
            <h2 className="panel-title mt-2">Theme and notifications</h2>

            <div className="mt-4 app-list">
              {[
                {
                  title: 'Dark mode',
                  body: 'Switch between light and dark interface styles.',
                  action: (
                    <button onClick={toggleTheme} className="secondary-button !h-9 !rounded-xl !px-3">
                      {isDarkMode ? 'Use light' : 'Use dark'}
                    </button>
                  ),
                },
                {
                  title: 'Email notifications',
                  body: 'Receive study and account updates by email.',
                  action: (
                    <button onClick={toggleNotifications} className="secondary-button !h-9 !rounded-xl !px-3">
                      {emailNotifications ? 'Turn off' : 'Turn on'}
                    </button>
                  ),
                },
                {
                  title: 'Push notifications',
                  body: 'Receive daily reminders on your device.',
                  action: (
                    <button onClick={handlePushToggle} disabled={isSaving} className="secondary-button !h-9 !rounded-xl !px-3 disabled:opacity-60">
                      {pushNotifications ? 'Turn off' : 'Turn on'}
                    </button>
                  ),
                },
              ].map((item) => (
                <div key={item.title} className="app-list-row items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{item.body}</p>
                  </div>
                  {item.action}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Danger zone</p>
            <h2 className="panel-title mt-2">Delete your account</h2>
            <p className="mt-3 text-[14px] leading-6 text-slate-600 dark:text-slate-300">
              This permanently deletes your profile, library data, study history, and subscriptions.
            </p>
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Are you absolutely sure? This will permanently delete your account and all your data. This action cannot be undone.'
                    )
                  ) {
                    return;
                  }

                  try {
                    const supabase = createClient();
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;

                    await supabase.from('profiles').delete().eq('id', user.id);
                    await supabase.from('resources').delete().eq('user_id', user.id);
                    await supabase.from('flashcards').delete().eq('user_id', user.id);
                    await supabase.from('study_history').delete().eq('user_id', user.id);
                    await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
                    await supabase.auth.signOut();

                    toast.success('Account deleted. Goodbye.');
                    router.push('/');
                  } catch (error: any) {
                    toast.error(`Failed to delete account: ${error.message}`);
                  }
                }}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700"
              >
                Delete account
              </button>
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
