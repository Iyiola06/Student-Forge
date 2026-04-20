'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppDataList, AppDataRow } from '@/components/app/AppDataList';
import AppEmptyState from '@/components/app/AppEmptyState';
import AppSection from '@/components/app/AppSection';
import { AppTabs } from '@/components/app/AppTabs';
import ResourceActionGrid from '@/components/resources/ResourceActionGrid';
import ResourceStatusBadge from '@/components/resources/ResourceStatusBadge';
import type { ProcessingJobRow, ResourceRow } from '@/components/resources/types';
import {
  formatBytes,
  formatFileType,
  getEffectiveResourceStatus,
  getResourcePreview,
  getResourceStatusCopy,
  getSourceHealthCopy,
  isResourceReady,
} from '@/components/resources/resource-utils';
import AppShell from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/client';

type ResourceDetailClientProps = {
  initialResource: ResourceRow;
  initialJob: ProcessingJobRow | null;
};

export default function ResourceDetailClient({ initialResource, initialJob }: ResourceDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [resource, setResource] = useState(initialResource);
  const [job, setJob] = useState<ProcessingJobRow | null>(initialJob);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRetrying, setIsRetrying] = useState(false);

  const status = getEffectiveResourceStatus(resource, job);
  const ready = isResourceReady(resource, job);
  const sourceHealth = getSourceHealthCopy(resource.processing_metadata?.source_health as string | null | undefined);
  const confidence = resource.extraction_confidence ? Math.round(resource.extraction_confidence * 100) : null;
  const supportCode = resource.processing_metadata?.support_code as string | undefined;
  const recommendedNextStep = resource.processing_metadata?.recommended_next_step as string | undefined;
  const extractedContent = resource.content?.trim() || resource.extracted_preview || '';
  const extractionNeedsReview = ready && (resource.processing_metadata?.source_health === 'needs_review' || (confidence ?? 100) < 75);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'content', label: ready ? 'Extracted text' : 'Preview' },
      { id: 'diagnostics', label: 'Diagnostics' },
    ],
    [ready]
  );

  async function refreshResource() {
    const { data: updatedResource } = await supabase
      .from('resources')
      .select(
        'id,title,subject,file_type,file_size_bytes,created_at,content,extracted_preview,extraction_confidence,extraction_method,processing_status,processing_error,processing_metadata'
      )
      .eq('id', resource.id)
      .single();

    if (updatedResource) {
      setResource(updatedResource as ResourceRow);
    }

    const { data: jobs } = await supabase
      .from('resource_processing_jobs')
      .select('id,resource_id,status,attempt_count,failure_code,failure_message,started_at,completed_at,created_at')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false })
      .limit(1);

    setJob(((jobs?.[0] as ProcessingJobRow | undefined) ?? null));
  }

  useEffect(() => {
    const channel = supabase
      .channel(`resource-detail:${resource.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources', filter: `id=eq.${resource.id}` }, () => {
        refreshResource();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resource_processing_jobs', filter: `resource_id=eq.${resource.id}` },
        () => {
          refreshResource();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resource.id]);

  async function onRetry() {
    setIsRetrying(true);
    await fetch('/api/resources/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId: resource.id }),
    });
    await refreshResource();
    setIsRetrying(false);
  }

  const sidebar = (
    <div className="app-section-stack">
      <AppSection eyebrow="AI readiness" title={ready ? 'Ready to use' : status === 'failed' ? 'Needs attention' : 'In progress'} variant="soft">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ResourceStatusBadge status={status} />
            {sourceHealth ? <ResourceStatusBadge label={sourceHealth} tone={extractionNeedsReview ? 'warning' : 'neutral'} /> : null}
          </div>
          <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">{getResourceStatusCopy(status)}</p>
          {extractionNeedsReview ? (
            <div className="app-empty">
              The extraction is usable, but parts of the source may still need a manual glance before you build study material from it.
            </div>
          ) : null}
          {status === 'failed' ? (
            <button onClick={onRetry} className="primary-button" disabled={isRetrying}>
              {isRetrying ? 'Retrying...' : 'Retry extraction'}
            </button>
          ) : null}
        </div>
      </AppSection>

      <AppSection eyebrow="File facts" title="Source details" variant="default" bodyClassName="space-y-3">
        <div className="resource-detail-meta-card">
          <p className="dashboard-mini-label">Type</p>
          <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{formatFileType(resource.file_type)}</p>
        </div>
        <div className="resource-detail-meta-card">
          <p className="dashboard-mini-label">Size</p>
          <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{formatBytes(resource.file_size_bytes)}</p>
        </div>
        <div className="resource-detail-meta-card">
          <p className="dashboard-mini-label">Method</p>
          <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{resource.extraction_method || 'Pending'}</p>
        </div>
        <div className="resource-detail-meta-card">
          <p className="dashboard-mini-label">Confidence</p>
          <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{confidence ? `${confidence}%` : 'Pending'}</p>
        </div>
      </AppSection>

      <AppSection eyebrow="Support" title="Trusted recovery path" variant="default">
        <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
          {recommendedNextStep || 'If the extraction needs help, Sulva’s Studify will show the recommended recovery step here.'}
        </p>
        {supportCode ? <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Support code: {supportCode}</p> : null}
      </AppSection>
    </div>
  );

  return (
    <AppShell
      eyebrow="Resource detail"
      title={resource.title}
      description="Readiness, extracted content, and AI actions for this study source."
      actions={
        ready ? (
          <Link href={`/generator?resource=${resource.id}&type=flashcards`} className="primary-button">
            Generate flashcards
          </Link>
        ) : status === 'failed' ? (
          <button onClick={onRetry} className="primary-button" disabled={isRetrying}>
            {isRetrying ? 'Retrying...' : 'Retry extraction'}
          </button>
        ) : (
          <Link href="/resources" className="secondary-button">
            Back to library
          </Link>
        )
      }
      sidebar={sidebar}
    >
      <div className="workspace-stack">
        <AppSection
          eyebrow="File header"
          title="Study-source overview"
          description="This is the cleanest view of what was extracted, how reliable it looks, and what you can do next."
          variant="spotlight"
          bodyClassName="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <ResourceStatusBadge status={status} />
            {sourceHealth ? <ResourceStatusBadge label={sourceHealth} tone={extractionNeedsReview ? 'warning' : 'neutral'} /> : null}
            {confidence ? <ResourceStatusBadge label={`${confidence}% confidence`} tone="neutral" /> : null}
            {resource.subject ? <ResourceStatusBadge label={resource.subject} tone="neutral" /> : null}
          </div>

          <div className="resource-detail-meta">
            <div className="resource-detail-meta-card">
              <p className="dashboard-mini-label">Created</p>
              <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{new Date(resource.created_at).toLocaleString()}</p>
            </div>
            <div className="resource-detail-meta-card">
              <p className="dashboard-mini-label">Processing</p>
              <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{status}</p>
            </div>
            <div className="resource-detail-meta-card">
              <p className="dashboard-mini-label">Attempts</p>
              <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{job?.attempt_count ?? 0}</p>
            </div>
            <div className="resource-detail-meta-card">
              <p className="dashboard-mini-label">Library</p>
              <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">Sulva’s Studify</p>
            </div>
          </div>
        </AppSection>

        <AppSection
          eyebrow="Actions"
          title="Use this source intelligently"
          description={ready ? 'Every action below opens with this resource already in context.' : 'AI actions unlock automatically when the source becomes ready.'}
        >
          <ResourceActionGrid resourceId={resource.id} ready={ready} />
        </AppSection>

        <AppSection eyebrow="Content" title="Readable view" action={<AppTabs items={tabs} value={activeTab} onChange={setActiveTab} />}>
          {activeTab === 'overview' ? (
            <div className="resource-preview">
              <p className="dashboard-mini-label">Preview</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-700 dark:text-slate-200">{getResourcePreview(resource, job)}</p>
            </div>
          ) : null}

          {activeTab === 'content' ? (
            extractedContent ? (
              <div className="resource-preview">
                <p className="dashboard-mini-label">{ready ? 'Extracted text' : 'Available content'}</p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-700 dark:text-slate-200">{extractedContent.slice(0, 6000)}</p>
              </div>
            ) : (
              <AppEmptyState
                description={
                  status === 'failed'
                    ? 'No safe extracted text is available yet. Retry the file or upload a clearer source.'
                    : 'Readable text will appear here as soon as extraction reaches a trustworthy state.'
                }
              />
            )
          ) : null}

          {activeTab === 'diagnostics' ? (
            <AppDataList>
              <AppDataRow>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Diagnostics summary</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    {(resource.processing_metadata?.diagnostics_summary as string | undefined) ||
                      job?.failure_message ||
                      'A diagnostic summary will appear here after processing finishes.'}
                  </p>
                </div>
              </AppDataRow>
              <AppDataRow>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Recommended next step</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    {recommendedNextStep || 'No intervention needed right now.'}
                  </p>
                </div>
              </AppDataRow>
              <AppDataRow>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Failure signal</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    {resource.processing_error || job?.failure_code || 'No failure signal recorded.'}
                  </p>
                </div>
              </AppDataRow>
              <AppDataRow>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Processing timestamps</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    Started {job?.started_at ? new Date(job.started_at).toLocaleString() : 'not yet'} {'\u2022'} Completed{' '}
                    {job?.completed_at ? new Date(job.completed_at).toLocaleString() : 'not yet'}
                  </p>
                </div>
              </AppDataRow>
            </AppDataList>
          ) : null}
        </AppSection>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push('/resources')} className="secondary-button">
            Back to library
          </button>
          {status === 'failed' ? (
            <button onClick={onRetry} className="ghost-button" disabled={isRetrying}>
              {isRetrying ? 'Retrying...' : 'Retry extraction'}
            </button>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
