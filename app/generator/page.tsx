'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import AppShell from '@/components/layout/AppShell';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import PracticeItem from '@/components/practice/PracticeItem';
import FlashcardDrill, { type DrillCard } from '@/components/studio/FlashcardDrill';
import CheatSheet, { type ExamSnapshot } from '@/components/studio/CheatSheet';
import DeckLibrary from '@/components/studio/DeckLibrary';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
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

const flashcardSchema = z.array(z.object({ front: z.string(), back: z.string() }));

const guidedReviewSchema = z.array(
  z.object({
    question: z.string(),
    model_answer: z.string(),
    key_points: z.array(z.string()),
    explanation: z.string(),
  })
);

const snapshotSchema = z.object({
  abbreviations: z.array(z.object({ short: z.string(), full: z.string() })),
  key_points: z.array(z.object({ point: z.string(), tag: z.string(), color: z.string() })),
  hot_list: z.array(z.object({ question: z.string(), difficulty: z.string(), rationale: z.string() })),
});

type OutputType = 'mcq' | 'flashcards' | 'theory' | 'exam_snapshot';

type ResourceOption = {
  id: string;
  title: string;
  content: string;
  processing_status: string | null;
  extracted_preview?: string | null;
};

const outputOptions: Array<{ id: OutputType; label: string; description: string; icon: Icon3DName; tone: string }> = [
  { id: 'mcq', label: 'Quiz', description: 'Exam-style MCQs with explanations', icon: 'target', tone: 'pastel-mint' },
  { id: 'flashcards', label: 'Flashcards', description: 'One-idea cards for spaced review', icon: 'card-index', tone: 'pastel-lime' },
  { id: 'theory', label: 'Exam questions', description: 'Open questions with model answers', icon: 'writing-hand', tone: 'pastel-sky' },
  { id: 'exam_snapshot', label: 'Cheat sheet', description: 'High-yield facts and hot list', icon: 'scroll', tone: 'pastel-lavender' },
];

const isOutputType = (value: string | null): value is OutputType =>
  value === 'mcq' || value === 'flashcards' || value === 'theory' || value === 'exam_snapshot';

