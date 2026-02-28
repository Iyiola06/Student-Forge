'use client';

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface HistoryItem {
  id: string;
  action_type: string;
  entity_type: string | null;
  details: Record<string, any>;
  created_at: string;
}

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setHistoryItems(data as HistoryItem[]);
      }
      setIsLoading(false);
    }

    fetchHistory();
  }, []);

  const formatItemInfo = (item: HistoryItem) => {
    const action = item.action_type.toLowerCase();
    if (action === 'quiz_completed') {
      return {
        icon: 'quiz',
        colorClass: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        title: `Completed Quiz: ${item.details?.title || 'Unknown Quiz'}`,
        subtitle: `${item.details?.subject || 'General'}`,
        badge: item.details?.score ? `Score: ${item.details.score}%` : null,
      };
    }
    if (action === 'document_read') {
      return {
        icon: 'menu_book',
        colorClass: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        title: `Read: ${item.details?.title || 'Document'}`,
        subtitle: `${item.details?.subject || 'General'} • ${item.details?.time_spent_mins || 0} mins`,
        badge: null,
      };
    }
    if (action.includes('upload')) {
      return {
        icon: 'upload_file',
        colorClass: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        title: `Uploaded: ${item.details?.title || 'File'}`,
        subtitle: 'Resource Addition',
        badge: null,
      };
    }

    // Default fallback
    return {
      icon: 'history',
      colorClass: 'bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-slate-400',
      title: item.action_type.replace(/_/g, ' '),
      subtitle: item.entity_type || 'Activity',
      badge: null,
    };
  };

  const formatDateLabel = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-6 pb-2 md:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Study History
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">
                    search
                  </span>
                </span>
                <input
                  className="w-full sm:w-64 h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#ea580c]"
                  placeholder="Search history..."
                  type="text"
                />
              </div>
              <button className="p-2 border border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#1b1b27] text-slate-500 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-slate-100 dark:bg-[#252535] rounded-lg transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
          </div>
          {/* Timeline Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-[#2d2d3f]"></div>

              {/* Timeline Items */}
              <div className="space-y-8 pb-12">
                {isLoading ? (
                  <div className="pl-20 py-8 flex items-center gap-3 text-slate-500 dark:text-[#9c9cba]">
                    <div className="size-5 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                    Loading history...
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="pl-20 py-12 flex flex-col items-start gap-2">
                    <div className="bg-slate-100 dark:bg-[#252535] p-3 rounded-xl mb-2">
                      <span className="material-symbols-outlined text-3xl text-slate-500 dark:text-slate-400">history_toggle_off</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">No Activity Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-[#9c9cba]">Your study history and timeline will appear here once you start taking quizzes or reading documents.</p>
                  </div>
                ) : (
                  historyItems.map((item, index) => {
                    const info = formatItemInfo(item);
                    return (
                      <div key={item.id} className="relative pl-20">
                        <div className="absolute left-0 top-0 w-16 text-right">
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">
                            {formatDateLabel(item.created_at)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-[#9c9cba]">
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                        <div className={`absolute left-[30px] top-1.5 w-4 h-4 rounded-full ${index === 0 ? 'bg-[#ea580c]' : 'bg-slate-300 dark:bg-slate-600'} border-4 border-[#f5f5f8] dark:border-[#101022] shadow-sm z-10`}></div>
                        <div className="bg-white dark:bg-[#1b1b27] p-4 rounded-xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-center sm:items-start gap-4 mb-2 sm:mb-0">
                              <div className={`p-2 rounded-lg ${info.colorClass} flex-shrink-0`}>
                                <span className="material-symbols-outlined">{info.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-white capitalize">
                                  {info.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-[#9c9cba]">
                                  {info.subtitle}
                                </p>
                              </div>
                            </div>
                            {info.badge && (
                              <span className="self-start sm:self-auto px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded">
                                {info.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Load More */}
              {historyItems.length > 0 && (
                <div className="text-center mt-8">
                  <button className="px-4 py-2 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm font-medium text-slate-600 dark:text-[#9c9cba] hover:bg-slate-50 dark:hover:bg-slate-100 dark:bg-[#252535] transition-colors shadow-sm">
                    Load More History
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
