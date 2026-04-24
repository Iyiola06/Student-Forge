'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AppEmptyState from '@/components/app/AppEmptyState';
import AppSection from '@/components/app/AppSection';
import AppStatCard from '@/components/app/AppStatCard';
import { AppTabs } from '@/components/app/AppTabs';
import AppShell from '@/components/layout/AppShell';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import ResourceDropzone from '@/components/resources/ResourceDropzone';
import ResourceListRow from '@/components/resources/ResourceListRow';
import ResourceStatusBadge from '@/components/resources/ResourceStatusBadge';
import type { ProcessingJobRow, ResourceRow } from '@/components/resources/types';
import {
  getEffectiveResourceStatus,
  getResourceStatusCopy,
  getSourceHealthCopy,
  isResourceReady,
} from '@/components/resources/resource-utils';
import { useGoogleBooks } from '@/hooks/useGoogleBooks';
import { createClient } from '@/lib/supabase/client';

type FilterId = 'all' | 'ready' | 'processing' | 'attention';

const uploadStateCopy: Record<string, string> = {
  idle: 'The library is ready for a new file.',
  compressing: 'Optimizing the upload before it enters storage.',
  uploading: 'Sending the file into your private study library.',
  queued: 'The file is safely stored and waiting for extraction.',
  extracting: 'Sulva’s Studify is reading and cleaning the text.',
  extracted: 'Readable text is in place and the preview is being finalized.',
  ready: 'The file is AI-ready and can be used immediately.',
  retrying: 'A second pass is running to improve the extraction.',
  failed: 'The file needs attention before it becomes AI-ready.',
};

