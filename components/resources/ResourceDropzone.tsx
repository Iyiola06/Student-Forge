'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ResourceDropzoneProps = {
  onFileSelect: (file: File) => Promise<void> | void;
  uploadState: string;
  className?: string;
};

export default function ResourceDropzone({ onFileSelect, uploadState, className }: ResourceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const busy = uploadState !== 'idle' && uploadState !== 'ready' && uploadState !== 'failed';

  return (
    <div
      className={cn('resource-dropzone', className)}
      data-dragging={isDragging ? 'true' : undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          await onFileSelect(file);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          event.target.value = '';
          await onFileSelect(file);
        }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[58ch]">
          <p className="eyebrow">Upload</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.06em] text-slate-950 dark:text-white">
            Bring in material once. Turn it into study flow.
          </h2>
          <p className="mt-4 text-[15px] leading-8 text-slate-600 dark:text-slate-300">
            Drag in lecture notes, decks, scans, screenshots, or PDFs. Sulva’s Studify reads the file, checks extraction quality, and makes it ready for quizzes, flashcards, summaries, and tutoring.
          </p>
        </div>

        <div className="rounded-[24px] border border-black/6 bg-white/72 p-4 dark:border-white/8 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="resource-file-icon size-11 rounded-[18px]">
              <span className="material-symbols-outlined text-[22px]">{busy ? 'autorenew' : 'upload_file'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-950 dark:text-white">
                {busy ? 'Processing upload' : uploadState === 'ready' ? 'Upload completed' : 'Drop file or browse'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {busy ? 'Your file is moving through extraction now.' : 'PDF, DOCX, PPTX, image, or text up to 25MB.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="primary-button" disabled={busy}>
              {busy ? 'Uploading...' : 'Choose file'}
            </button>
            <span className="secondary-button !h-10 !cursor-default !rounded-xl !px-4">
              Drag and drop supported
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
