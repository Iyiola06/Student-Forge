import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/billing/server';

export const dynamic = 'force-dynamic';

export default async function OpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'operator'].includes(profile.role || '')) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const [
    { data: processingJobs },
    { data: generationJobs },
    { data: reviewSessions },
    { data: creditEvents },
    { data: referralReviews },
  ] = await Promise.all([
    admin
      .from('resource_processing_jobs')
      .select('status,created_at,completed_at,failure_code')
      .order('created_at', { ascending: false })
      .limit(60),
    admin
      .from('generation_jobs')
      .select('status,credits_charged,estimated_provider_cost,created_at')
      .order('created_at', { ascending: false })
      .limit(60),
    admin
      .from('review_sessions')
      .select('status,completed_items,total_items,started_at')
      .order('started_at', { ascending: false })
      .limit(60),
    admin
      .from('credit_events')
      .select('event_type,amount,estimated_provider_cost,created_at')
      .order('created_at', { ascending: false })
      .limit(60),
    admin
      .from('referral_redemptions')
      .select('status,suspicious,suspicious_reason,created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const processingList = processingJobs ?? [];
  const generationList = generationJobs ?? [];
  const reviewList = reviewSessions ?? [];
  const walletList = creditEvents ?? [];
  const referralList = referralReviews ?? [];

  const processingSuccessRate = processingList.length
    ? Math.round((processingList.filter((job) => job.status === 'completed').length / processingList.length) * 100)
    : 0;
  const generationSuccessRate = generationList.length
    ? Math.round((generationList.filter((job) => job.status === 'completed').length / generationList.length) * 100)
    : 0;
  const reviewCompletionRate = reviewList.length
    ? Math.round(
        (reviewList.filter((session) => session.status === 'completed').length / reviewList.length) * 100
      )
    : 0;
  const walletBurn = walletList.filter((event) => event.amount < 0).reduce((sum, event) => sum + Math.abs(event.amount), 0);

  return (
    <AppShell
      eyebrow="Ops"
      title="Operator dashboard"
      description="This internal surface tracks the closeout metrics that matter most now: reliability, review execution, and wallet burn."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel p-6">
          <p className="eyebrow">Processing</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{processingSuccessRate}%</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Recent extraction success rate</p>
        </div>
        <div className="glass-panel p-6">
          <p className="eyebrow">Generation</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{generationSuccessRate}%</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Recent generation success rate</p>
        </div>
        <div className="glass-panel p-6">
          <p className="eyebrow">Review</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{reviewCompletionRate}%</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Session completion rate</p>
        </div>
        <div className="glass-panel p-6">
          <p className="eyebrow">Wallet</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{walletBurn}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Credits burned in recent activity</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <div className="glass-panel p-6">
          <p className="eyebrow">Processing failures</p>
          <div className="mt-5 space-y-3">
            {processingList.filter((job) => job.status === 'failed').slice(0, 8).map((job, index) => (
              <div key={`${job.created_at}-${index}`} className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                <p className="text-sm font-black text-slate-950 dark:text-white">{job.failure_code || 'EXTRACTION_FAILED'}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(job.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Generation load</p>
          <div className="mt-5 space-y-3">
            {generationList.slice(0, 8).map((job, index) => (
              <div key={`${job.created_at}-${index}`} className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                <p className="text-sm font-black text-slate-950 dark:text-white">{job.status}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {job.credits_charged} credits • est. cost {job.estimated_provider_cost}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Review volume</p>
          <div className="mt-5 space-y-3">
            {reviewList.slice(0, 8).map((session, index) => (
              <div key={`${session.started_at}-${index}`} className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                <p className="text-sm font-black text-slate-950 dark:text-white">{session.status}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {session.completed_items}/{session.total_items} items • {new Date(session.started_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Referral review</p>
          <div className="mt-5 space-y-3">
            {referralList.length ? (
              referralList.slice(0, 8).map((referral, index) => (
                <div key={`${referral.created_at}-${index}`} className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {referral.status}
                    {referral.suspicious ? ' • flagged' : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {referral.suspicious_reason || 'No suspicion reason'} • {new Date(referral.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No referral reviews yet.</p>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
