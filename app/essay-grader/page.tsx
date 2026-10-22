'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import CameraCapture from '@/components/ai/CameraCapture';
import Icon3D from '@/components/ui/Icon3D';
import { createClient } from '@/lib/supabase/client';
import { awardXp } from '@/app/actions/gamifier';
import { getBillingErrorMessage } from '@/lib/billing/client';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type GradeResult = {
  score: number;
  maxScore: number;
  feedback: string;
  correctAnswer: string;
  improvements: string[];
  strengths: string[];
  isCorrect: boolean;
};

type Submission = {
  id: string;
  question: string;
  score: number;
  max_score: number;
  was_handwritten: boolean;
  created_at: string;
  feedback: Partial<GradeResult>;
  answer_text: string | null;
};

/** Downscales a photo so it uploads quickly and stays under request limits. */
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function EssayGraderPage() {
  const [mode, setMode] = useState<'typed' | 'handwritten'>('typed');
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    const { data } = await createClient()
      .from('essay_submissions')
      .select('id,question,score,max_score,was_handwritten,created_at,feedback,answer_text')
      .order('created_at', { ascending: false })
      .limit(12);
    setHistory((data as Submission[]) ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    loadHistory();
  }, []);

  const handleGrade = async () => {
    if (!question.trim() || (mode === 'typed' ? !typedAnswer.trim() : !image)) {
      setError(mode === 'typed' ? 'Add the question and your answer.' : 'Add the question and a photo of your handwritten answer.');
      return;
    }
    setIsGrading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'typed'
            ? { type: 'typed', question, context: context.trim() || 'General academic knowledge', typedAnswer }
            : { type: 'handwritten', question, context: context.trim() || 'General academic knowledge', imageData: image }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getBillingErrorMessage(data, 'Failed to grade the answer'));
      setResult(data);
      loadHistory();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) awardXp(user.id, 50, 'essay_grading');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade the answer');
    } finally {
      setIsGrading(false);
    }
  };

  const pct = result ? Math.round((result.score / Math.max(1, result.maxScore)) * 100) : 0;
  const recentScores = history.slice(0, 8).reverse().map((h) => Math.round((Number(h.score) / Math.max(1, Number(h.max_score))) * 100));

  return (
    <AppShell eyebrow="Study tools" title="Essay grader" description="Type or photograph your answer. Get a fair score, what earned marks, and exactly how to earn more.">
      {showCamera ? (
        <CameraCapture
          onCapture={(dataUrl) => {
            setImage(dataUrl);
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      ) : null}

      <div className="workspace-stack">
        <CreditStatusBanner featureLabel="Essay grading" creditCost={25} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="glass-panel app-panel space-y-4">
            <div className="app-tabs">
              <button className="app-tab" data-active={mode === 'typed'} onClick={() => setMode('typed')}>
                Type answer
              </button>
              <button className="app-tab" data-active={mode === 'handwritten'} onClick={() => setMode('handwritten')}>
                Handwritten photo
              </button>
            </div>

            {error ? <div className="auth-alert" data-tone="error">{error}</div> : null}

            <div>
              <label className="auth-label">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="h-24 w-full resize-none rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] p-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                placeholder="e.g. Explain the impact of the Industrial Revolution on European society."
              />
            </div>
            <div>
              <label className="auth-label">Subject or exam (optional)</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                placeholder="e.g. WAEC History, Paper 2"
              />
            </div>

            {mode === 'typed' ? (
              <div>
                <label className="auth-label">Your answer</label>
                <textarea
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  className="h-64 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
                  placeholder="Write your answer as you would in the exam..."
                />
                <p className="mt-1 text-right text-[12px] text-[var(--text-soft)]">{typedAnswer.trim() ? typedAnswer.trim().split(/\s+/).length : 0} words</p>
              </div>
            ) : (
              <div>
                <label className="auth-label">Photo of your answer</label>
                {image ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[var(--line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Your handwritten answer" className="max-h-80 w-full object-contain bg-[var(--card-2)]" />
                    <button className="secondary-button absolute top-3 right-3 !h-8 !px-3" onClick={() => setImage(null)}>
                      Retake
                    </button>
                  </div>
                ) : (
                  <div className="resource-dropzone flex flex-col items-center gap-3 text-center">
                    <Icon3D name="camera" size={56} />
                    <p className="text-sm text-[var(--text-soft)]">Good light, the whole page in frame, writing the right way up.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button className="primary-button" onClick={() => setShowCamera(true)}>
                        Use camera
                      </button>
                      <button className="secondary-button" onClick={() => fileRef.current?.click()}>
                        Upload photo
                      </button>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) setImage(await compressImage(file));
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <button onClick={handleGrade} disabled={isGrading} className="primary-button !h-12 w-full">
              {isGrading ? 'Marking your answer...' : 'Grade my answer'}
            </button>
          </div>

          <div className="glass-panel app-panel">
            {result ? (
              <div className="space-y-4 animate-rise">
                <div className="flex items-center gap-4">
                  <div className="dashboard-progress-orbit !w-[104px] shrink-0" style={{ '--progress': pct, '--orbit-color': pct >= 70 ? '#12a66a' : pct >= 50 ? '#4a9be8' : '#ff9f5a' } as React.CSSProperties}>
                    <div className="dashboard-progress-orbit-value">
                      <p className="font-display text-[24px] leading-none font-semibold text-[var(--text-strong)]">{result.score}</p>
                      <p className="text-[11px] text-[var(--text-soft)]">of {result.maxScore}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-[19px] font-semibold text-[var(--text-strong)]">
                      {pct >= 70 ? 'Strong answer' : pct >= 50 ? 'Solid, with gaps' : 'Needs more work'}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-6 text-[var(--text-body)]">{result.feedback}</p>
                  </div>
                </div>
                {result.strengths?.length ? (
                  <div className="rounded-2xl bg-[var(--success-soft)] p-4">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-strong)]">
                      <Icon3D name="check" size={18} /> What earned marks
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-[var(--text-body)]">
                      {result.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {result.improvements?.length ? (
                  <div className="rounded-2xl bg-[var(--warning-soft)] p-4">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-strong)]">
                      <Icon3D name="target" size={18} /> How to earn more
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-[var(--text-body)]">
                      {result.improvements.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <details className="rounded-2xl border border-[var(--line)] p-4">
                  <summary className="cursor-pointer text-[13.5px] font-medium text-[var(--text-strong)]">See a full-marks answer</summary>
                  <p className="mt-2 text-[13.5px] leading-6 whitespace-pre-wrap text-[var(--text-body)]">{result.correctAnswer}</p>
                </details>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <Icon3D name="hundred" size={84} className="animate-float" />
                <h2 className="panel-title mt-4">Your feedback appears here</h2>
                <p className="mt-2 max-w-sm text-sm text-[var(--text-soft)]">Graded like an examiner: partial credit for right ideas, honest about what is missing.</p>
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Your progress</p>
              <h2 className="panel-title mt-1">Past answers</h2>
            </div>
            {recentScores.length > 1 ? (
              <div className="flex h-12 items-end gap-1.5" aria-label="Recent scores">
                {recentScores.map((score, i) => (
                  <div key={i} className="w-3 rounded-full bg-gradient-to-t from-[#4a9be8] to-[#8cc4f5]" style={{ height: `${Math.max(12, score)}%` }} title={`${score}%`} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-4 space-y-1.5">
            {history.length ? (
              history.map((h) => {
                const p = Math.round((Number(h.score) / Math.max(1, Number(h.max_score))) * 100);
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setQuestion(h.question);
                      setTypedAnswer(h.answer_text ?? '');
                      setMode(h.answer_text ? 'typed' : 'handwritten');
                      setResult({
                        score: Number(h.score),
                        maxScore: Number(h.max_score),
                        feedback: h.feedback?.feedback ?? '',
                        correctAnswer: h.feedback?.correctAnswer ?? '',
                        improvements: h.feedback?.improvements ?? [],
                        strengths: h.feedback?.strengths ?? [],
                        isCorrect: Boolean(h.feedback?.isCorrect),
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex w-full items-center gap-3 rounded-[18px] p-2.5 text-left transition hover:bg-[var(--accent-softer)]"
                  >
                    <span className="icon-tile size-10">
                      <Icon3D name={h.was_handwritten ? 'camera' : 'memo'} size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[var(--text-strong)]">{h.question}</span>
                      <span className="text-[12px] text-[var(--text-soft)]">{new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                    <span className={cn('pill-tag', p >= 70 ? '!bg-[var(--success-soft)]' : p >= 50 ? '!bg-[var(--accent-soft)]' : '!bg-[var(--warning-soft)]')}>{p}%</span>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-[var(--text-soft)]">Graded answers are saved here so you can watch your scores climb.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
