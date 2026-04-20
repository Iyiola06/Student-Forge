'use client';

import AppShell from '@/components/layout/AppShell';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface HistoryItem {
  id: string;
  action_type: string;
  entity_type: string | null;
  details: Record<string, any>;
  created_at: string;
}

const ACTION_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Quizzes', value: 'quiz' },
  { label: 'Documents', value: 'document' },
  { label: 'Uploads', value: 'upload' },
  { label: 'Other', value: 'other' },
];

function formatItemInfo(item: HistoryItem) {
  const action = item.action_type.toLowerCase();
  if (action.includes('quiz')) {
    return {
      icon: 'quiz',
      color: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
      dot: 'bg-violet-500',
      title: item.details?.title ? `Quiz: ${item.details.title}` : 'Quiz Completed',
      subtitle: item.details?.subject || 'General',
      badge: item.details?.score != null ? `${item.details.score}%` : null,
      badgeColor: Number(item.details?.score) >= 70
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      filterKey: 'quiz',
    };
  }
  if (action.includes('document') || action.includes('read')) {
    return {
      icon: 'menu_book',
      color: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
      dot: 'bg-sky-500',
      title: item.details?.title ? `Read: ${item.details.title}` : 'Document Read',
      subtitle: [item.details?.subject, item.details?.time_spent_mins ? `${item.details.time_spent_mins} min` : null].filter(Boolean).join(' • ') || 'General',
      badge: null,
      badgeColor: '',
      filterKey: 'document',
    };
  }
  if (action.includes('upload')) {
    return {
      icon: 'upload_file',
      color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      title: item.details?.title ? `Uploaded: ${item.details.title}` : 'File Uploaded',
      subtitle: 'Resource Library',
      badge: null,
      badgeColor: '',
      filterKey: 'upload',
    };
  }
  if (action.includes('flash')) {
    return {
      icon: 'style',
      color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
      title: item.details?.title ? `Flashcards: ${item.details.title}` : 'Flashcard Study',
      subtitle: item.details?.subject || 'General',
      badge: item.details?.mastered != null ? `${item.details.mastered} mastered` : null,
      badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      filterKey: 'other',
    };
  }
  return {
    icon: 'history',
    color: 'bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    title: item.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    subtitle: item.entity_type || 'Activity',
    badge: null,
    badgeColor: '',
    filterKey: 'other',
  };
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Group items by date label
function groupByDate(items: HistoryItem[]) {
  const groups: { label: string; items: HistoryItem[] }[] = [];
  const seen = new Map<string, number>();
  for (const item of items) {
    const label = formatDate(item.created_at);
    if (seen.has(label)) {
      groups[seen.get(label)!].items.push(item);
    } else {
      seen.set(label, groups.length);
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 30;

  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('study_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (data) {
        setHistoryItems(data as HistoryItem[]);
        setHasMore(data.length === PAGE_SIZE);
      }
      setIsLoading(false);
    }
    fetchHistory();
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('study_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(historyItems.length, historyItems.length + PAGE_SIZE - 1);
    if (data) {
      setHistoryItems(prev => [...prev, ...(data as HistoryItem[])]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setIsLoadingMore(false);
  };

  const filteredItems = historyItems.filter(item => {
    const info = formatItemInfo(item);
    const matchesFilter = activeFilter === 'all' || info.filterKey === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || info.title.toLowerCase().includes(q) || item.action_type.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const groups = groupByDate(filteredItems);

  return (
    <AppShell
      eyebrow="Profile"
      title="Study history"
      description="Everything you’ve done recently, with filters for the actions you want to review."
    >
        <main className="flex-1 max-w-3xl w-full">

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Study History</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Everything you've done, in one place.</p>
          </div>

          {/* Search + Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] transition"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
              {ACTION_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === f.value
                      ? 'bg-[#1a5c2a] text-white border-[#1a5c2a]'
                      : 'bg-white dark:bg-[#1b1b27] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2d2d3f] hover:border-[#1a5c2a]'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="size-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading your history...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="size-16 rounded-2xl bg-slate-100 dark:bg-[#1b1b27] flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-400">history_toggle_off</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">No Activity Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : 'Your study history will appear here once you start studying.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map(group => (
                <div key={group.label}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#1a5c2a]">{group.label}</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-[#2d2d3f]" />
                    <span className="text-xs text-slate-400">{group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}</span>
                  </div>

                  {/* Items in this group */}
                  <div className="space-y-3">
                    {group.items.map(item => {
                      const info = formatItemInfo(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 bg-white dark:bg-[#161621] border border-slate-200 dark:border-[#2d2d3f] rounded-2xl p-4 hover:shadow-md dark:hover:border-[#3d3d5f] transition-all group"
                        >
                          {/* Icon */}
                          <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${info.color}`}>
                            <span className="material-symbols-outlined text-[22px]">{info.icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate max-w-[280px] sm:max-w-full capitalize">
                                {info.title}
                              </h3>
                              {info.badge && (
                                <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${info.badgeColor}`}>
                                  {info.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{info.subtitle}</p>
                          </div>

                          {/* Time */}
                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatTime(item.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && !searchQuery && activeFilter === 'all' && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2.5 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#252535] transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore
                      ? <span className="flex items-center gap-2"><span className="size-4 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin inline-block" /> Loading...</span>
                      : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
    </AppShell>
  );
}
