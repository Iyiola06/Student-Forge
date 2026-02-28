import { QuizMode, Quiz, GradingResult, StudyBreakdown } from "../types/ai";

export const generateQuiz = async (sourceText: string, mode: QuizMode, count: number): Promise<Quiz> => {
    const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText, mode, count }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Quiz generation error:', error);
        throw new Error(error.error || 'Failed to generate quiz. Please try again.');
    }

    return response.json();
};

export const generateIllustration = async (prompt: string): Promise<string | null> => {
    // Placeholder for future feature
    console.warn('Illustration generation not yet implemented');
    return null;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    // Using native Web Speech API if possible, or a dedicated AI route
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        return 'native';
    }
    return null;
};

export const generateStudyBlueprint = async (sourceText: string): Promise<StudyBreakdown> => {
    const response = await fetch('/api/ai/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Blueprint generation error:', error);
        throw new Error(error.error || 'Failed to generate study blueprint. Please try again.');
    }

    return response.json();
};

export const generateChapterDetails = async (title: string, text: string): Promise<any> => {
    // Can be part of the blueprint or a dedicated call
    return {
        keyPoints: [{ title: 'Loading...', content: 'Details will load shortly' }],
    };
};

export const askFollowUpQuestion = async (userQuestion: string, title: string, content: string, fullText: string, history: any[]): Promise<string> => {
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuestion, title, content, fullText, history }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
    }

    const data = await response.json();
    return data.response;
};

export const gradeHandwrittenAnswer = async (img: string, q: string, ctx: string): Promise<GradingResult> => {
    const response = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'handwritten', imageData: img, question: q, context: ctx }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Grading error:', error);
        throw new Error(error.error || 'Failed to grade answer. Please try again.');
    }

    return response.json();
};

export const gradeTypedAnswer = async (answer: string, q: string, ctx: string): Promise<GradingResult> => {
    const response = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'typed', typedAnswer: answer, question: q, context: ctx }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Grading error:', error);
        throw new Error(error.error || 'Failed to grade answer. Please try again.');
    }

    return response.json();
};
