'use client';

import AppShell from '@/components/layout/AppShell';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { awardXp } from '@/app/actions/gamifier';
import { getBillingErrorMessage } from '@/lib/billing/client';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  title: string;
  content: string;
  processing_status: string;
}

const LEVEL_OPTIONS: { val: string; label: string; hint: string; icon: Icon3DName; tone: string }[] = [
  { val: 'child', label: 'Child (5 yo)', hint: 'Tiny words, stories', icon: 'seedling', tone: 'pastel-mint' },
  { val: 'beginner', label: 'Beginner', hint: 'New to the topic', icon: 'student-1', tone: 'pastel-sky' },
  { val: 'general', label: 'General', hint: 'Clear and everyday', icon: 'globe', tone: 'pastel-butter' },
  { val: 'expert', label: 'Expert', hint: 'Keep the nuance', icon: 'teacher', tone: 'pastel-lavender' },
];

const FORMAT_OPTIONS: { val: string; label: string; hint: string; icon: Icon3DName }[] = [
  { val: 'paragraphs', label: 'Structured paragraphs', hint: 'Headings with short sections', icon: 'open-book' },
  { val: 'bullets', label: 'Bullet points only', hint: 'Fast to scan and revise', icon: 'clipboard' },
  { val: 'analogy', label: 'Real-world analogies', hint: 'Explained through everyday things', icon: 'bulb' },
];

