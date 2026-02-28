export type QuizMode = 'mcq' | 'true-false' | 'fill-gap' | 'theoretical';

export interface QuizQuestion {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

export interface Quiz {
    title: string;
    questions: QuizQuestion[];
}

export interface GradingResult {
    score: number;
    feedback: string;
    correctAnswer: string;
    isCorrect: boolean;
}

export interface StudyChapter {
    title: string;
    summary: string;
    keyPoints: string[];
}

export interface StudyBreakdown {
    title: string;
    overallSummary: string;
    chapters: StudyChapter[];
    estimatedStudyTimeMinutes: number;
}
