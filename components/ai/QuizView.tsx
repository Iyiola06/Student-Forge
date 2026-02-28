'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Quiz, QuizMode, GradingResult } from '@/types/ai';
import CameraCapture from './CameraCapture';
import VoiceButton from './VoiceButton';
import { gradeHandwrittenAnswer, gradeTypedAnswer } from '@/lib/aiClient';

interface QuizViewProps {
    quiz: Quiz;
    sourceText: string;
    onRestart: () => void;
}

const GRADING_MESSAGES = [
    "Analyzing ink contrast...",
    "Transcribing handwriting...",
    "Consulting source material...",
    "Applying StudyForge rubric...",
    "Synthesizing tutor feedback..."
];

const QuizView: React.FC<QuizViewProps> = ({ quiz, sourceText, onRestart }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [theoryInputMode, setTheoryInputMode] = useState<'none' | 'camera' | 'typing'>('none');
    const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
    const [isGrading, setIsGrading] = useState(false);
    const [gradingStep, setGradingStep] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [typedAnswer, setTypedAnswer] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const questions = quiz.questions || [];
    const question = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

    useEffect(() => {
        let interval: any;
        if (isGrading) {
            setGradingStep(0);
            interval = setInterval(() => {
                setGradingStep(prev => (prev + 1) % GRADING_MESSAGES.length);
            }, 1200);
        }
        return () => clearInterval(interval);
    }, [isGrading]);

    const handleMCQSelect = (idx: number) => {
        setAnswers({ ...answers, [currentIdx]: idx });
        setShowExplanation(true);
    };

    const handleGapSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!typedAnswer.trim()) return;
        setAnswers({ ...answers, [currentIdx]: typedAnswer });
        setShowExplanation(true);
    };

    const handleCapture = async (base64: string) => {
        setIsCameraOpen(false);
        setIsGrading(true);
        setGradingResult(null);
        try {
            const result = await gradeHandwrittenAnswer(base64, question.question, sourceText);
            setGradingResult(result);
            setAnswers({ ...answers, [currentIdx]: result });
        } catch (err) {
            console.error(err);
        } finally {
            setIsGrading(false);
        }
    };

    const handleTypedTheorySubmit = async () => {
        if (!typedAnswer.trim()) return;
        setIsGrading(true);
        setTheoryInputMode('none');
        try {
            const result = await gradeTypedAnswer(typedAnswer, question.question, sourceText);
            setGradingResult(result);
            setAnswers({ ...answers, [currentIdx]: result });
        } catch (err) {
            console.error(err);
        } finally {
            setIsGrading(false);
        }
    };

    const isCurrentAnswered = () => answers[currentIdx] !== undefined;

    const nextQuestion = () => {
        if (!isLast) {
            setCurrentIdx(currentIdx + 1);
            setShowExplanation(false);
            setGradingResult(null);
            setTypedAnswer('');
            setTheoryInputMode('none');
        } else {
            setShowSummary(true);
        }
    };

    if (showSummary) {
        const correctCount = Object.values(answers).filter(a => typeof a === 'number' ? questions[0].answer === questions[0].options?.[a] : (a as GradingResult).isCorrect).length;
        return (
            <div className="max-w-4xl mx-auto px-4 animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-white dark:bg-[#1b1b27] rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <div className="w-24 h-24 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-symbols-outlined text-5xl font-black">emoji_events</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Knowledge Secured</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 font-bold">You've successfully completed the assessment with {correctCount} points.</p>
                    <button onClick={onRestart} className="h-16 px-10 bg-[#ea580c] text-white font-black rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/20 flex items-center justify-center gap-4 mx-auto group">
                        <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-700">restart_alt</span>
                        NEW STUDY SESSION
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
                <button onClick={onRestart} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm active:scale-90">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-1">Knowledge Check</p>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{currentIdx + 1} / {questions.length}</h2>
                </div>
                <div className="w-12"></div>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-12 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(234,88,12,0.5)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="bg-white dark:bg-[#1b1b27] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden flex flex-col relative group">
                <div className="p-10 md:p-14 flex-grow relative z-10">
                    <div className="flex items-start justify-between gap-6 mb-10">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight pr-6">
                            {question?.question}
                        </h3>
                        <VoiceButton text={question?.question} size="lg" />
                    </div>

                    {/* Question Interface */}
                    <div className="min-h-[200px]">
                        {quiz.title.toLowerCase().includes('mcq') && (
                            <div className="grid grid-cols-1 gap-4">
                                {question?.options?.map((option, idx) => {
                                    const isSelected = answers[currentIdx] === idx;
                                    const isCorrect = option === question.answer;
                                    let btnClass = "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center group relative overflow-hidden ";
                                    if (showExplanation) {
                                        if (isCorrect) btnClass += "border-emerald-500 bg-emerald-500/5 text-emerald-900 dark:text-emerald-400";
                                        else if (isSelected) btnClass += "border-rose-500 bg-rose-500/5 text-rose-900 dark:text-rose-400";
                                        else btnClass += "border-slate-100 dark:border-slate-800 opacity-40";
                                    } else {
                                        btnClass += isSelected ? "border-orange-500 bg-orange-500/5 dark:text-white" : "border-slate-100 dark:border-slate-800 hover:border-orange-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50";
                                    }
                                    return (
                                        <button key={idx} onClick={() => !showExplanation && handleMCQSelect(idx)} disabled={showExplanation} className={btnClass}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-5 font-black transition-colors ${showExplanation && isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="font-bold text-lg">{option}</span>
                                            {showExplanation && isCorrect && <span className="material-symbols-outlined absolute right-6 text-emerald-500">check_circle</span>}
                                            {showExplanation && isSelected && !isCorrect && <span className="material-symbols-outlined absolute right-6 text-rose-500">cancel</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {!quiz.title.toLowerCase().includes('mcq') && !gradingResult && !isGrading && theoryInputMode === 'none' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <button onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center gap-6 p-10 bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:border-orange-500 transition-all group active:scale-95">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-800 text-orange-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <span className="material-symbols-outlined text-4xl font-black">photo_camera</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-slate-900 dark:text-white text-xl">Handwritten</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Snap a photo</p>
                                    </div>
                                </button>
                                <button onClick={() => setTheoryInputMode('typing')} className="flex flex-col items-center gap-6 p-10 bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:border-orange-500 transition-all group active:scale-95">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-800 text-orange-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                                        <span className="material-symbols-outlined text-4xl font-black">keyboard</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-slate-900 dark:text-white text-xl">Type Answer</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Traditional input</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {theoryInputMode === 'typing' && !isGrading && !gradingResult && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <textarea
                                    value={typedAnswer}
                                    onChange={e => setTypedAnswer(e.target.value)}
                                    placeholder="The mitochondria is the..."
                                    className="w-full h-56 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-orange-500 focus:ring-8 focus:ring-orange-500/5 outline-none text-slate-700 dark:text-slate-300 font-bold leading-relaxed resize-none shadow-inner"
                                />
                                <div className="flex gap-4">
                                    <button onClick={() => setTheoryInputMode('none')} className="px-8 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 font-black text-slate-400 text-xs uppercase tracking-widest hover:text-orange-500 transition-colors">BACK</button>
                                    <button onClick={handleTypedTheorySubmit} disabled={!typedAnswer.trim()} className="flex-1 h-16 bg-[#ea580c] text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98]">SUBMIT FOR GRADING</button>
                                </div>
                            </div>
                        )}

                        {isGrading && (
                            <div className="flex flex-col items-center py-20 text-center animate-in fade-in duration-500">
                                <div className="relative w-28 h-28 mb-10">
                                    <div className="absolute inset-0 border-[6px] border-orange-100 dark:border-orange-500/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-2xl font-black text-slate-800 dark:text-white mb-2">{GRADING_MESSAGES[gradingStep]}</p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">Gemini AI is Reviewing</p>
                            </div>
                        )}
                    </div>

                    {(showExplanation || gradingResult) && (
                        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="p-10 md:p-12 bg-orange-50 dark:bg-orange-500/5 rounded-[3rem] border border-orange-100 dark:border-orange-500/20 relative">
                                <div className="absolute top-8 right-8">
                                    <VoiceButton text={gradingResult ? gradingResult.feedback : (question?.explanation || "")} />
                                </div>

                                <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-[0.2em] mb-6">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    TUTOR FEEDBACK
                                </div>

                                <p className="text-slate-800 dark:text-white font-bold leading-relaxed text-xl">
                                    {gradingResult ? gradingResult.feedback : question?.explanation}
                                </p>

                                {gradingResult && (
                                    <div className="mt-10 flex flex-col md:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-orange-100 dark:border-orange-500/10">
                                        <div className="w-20 h-20 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-orange-500/20">
                                            {gradingResult.score}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Knowledge Accuracy</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{gradingResult.score >= 80 ? 'Exceptional Mastery!' : gradingResult.score >= 50 ? 'Strong Foundation' : 'Keep Pushing Forward'}</p>
                                        </div>
                                        {!gradingResult.isCorrect && (
                                            <div className="ml-auto w-full md:w-auto p-4 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Model Answer</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{gradingResult.correctAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="bg-slate-50 dark:bg-[#101022] px-10 md:px-14 py-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-50 backdrop-blur-3xl">
                    <div className="text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-widest hidden md:block">
                        {currentIdx + 1} OF {questions.length} SECURED
                    </div>
                    <button
                        onClick={nextQuestion}
                        disabled={!isCurrentAnswered()}
                        className="h-16 px-12 bg-[#ea580c] text-white font-black rounded-2xl disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all flex items-center shadow-2xl shadow-orange-500/20 hover:bg-orange-600 active:scale-95 group"
                    >
                        {isLast ? 'COMPLETE SESSION' : 'CONTINUE'}
                        <span className="material-symbols-outlined ml-4 group-hover:translate-x-2 transition-transform font-black">arrow_forward</span>
                    </button>
                </div>
            </div>

            {isCameraOpen && (
                <div className="animate-in fade-in duration-300">
                    <CameraCapture onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />
                </div>
            )}
        </div>
    );
};

export default QuizView;
