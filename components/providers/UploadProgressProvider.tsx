'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/lib/supabase/client';
import type { ResourceProcessingStatus } from '@/types/product';
import { extractPdfToMarkdown } from '@/lib/pdf/browser';
import Icon3D from '@/components/ui/Icon3D';

type UploadState = 'idle' | 'compressing' | 'uploading' | ResourceProcessingStatus;

interface UploadContextType {
  uploadState: UploadState;
  progress: number;
  fileName: string | null;
  error: string | null;
  uploadFile: (file: File) => Promise<void>;
  dismiss: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('upload-processing')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resources' }, (payload) => {
        const status = payload.new.processing_status as ResourceProcessingStatus | undefined;
        const title = payload.new.title || 'Your file';
        if (!status) return;

        if (status === 'ready') {
          toast.success(`${title} is ready for review.`);
          setUploadState('ready');
          setProgress(100);
          setTimeout(() => dismiss(), 5000);
        } else if (status === 'failed') {
          toast.error(`${title} failed to process: ${payload.new.processing_error || 'Unknown error'}`);
          setUploadState('failed');
          setError(payload.new.processing_error || 'Background processing failed');
        } else if (['queued', 'extracting', 'extracted', 'retrying'].includes(status)) {
          setUploadState(status);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!['queued', 'extracting', 'extracted', 'retrying'].includes(uploadState)) return;
    const timer = setTimeout(() => {
      toast.info('Processing is taking longer than expected. The file will stay in your library and finish when ready.');
      dismiss();
    }, 3 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [uploadState]);

  const compressImage = async (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              } else {
                reject(new Error('Canvas to blob conversion failed'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

  const extractTextClientSide = async (file: File): Promise<{ text: string; method: string } | null> => {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      try {
        const result = await extractPdfToMarkdown(await file.arrayBuffer(), {
          onProgress: (p) => {
            if (p.phase === 'reading') {
              setDetail(`Reading page ${p.page} of ${p.totalPages}`);
              setProgress(70 + Math.round((p.page / Math.max(1, p.totalPages)) * 10));
            } else if (p.phase === 'ocr') {
              setDetail(`Reading scanned pages with AI \u2022 ${p.ocrDone}/${p.ocrTotal}`);
              setProgress(80 + Math.round((p.ocrDone / Math.max(1, p.ocrTotal)) * 15));
            }
          },
        });
        if (result.ocrFailedPages.length) {
          toast.warn(`${result.ocrFailedPages.length} scanned page(s) could not be read: ${result.ocrFailedPages.slice(0, 8).join(', ')}`);
        }
        return result.markdown.trim().length >= 50 ? { text: result.markdown, method: result.method } : null;
      } catch (pdfError) {
        console.warn('In-browser PDF extraction failed, falling back to the server', pdfError);
        return null;
      }
    }

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim().length >= 50 ? { text: result.value.trim(), method: 'docx' } : null;
    }

    if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || name.endsWith('.pptx')) {
      const JSZip = (await import('jszip')).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slideFiles = Object.keys(zip.files)
        .filter((n) => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
        .sort();
      let text = '';
      for (const slidePath of slideFiles) {
        const xml = await zip.files[slidePath].async('text');
        const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) text += matches.map((m: string) => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
      }
      return text.trim().length >= 50 ? { text: text.trim(), method: 'pptx' } : null;
    }

    if (type.startsWith('image/')) {
      try {
        setDetail('Reading your photo with AI');
        const image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/resources/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, page: 1 }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.markdown === 'string' && data.markdown.trim().length >= 20) {
          return { text: data.markdown.trim(), method: 'image_ocr' };
        }
      } catch (imageError) {
        console.warn('In-browser image OCR failed, falling back to the server', imageError);
      }
      return null;
    }

