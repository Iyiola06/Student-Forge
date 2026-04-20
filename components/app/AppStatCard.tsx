import type { ReactNode } from 'react';
import Panel from '@/components/ui/Panel';
import { cn } from '@/lib/utils';

type AppStatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function AppStatCard({ label, value, detail, action, className }: AppStatCardProps) {
  return (
    <Panel variant="default" padding="sm" className={cn('metric-tile flex flex-col justify-between', className)}>
      <div>
        <p className="eyebrow">{label}</p>
        <div className="mt-3 text-[28px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 dark:text-white">{value}</div>
        {detail ? <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{detail}</p> : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Panel>
  );
}
