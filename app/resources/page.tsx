'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import { useGoogleBooks } from '@/hooks/useGoogleBooks';
import { createClient } from '@/lib/supabase/client';

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
  const { searchBooks, results: bookResults, isLoading: booksLoading, error: booksError } = useGoogleBooks();

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [jobsByResource, setJobsByResource] = useState<Record<string, ProcessingJobRow | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [hasBookSearched, setHasBookSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedResource = resources.find((resource) => resource.id === selectedId) ?? resources[0] ?? null;
  const selectedJob = selectedResource ? jobsByResource[selectedResource.id] : null;

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
    setSelectedId((current) => (current && rows.some((resource) => resource.id === current) ? current : rows[0]?.id ?? null));

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
    const lowered = query.trim().toLowerCase();
    if (!lowered) return resources;

    return resources.filter((resource) =>
      [resource.title, resource.subject, resource.processing_status, jobsByResource[resource.id]?.status].some((value) =>
        (value || '').toLowerCase().includes(lowered)
      )
    );
  }, [jobsByResource, query, resources]);

  const onRetry = async (resourceId: string) => {
    await fetch('/api/resources/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId }),
    });
  };

  const onSearchBooks = async () => {
    setHasBookSearched(true);
    await searchBooks(bookQuery);
  };

  return (
    <AppShell
      eyebrow="Library"
      title="Study materials"
      actions={
        <label className="primary-button cursor-pointer">
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
      <div className="workspace-stack">
        <section className="metric-strip">
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Upload state</p>
            <p className="mt-2 text-[25px] font-black capitalize tracking-[-0.05em] text-slate-950 dark:text-white">
              {uploadState === 'idle' ? 'Ready' : uploadState}
            </p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Bring in PDFs, notes, decks, images, or text files.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Files</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{filteredResources.length}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Items in your current library view.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Books search</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              {hasBookSearched ? bookResults.length : 0}
            </p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Reference titles from Google Books.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Next action</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={selectedResource?.processing_status === 'ready' ? `/generator?resource=${selectedResource.id}` : '/generator'} className="primary-button !h-9 !px-3">
                Generate
              </Link>
              <Link href="/review" className="secondary-button !h-9 !px-3">
                Review
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
          <section className="glass-panel app-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="eyebrow">Source Vault</p>
                <h3 className="panel-title mt-2">Your files</h3>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, subject, or status"
                className="w-full rounded-2xl border border-black/5 bg-white/60 px-4 py-2.5 text-sm outline-none ring-0 md:max-w-xs dark:border-white/8 dark:bg-white/5"
              />
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="app-empty">Loading your library...</div>
              ) : filteredResources.length ? (
                <div className="app-list">
                  {filteredResources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => setSelectedId(resource.id)}
                      data-active={selectedResource?.id === resource.id}
                      className="app-list-button app-list-row"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {(resource.subject || 'General') + ' / ' + new Date(resource.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="metric-chip !px-2 !py-1 !text-[10px]">
                            {jobsByResource[resource.id]?.status || resource.processing_status || 'queued'}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {resource.processing_error ||
                            jobsByResource[resource.id]?.failure_message ||
                            resource.processing_metadata?.diagnostics_summary ||
                            resource.extracted_preview ||
                            'Preview unavailable until extraction completes.'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="app-empty">No uploaded materials yet. Bring in a PDF, deck, image note, or text file to start the study loop.</div>
              )}
            </div>
          </section>

          <section className="glass-panel app-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Google Books</p>
                <h3 className="panel-title mt-2">Browse reference titles</h3>
              </div>
              <div className="flex w-full gap-2 md:max-w-lg">
                <input
                  value={bookQuery}
                  onChange={(event) => setBookQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSearchBooks();
                    }
                  }}
                  placeholder="Search author, topic, or title"
                  className="min-w-0 flex-1 rounded-2xl border border-black/5 bg-white/60 px-4 py-2.5 text-sm outline-none dark:border-white/8 dark:bg-white/5"
                />
                <button type="button" onClick={onSearchBooks} className="primary-button">
                  Search
                </button>
              </div>
            </div>

            <div className="mt-4">
              {booksLoading ? (
                <div className="app-empty">Searching Google Books...</div>
              ) : booksError ? (
                <div className="app-empty">{booksError}</div>
              ) : hasBookSearched && bookResults.length ? (
                <div className="app-list">
                  {bookResults.map((book) => {
                    const description = book.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    return (
                      <div key={book.id} className="app-list-row">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white/60 dark:border-white/8 dark:bg-white/5">
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
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {book.authors?.length ? book.authors.join(', ') : 'Author unavailable'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {book.previewLink ? (
                                <a
                                  href={book.previewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-8 items-center justify-center rounded-xl border border-black/8 bg-white/60 px-3 text-xs font-black text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                  Preview
                                </a>
                              ) : null}
                              {book.pdfAvailable && book.pdfLink ? (
                                <a href={book.pdfLink} target="_blank" rel="noreferrer" className="primary-button !h-8 !rounded-xl !px-3 !text-xs">
                                  Open PDF
                                </a>
                              ) : null}
                            </div>
                          </div>
                          {description ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="app-empty">Search Google Books here when you want a reference text alongside your uploaded study materials.</div>
              )}
            </div>
          </section>
        </div>

          <section className="glass-panel app-panel">
          <p className="eyebrow">Selected File</p>
          <h3 className="panel-title mt-2">{selectedResource?.title || 'Choose a file'}</h3>
          {selectedResource ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="metric-chip">{selectedJob?.status || selectedResource.processing_status || 'queued'}</span>
                {selectedResource.extraction_method ? <span className="metric-chip">{selectedResource.extraction_method}</span> : null}
                {selectedResource.extraction_confidence ? (
                  <span className="metric-chip">{Math.round(selectedResource.extraction_confidence * 100)}% confidence</span>
                ) : null}
                {selectedResource.processing_metadata?.source_health ? (
                  <span className="metric-chip">{selectedResource.processing_metadata.source_health}</span>
                ) : null}
              </div>

              <div className="mt-4 rounded-[20px] border border-black/5 bg-white/55 px-4 py-4 dark:border-white/8 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Preview</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {selectedResource.processing_error ||
                    selectedResource.extracted_preview ||
                    selectedResource.content?.slice(0, 600) ||
                    'We will show the extracted text preview here once processing finishes.'}
                </p>
              </div>

              <div className="mt-4 app-list">
                <div className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Diagnostics</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {selectedResource.processing_metadata?.diagnostics_summary ||
                        selectedJob?.failure_code ||
                        'Diagnostics will appear here once processing runs.'}
                    </p>
                    {selectedJob ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Attempts {selectedJob.attempt_count} / {selectedJob.started_at ? `started ${new Date(selectedJob.started_at).toLocaleString()}` : 'not started'}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="app-list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Support path</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
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
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={selectedResource.processing_status === 'ready' ? `/generator?resource=${selectedResource.id}` : '/generator'}
                  className="primary-button"
                >
                  Generate practice
                </Link>
                {(selectedJob?.status === 'failed' || selectedResource.processing_status === 'failed') ? (
                  <button onClick={() => onRetry(selectedResource.id)} className="secondary-button">
                    Retry extraction
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-4 app-empty">Select a resource to inspect extraction health and preview content.</div>
          )}
          </section>
        </section>
      </div>
    </AppShell>
  );
}
