import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { getAdminClientAvailability } from '@/lib/billing/server';

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

  const adminAvailability = getAdminClientAvailability();

  if (!adminAvailability.enabled) {
    return (
      <AppShell eyebrow="Ops" title="Operator dashboard">
        <section className="glass-panel app-panel">
          <p className="eyebrow">Config health</p>
          <h2 className="panel-title mt-2">Admin services are unavailable</h2>
          <p className="mt-3 text-[14px] leading-6 text-slate-600 dark:text-slate-300">
            Operator surfaces, referral automation, billing confirmation, and generation job persistence need the missing keys below.
          </p>
          <div className="mt-4 app-list">
            {adminAvailability.missingKeys.map((key) => (
              <div key={key} className="app-list-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{key}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AppShell>
    );
  }

  const admin = adminAvailability.client;
  const [{ data: processingJobs }, { data: generationJobs }, { data: reviewSessions }, { data: creditEvents }, { data: referralReviews }] =
    await Promise.all([
      admin.from('resource_processing_jobs').select('status,created_at,completed_at,failure_code').order('created_at', { ascending: false }).limit(60),
      admin
        .from('generation_jobs')
        .select('status,credits_charged,estimated_provider_cost,created_at')
        .order('created_at', { ascending: false })
        .limit(60),
      admin.from('review_sessions').select('status,completed_items,total_items,started_at').order('started_at', { ascending: false }).limit(60),
      admin.from('credit_events').select('event_type,amount,estimated_provider_cost,created_at').order('created_at', { ascending: false }).limit(60),
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
    ? Math.round((reviewList.filter((session) => session.status === 'completed').length / reviewList.length) * 100)
    : 0;
  const walletBurn = walletList.filter((event) => event.amount < 0).reduce((sum, event) => sum + Math.abs(event.amount), 0);

  return (
    <AppShell eyebrow="Ops" title="Operator dashboard">
      <div className="workspace-stack">
        <section className="metric-strip">
          {[
            ['Processing', `${processingSuccessRate}%`, 'Recent extraction success'],
            ['Generation', `${generationSuccessRate}%`, 'Recent generation success'],
            ['Review', `${reviewCompletionRate}%`, 'Session completion rate'],
            ['Wallet burn', `${walletBurn}`, 'Recent credits consumed'],
          ].map(([label, value, detail]) => (
            <div key={label} className="glass-panel app-panel-tight">
              <p className="eyebrow">{label}</p>
              <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{value}</p>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Processing failures</p>
            <h2 className="panel-title mt-2">Latest extraction issues</h2>
            <div className="mt-4">
              {processingList.filter((job) => job.status === 'failed').length ? (
                <div className="app-list">
                  {processingList
                    .filter((job) => job.status === 'failed')
                    .slice(0, 8)
                    .map((job, index) => (
                      <div key={`${job.created_at}-${index}`} className="app-list-row">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-950 dark:text-white">{job.failure_code || 'EXTRACTION_FAILED'}</p>
                          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{new Date(job.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="app-empty">No recent extraction failures.</div>
              )}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Generation load</p>
            <h2 className="panel-title mt-2">Recent generation jobs</h2>
            <div className="mt-4 app-list">
              {generationList.slice(0, 8).map((job, index) => (
                <div key={`${job.created_at}-${index}`} className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black capitalize text-slate-950 dark:text-white">{job.status}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                      {job.credits_charged} credits • est. cost {job.estimated_provider_cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Review volume</p>
            <h2 className="panel-title mt-2">Recent review sessions</h2>
            <div className="mt-4 app-list">
              {reviewList.slice(0, 8).map((session, index) => (
                <div key={`${session.started_at}-${index}`} className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black capitalize text-slate-950 dark:text-white">{session.status}</p>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                      {session.completed_items}/{session.total_items} items • {new Date(session.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Referral review</p>
            <h2 className="panel-title mt-2">Flagged redemptions</h2>
            <div className="mt-4">
              {referralList.length ? (
                <div className="app-list">
                  {referralList.slice(0, 8).map((referral, index) => (
                    <div key={`${referral.created_at}-${index}`} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950 dark:text-white">
                          {referral.status}
                          {referral.suspicious ? ' • flagged' : ''}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                          {referral.suspicious_reason || 'No suspicion reason'} • {new Date(referral.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">No referral reviews yet.</div>
              )}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
