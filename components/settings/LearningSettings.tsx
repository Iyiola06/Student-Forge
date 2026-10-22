'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Icon3D from '@/components/ui/Icon3D';
import { createClient } from '@/lib/supabase/client';

type LearningState = {
  retention: number;
  fsrs: { stabilityScale?: number; fittedOn?: number; fittedAt?: string } | null;
  freezes: number;
  reminders: boolean;
  memory: string;
};

const RETENTION_LABELS: Array<[number, string]> = [
  [0.85, 'Lighter: fewer reviews, a few more slips'],
  [0.91, 'Balanced: the research default'],
  [0.97, 'Exam crunch: more reviews, near-perfect recall'],
];

/** Study preferences that drive the memory model, reminders and tutor memory. */
export default function LearningSettings() {
  const [state, setState] = useState<LearningState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { data: pref }, { data: memory }] = await Promise.all([
        supabase.from('profiles').select('desired_retention,fsrs_params,streak_freezes').eq('id', user.id).maybeSingle(),
        supabase.from('notification_preferences').select('enabled').eq('user_id', user.id).eq('preference_type', 'due_review').eq('channel', 'push').maybeSingle(),
        supabase.from('learner_memory').select('notes').eq('user_id', user.id).maybeSingle(),
      ]);
      setState({
        retention: Number(profile?.desired_retention ?? 0.9),
        fsrs: (profile?.fsrs_params as LearningState['fsrs']) ?? null,
        freezes: Number(profile?.streak_freezes ?? 0),
        reminders: pref?.enabled ?? true,
        memory: memory?.notes ?? '',
      });
    })();
  }, []);

  if (!state) return <div className="glass-panel app-panel h-40 animate-pulse" />;

  const saveRetention = async (value: number) => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({ desired_retention: value }).eq('id', user.id);
      if (error) toast.error(error.message);
      else toast.success(`Target recall set to ${Math.round(value * 100)}%.`);
    }
    setSaving(false);
  };

  const toggleReminders = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const enabled = !state.reminders;
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, preference_type: 'due_review', channel: 'push', enabled }, { onConflict: 'user_id,preference_type,channel' });
    if (error) return toast.error(error.message);
    setState({ ...state, reminders: enabled });
    toast.success(enabled ? 'Daily review reminders on.' : 'Daily review reminders off.');
  };

  const forgetMemory = async () => {
    if (!confirm('Clear everything the tutor has learned about how you study?')) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('learner_memory').delete().eq('user_id', user.id);
    setState({ ...state, memory: '' });
    toast.success('Tutor memory cleared.');
  };

  const scale = state.fsrs?.stabilityScale;
  const retentionLabel = RETENTION_LABELS.find(([max]) => state.retention <= max)?.[1] ?? RETENTION_LABELS[2][1];

  return (
    <section className="glass-panel app-panel">
      <p className="eyebrow">Learning</p>
      <h2 className="panel-title mt-1">How Studify schedules your reviews</h2>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-strong)]">
              <Icon3D name="target" size={22} /> Target recall
            </p>
            <span className="font-display text-[18px] font-semibold text-[var(--text-strong)]">{Math.round(state.retention * 100)}%</span>
          </div>
          <input
            type="range"
            min={80}
            max={95}
            step={1}
            value={Math.round(state.retention * 100)}
            disabled={saving}
            onChange={(e) => setState({ ...state, retention: Number(e.target.value) / 100 })}
            onMouseUp={(e) => saveRetention(Number((e.target as HTMLInputElement).value) / 100)}
            onTouchEnd={(e) => saveRetention(Number((e.target as HTMLInputElement).value) / 100)}
            onKeyUp={(e) => saveRetention(Number((e.target as HTMLInputElement).value) / 100)}
            className="mt-3 w-full accent-[#4a9be8]"
            aria-label="Target recall percentage"
          />
          <p className="mt-1 text-[12.5px] text-[var(--text-soft)]">{retentionLabel}</p>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-strong)]">
            <Icon3D name="brain" size={22} /> Your memory model
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[var(--text-body)]">
            {scale
              ? `Tuned from ${state.fsrs?.fittedOn?.toLocaleString()} of your reviews. You remember ${
                  scale >= 1.05 ? `about ${Math.round((scale - 1) * 100)}% longer` : scale <= 0.95 ? `about ${Math.round((1 - scale) * 100)}% shorter` : 'about as long'
                } than the average learner, so your intervals are adjusted to match.`
              : 'Using the standard FSRS model. After about 200 reviews it re-tunes itself to how fast you actually forget.'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4">
          <div>
            <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-strong)]">
              <Icon3D name="bell" size={22} /> Daily review reminder
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--text-soft)]">A push at 6pm when cards are due and you have not studied yet. Needs push notifications on.</p>
          </div>
          <button className={state.reminders ? 'secondary-button !h-9 shrink-0 whitespace-nowrap' : 'primary-button !h-9 shrink-0 whitespace-nowrap'} onClick={toggleReminders}>
            {state.reminders ? 'Turn off' : 'Turn on'}
          </button>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-strong)]">
            <Icon3D name="fire" size={22} /> Streak freezes: {state.freezes}/2
          </p>
          <p className="mt-1 text-[12.5px] text-[var(--text-soft)]">Finish a Streak Saver session in Review to bank one. A freeze forgives a missed day.</p>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-strong)]">
              <Icon3D name="robot" size={22} /> What the tutor remembers about you
            </p>
            {state.memory ? (
              <button className="ghost-button !h-8 !px-3 !text-[12.5px]" onClick={forgetMemory}>
                Clear memory
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] leading-6 whitespace-pre-wrap text-[var(--text-body)]">
            {state.memory || 'Nothing yet. After a few tutor conversations, short notes about your subjects and tricky concepts appear here.'}
          </p>
        </div>
      </div>
    </section>
  );
}
