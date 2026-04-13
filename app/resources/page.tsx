'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ResourceRow = {
  id: string;
  title: string;
  subject: string | null;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  content?: string | null;
  extracted_preview?: string | null;
  extraction_confidence?: number | null;
  extraction_method?: string | null;
  processing_status?: string | null;
  processing_error?: string | null;
  processing_metadata?: Record<string, any> | null;
};

type ProcessingJobRow = {
  id: string;
  resource_id: string;
  status: string;
  attempt_count: number;
  failure_code: string | null;
  failure_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export default function ResourcesPage() {
  const supabase = createClient();
  const { uploadFile, uploadState } = useUpload();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [jobsByResource, setJobsByResource] = useState<Record<string, ProcessingJobRow | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selectedResource = resources.find((resource) => resource.id === selectedId) ?? resources[0] ?? null;
  const selectedJob = selectedResource ? jobsByResource[selectedResource.id] : null;

  async function fetchResources() {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('resources')
      .select(
        'id,title,subject,file_type,file_size_bytes,created_at,content,extracted_preview,extraction_confidence,extraction_method,processing_status,processing_error,processing_metadata'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rows = (data as ResourceRow[]) ?? [];
    setResources(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);

    if (rows.length) {
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
    } else {
      setJobsByResource({});
    }

    setIsLoading(false);
  }

  useEffect(() => {
    fetchResources();

    const channel = supabase
      .channel('resources-core-loop')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        fetchResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredResources = useMemo(() => {
    const lowered = query.toLowerCase();
    return resources.filter((resource) =>
      [resource.title, resource.subject, resource.processing_status, jobsByResource[resource.id]?.status].some((value) =>
        (value || '').toLowerCase().includes(lowered)
      )
    );
  }, [query, resources, jobsByResource]);

  const sidebar = (
    <>
      <section className="glass-panel p-5">
        <p className="eyebrow">Upload State</p>
        <h3 className="panel-title mt-2 capitalize">{uploadState === 'idle' ? 'Ready for the next file' : uploadState}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The library now exposes the full ingestion pipeline: queued jobs, extraction diagnostics, retry support, and file health.
        </p>
      </section>
      <section className="glass-panel p-5">
        <p className="eyebrow">Next Action</p>
        <div className="mt-4 space-y-3">
          <Link
            href={selectedResource?.processing_status === 'ready' ? `/generator?resource=${selectedResource.id}` : '/generator'}
            className="flex items-center justify-between rounded-[24px] border border-black/5 bg-white/55 px-4 py-3 text-sm font-black text-slate-950 dark:border-white/8 dark:bg-white/5 dark:text-white"
          >
            <span>Generate from selected file</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
          <Link
            href="/review"
            className="flex items-center justify-between rounded-[24px] border border-black/5 bg-white/55 px-4 py-3 text-sm font-black text-slate-950 dark:border-white/8 dark:bg-white/5 dark:text-white"
          >
            <span>Open today’s review queue</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </section>
    </>
  );

  const onRetry = async (resourceId: string) => {
    await fetch('/api/resources/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId }),
    });
  };

  return (
    <AppShell
      eyebrow="Library"
      title="Study materials"
      description="Upload source material, inspect extraction trust, and move into generation or review with clear status and support paths."
      sidebar={sidebar}
      actions={
        <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]">
          Upload file
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              event.target.value = '';
              await uploadFile(file);
            }}
          />
        </label>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Source Vault</p>
              <h3 className="panel-title mt-2">Uploaded resources</h3>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, subject, or status"
              className="w-full rounded-2xl border border-black/5 bg-white/60 px-4 py-3 text-sm outline-none ring-0 md:max-w-xs dark:border-white/8 dark:bg-white/5"
            />
          </div>

          <div className="mt-5 space-y-3">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-black/8 bg-white/45 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Loading your library…
              </div>
            ) : filteredResources.length ? (
              filteredResources.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => setSelectedId(resource.id)}
                  className={cn(
                    'w-full rounded-[24px] border p-4 text-left transition-all',
                    selectedResource?.id === resource.id
                      ? 'border-[#1a5c2a]/30 bg-[#1a5c2a]/8'
                      : 'border-black/5 bg-white/55 hover:border-[#1a5c2a]/20 dark:border-white/8 dark:bg-white/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {resource.subject || 'General'} • {new Date(resource.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="metric-chip !px-2 !py-1 !text-[10px]">
                      {jobsByResource[resource.id]?.status || resource.processing_status || 'queued'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {resource.processing_error ||
                      jobsByResource[resource.id]?.failure_message ||
                      resource.processing_metadata?.diagnostics_summary ||
                      resource.extracted_preview ||
                      'Preview unavailable until extraction completes.'}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-black/8 bg-white/45 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                No uploaded materials yet. Bring in a PDF, deck, image note, or text file to start the study loop.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Extraction Preview</p>
          <h3 className="panel-title mt-2">{selectedResource?.title || 'Select a file'}</h3>
          {selectedResource ? (
            <>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="metric-chip">{selectedJob?.status || selectedResource.processing_status || 'queued'}</span>
                {selectedResource.extraction_method ? <span className="metric-chip">{selectedResource.extraction_method}</span> : null}
                {selectedResource.extraction_confidence ? (
                  <span className="metric-chip">{Math.round(selectedResource.extraction_confidence * 100)}% confidence</span>
                ) : null}
                {selectedResource.processing_metadata?.source_health ? (
                  <span className="metric-chip">{selectedResource.processing_metadata.source_health}</span>
                ) : null}
              </div>

              <div className="mt-5 rounded-[24px] border border-black/5 bg-white/55 p-5 dark:border-white/8 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Preview</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {selectedResource.processing_error ||
                    selectedResource.extracted_preview ||
                    selectedResource.content?.slice(0, 600) ||
                    'We will show the extracted text preview here once processing finishes.'}
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Job diagnostics</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedResource.processing_metadata?.diagnostics_summary ||
                      selectedJob?.failure_code ||
                      'Diagnostics will appear here once processing runs.'}
                  </p>
                  {selectedJob ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Attempts {selectedJob.attempt_count} • {selectedJob.started_at ? `started ${new Date(selectedJob.started_at).toLocaleString()}` : 'not started'}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[24px] border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Support path</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedResource.processing_metadata?.recommended_next_step ||
                      'If extraction fails, retry guidance and a support code will appear here.'}
                  </p>
                  {selectedResource.processing_metadata?.support_code ? (
                    <p className="mt-2 text-xs font-black text-slate-700 dark:text-slate-200">
                      Support code: {selectedResource.processing_metadata.support_code}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={selectedResource.processing_status === 'ready' ? `/generator?resource=${selectedResource.id}` : '/generator'}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
                >
                  Generate practice
                </Link>
                {(selectedJob?.status === 'failed' || selectedResource.processing_status === 'failed') ? (
                  <button
                    onClick={() => onRetry(selectedResource.id)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/8 bg-white/60 px-4 text-sm font-black text-slate-950 transition hover:border-[#1a5c2a]/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    Retry extraction
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Select a resource to inspect extraction health and preview content.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
