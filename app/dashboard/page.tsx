import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Run ALL queries in parallel — this is the key speedup
  const [profileRes, dueRes, overdueRes, totalCardsRes, recentRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('flashcard_items').select('id', { count: 'exact', head: true }).lte('next_review_at', now.toISOString()),
    supabase.from('flashcard_items').select('id', { count: 'exact', head: true }).lte('next_review_at', yesterday.toISOString()),
    supabase.from('flashcard_items').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id, title, content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const cardsDue = dueRes.count ?? 0;
  const overdue24h = (overdueRes.count ?? 0) > 0;
  const totalCards = totalCardsRes.count ?? 0;
  const recentResource = recentRes.data?.[0] ?? null;

  // Calculate readiness on the server
  const cardsMastered = profile?.cards_mastered || 0;
  const cardScore = totalCards ? Math.min((cardsMastered / totalCards) * 40, 40) : 0;
  const quizzes = profile?.quizzes_taken || 0;
  const quizScore = Math.min((quizzes / 10) * 40, 40);
  const streak = profile?.streak_days || 0;
  const streakScore = Math.min((streak / 7) * 20, 20);
  const readiness = Math.round(cardScore + quizScore + streakScore);

  return (
    <DashboardClient
      initialData={{
        user,
        profile,
        stats: {
          cardsDue,
          overdue24h,
          totalCards,
          recentResource,
          readiness,
        },
      }}
    />
  );
}
