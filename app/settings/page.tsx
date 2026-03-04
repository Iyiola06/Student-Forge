'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { pushService } from '@/lib/pushService';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { profile, isLoading, mutate } = useProfile();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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

  return (
    <div className="main-bg font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c] selection:text-white">
      <Sidebar />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">
        {/* Header */}

        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
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
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
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
                      className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
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
                    className="w-full rounded-lg border border-slate-300 dark:border-[#2d2d3f] bg-slate-50 dark:bg-[#111118] p-2.5 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none dark:text-white"
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
                  <div className="flex gap-4">
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
                        className={`size-14 rounded-full border-4 overflow-hidden shadow-sm transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#ea580c] scale-110' : 'border-transparent'}`}
                      >
                        <img src={url} alt={`Avatar option ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <div className="relative size-14 rounded-full border-2 border-dashed border-slate-300 dark:border-[#3b3b54] bg-slate-50 dark:bg-[#1a1a24] hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors flex items-center justify-center cursor-pointer overflow-hidden group">
                      {isUploadingAvatar ? (
                        <div className="size-5 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-[#ea580c]">add_a_photo</span>
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
                  <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 bg-[#ea580c] text-white font-bold rounded-lg hover:bg-[#ea580c]/90 transition-colors disabled:opacity-50">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#ea580c]"></div>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#ea580c]"></div>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#ea580c]"></div>
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
                      className="px-4 py-2 bg-[#ea580c]/10 text-[#ea580c] font-bold rounded-lg hover:bg-[#ea580c]/20 transition-colors text-sm flex items-center gap-2"
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
