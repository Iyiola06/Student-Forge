'use client';

import React, { useState } from 'react';
import DocumentIngestion from './DocumentIngestion';
import StudyBreakdownView from './StudyBreakdownView';
import QuizView from './QuizView';
import { generateStudyBlueprint, generateQuiz } from '@/lib/aiClient';
import { StudyBreakdown, Quiz, QuizMode } from '@/types/ai';

const Dashboard: React.FC = () => {
    const [view, setView] = useState<'ingestion' | 'breakdown' | 'quiz'>('ingestion');
    const [sourceText, setSourceText] = useState('');
    const [breakdown, setBreakdown] = useState<StudyBreakdown | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingState, setLoadingState] = useState('');

    const handleDocumentProcessed = async (text: string) => {
        setSourceText(text);
        setIsLoading(true);
        setLoadingState('Synthesizing Knowledge...');
        try {
            const blueprint = await generateStudyBlueprint(text);
            setBreakdown(blueprint);
            setView('breakdown');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartQuiz = async () => {
        if (!sourceText) return;
        setIsLoading(true);
        setLoadingState('Generating Assessment Questions...');
        try {
            // Default to MCQ for the first generation
            const generatedQuiz = await generateQuiz(sourceText, 'mcq' as QuizMode, 5);
            setQuiz(generatedQuiz);
            setView('quiz');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c16] text-slate-900 dark:text-white pb-20 pt-10 px-4 md:px-8">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-40 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-[#0c0c16]/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="relative w-32 h-32 mb-10">
                            <div className="absolute inset-0 border-[8px] border-orange-100 dark:border-orange-500/10 rounded-full"></div>
                            <div className="absolute inset-0 border-[8px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-orange-500 animate-pulse font-black">bolt</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter mb-2">{loadingState}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Gemini 2.5 Flash Engine Active</p>
                    </div>
                )}

                {/* Dynamic Header */}
                {view !== 'quiz' && (
                    <header className="mb-16 text-center animate-in fade-in slide-in-from-top-6 duration-700">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-orange-500/10 rounded-full mb-6 border border-orange-500/20">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                            <span className="text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em]">Neural Study Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                            {view === 'ingestion' ? 'Master Any Subject.' : 'Targeted Roadmap.'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold max-w-3xl mx-auto leading-relaxed">
                            {view === 'ingestion'
                                ? 'Input your materials and let the AI build a high-retention study architecture for you.'
                                : 'Follow the synthesized breakdown below to solidify your understanding before the quiz.'}
                        </p>
                    </header>
                )}

                <main>
                    {view === 'ingestion' && (
                        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                            <DocumentIngestion onProcessed={handleDocumentProcessed} />
                        </div>
                    )}

                    {view === 'breakdown' && breakdown && (
                        <StudyBreakdownView
                            breakdown={breakdown}
                            sourceText={sourceText}
                            onStartQuiz={handleStartQuiz}
                            onRestart={() => setView('ingestion')}
                        />
                    )}

                    {view === 'quiz' && quiz && (
                        <QuizView
                            quiz={quiz}
                            sourceText={sourceText}
                            onRestart={() => setView('ingestion')}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
