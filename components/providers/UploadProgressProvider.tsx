'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/lib/supabase/client';
import type { ResourceProcessingStatus } from '@/types/product';

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

  const extractTextClientSide = async (file: File): Promise<string | null> => {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim().length >= 50 ? result.value.trim() : null;
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
      return text.trim().length >= 50 ? text.trim() : null;
    }

    if (type === 'text/plain' || type === 'application/json') {
      return await file.text();
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

      setUploadState('queued');
      setProgress(70);
      const extractedText = await extractTextClientSide(finalFile);
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
        <div className="glass-panel fixed bottom-6 right-6 z-50 w-80 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900 dark:text-white">{fileName}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{statusLabel[uploadState]}</p>
              </div>
              {['ready', 'failed', 'queued', 'extracting', 'retrying'].includes(uploadState) ? (
                <button onClick={dismiss} className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              ) : null}
            </div>
          </div>

          {uploadState === 'failed' ? (
            <div className="h-1.5 w-full bg-red-500" />
          ) : uploadState === 'ready' ? (
            <div className="h-1.5 w-full bg-emerald-500" />
          ) : (
            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/8">
              <div
                className={uploadState === 'extracting' ? 'h-full bg-[#1a5c2a] transition-all animate-pulse' : 'h-full bg-[#1a5c2a] transition-all'}
                style={{ width: `${Math.max(progress, uploadState === 'extracting' ? 92 : 12)}%` }}
              />
            </div>
          )}
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