    if (type === 'text/plain' || type === 'application/json' || name.endsWith('.md')) {
      return { text: await file.text(), method: 'plain_text' };
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadState('compressing');
      setFileName(file.name);
      setProgress(0);
      setError(null);

      let finalFile = file;
      if (file.type.startsWith('image/')) {
        finalFile = await compressImage(file);
      } else if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
          finalFile = new File([pdfBytes.buffer as ArrayBuffer], file.name, { type: 'application/pdf' });
        } catch {
          finalFile = file;
        }
      }

      if (finalFile.size > 25 * 1024 * 1024) {
        throw new Error(`File size (${(finalFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 25MB limit.`);
      }

      setUploadState('uploading');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = finalFile.name.split('.').pop();
      const storageFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${storageFileName}`;

      setProgress(40);
      const { error: storageError } = await supabase.storage.from('resources').upload(filePath, finalFile);
      if (storageError) throw new Error(storageError.message || 'Failed to upload to storage');

      setUploadState('extracting');
      setProgress(70);
      // Extract from the original file: re-saved PDFs can lose text structure.
      const extraction = await extractTextClientSide(file.type === 'application/pdf' ? file : finalFile);
      const extractedText = extraction?.text ?? null;
      setDetail(null);
      if (extractedText) {
        setUploadState('extracting');
        setProgress(85);
      }

      const response = await fetch('/api/resources/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          fileName: finalFile.name,
          fileType: finalFile.type,
          fileSize: finalFile.size,
          extractedText,
          extractionMethod: extraction?.method,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save document');

      if (result.status === 'ready') {
        setUploadState('ready');
        setProgress(100);
        toast.success(`${finalFile.name} is ready!`);
        setTimeout(() => dismiss(), 4000);
      } else if (result.status === 'failed') {
        throw new Error(result.processingError || 'Processing failed');
      } else {
        setUploadState('extracting');
        setProgress(92);
      }
    } catch (err: any) {
      setUploadState('failed');
      setError(err.message);
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const dismiss = () => {
    setDetail(null);
    setUploadState('idle');
    setFileName(null);
    setProgress(0);
    setError(null);
  };

  const statusLabel: Record<UploadState, string> = {
    idle: '',
    compressing: 'Optimizing file…',
    uploading: 'Uploading to your library…',
    uploaded: 'File uploaded.',
    queued: 'Queued for extraction…',
    extracting: 'Extracting readable text…',
    extracted: 'Preparing preview…',
    generating: 'Generating study output…',
    ready: 'Ready for review.',
    retrying: 'Retrying extraction…',
    failed: 'Processing failed.',
    archived: 'Archived.',
  };

  return (
    <UploadContext.Provider value={{ uploadState, progress, fileName, error, uploadFile, dismiss }}>
      {children}
      {uploadState !== 'idle' ? (
        <div className="glass-panel fixed right-3 bottom-24 left-3 z-50 overflow-hidden animate-rise sm:right-6 sm:bottom-6 sm:left-auto sm:w-[340px]">
          <div className="flex items-start gap-3 p-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-softer)]">
              <Icon3D
                name={uploadState === 'failed' ? 'thinking' : uploadState === 'ready' ? 'party' : 'file-folder'}
                size={28}
                className={uploadState === 'ready' || uploadState === 'failed' ? '' : 'animate-float'}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-strong)]">{fileName}</p>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">{detail || statusLabel[uploadState]}</p>
              {error ? <p className="mt-1 line-clamp-2 text-xs text-[var(--danger)]">{error}</p> : null}
            </div>
            {['ready', 'failed', 'queued', 'extracting', 'retrying'].includes(uploadState) ? (
              <button onClick={dismiss} className="text-[var(--text-faint)] transition hover:text-[var(--text-strong)]" aria-label="Dismiss">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            ) : null}
          </div>

          <div className="h-1.5 w-full bg-[var(--line)]">
            <div
              className={
                uploadState === 'failed'
                  ? 'h-full w-full bg-[var(--danger)]'
                  : uploadState === 'ready'
                    ? 'h-full w-full bg-[var(--success)]'
                    : 'h-full rounded-r-full bg-gradient-to-r from-[#4a9be8] to-[#8cc4f5] transition-all duration-500'
              }
              style={uploadState === 'failed' || uploadState === 'ready' ? undefined : { width: `${Math.max(progress, 12)}%` }}
            />
          </div>
        </div>
      ) : null}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProgressProvider');
  }
  return context;
}
