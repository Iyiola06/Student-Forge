'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';

export type ExamSnapshot = {
  abbreviations?: Array<{ short?: string; full?: string }>;
  key_points?: Array<{ point?: string; tag?: string; color?: string }>;
  hot_list?: Array<{ question?: string; difficulty?: string; rationale?: string }>;
};

const TAG_TONES = ['pastel-sky', 'pastel-mint', 'pastel-peach', 'pastel-lavender', 'pastel-butter', 'pastel-blush'];

async function downloadPdf(snapshot: ExamSnapshot, title: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 20;
  const line = (text: string, size = 11, style: 'normal' | 'bold' | 'italic' = 'normal', indent = 20) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 190 - indent);
    if (y + lines.length * 6 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, indent, y);
    y += lines.length * (size * 0.5) + 2;
  };

  line(`${title} — Exam cheat sheet`, 17, 'bold');
  y += 4;
  if (snapshot.abbreviations?.length) {
    line('Abbreviations', 13, 'bold');
    snapshot.abbreviations.forEach((a) => line(`${a.short}: ${a.full}`));
    y += 4;
  }
  if (snapshot.key_points?.length) {
    line('High-yield facts', 13, 'bold');
    snapshot.key_points.forEach((k) => line(`• ${k.tag ? `[${k.tag}] ` : ''}${k.point}`));
    y += 4;
  }
  if (snapshot.hot_list?.length) {
    line("Examiner's hot list", 13, 'bold');
    snapshot.hot_list.forEach((h, i) => {
      line(`${i + 1}. ${h.question}${h.difficulty ? ` (${h.difficulty})` : ''}`, 11, 'bold');
      if (h.rationale) line(`Why it comes up: ${h.rationale}`, 10, 'italic', 26);
    });
  }
  doc.save(`${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'cheat-sheet'}.pdf`);
}

export default function CheatSheet({ snapshot, title, topic }: { snapshot: ExamSnapshot; title: string; topic?: string | null }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const hotList = (snapshot.hot_list ?? []).filter((h) => h?.question);

  const addHotListToReview = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/review/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || title,
          items: [
            ...hotList.map((h) => ({
              question: h.question,
              answer: 'Answer it from memory, then check your notes.',
              explanation: h.rationale ? `Why examiners ask this: ${h.rationale}` : undefined,
            })),
            ...(snapshot.abbreviations ?? [])
              .filter((a) => a.short && a.full)
              .map((a) => ({ front: `What does ${a.short} stand for?`, back: a.full })),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add to review');
      setAdded(true);
      toast.success(`${data.added} items added to your review queue.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add to review');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button className="primary-button !h-10" onClick={() => downloadPdf(snapshot, title)}>
          Download PDF
        </button>
        <button className="secondary-button !h-10" disabled={adding || added || (!hotList.length && !snapshot.abbreviations?.length)} onClick={addHotListToReview}>
          {added ? 'Added to review' : adding ? 'Adding...' : 'Add to spaced review'}
        </button>
      </div>

      {snapshot.abbreviations?.length ? (
        <section>
          <h3 className="flex items-center gap-2 font-display text-[16px] font-semibold text-[var(--text-strong)]">
            <Icon3D name="bookmark" size={22} /> Abbreviations
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {snapshot.abbreviations.map((a, i) => (
              <div key={i} className="flex items-baseline gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5">
                <span className="font-display text-[15px] font-semibold text-[var(--accent-strong)]">{a.short}</span>
                <span className="text-[13.5px] text-[var(--text-body)]">{a.full}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {snapshot.key_points?.length ? (
        <section>
          <h3 className="flex items-center gap-2 font-display text-[16px] font-semibold text-[var(--text-strong)]">
            <Icon3D name="bolt" size={22} /> High-yield facts
          </h3>
          <ul className="mt-3 space-y-2">
            {snapshot.key_points.map((k, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-3 text-[14px] leading-6 text-[var(--text-body)]">
                {k.tag ? <span className={cn('pill-tag shrink-0 !text-[11px]', TAG_TONES[i % TAG_TONES.length])}>{k.tag}</span> : null}
                <span>{k.point}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hotList.length ? (
        <section>
          <h3 className="flex items-center gap-2 font-display text-[16px] font-semibold text-[var(--text-strong)]">
            <Icon3D name="crystal" size={22} /> Examiner&rsquo;s hot list
          </h3>
          <ol className="mt-3 space-y-2">
            {hotList.map((h, i) => (
              <li key={i} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14.5px] font-medium text-[var(--text-strong)]">
                    {i + 1}. {h.question}
                  </p>
                  {h.difficulty ? <span className="pill-tag shrink-0 !text-[11px] capitalize">{h.difficulty}</span> : null}
                </div>
                {h.rationale ? <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-soft)]">{h.rationale}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
