import Link from 'next/link';
import { cn } from '@/lib/utils';

type ResourceActionGridProps = {
  resourceId: string;
  ready: boolean;
  className?: string;
};

const actions = [
  {
    title: 'Generate flashcards',
    body: 'Turn the extracted material into rapid-retrieval cards.',
    href: (resourceId: string) => `/generator?resource=${resourceId}&type=flashcards`,
    icon: 'style',
  },
  {
    title: 'Generate quiz',
    body: 'Create multiple-choice practice from the same source.',
    href: (resourceId: string) => `/generator?resource=${resourceId}&type=mcq`,
    icon: 'quiz',
  },
  {
    title: 'Create summary',
    body: 'Open the simplifier with this resource already selected.',
    href: (resourceId: string) => `/simplifier?resource=${resourceId}`,
    icon: 'article',
  },
  {
    title: 'Use AI tutor',
    body: 'Talk through the material with the document loaded as context.',
    href: (resourceId: string) => `/ai-tutor?resourceId=${resourceId}`,
    icon: 'school',
  },
] as const;

export default function ResourceActionGrid({ resourceId, ready, className }: ResourceActionGridProps) {
  return (
    <div className={cn('resource-action-grid', className)}>
      {actions.map((action) => {
        const href = action.href(resourceId);

        if (!ready) {
          return (
            <div key={action.title} className="resource-action-card opacity-65">
              <div className="flex items-start gap-3">
                <div className="resource-file-icon size-11 rounded-[18px]">
                  <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{action.title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{action.body}</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link key={action.title} href={href} className="resource-action-card block">
            <div className="flex items-start gap-3">
              <div className="resource-file-icon size-11 rounded-[18px]">
                <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950 dark:text-white">{action.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{action.body}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
