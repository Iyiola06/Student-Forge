import type { ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import Panel, { panelVariants } from '@/components/ui/Panel';
import { cn } from '@/lib/utils';

type AppSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: VariantProps<typeof panelVariants>['variant'];
  padding?: VariantProps<typeof panelVariants>['padding'];
};

export default function AppSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  variant = 'default',
  padding = 'default',
}: AppSectionProps) {
  const hasHeader = eyebrow || title || description || action;

  return (
    <Panel variant={variant} padding={padding} className={cn(className)}>
      {hasHeader ? (
        <div className="app-section-header">
          <div className="min-w-0">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className={cn('panel-title', eyebrow ? 'mt-2' : '')}>{title}</h2> : null}
            {description ? <p className="app-section-copy">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(hasHeader ? 'mt-5' : '', bodyClassName)}>{children}</div>
    </Panel>
  );
}
