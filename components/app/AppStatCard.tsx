import type { ReactNode } from 'react';
import Panel from '@/components/ui/Panel';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

type AppStatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  icon?: Icon3DName;
  tone?: string;
  className?: string;
};

export default function AppStatCard({ label, value, detail, action, icon, tone, className }: AppStatCardProps) {
  return (
    <Panel variant="default" padding="sm" className={cn('metric-tile relative flex flex-col justify-between overflow-hidden', tone, className)}>
      {icon ? <Icon3D name={icon} size={52} className="absolute top-4 right-4" /> : null}
      <div>
        <p className="text-[13px] text-[var(--text-soft)]">{label}</p>
        <div className="mt-2 font-display text-[30px] leading-[1.02] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{value}</div>
        {detail ? <p className="mt-2 text-[13px] leading-5 text-[var(--text-soft)]">{detail}</p> : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Panel>
  );
}
