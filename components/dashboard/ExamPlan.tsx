import Link from 'next/link';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

export type CardCounts = { total: number; mastered: number; unseen: number; dueThisWeek: number };

type Phase = { id: 'learn' | 'consolidate' | 'final'; title: string; body: string; range: string };

/** Turns an exam date and the card pile into a concrete daily plan. */
export function buildExamPlan(examDays: number, counts: CardCounts) {
  const studyDays = Math.max(1, examDays - 1); // keep the last day light
  const newPerDay = counts.unseen ? Math.ceil(counts.unseen / Math.max(1, studyDays - Math.min(3, Math.floor(studyDays / 3)))) : 0;
  const duePerDay = Math.ceil(counts.dueThisWeek / 7);
  const minutesPerDay = Math.max(5, Math.round(newPerDay * 1 + duePerDay * 0.4));
  const learnEnd = Math.max(0, examDays - 14);
  const phases: Phase[] = [
    {
      id: 'learn',
      title: 'Learn',
      range: examDays > 14 ? `Now → ${learnEnd} days before` : 'Done or skipped',
      body: 'Upload every topic, generate flashcards and quizzes, and introduce new cards daily.',
    },
    {
      id: 'consolidate',
      title: 'Consolidate',
      range: examDays > 2 ? `${Math.min(examDays, 14)} → 3 days before` : 'Done',
      body: 'Stop adding much new. Drill weak topics, answer exam questions, use Quiz me in the tutor.',
    },
    {
      id: 'final',
      title: 'Final review',
      range: 'Last 2 days',
      body: 'Every card is scheduled for one last look. Read your cheat sheets, review lightly, sleep well.',
    },
  ];
  const current: Phase['id'] = examDays > 14 ? 'learn' : examDays > 2 ? 'consolidate' : 'final';
  return { newPerDay, duePerDay, minutesPerDay, phases, current };
}

export default function ExamPlan({ examDays, counts }: { examDays: number | null; counts: CardCounts }) {
  if (examDays === null) {
    return (
      <div className="glass-panel app-panel flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Icon3D name="calendar" size={52} />
        <div className="flex-1">
          <h2 className="panel-title">Set your exam date</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            Add a date and Studify paces your daily cards, and makes sure every card gets a final review just before the exam.
          </p>
        </div>
        <Link href="/settings" className="primary-button">
          Add exam date
        </Link>
      </div>
    );
  }

  const plan = buildExamPlan(examDays, counts);
  const masteredPct = counts.total ? Math.round((counts.mastered / counts.total) * 100) : 0;

  return (
    <div className="glass-panel app-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Exam plan</p>
          <h2 className="panel-title mt-1">
            {examDays === 0 ? 'Exam day. You prepared for this.' : `${examDays} day${examDays === 1 ? '' : 's'} to go`}
          </h2>
        </div>
        <Link href="/settings" className="ghost-button !h-9 !px-3">
          Change date
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'New cards / day', value: plan.newPerDay, icon: 'sparkles' as const },
          { label: 'Reviews / day', value: plan.duePerDay, icon: 'brain' as const },
          { label: 'Minutes / day', value: plan.minutesPerDay, icon: 'stopwatch' as const },
        ].map((s) => (
          <div key={s.label} className="rounded-[20px] bg-[var(--card-2)] p-3">
            <Icon3D name={s.icon} size={24} />
            <p className="mt-2 font-display text-[22px] font-semibold text-[var(--text-strong)]">{s.value}</p>
            <p className="text-[11.5px] text-[var(--text-soft)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12.5px] text-[var(--text-soft)]">
          <span>
            {counts.mastered} of {counts.total} cards mastered
          </span>
          <span>{masteredPct}%</span>
        </div>
        <div className="mt-1.5 dashboard-progress-track !h-2">
          <div className="dashboard-progress-fill" data-tone="success" style={{ '--value': masteredPct } as React.CSSProperties} />
        </div>
      </div>

      <ol className="mt-5 grid gap-2 md:grid-cols-3">
        {plan.phases.map((phase) => (
          <li
            key={phase.id}
            className={cn(
              'rounded-[20px] border p-3',
              phase.id === plan.current ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] opacity-75'
            )}
          >
            <p className="flex items-center justify-between text-[13px] font-semibold text-[var(--text-strong)]">
              {phase.title}
              {phase.id === plan.current ? <span className="pill-tag !text-[10.5px]">Now</span> : null}
            </p>
            <p className="text-[11.5px] text-[var(--text-soft)]">{phase.range}</p>
            <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--text-body)]">{phase.body}</p>
          </li>
        ))}
      </ol>

      {counts.total === 0 ? (
        <Link href="/generator" className="primary-button mt-4">
          Create your first cards
        </Link>
      ) : null}
    </div>
  );
}
