'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { profile, isLoading } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').split(' ');
      setFormData({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between px-6 sticky top-0 z-20 md:hidden">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <div className="flex items-center gap-4">
            <div
              className="bg-cover bg-center bg-no-repeat rounded-full w-9 h-9 border-2 border-slate-200 dark:border-[#3b3b54]"
              style={{
                backgroundImage: profile?.avatar_url
                  ? `url("${profile.avatar_url}")`
                  : 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=fallback")',
              }}
            ></div>
          </div>
        </header>
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
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-lg text-slate-500 border border-slate-300 dark:border-[#2d2d3f] bg-slate-100 dark:bg-[#252535] p-2.5 text-sm outline-none dark:text-slate-400 cursor-not-allowed"
                    defaultValue="Linked via Authentication"
                    disabled
                    type="text"
                  />
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
                    <input className="sr-only peer" type="checkbox" />
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
                      defaultChecked
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#ea580c]"></div>
                  </label>
                </div>
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
                <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
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
