'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import AppShell from '@/components/layout/AppShell';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import { createClient } from '@/lib/supabase/client';
import { getBillingErrorMessage } from '@/lib/billing/client';
import { cn } from '@/lib/utils';

const mcqSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    explanation: z.string(),
  })
);

const flashcardSchema = z.array(
  z.object({
    front: z.string(),
    back: z.string(),
  })
);

const guidedReviewSchema = z.array(
  z.object({
    question: z.string(),
    model_answer: z.string(),
    key_points: z.array(z.string()),
    explanation: z.string(),
  })
);

type ResourceOption = {
  id: string;
  title: string;
  content: string;
  processing_status: string | null;
  extracted_preview?: string | null;
};

const outputOptions = [
  { id: 'mcq', label: 'Quiz', description: 'Multiple-choice questions for activation.' },
  { id: 'flashcards', label: 'Flashcards', description: 'Fast retrieval cards for spaced review.' },
  { id: 'theory', label: 'Guided Review', description: 'Open-ended prompts with model answers.' },
] as const;

export default function GeneratorPage() {
  const { uploadFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [type, setType] = useState<'mcq' | 'flashcards' | 'theory'>('mcq');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => {
    if (type === 'flashcards') return flashcardSchema;
    if (type === 'theory') return guidedReviewSchema;
    return mcqSchema;
  }, [type]);

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/ai/generate',
    schema,
  });

  useEffect(() => {
    if (aiError) {
      setError(getBillingErrorMessage({ error: aiError.message }, aiError.message));
    }
  }, [aiError]);

  useEffect(() => {
    async function loadResources() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('resources')
        .select('id,title,content,processing_status,extracted_preview')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setResources((data as ResourceOption[]) ?? []);
    }

    loadResources();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('resource');
    if (resourceId) {
      setSelectedResource(resourceId);
    }
  }, []);

  const selectedResourceRecord = resources.find((resource) => resource.id === selectedResource) ?? null;

  const onGenerate = () => {
    const content = selectedResourceRecord?.content || pastedText;

    if (!content?.trim()) {
      setError('Choose a ready resource or paste study material before generating.');
      return;
    }

    if (selectedResourceRecord && selectedResourceRecord.processing_status !== 'ready') {
      setError('This resource is still processing. Wait for it to become ready or use pasted text.');
      return;
    }

    setError(null);
    submit({
      content,
      type,
      difficulty,
      count,
      topic: topic.trim() || undefined,
      curriculum: curriculum.trim() || undefined,
      stream: true,
      resourceId: selectedResourceRecord?.id,
    });
  };

  const resultItems = Array.isArray(object) ? object : [];

  return (
    <AppShell
      eyebrow="Generate"
      title="Create study output"
      actions={
        <button onClick={() => fileInputRef.current?.click()} className="secondary-button">
          Upload source
        </button>
      }
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
        <CreditStatusBanner featureLabel="Question generation" creditCost={40} />

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Step 01</p>
            <h2 className="panel-title mt-2">Pick your source</h2>

            <div className="mt-4 space-y-4">
              <select
                value={selectedResource}
                onChange={(event) => {
                  setSelectedResource(event.target.value);
                  if (event.target.value) setPastedText('');
                }}
                className="w-full rounded-2xl border border-black/8 bg-white/72 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="">Choose a ready library file</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.title} {resource.processing_status !== 'ready' ? `(${resource.processing_status})` : ''}
                  </option>
                ))}
              </select>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-black/8 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Or paste text
                  </span>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(event) => {
                  setPastedText(event.target.value);
                  if (event.target.value) setSelectedResource('');
                }}
                className="h-48 w-full rounded-2xl border border-black/8 bg-white/72 px-4 py-4 text-sm leading-7 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Paste a lecture note, chapter summary, or class handout here..."
              />
            </div>
          </section>

          <section className="glass-panel app-panel">
            <p className="eyebrow">Step 02</p>
            <h2 className="panel-title mt-2">Shape the output</h2>

            {error ? <div className="mt-4 rounded-[20px] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</div> : null}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {outputOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setType(option.id)}
                  className={cn(
                    'rounded-[18px] border p-4 text-left transition-all',
                    type === option.id
                      ? 'border-[#163f73]/20 bg-[#163f73]/8 dark:border-[#f39a2b]/20 dark:bg-[#f39a2b]/10'
                      : 'border-black/8 bg-white/60 hover:border-[#163f73]/20 dark:border-white/10 dark:bg-white/5'
                  )}
                >
                  <p className="text-sm font-black text-slate-950 dark:text-white">{option.label}</p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        'rounded-2xl px-3 py-3 text-sm font-black capitalize transition-all',
                        difficulty === level
                          ? 'bg-[#163f73] text-white'
                          : 'border border-black/8 bg-white/60 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Item count</label>
                <input type="range" min="4" max="20" value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-3 w-full accent-[#163f73]" />
                <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">{count} items</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="rounded-2xl border border-black/8 bg-white/72 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Specific topic (optional)"
              />
              <input
                value={curriculum}
                onChange={(event) => setCurriculum(event.target.value)}
                className="rounded-2xl border border-black/8 bg-white/72 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Curriculum (optional)"
              />
            </div>

            <button onClick={onGenerate} disabled={isLoading} className="primary-button mt-6 !h-12 disabled:opacity-60">
              {isLoading ? 'Generating...' : 'Generate output'}
            </button>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Source quality</p>
            <h2 className="panel-title mt-2">{selectedResourceRecord ? 'Resource selected' : 'Paste-ready input'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {selectedResourceRecord?.extracted_preview ||
                'Pasted text works best when it contains a full explanation, lecture note, or topic summary rather than a few bullets.'}
            </p>
          </section>

          <section className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Output</p>
                <h2 className="panel-title mt-2">Generated study set</h2>
              </div>
              <Link href="/review" className="ghost-button !h-9 !px-0">
                Open review queue
              </Link>
            </div>

            <div className="mt-4">
              {resultItems.length ? (
                <div className="app-list">
                  {resultItems.map((item: any, index) => (
                    <div key={index} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                          {type === 'flashcards' ? `Card ${index + 1}` : `Item ${index + 1}`}
                        </p>
                        <p className="mt-2 text-sm font-black leading-6 text-slate-950 dark:text-white">{item.question || item.front}</p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{item.explanation || item.back || item.model_answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">Your generated set will appear here after you run the workflow.</div>
              )}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