export default function SimplifierPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [pastedText, setPastedText] = useState('');

  const [level, setLevel] = useState('beginner'); // child, beginner, general, expert
  const [format, setFormat] = useState('paragraphs'); // paragraphs, bullets, analogy
  const [focus, setFocus] = useState('');

  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedOutput, setSimplifiedOutput] = useState<string | null>(null);
  const [youtubeTopics, setYoutubeTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile, uploadState } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchResources() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('resources')
        .select('id, title, content, processing_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setResources(data);
    }
    fetchResources();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('resource');
    if (resourceId) {
      setSelectedResource(resourceId);
      setPastedText('');
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setIsUploading(true);
    setPastedText('');
    setSelectedResource('');

    const supabase = createClient();
    const ch = supabase
      .channel('simplifier-upload-' + Date.now())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resources' }, async (payload) => {
        if (payload.new.processing_status === 'ready') {
          setSelectedResource(payload.new.id);
          setIsUploading(false);
          supabase.removeChannel(ch);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('resources')
              .select('id, title, content, processing_status')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (data) setResources(data);
          }
        } else if (payload.new.processing_status === 'error') {
          setIsUploading(false);
          supabase.removeChannel(ch);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'resources' }, async (payload) => {
        if (payload.new.processing_status === 'ready') {
          setSelectedResource(payload.new.id);
          setIsUploading(false);
          supabase.removeChannel(ch);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('resources')
              .select('id, title, content, processing_status')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (data) setResources(data);
          }
        }
      })
      .subscribe();

    await uploadFile(file);
  };

  const handleSimplify = async () => {
    let contentToUse = pastedText;

    if (selectedResource) {
      const resource = resources.find(r => r.id === selectedResource);
      if (resource) {
        if (resource.processing_status !== 'ready') {
          setError('Document is still processing. Please wait.');
          return;
        }
        if (resource.content) {
          contentToUse = resource.content;
        }
      }
    }

    if (!contentToUse.trim()) {
      setError('Please select a resource or paste some text to simplify.');
      return;
    }

    setIsSimplifying(true);
    setError(null);
    setSimplifiedOutput(null);
    setYoutubeTopics([]);

    try {
      const res = await fetch('/api/ai/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToUse,
          level,
          format,
          focus
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(getBillingErrorMessage(data, 'Failed to simplify document'));
      }

      setSimplifiedOutput(data.result);
      if (Array.isArray(data.youtube_topics)) {
        setYoutubeTopics(data.youtube_topics);
      }
      awardGenerationXP();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimplifying(false);
    }
  };

  const awardGenerationXP = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await awardXp(user.id, 20, 'simplifier_generation');
  };

  const levelLabel = LEVEL_OPTIONS.find((o) => o.val === level)?.label ?? level;
  const formatLabel = FORMAT_OPTIONS.find((o) => o.val === format)?.label ?? format;
  const pastedWords = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;

  return (
    <AppShell
      eyebrow="Study tools"
      title="Document simplifier"
      description="Translate dense material into a clearer explanation level, format, and focus without changing the underlying study logic."
    >
      {simplifiedOutput ? (
        <div className="workspace-stack animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setSimplifiedOutput(null)} className="secondary-button !h-10 !px-4">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to simplifier
            </button>
            <div className="flex flex-wrap gap-2">
              <span className="metric-chip">
                <Icon3D name={LEVEL_OPTIONS.find((o) => o.val === level)?.icon ?? 'student-1'} size={16} />
                {levelLabel}
              </span>
              <span className="metric-chip">
                <Icon3D name={FORMAT_OPTIONS.find((o) => o.val === format)?.icon ?? 'memo'} size={16} />
                {formatLabel}
              </span>
            </div>
          </div>

          <article className="glass-panel overflow-hidden">
            <div className="pastel-sky relative px-5 pt-6 pb-5 md:px-10 md:pt-9">
              <div className="flex min-w-0 items-start gap-4">
                <span className="icon-tile size-14 !rounded-[20px] bg-[var(--card)] md:size-16">
                  <Icon3D name="open-book" size={36} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">Simplified document</p>
                  <h2 className="font-display mt-1 text-[24px] leading-tight font-semibold tracking-[-0.02em] text-[var(--text-strong)] md:text-[30px]">
                    Here is the <span className="torn-mark">clear</span> version
                  </h2>
                  <p className="mt-1.5 text-[13.5px] text-[var(--text-soft)]">
                    Written for {levelLabel.toLowerCase()} readers as {formatLabel.toLowerCase()}
                    {focus.trim() ? `, focused on ${focus.trim()}` : ''}.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-7 md:px-10 md:pb-10">
              <div className="study-prose break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{simplifiedOutput}</ReactMarkdown>
              </div>

              {youtubeTopics.length > 0 && (
                <div className="pastel-blush mt-10 rounded-[24px] border border-[var(--line)] p-5 md:p-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="icon-tile size-11 bg-[var(--card)]">
                      <Icon3D name="laptop" size={26} />
                    </span>
                    <div className="min-w-0">
                      <p className="eyebrow">Keep learning</p>
                      <h3 className="panel-title !text-[17px]">Watch the concept on YouTube</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {youtubeTopics.map((topic, i) => (
                      <a
                        key={i}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lift inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] py-2 pr-3 pl-2.5 text-[13px] font-medium text-[var(--text-strong)] shadow-[var(--shadow-sm)]"
                      >
                        <svg className="size-4 shrink-0 text-[var(--danger)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                        <span className="min-w-0 truncate">{topic}</span>
                        <span className="material-symbols-outlined shrink-0 text-[15px] text-[var(--text-soft)]">open_in_new</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      ) : (
        <div className="workspace-stack">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left column: input source */}
            <div className="min-w-0 space-y-5">
              <div className="resource-dropzone flex flex-col items-center text-center" data-dragging={isUploading ? 'true' : undefined}>
                {isUploading ? (
                  <span className="mb-1 inline-flex size-[88px] items-center justify-center">
                    <span className="size-12 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
                  </span>
                ) : (
                  <Icon3D name="file-folder" size={88} className="animate-float" priority />
                )}
                <p className="eyebrow mt-3">{isUploading ? 'Hang tight' : 'Step 1 · Add your material'}</p>
                <h2 className="font-display mt-1 text-[22px] leading-tight font-semibold tracking-[-0.02em] text-[var(--text-strong)] md:text-[26px]">
                  {isUploading ? 'Reading your document...' : (
                    <>
                      Drop in something <span className="torn-mark" data-tone="white">dense</span>
                    </>
                  )}
                </h2>
                <p className="mt-2 max-w-[44ch] text-sm text-[var(--text-soft)]">
                  {isUploading
                    ? 'We are extracting the text. It will be selected automatically when it is ready.'
                    : 'Lecture notes, a textbook chapter, or slides. We will rewrite it at the level you choose.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {['PDF', 'Word', 'PowerPoint', 'Image', 'Text'].map((t) => (
                    <span key={t} className="pill-tag">{t}</span>
                  ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.txt" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="primary-button mt-5">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  {isUploading ? 'Uploading...' : 'Browse files'}
                </button>
              </div>

              <div className="auth-divider px-2">
                <span className="auth-divider-line" />
                <span className="auth-divider-label">or</span>
                <span className="auth-divider-line" />
              </div>

              <div className="glass-panel app-panel">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="icon-tile size-11">
                    <Icon3D name="memo" size={26} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="panel-title !text-[17px]">Paste text</h3>
                    <p className="text-[13px] text-[var(--text-soft)]">An article, a chapter, or your own notes.</p>
                  </div>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setSelectedResource('');
                  }}
                  placeholder="Paste your content here..."
                  className="mt-4 h-44 w-full min-w-0 resize-none rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--ring-brand)]"
                />
                <p className="mt-1 text-right text-[12px] text-[var(--text-soft)]">{pastedWords} words</p>
              </div>

              {resources.length > 0 && (
                <div className="glass-panel app-panel">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="icon-tile size-11">
                      <Icon3D name="books" size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="panel-title !text-[17px]">Or pick a recent resource</h3>
                      <p className="text-[13px] text-[var(--text-soft)]">From your library</p>
                    </div>
                  </div>
                  <div className="custom-scrollbar mt-4 grid max-h-64 gap-1.5 overflow-y-auto pr-1">
                    {resources.map((res) => {
                      const active = selectedResource === res.id;
                      const ready = res.processing_status === 'ready';
                      return (
                        <button
                          key={res.id}
                          onClick={() => {
                            setSelectedResource(res.id);
                            setPastedText('');
                          }}
                          className={cn(
                            'flex w-full min-w-0 items-center gap-3 rounded-[18px] border p-2.5 text-left transition',
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_3px_var(--ring-brand)]'
                              : 'border-transparent hover:bg-[var(--accent-softer)]'
                          )}
                        >
                          <span className="icon-tile size-10 bg-[var(--card)]">
                            <Icon3D name={ready ? 'scroll' : 'hourglass'} size={22} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-[var(--text-strong)]">{res.title}</span>
                            <span className="text-[12px] text-[var(--text-soft)]">{ready ? 'Ready to simplify' : 'Still processing'}</span>
                          </span>
                          {active ? (
                            <span className="material-symbols-outlined shrink-0 text-[20px] text-[var(--accent-strong)]">check_circle</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: settings */}
            <div className="min-w-0 space-y-5">
              <CreditStatusBanner featureLabel="Document simplifier" creditCost={30} />

              <div className="glass-panel app-panel xl:sticky xl:top-6">
                <p className="eyebrow">Step 2 · Tune it</p>
                <h3 className="panel-title mt-1">Simplifier settings</h3>

                <div className="mt-5 space-y-6">
                  <div>
                    <p className="auth-label">Who is it for?</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {LEVEL_OPTIONS.map((opt) => {
                        const active = level === opt.val;
                        return (
                          <button
                            key={opt.val}
                            onClick={() => setLevel(opt.val)}
                            aria-pressed={active}
                            className={cn(
                              opt.tone,
                              'relative flex min-w-0 flex-col items-start gap-2 rounded-[20px] border p-3 text-left transition',
                              active
                                ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--ring-brand)]'
                                : 'border-[var(--line)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]'
                            )}
                          >
                            {active ? (
                              <span className="absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-full bg-[var(--action)] text-[var(--action-ink)]">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              </span>
                            ) : null}
                            <Icon3D name={opt.icon} size={36} />
                            <span className="min-w-0">
                              <span className="block text-[14px] font-medium text-[var(--text-strong)]">{opt.label}</span>
                              <span className="block text-[12px] leading-4 text-[var(--text-soft)]">{opt.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="auth-label">Output format</p>
                    <div className="space-y-2">
                      {FORMAT_OPTIONS.map((opt) => {
                        const active = format === opt.val;
                        return (
                          <button
                            key={opt.val}
                            onClick={() => setFormat(opt.val)}
                            aria-pressed={active}
                            className={cn(
                              'flex w-full min-w-0 items-center gap-3 rounded-[18px] border p-2.5 text-left transition',
                              active
                                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                                : 'border-[var(--line)] bg-[var(--card)] hover:bg-[var(--accent-softer)]'
                            )}
                          >
                            <span className="icon-tile size-10 bg-[var(--card)]">
                              <Icon3D name={opt.icon} size={22} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium text-[var(--text-strong)]">{opt.label}</span>
                              <span className="block truncate text-[12px] text-[var(--text-soft)]">{opt.hint}</span>
                            </span>
                            <span
                              className={cn(
                                'inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition',
                                active ? 'border-[var(--action)] bg-[var(--action)]' : 'border-[var(--line-strong)]'
                              )}
                            >
                              {active ? <span className="size-1.5 rounded-full bg-[var(--action-ink)]" /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="simplifier-focus" className="auth-label">
                      Specific focus <span className="text-[var(--text-faint)]">(optional)</span>
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                      </span>
                      <input
                        id="simplifier-focus"
                        type="text"
                        placeholder="e.g. Just the mathematical formulas"
                        value={focus}
                        onChange={(e) => setFocus(e.target.value)}
                        className="auth-input auth-input-with-icon min-w-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
                  {error && <div className="auth-alert" data-tone="error">{error}</div>}
                  <button
                    onClick={handleSimplify}
                    disabled={isSimplifying || isUploading || (!selectedResource && !pastedText.trim())}
                    className="primary-button !h-12 w-full"
                  >
                    {isSimplifying ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-[var(--action-ink)] border-t-transparent" />
                        Simplifying...
                      </>
                    ) : (
                      <>
                        <Icon3D name="sparkles" size={18} />
                        Simplify now
                      </>
                    )}
                  </button>
                  <p className="text-center text-[12px] text-[var(--text-soft)]">
                    {selectedResource || pastedText.trim() ? 'Ready when you are. Earn 20 XP per run.' : 'Add a file, paste text, or pick a resource to start.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
