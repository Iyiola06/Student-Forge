'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudyMaterial } from '@/types/ai';

interface DocumentIngestionProps {
    onProcessed: (text: string) => void;
}

const STORAGE_KEY = 'studyforge_saved_materials';
const MAX_SAVED_ITEMS = 10;

const DocumentIngestion: React.FC<DocumentIngestionProps> = ({ onProcessed }) => {
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [savedMaterials, setSavedMaterials] = useState<StudyMaterial[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setSavedMaterials(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored materials', e);
            }
        }
    }, []);

    const saveMaterial = (content: string, name: string, type: 'file' | 'text') => {
        const newMaterial = {
            id: crypto.randomUUID(),
            name: name || 'Untitled Note',
            content,
            timestamp: Date.now(),
            type
        };

        const updated = [newMaterial, ...savedMaterials].slice(0, MAX_SAVED_ITEMS);
        setSavedMaterials(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const deleteMaterial = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedMaterials.filter(m => m.id !== id);
        setSavedMaterials(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const processFile = async (file: File) => {
        setFileName(file.name);
        setIsProcessing(true);
        try {
            let fullText = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                // Assuming pdfjs is available globally or imported
                // In a real Next.js app, we'd use a dynamic import or the library we already have in package.json
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n';
                }
            } else {
                fullText = await file.text();
            }

            setText(fullText);
            saveMaterial(fullText, file.name, 'file');
            onProcessed(fullText);
        } catch (err) {
            console.error('Error parsing file:', err);
            setFileName(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualSubmit = () => {
        if (text.trim().length < 50) return;
        const name = text.substring(0, 30).trim() + (text.length > 30 ? '...' : '');
        saveMaterial(text, name, 'text');
        onProcessed(text);
    };

    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            {savedMaterials.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">history</span>
                            Recent Brain-Dumps
                        </h3>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{savedMaterials.length}/{MAX_SAVED_ITEMS} slots occupied</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {savedMaterials.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => onProcessed(m.content)}
                                className="group relative bg-white dark:bg-[#1b1b27] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/50 transition-all cursor-pointer"
                            >
                                <button
                                    onClick={(e) => deleteMaterial(m.id, e)}
                                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${m.type === 'file' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {m.type === 'file' ? 'description' : 'notes'}
                                    </span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs truncate mb-1">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(m.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1b1b27] p-6 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/10 transition-colors duration-1000"></div>

                <div className="mb-10 relative">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Fuel Your AI Tutor</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">Upload a PDF or paste your messy notes. We'll extract the core concepts and build your custom study path.</p>
                </div>

                <div className="space-y-8">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
                        className={`relative group border-2 border-dashed rounded-[2rem] p-10 md:p-16 text-center transition-all cursor-pointer ${isDragging
                            ? 'border-orange-500 bg-orange-500/10 scale-[1.02] ring-8 ring-orange-500/5'
                            : fileName
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-500/5 dark:hover:bg-orange-500/5'
                            }`}
                    >
                        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept=".pdf,.txt" />

                        <div className="flex flex-col items-center">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-xl ${isDragging ? 'bg-orange-500 text-white scale-110 rotate-12' :
                                fileName ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:rotate-6'
                                }`}>
                                <span className="material-symbols-outlined text-3xl">
                                    {isDragging ? 'download' : fileName ? 'check_circle' : 'upload_file'}
                                </span>
                            </div>
                            <p className="font-black text-slate-900 dark:text-white text-xl md:text-2xl mb-2">{fileName ? fileName : 'Upload PDF'}</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{fileName ? 'File Ready' : 'Drop your textbook here'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-slate-100 dark:bg-slate-800 flex-grow"></div>
                        <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-700 tracking-[0.4em]">OR INPUT TEXT</span>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 flex-grow"></div>
                    </div>

                    <div className="relative group">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste raw text, snippets, or bullet points here..."
                            className="w-full h-40 md:h-56 p-6 md:p-8 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-8 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-700 dark:text-slate-300 text-lg font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-relaxed resize-none shadow-inner"
                        />
                        {text && (
                            <button
                                onClick={() => setText('')}
                                className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl font-black">backspace</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleManualSubmit}
                        disabled={isProcessing || text.trim().length < 50}
                        className="w-full h-16 md:h-20 bg-[#ea580c] text-white text-lg md:text-xl font-black rounded-2xl md:rounded-[1.5rem] hover:bg-orange-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center group active:scale-[0.98]"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Analyzing DNA...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span>GENERATE STUDY PATH</span>
                                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform font-black">arrow_forward</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentIngestion;
