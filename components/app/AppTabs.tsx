import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AppTabItem = {
  id: string;
  label: string;
  count?: ReactNode;
};

type AppTabsProps = {
  items: AppTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function AppTabs({ items, value, onChange, className }: AppTabsProps) {
  return (
    <div className={cn('app-tabs', className)}>
      {items.map((item) => (
        <AppTabButton key={item.id} active={value === item.id} onClick={() => onChange(item.id)}>
          <span>{item.label}</span>
          {item.count !== undefined ? <span className="ml-2 text-[11px] opacity-70">{item.count}</span> : null}
        </AppTabButton>
      ))}
    </div>
  );
}

type AppTabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function AppTabButton({ active, className, children, ...props }: AppTabButtonProps) {
  return (
    <button type="button" className={cn('app-tab', className)} data-active={active ? 'true' : undefined} {...props}>
      {children}
    </button>
  );
}
