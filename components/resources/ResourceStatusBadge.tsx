import { cva, type VariantProps } from 'class-variance-authority';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import { cn } from '@/lib/utils';
import { getResourceStatusLabel, getResourceStatusTone } from '@/components/resources/resource-utils';

export const appStatusBadgeVariants = cva('', {
  variants: {
    tone: {
      neutral: '',
      info: '',
      success: '',
      warning: '',
      danger: '',
    },
  },
});

type ResourceStatusBadgeProps = {
  status?: string | null;
  className?: string;
  label?: string;
  tone?: VariantProps<typeof appStatusBadgeVariants>['tone'];
};

export default function ResourceStatusBadge({ status, className, label, tone }: ResourceStatusBadgeProps) {
  return (
    <AppStatusBadge tone={tone || getResourceStatusTone(status)} className={cn(className)}>
      {label || getResourceStatusLabel(status)}
    </AppStatusBadge>
  );
}
