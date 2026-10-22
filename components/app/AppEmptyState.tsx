import type { ReactNode } from 'react';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

type AppEmptyStateProps = {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  icon?: Icon3DName;
  className?: string;
};

export default function AppEmptyState({ title, description, action, icon = 'cloud', className }: AppEmptyStateProps) {
  return (
    <div className={cn('app-empty flex flex-col items-center text-center', className)}>
      <Icon3D name={icon} size={56} className="mb-2" />
      {title ? <p className="font-display text-[15px] font-semibold text-[var(--text-strong)]">{title}</p> : null}
      <p className={cn('max-w-[46ch] text-sm', title ? 'mt-1' : '')}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
