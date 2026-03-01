'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SharedQuizClientProps {
    quiz: { title: string; subject: string; difficulty: string };
    questions: any[];
}

export default function SharedQuizClient({ quiz, questions }: SharedQuizClientProps) {
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [isFinished, setIsFinished] = useState(false);

    const startQuiz = () => {
        setIsQuizActive(true);
        setCurrentQuestionIndex(0);
        setScore(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setShowExplanation(false);
        setIsFinished(false);
    };

    const handleOptionSelect = (option: string) => {
        if (showExplanation) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption) return;

        const currentQ = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQ.answer;

        if (isCorrect) setScore(s => s + 1);

        setUserAnswers([...userAnswers, {
            question: currentQ.question,
            selected: selectedOption,
            correct: currentQ.answer,
            isCorrect,
            explanation: currentQ.explanation
        }]);

        setShowExplanation(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setIsQuizActive(false);
            setIsFinished(true);
        }
    };

    return (
        <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col items-center justify-center p-6 antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="size-10 bg-[#ea580c]/10 text-[#ea580c] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
                            StudyForge Shared Quiz
                        </h2>
                    </Link>
                </div>

                {!isQuizActive && !isFinished ? (
                    <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-10 text-center shadow-lg">
                        <span className="material-symbols-outlined text-6xl text-[#ea580c] mb-4 bg-[#ea580c]/10 p-4 rounded-full">
                            contact_support
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{quiz.title}</h1>
                        <p className="text-slate-500 dark:text-[#9c9cba] mb-8 text-lg">
                            {quiz.subject || 'General'} • {questions.length} Questions • {quiz.difficulty}
                        </p>
                        <button
                            onClick={startQuiz}
                            className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#ea580c]/25 transition-all w-full md:w-auto"
                        >
                            Start Quiz
                        </button>
                    </div>
                ) : isQuizActive ? (
                    <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-8 shadow-lg relative overflow-hidden">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-[#252535]">
                            <div
                                className="h-full bg-gradient-to-r from-[#ea580c] to-amber-500 transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center mb-6 pt-4">
                            <span className="text-sm font-bold text-slate-500 dark:text-[#9c9cba]">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 leading-relaxed">
                            {questions[currentQuestionIndex].question}
                        </h2>

                        <div className="space-y-3 mb-8">
                            {questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                                const isSelected = selectedOption === opt;
                                const isCorrectAnswer = questions[currentQuestionIndex].answer === opt;

                                let optionClass = "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ";

                                if (!showExplanation) {
                                    optionClass += isSelected
                                        ? "border-[#ea580c] bg-[#ea580c]/5 text-[#ea580c] font-bold"
                                        : "border-slate-200 dark:border-[#3b3b54] bg-white dark:bg-[#1b1b27] text-slate-700 dark:text-slate-300 hover:border-[#ea580c]/50";
                                } else {
                                    if (isCorrectAnswer) {
                                        optionClass += "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 font-bold";
                                    } else if (isSelected && !isCorrectAnswer) {
                                        optionClass += "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 font-bold opacity-75";
                                    } else {
                                        optionClass += "border-slate-200 dark:border-[#3b3b54] bg-slate-50 dark:bg-[#111118] text-slate-400 opacity-50";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(opt)}
                                        disabled={showExplanation}
                                        className={optionClass}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`shrink-0 mt-0.5 size-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${!showExplanation && isSelected ? 'border-[#ea580c] bg-[#ea580c] text-white' :
                                                    showExplanation && isCorrectAnswer ? 'border-green-500 bg-green-500 text-white' :
                                                        showExplanation && isSelected && !isCorrectAnswer ? 'border-red-500 bg-red-500 text-white' :
                                                            'border-slate-300 dark:border-[#4b4b66]'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span>{opt}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {showExplanation && (
                            <div className={`p-5 rounded-xl border-l-4 mb-8 ${selectedOption === questions[currentQuestionIndex].answer ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`material-symbols-outlined ${selectedOption === questions[currentQuestionIndex].answer ? 'text-green-500' : 'text-amber-500'}`}>
                                        {selectedOption === questions[currentQuestionIndex].answer ? 'check_circle' : 'lightbulb'}
                                    </span>
                                    <h4 className={`font-bold ${selectedOption === questions[currentQuestionIndex].answer ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                        {selectedOption === questions[currentQuestionIndex].answer ? 'Correct!' : 'Incorrect'}
                                    </h4>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {questions[currentQuestionIndex].explanation || "No further explanation provided."}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-[#2d2d3f]">
                            {!showExplanation ? (
                                <button
                                    onClick={handleCheckAnswer}
                                    disabled={!selectedOption}
                                    className="bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all"
                                >
                                    Check Answer
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextQuestion}
                                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                                >
                                    {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    // Results View
                    <div className="bg-white dark:bg-[#1b1b27] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-10 text-center shadow-lg">
                        <div className="inline-flex items-center justify-center p-4 bg-[#ea580c]/10 rounded-full mb-6">
                            <span className="material-symbols-outlined text-5xl text-[#ea580c]">emoji_events</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Quiz Complete!</h2>
                        <p className="text-slate-500 dark:text-[#9c9cba] mb-8 text-lg">
                            You scored {score} out of {questions.length} questions correctly.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={startQuiz}
                                className="bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-700 dark:text-slate-300 px-8 py-3 rounded-xl font-bold transition-all"
                            >
                                Try Again
                            </button>
                            <Link
                                href="/signup"
                                className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#ea580c]/25 transition-all"
                            >
                                Create Free Account
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
