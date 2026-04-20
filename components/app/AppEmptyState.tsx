import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppEmptyStateProps = {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function AppEmptyState({ title, description, action, className }: AppEmptyStateProps) {
  return (
    <div className={cn('app-empty', className)}>
      {title ? <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p> : null}
      <p className={cn('text-sm', title ? 'mt-2' : '')}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
