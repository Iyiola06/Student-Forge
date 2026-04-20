import * as React from 'react';
import { cn } from '@/lib/utils';

export function AppDataList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('app-list', className)} {...props} />;
}

type AppDataRowProps<T extends React.ElementType = 'div'> = {
  as?: T;
  active?: boolean;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

export function AppDataRow<T extends React.ElementType = 'div'>({
  as,
  active,
  className,
  ...props
}: AppDataRowProps<T>) {
  const Component = as || 'div';

  return <Component className={cn('app-list-row', className)} data-active={active ? 'true' : undefined} {...props} />;
}
