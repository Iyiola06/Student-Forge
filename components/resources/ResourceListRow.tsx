import Link from 'next/link';
import ResourceStatusBadge from '@/components/resources/ResourceStatusBadge';
import type { ProcessingJobRow, ResourceRow } from '@/components/resources/types';
import {
  formatBytes,
  formatFileType,
  getEffectiveResourceStatus,
  getResourcePreview,
  getSourceHealthCopy,
} from '@/components/resources/resource-utils';

type ResourceListRowProps = {
  resource: ResourceRow;
  job?: ProcessingJobRow | null;
};

export default function ResourceListRow({ resource, job }: ResourceListRowProps) {
  const status = getEffectiveResourceStatus(resource, job);
  const sourceHealth = getSourceHealthCopy(resource.processing_metadata?.source_health as string | null | undefined);

  return (
    <Link href={`/resources/${resource.id}`} className="app-list-button block">
      <div className="app-list-row">
        <div className="resource-file-icon">
          <span className="material-symbols-outlined text-[20px]">
            {resource.file_type.startsWith('image/') ? 'imagesmode' : resource.file_type.includes('presentation') ? 'slideshow' : 'description'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                {(resource.subject || 'General') + ' \u2022 ' + formatFileType(resource.file_type) + ' \u2022 ' + formatBytes(resource.file_size_bytes)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ResourceStatusBadge status={status} />
              {sourceHealth ? <ResourceStatusBadge label={sourceHealth} tone="neutral" /> : null}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{getResourcePreview(resource, job)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-slate-400 dark:text-slate-500">
            <span>Updated {new Date(resource.created_at).toLocaleDateString()}</span>
            {resource.extraction_confidence ? <span>{Math.round(resource.extraction_confidence * 100)}% confidence</span> : null}
            {job?.attempt_count ? <span>{job.attempt_count} attempt{job.attempt_count === 1 ? '' : 's'}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
