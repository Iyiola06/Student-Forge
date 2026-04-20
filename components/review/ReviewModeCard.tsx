import type { ReviewSessionType } from '@/components/review/types';

type ReviewModeCardProps = {
  id: ReviewSessionType;
  label: string;
  body: string;
  onStart: (id: ReviewSessionType) => void;
  isStarting: boolean;
};

export default function ReviewModeCard({ id, label, body, onStart, isStarting }: ReviewModeCardProps) {
  return (
    <div className="app-list-row items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-950 dark:text-white">{label}</p>
        <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p>
      </div>
      <button onClick={() => onStart(id)} disabled={isStarting} className="primary-button shrink-0 disabled:opacity-60">
        {isStarting ? 'Starting...' : 'Start session'}
      </button>
    </div>
  );
}