export default function ResourcesPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadState } = useUpload();
  const { searchBooks, results: bookResults, isLoading: booksLoading, error: booksError } = useGoogleBooks();

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [jobsByResource, setJobsByResource] = useState<Record<string, ProcessingJobRow | null>>({});
  const [query, setQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [hasBookSearched, setHasBookSearched] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');
  const [isLoading, setIsLoading] = useState(true);

  async function fetchResources() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setResources([]);
      setJobsByResource({});
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('resources')
      .select(
        'id,title,subject,file_type,file_size_bytes,created_at,content,extracted_preview,extraction_confidence,extraction_method,processing_status,processing_error,processing_metadata'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rows = (data as ResourceRow[]) ?? [];
    setResources(rows);

    if (!rows.length) {
      setJobsByResource({});
      setIsLoading(false);
      return;
    }

    const { data: jobs } = await supabase
      .from('resource_processing_jobs')
      .select('id,resource_id,status,attempt_count,failure_code,failure_message,started_at,completed_at,created_at')
      .in('resource_id', rows.map((resource) => resource.id))
      .order('created_at', { ascending: false });

    const mapped: Record<string, ProcessingJobRow | null> = {};
    for (const job of jobs ?? []) {
      if (!mapped[job.resource_id]) {
        mapped[job.resource_id] = job as ProcessingJobRow;
      }
    }

    setJobsByResource(mapped);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchResources();

    const channel = supabase
      .channel('resources-library')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        fetchResources();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_processing_jobs' }, () => {
        fetchResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const readyCount = resources.filter((resource) => isResourceReady(resource, jobsByResource[resource.id])).length;
  const processingCount = resources.filter((resource) => {
    const status = getEffectiveResourceStatus(resource, jobsByResource[resource.id]);
    return ['queued', 'processing', 'extracting', 'extracted', 'retrying', 'uploaded'].includes(status);
  }).length;
  const attentionCount = resources.filter((resource) => {
    const status = getEffectiveResourceStatus(resource, jobsByResource[resource.id]);
    return status === 'failed' || resource.processing_metadata?.source_health === 'needs_review';
  }).length;

  const filteredResources = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const job = jobsByResource[resource.id];
      const status = getEffectiveResourceStatus(resource, job);
      const matchesQuery =
        !lowered ||
        [resource.title, resource.subject, status, resource.extraction_method].some((value) =>
          (value || '').toLowerCase().includes(lowered)
        );

      if (!matchesQuery) return false;

      if (filter === 'ready') return status === 'ready';
      if (filter === 'processing') return ['queued', 'processing', 'extracting', 'extracted', 'retrying', 'uploaded'].includes(status);
      if (filter === 'attention') return status === 'failed' || resource.processing_metadata?.source_health === 'needs_review';

      return true;
    });
  }, [filter, jobsByResource, query, resources]);

  const latestResource = resources[0];

  const sidebar = (
    <div className="app-section-stack">
      <AppSection eyebrow="Pipeline" title="Upload trust" variant="soft">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ResourceStatusBadge status={uploadState === 'idle' ? 'ready' : uploadState} label={uploadState === 'idle' ? 'Library ready' : undefined} />
          </div>
          <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
            {uploadStateCopy[uploadState] || 'The library is ready for your next source.'}
          </p>
        </div>
      </AppSection>

      <AppSection eyebrow="Library health" title="Current balance">
        <div className="space-y-3">
          <div className="resource-detail-meta-card">
            <p className="dashboard-mini-label">AI ready</p>
            <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{readyCount}</p>
          </div>
          <div className="resource-detail-meta-card">
            <p className="dashboard-mini-label">Processing</p>
            <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{processingCount}</p>
          </div>
          <div className="resource-detail-meta-card">
            <p className="dashboard-mini-label">Needs review</p>
            <p className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{attentionCount}</p>
          </div>
        </div>
      </AppSection>

      {latestResource ? (
        <AppSection eyebrow="Latest file" title={latestResource.title} variant="default">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <ResourceStatusBadge status={getEffectiveResourceStatus(latestResource, jobsByResource[latestResource.id])} />
              {getSourceHealthCopy(latestResource.processing_metadata?.source_health as string | undefined) ? (
                <ResourceStatusBadge
                  label={getSourceHealthCopy(latestResource.processing_metadata?.source_health as string | undefined) || undefined}
                  tone="neutral"
                />
              ) : null}
            </div>
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
              {getResourceStatusCopy(getEffectiveResourceStatus(latestResource, jobsByResource[latestResource.id]))}
            </p>
            <Link href={`/resources/${latestResource.id}`} className="ghost-button !h-9 !px-0">
              Open detail
            </Link>
          </div>
        </AppSection>
      ) : null}
    </div>
  );

  return (
    <AppShell
      eyebrow="Library"
      title="Study materials"
      description="Upload, inspect, and trust the sources that power quizzes, flashcards, summaries, and tutoring."
      actions={
        <button type="button" onClick={() => fileInputRef.current?.click()} className="secondary-button hidden md:inline-flex">
          Browse files
        </button>
      }
      sidebar={sidebar}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          event.target.value = '';
          await uploadFile(file);
        }}
      />

      <div className="workspace-stack">
        <ResourceDropzone onFileSelect={uploadFile} uploadState={uploadState} />

        <section className="grid gap-4 md:grid-cols-3">
          <AppStatCard label="All sources" value={resources.length} detail="Everything currently in your study library." />
          <AppStatCard label="AI ready" value={readyCount} detail="Ready to generate flashcards, quizzes, summaries, and tutoring context." />
          <AppStatCard
            label="Needs attention"
            value={attentionCount}
            detail={processingCount ? `${processingCount} file${processingCount === 1 ? '' : 's'} still processing.` : 'No active processing risk.'}
          />
        </section>

        <AppSection
          eyebrow="Library"
          title="Your files"
          description="Search, filter, and open the source that should drive your next study action."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <AppTabs
                items={[
                  { id: 'all', label: 'All', count: resources.length },
                  { id: 'ready', label: 'AI ready', count: readyCount },
                  { id: 'processing', label: 'Processing', count: processingCount },
                  { id: 'attention', label: 'Needs review', count: attentionCount },
                ]}
                value={filter}
                onChange={(value) => setFilter(value as FilterId)}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, subject, or status"
                className="w-full rounded-2xl border border-black/6 bg-white/70 px-4 py-2.5 text-sm outline-none lg:w-[280px] dark:border-white/8 dark:bg-white/5"
              />
            </div>
          }
        >
          {isLoading ? (
            <AppEmptyState description="Loading your library..." />
          ) : filteredResources.length ? (
            <div className="app-list">
              {filteredResources.map((resource) => (
                <ResourceListRow key={resource.id} resource={resource} job={jobsByResource[resource.id]} />
              ))}
            </div>
          ) : (
            <AppEmptyState
              title="No matching sources"
              description={
                resources.length
                  ? 'Try a broader search or switch the filter to reveal more materials.'
                  : 'Upload your first PDF, deck, image note, or text file to start the study loop.'
              }
            />
          )}
        </AppSection>

        <AppSection
          eyebrow="Reference search"
          title="Browse Google Books"
          description="Keep a secondary reference nearby when you want broader context around a topic."
          action={
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[420px]">
              <input
                value={bookQuery}
                onChange={(event) => setBookQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setHasBookSearched(true);
                    searchBooks(bookQuery);
                  }
                }}
                placeholder="Search author, topic, or title"
                className="min-w-0 flex-1 rounded-2xl border border-black/6 bg-white/70 px-4 py-2.5 text-sm outline-none dark:border-white/8 dark:bg-white/5"
              />
              <button
                type="button"
                onClick={async () => {
                  setHasBookSearched(true);
                  await searchBooks(bookQuery);
                }}
                className="secondary-button sm:shrink-0"
              >
                Search
              </button>
            </div>
          }
        >
          {booksLoading ? (
            <AppEmptyState description="Searching Google Books..." />
          ) : booksError ? (
            <AppEmptyState description={booksError} />
          ) : hasBookSearched && bookResults.length ? (
            <div className="app-list">
              {bookResults.map((book) => {
                const description = book.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                return (
                  <div key={book.id} className="app-list-row">
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-black/6 bg-white/70 dark:border-white/8 dark:bg-white/5">
                      {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">menu_book</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{book.title}</p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                            {book.authors?.length ? book.authors.join(', ') : 'Author unavailable'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {book.previewLink ? (
                            <a href={book.previewLink} target="_blank" rel="noreferrer" className="secondary-button !h-9 !px-3">
                              Preview
                            </a>
                          ) : null}
                          {book.pdfAvailable && book.pdfLink ? (
                            <a href={book.pdfLink} target="_blank" rel="noreferrer" className="primary-button !h-9 !px-3">
                              Open PDF
                            </a>
                          ) : null}
                        </div>
                      </div>
                      {description ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <AppEmptyState description="Search Google Books when you want a reference title beside your uploaded study material." />
          )}
        </AppSection>
      </div>
    </AppShell>
  );
}