export default function StudyStudioPage() {
  const { uploadFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [type, setType] = useState<OutputType>('mcq');
  const [generatedType, setGeneratedType] = useState<OutputType>('mcq');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [practiceScore, setPracticeScore] = useState({ answered: 0, correct: 0 });
  const [drill, setDrill] = useState<{ title: string; cards: DrillCard[] } | null>(null);
  const [deckRefresh, setDeckRefresh] = useState(0);

  const schema = useMemo(() => {
    if (type === 'flashcards') return flashcardSchema;
    if (type === 'theory') return guidedReviewSchema;
    if (type === 'exam_snapshot') return snapshotSchema;
    return mcqSchema;
  }, [type]);

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/ai/generate',
    schema: schema as z.ZodType<unknown>,
    onFinish: () => {
      if (generatedType === 'flashcards') setDeckRefresh((n) => n + 1);
    },
  });

  useEffect(() => {
    if (aiError) setError(getBillingErrorMessage({ error: aiError.message }, aiError.message));
  }, [aiError]);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('resource');
    const outputType = params.get('type');
    const focusTopic = params.get('topic');
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of URL params on mount */
    if (focusTopic) setTopic(focusTopic);
    if (resourceId) setSelectedResource(resourceId);
    if (isOutputType(outputType)) setType(outputType);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const selectedResourceRecord = resources.find((resource) => resource.id === selectedResource) ?? null;
  const sourceTitle = selectedResourceRecord?.title?.replace(/\.(pdf|docx?|pptx?|txt|png|jpe?g)$/i, '') || topic || 'My notes';

  const onGenerate = () => {
    const content = selectedResourceRecord?.content || pastedText;
    if (!content.trim()) {
      setError('Choose a ready resource or paste study material before generating.');
      return;
    }
    if (selectedResourceRecord && selectedResourceRecord.processing_status !== 'ready') {
      setError('This resource is still processing. Wait for it to become ready or use pasted text.');
      return;
    }
    setError(null);
    setDrill(null);
    setPracticeScore({ answered: 0, correct: 0 });
    setGeneratedType(type);
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

  const resultItems = Array.isArray(object) ? (object as Array<Record<string, unknown>>) : [];
  const snapshot = generatedType === 'exam_snapshot' && object && !Array.isArray(object) ? (object as ExamSnapshot) : null;
  const generatedCards: DrillCard[] =
    generatedType === 'flashcards'
      ? resultItems.filter((c): c is DrillCard => typeof c?.front === 'string' && typeof c?.back === 'string')
      : [];
  const countLabel = type === 'flashcards' ? 'cards' : type === 'exam_snapshot' ? 'hot-list questions' : 'questions';

  return (
    <AppShell
      eyebrow="Study studio"
      title="Turn notes into practice"
      description="One place for quizzes, flashcards, exam questions and cheat sheets. Everything you make lands in your spaced review queue."
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
        <CreditStatusBanner featureLabel="Each generation" creditCost={40} />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {outputOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setType(option.id)}
              aria-pressed={type === option.id}
              className={cn(
                'lift relative flex flex-col overflow-hidden rounded-[26px] border p-4 text-left',
                option.tone,
                type === option.id ? 'border-[var(--accent)] ring-4 ring-[var(--ring-brand)]' : 'border-[var(--line)]'
              )}
            >
              <Icon3D name={option.icon} size={52} />
              <p className="mt-3 font-display text-[16px] font-semibold text-[var(--text-strong)]">{option.label}</p>
              <p className="text-[12.5px] leading-5 text-[var(--text-soft)]">{option.description}</p>
            </button>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel app-panel">
            <p className="eyebrow">Source</p>
            <h2 className="panel-title mt-1">What should we study?</h2>
            <div className="mt-4 space-y-3">
              <select
                value={selectedResource}
                onChange={(event) => {
                  setSelectedResource(event.target.value);
                  if (event.target.value) setPastedText('');
                }}
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
              >
                <option value="">Choose from your library</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.title} {resource.processing_status !== 'ready' ? `(${resource.processing_status})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-center text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">or paste text</p>
              <textarea
                value={pastedText}
                onChange={(event) => {
                  setPastedText(event.target.value);
                  if (event.target.value) setSelectedResource('');
                }}
                className="h-40 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 py-3 text-sm leading-7 text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                placeholder="Paste a lecture note, chapter summary or handout..."
              />
              {selectedResourceRecord?.extracted_preview ? (
                <p className="line-clamp-2 text-[12.5px] text-[var(--text-soft)]">{selectedResourceRecord.extracted_preview}</p>
              ) : null}
            </div>
          </div>

          <div className="glass-panel app-panel">
            <p className="eyebrow">Options</p>
            <h2 className="panel-title mt-1">Shape the {outputOptions.find((o) => o.id === type)?.label.toLowerCase()}</h2>
            {error ? <div className="auth-alert mt-4" data-tone="error">{error}</div> : null}

            {type !== 'exam_snapshot' ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] text-[var(--text-soft)]">Difficulty</label>
                  <div className="app-tabs w-full">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button key={level} onClick={() => setDifficulty(level)} data-active={difficulty === level} className="app-tab flex-1 capitalize">
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] text-[var(--text-soft)]">
                    {count} {countLabel}
                  </label>
                  <input type="range" min="4" max="20" value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-3 w-full accent-[#4a9be8]" />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                A one-page summary of abbreviations, high-yield facts and the questions most likely to come up. Download it as a PDF or
                send it to spaced review.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                placeholder="Focus topic (optional)"
              />
              <input
                value={curriculum}
                onChange={(event) => setCurriculum(event.target.value)}
                className="rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                placeholder="Exam board, e.g. WAEC (optional)"
              />
            </div>

            <button onClick={onGenerate} disabled={isLoading} className="primary-button mt-5 !h-12 w-full sm:w-auto">
              {isLoading ? 'Generating...' : `Generate ${outputOptions.find((o) => o.id === type)?.label.toLowerCase()}`}
            </button>
          </div>
        </section>

        {drill ? (
          <section className="glass-panel app-panel">
            <p className="eyebrow">Drill</p>
            <h2 className="panel-title mt-1 mb-4">{drill.title}</h2>
            <FlashcardDrill cards={drill.cards} onExit={() => setDrill(null)} />
          </section>
        ) : null}

        {(resultItems.length || snapshot) && !drill ? (
          <section className="glass-panel app-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{isLoading ? 'Writing...' : 'Ready'}</p>
                <h2 className="panel-title mt-1">
                  {generatedType === 'exam_snapshot' ? 'Cheat sheet' : generatedType === 'flashcards' ? 'Your new deck' : 'Practise now'}
                </h2>
              </div>
              {generatedType === 'flashcards' && !isLoading && generatedCards.length ? (
                <button className="primary-button" onClick={() => setDrill({ title: sourceTitle, cards: generatedCards })}>
                  Drill these {generatedCards.length} cards
                </button>
              ) : generatedType !== 'exam_snapshot' ? (
                <Link href="/review" className="secondary-button">
                  Open review queue
                </Link>
              ) : null}
            </div>

            <div className="mt-4">
              {snapshot ? (
                <CheatSheet snapshot={snapshot} title={sourceTitle} topic={topic || selectedResourceRecord?.title} />
              ) : (
                <div className="space-y-3">
                  {generatedType === 'mcq' && !isLoading ? (
                    <p className="text-[13px] text-[var(--text-soft)]">
                      Answer each one before peeking. Score:{' '}
                      <span className="font-semibold text-[var(--text-strong)]">
                        {practiceScore.correct}/{practiceScore.answered}
                      </span>
                      . Misses are scheduled to come back in review.
                    </p>
                  ) : null}
                  {resultItems.map((item, index) => (
                    <PracticeItem
                      key={`${index}-${String(item?.question ?? item?.front ?? '')}`}
                      index={index}
                      kind={generatedType === 'exam_snapshot' ? 'theory' : generatedType}
                      item={item ?? {}}
                      onAnswered={(wasCorrect) => setPracticeScore((s) => ({ answered: s.answered + 1, correct: s.correct + (wasCorrect ? 1 : 0) }))}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-3">
            <p className="eyebrow">Your decks</p>
            <h2 className="panel-title mt-1">Flashcard library</h2>
          </div>
          <DeckLibrary refreshKey={deckRefresh} onDrill={(title, cards) => setDrill({ title, cards })} />
        </section>
      </div>
    </AppShell>
  );
}
