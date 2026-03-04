'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { PDFDocument } from 'pdf-lib';

type UploadState = 'idle' | 'compressing' | 'uploading' | 'processing' | 'ready' | 'error';

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
        // Listen for realtime updates on resources table to know when processing is done
        const channel = supabase
            .channel('upload-processing')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'resources',
                },
                (payload) => {
                    const newStatus = payload.new.processing_status;
                    const oldStatus = payload.old.processing_status;

                    if (newStatus === 'ready' && oldStatus !== 'ready') {
                        toast.success(`${payload.new.title || 'Your file'} is ready and analyzed in the background!`);
                        if (uploadState === 'processing') {
                            setUploadState('ready');
                            setTimeout(() => dismiss(), 5000);
                        }
                    } else if (newStatus === 'error' && oldStatus !== 'error') {
                        toast.error(`${payload.new.title || 'File'} analysis failed: ${payload.new.processing_error || 'Background error'}`);
                        if (uploadState === 'processing') {
                            setUploadState('error');
                            setError(payload.new.processing_error || 'Background processing failed');
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, uploadState]);

    const compressPdf = async (file: File): Promise<File> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            // Load the PDF documents
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

            // Save it back (this often strips metadata and unused objects, achieving some compression)
            // Note: full PDF compression (images etc.) in browser is very hard, but this helps.
            const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
            return new File([pdfBytes.buffer as ArrayBuffer], file.name, { type: 'application/pdf' });
        } catch (e) {
            console.warn("PDF compression failed or was skipped", e);
            return file;
        }
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                }));
                            } else {
                                reject(new Error('Canvas to Blob conversion failed'));
                            }
                        },
                        'image/jpeg',
                        0.7 // quality
                    );
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const uploadFile = async (file: File) => {
        try {
            setUploadState('compressing');
            setFileName(file.name);
            setProgress(0);
            setError(null);

            let finalFile = file;

            if (file.type === 'application/pdf') {
                finalFile = await compressPdf(file);
            } else if (file.type.startsWith('image/')) {
                finalFile = await compressImage(file);
            }

            // 15MB absolute limit
            if (finalFile.size > 15 * 1024 * 1024) {
                throw new Error(`File size (${(finalFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 15MB limit.`);
            }

            setUploadState('uploading');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = finalFile.name.split('.').pop();
            const storageFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${storageFileName}`;

            // We use standard upload, simulating progress as XHR can be complex with Supabase JS client
            // A full XHR implementation with signed URLs is possible, but standard upload is fast for <15MB files
            setProgress(50);

            const { data: storageData, error: storageError } = await supabase.storage
                .from('resources')
                .upload(filePath, finalFile);

            if (storageError) {
                throw new Error(storageError.message || 'Failed to upload to storage');
            }

            setProgress(100);
            setUploadState('processing');

            // Trigger background processing
            const response = await fetch('/api/resources/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath,
                    fileName: finalFile.name,
                    fileType: finalFile.type,
                    fileSize: finalFile.size,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to start background processing');
            }

        } catch (err: any) {
            setUploadState('error');
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

    return (
        <UploadContext.Provider value={{ uploadState, progress, fileName, error, uploadFile, dismiss }}>
            {children}
            {uploadState !== 'idle' && (
                <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl shadow-2xl z-50 overflow-hidden font-display animate-in slide-in-from-bottom-5">
                    <div className="p-4 flex items-start justify-between">
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2">
                                {fileName}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize flex items-center gap-2">
                                {uploadState === 'compressing' && <><span className="size-3 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></span> Optimizing file...</>}
                                {uploadState === 'uploading' && 'Uploading direct to cloud...'}
                                {uploadState === 'processing' && <><span className="size-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span> Analyzing content...</>}
                                {uploadState === 'ready' && <span className="text-green-500 font-bold">Upload Complete!</span>}
                                {uploadState === 'error' && <span className="text-red-500 font-bold">Failed to upload</span>}
                            </span>
                        </div>
                        {(uploadState === 'ready' || uploadState === 'error' || uploadState === 'processing') && (
                            <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    {(uploadState === 'uploading' || uploadState === 'compressing' || uploadState === 'processing') && (
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#0c0c16]">
                            <div
                                className={`h-full transition-all duration-300 ${uploadState === 'processing' ? 'bg-purple-500 animate-pulse w-full' : 'bg-[#ea580c]'}`}
                                style={{ width: uploadState === 'processing' ? '100%' : `${Math.max(10, progress)}%` }}
                            />
                        </div>
                    )}
                    {uploadState === 'error' && (
                        <div className="h-1.5 w-full bg-red-500" />
                    )}
                    {uploadState === 'ready' && (
                        <div className="h-1.5 w-full bg-green-500" />
                    )}
                </div>
            )}
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
