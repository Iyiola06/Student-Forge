/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const today = new Date().toISOString();

  const [profileRes, resourcesRes, reviewItemsRes, topicMasteryRes, walletTxRes, sessionsRes, attemptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('resources')
      .select(
        'id,title,subject,processing_status,processing_error,extracted_preview,created_at,processing_started_at,processing_completed_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('review_items')
      .select('id,item_type,source_topic,due_at,review_state,mastery_score,last_reviewed_at')
      .eq('user_id', user.id)
      .order('due_at', { ascending: true })
      .limit(40),
    supabase
      .from('topic_mastery')
      .select('id,topic_slug,topic_label,mastery_score,mistakes_count,due_count,last_reviewed_at')
      .eq('user_id', user.id)
      .order('mastery_score', { ascending: true })
      .limit(6),
    supabase
      .from('credit_events')
      .select('id,amount,source,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('review_sessions')
      .select('id,session_type,status,completed_items,total_items,started_at,completed_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5),
    supabase
      .from('review_attempts')
      .select('id,result,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const countItems = (filter?: (q: any) => any) => {
    let query: any = supabase.from('review_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (filter) query = filter(query);
    return query.then((res: { count: number | null }) => res.count ?? 0);
  };
  const weekAhead = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const [totalCards, masteredCards, unseenCards, dueThisWeek] = await Promise.all([
    countItems(),
    countItems((q) => q.eq('review_state', 'mastered')),
    countItems((q) => q.eq('reviews_count', 0)),
    countItems((q) => q.lte('due_at', weekAhead).neq('review_state', 'mastered')),
  ]);

  const reviewItems = reviewItemsRes.data ?? [];
  const dueToday = reviewItems.filter((item) => item.due_at <= today && item.review_state !== 'mastered');
  const overdue = reviewItems.filter((item) => item.due_at < today && item.review_state !== 'mastered');
  const weakTopics = (topicMasteryRes.data ?? []).filter((topic) => topic.mastery_score < 70);
  const recentResources = resourcesRes.data ?? [];

  const readyResources = recentResources.filter((resource) => resource.processing_status === 'ready').length;
  const failedResources = recentResources.filter((resource) => resource.processing_status === 'failed').length;
  const firstReadyRate = recentResources.length ? Math.round((readyResources / recentResources.length) * 100) : 0;
  const recentAttempts = attemptsRes.data ?? [];
  const reviewCompletionRate = (sessionsRes.data ?? []).length
    ? Math.round(
        (((sessionsRes.data ?? []).filter((session) => session.status === 'completed').length) / (sessionsRes.data ?? []).length) * 100
      )
    : 0;

  return (
    <DashboardClient
      initialData={{
        user,
        profile: profileRes.data ?? null,
        dashboard: {
          dueToday,
          overdue,
          weakTopics,
          recentResources,
          recentTransactions: walletTxRes.data ?? [],
          recentSessions: sessionsRes.data ?? [],
          recentAttempts,
          reviewCompletionRate,
          firstReadyRate,
          failedResources,
          cardCounts: { total: totalCards, mastered: masteredCards, unseen: unseenCards, dueThisWeek },
        },
      }}
    />
  );
}
