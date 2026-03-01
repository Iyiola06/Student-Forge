'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';

interface Resource {
  id: string;
  title: string;
  content: string;
}

export default function GeneratorPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [pastedText, setPastedText] = useState('');

  const [type, setType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz Interaction States
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResources() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('resources')
        .select('id, title, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setResources(data);
    }
    fetchResources();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPastedText(`Uploading and analyzing ${file.name}...`);
    setSelectedResource('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (storageError) {
        throw new Error(storageError.message || 'Failed to upload to storage');
      }

      setPastedText(`Analyzing document content...`);
      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      // Refresh the library to show the new file
      async function fetchUpdatedResources() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('resources')
          .select('id, title, content')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setResources(data);
      }
      await fetchUpdatedResources();

      // Automatically select the new resource
      if (result.resource && result.resource.id) {
        setSelectedResource(result.resource.id);
        setPastedText('');
      } else {
        setPastedText(result.resource?.content || 'Text extraction completed.');
      }

    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
      setPastedText('');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleGenerate = async () => {
    let contentToUse = pastedText;

    if (selectedResource) {
      const resource = resources.find(r => r.id === selectedResource);
      if (resource && resource.content) {
        contentToUse = resource.content;
      }
    }

    if (!contentToUse.trim()) {
      setError('Please select a resource or paste some text to generate questions.');
      return;
    }

    // Validate the content isn't garbage / error text
    const BLOCKED_PHRASES = [
      'text extraction is currently only supported',
      'failed to parse', 'could not extract',
      'parsing failed', 'no text content',
      'not currently supported for text extraction'
    ];
    const lowerContent = contentToUse.toLowerCase();
    if (BLOCKED_PHRASES.some(p => lowerContent.includes(p)) || contentToUse.trim().length < 50) {
      setError('This resource does not contain valid study material. Please re-upload the file or paste the text directly into the text box.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToUse,
          type,
          difficulty,
          count
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate content');
      }

      setGeneratedData(result.data);

      // Awarding XP is now handled at the end of the interactive quiz
      // Awarding XP for generation - optional: could add a small bonus here

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = () => {
    if (!generatedData || generatedData.length === 0) return;
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizStartTime(Date.now());
  };

  const handleOptionSelect = (option: string) => {
    if (showExplanation) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !generatedData) return;

    const currentQ = generatedData[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.answer;

    if (isCorrect) setScore(s => s + 1);

    setUserAnswers([...userAnswers, {
      question: currentQ.question || currentQ.sentence,
      selected: selectedOption,
      correct: currentQ.answer,
      isCorrect,
      explanation: currentQ.explanation
    }]);

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < generatedData.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsQuizActive(false);
    // Award XP based on performance
    const finalScore = score + (selectedOption === generatedData[currentQuestionIndex].answer ? 1 : 0);
    const xpEarned = finalScore * 5; // 5 XP per correct answer

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', user.id)
      .single();

    if (profile) {
      const newXp = profile.xp + xpEarned;
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

      await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel > profile.level ? newLevel : profile.level })
        .eq('id', user.id);
    }
  };

  const saveQuiz = async () => {
    if (!generatedData) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          resource_id: selectedResource || null,
          title: `Generated ${type.toUpperCase()}`,
          subject: 'General',
          difficulty,
          is_public: true
        })
        .select().single();

      if (quizError) throw quizError;

      const questions = generatedData.map((q: any) => ({
        quiz_id: quiz.id,
        question_text: q.question || q.sentence || 'No question text',
        question_type: type,
        options: q.options || [],
        correct_answer: q.answer || q.model_answer || '',
        explanation: q.explanation || ''
      }));

      const { error: itemsError } = await supabase.from('quiz_questions').insert(questions);
      if (itemsError) throw itemsError;

      setSavedQuizId(quiz.id);
    } catch (err: any) {
      alert(`Error saving quiz: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentSettings = { type, difficulty, count };

  const downloadPDF = () => {
    if (!generatedData) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text(`StudyForge Generated ${type.toUpperCase()}`, 20, y);
    y += 10;

    doc.setFontSize(12);

    if (type === 'mcq') {
      generatedData.forEach((q: any, i: number) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${q.question}`, 170);
        doc.text(lines, 20, y);
        y += (lines.length * 7);

        q.options.forEach((opt: string, j: number) => {
          doc.text(`${String.fromCharCode(65 + j)}. ${opt}`, 30, y);
          y += 7;
        });

        doc.setTextColor(0, 150, 0); // Green
        doc.text(`Answer: ${q.answer}`, 30, y);
        doc.setTextColor(0, 0, 0); // Reset
        y += 15;

        if (y > 270) { doc.addPage(); y = 20; }
      });
    } else if (type === 'fill_in_gap') {
      generatedData.forEach((q: any, i: number) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${q.sentence}`, 170);
        doc.text(lines, 20, y);
        y += (lines.length * 7);

        doc.setTextColor(0, 150, 0);
        doc.text(`Answer: ${q.answer}`, 30, y);
        doc.setTextColor(0, 0, 0);
        y += 15;

        if (y > 270) { doc.addPage(); y = 20; }
      });
    } else if (type === 'theory') {
      generatedData.forEach((q: any, i: number) => {
        const qLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, 170);
        doc.text(qLines, 20, y);
        y += (qLines.length * 7);

        doc.text("Model Answer:", 30, y);
        y += 7;
        const aLines = doc.splitTextToSize(q.model_answer, 160);
        doc.setTextColor(80, 80, 80);
        doc.text(aLines, 30, y);
        doc.setTextColor(0, 0, 0);
        y += (aLines.length * 7) + 10;

        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    doc.save(`studyforge_${type}_${Date.now()}.pdf`);
  };

  const renderQuiz = () => {
    if (!generatedData || currentQuestionIndex >= generatedData.length) return null;
    const q = generatedData[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / generatedData.length) * 100;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full animate-in fade-in zoom-in duration-500">
        <div className="w-full mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {generatedData.length}</span>
            <span className="text-xs font-bold text-[#ea580c]">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-[#1a1a24] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#ea580c] to-amber-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a24] rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-8 md:p-12 shadow-2xl w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#ea580c]"></div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-10 leading-tight">
            {q.question || q.sentence}
          </h2>

          <div className="grid grid-cols-1 gap-4 mb-10">
            {q.options ? q.options.map((opt: string, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedOption === opt;
              const isCorrect = opt === q.answer;

              let bgClass = "bg-[#f5f5f8] dark:bg-[#13131a] border-slate-200 dark:border-[#2d2d3f] hover:border-[#ea580c]/50";
              if (showExplanation) {
                if (isCorrect) bgClass = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                else if (isSelected) bgClass = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
              } else if (isSelected) {
                bgClass = "bg-[#ea580c]/10 border-[#ea580c] ring-2 ring-[#ea580c]/20";
              }

              return (
                <button
                  key={i}
                  disabled={showExplanation}
                  onClick={() => handleOptionSelect(opt)}
                  className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group ${bgClass}`}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${isSelected ? 'bg-[#ea580c] text-white' : 'bg-white dark:bg-[#1b1b27] text-slate-400 group-hover:text-[#ea580c]'}`}>
                    {letter}
                  </div>
                  <span className="text-lg font-bold flex-1">{opt}</span>
                  {showExplanation && isCorrect && <span className="material-symbols-outlined text-green-500">check_circle</span>}
                  {showExplanation && isSelected && !isCorrect && <span className="material-symbols-outlined text-red-500">cancel</span>}
                </button>
              );
            }) : (
              <div className="space-y-4">
                <input
                  type="text"
                  disabled={showExplanation}
                  value={selectedOption || ''}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-6 rounded-2xl bg-[#f5f5f8] dark:bg-[#13131a] border-2 border-slate-200 dark:border-[#2d2d3f] focus:border-[#ea580c] outline-none text-xl font-bold"
                />
              </div>
            )}
          </div>

          {showExplanation && (
            <div className="mb-10 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-2 text-blue-500">
                <span className="material-symbols-outlined">info</span>
                <span className="text-xs font-black uppercase tracking-widest">Explanation</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                {q.explanation || "No explanation provided for this question."}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {showExplanation ? (
              <button
                onClick={handleNextQuestion}
                className="flex-1 h-16 bg-[#ea580c] text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
              >
                <span>{currentQuestionIndex + 1 === generatedData.length ? 'SEE RESULTS' : 'NEXT QUESTION'}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsQuizActive(false)}
                  className="px-8 h-16 bg-slate-100 dark:bg-[#252535] text-slate-500 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-all"
                >
                  QUIT
                </button>
                <button
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className="flex-1 h-16 bg-[#5b5bfa] disabled:opacity-50 text-white font-black rounded-2xl hover:bg-[#4a4ae0] transition-all shadow-xl shadow-blue-500/20"
                >
                  CHECK ANSWER
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / generatedData.length) * 100);
    const xpEarned = score * 5;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex size-24 bg-orange-500/20 rounded-full items-center justify-center mb-6 border-4 border-orange-500/30">
            <span className="material-symbols-outlined text-5xl text-[#ea580c] animate-bounce">emoji_events</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Quiz Completed!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Excellent work. You&apos;ve mastered these concepts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
          <div className="bg-white dark:bg-[#1a1a24] p-8 rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Score</p>
            <p className="text-4xl font-black text-[#5b5bfa]">{percentage}%</p>
            <p className="text-xs font-bold text-slate-500 mt-1">{score}/{generatedData.length} Correct</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a24] p-8 rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] text-center border-orange-500/30 ring-4 ring-orange-500/5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">XP Earned</p>
            <p className="text-4xl font-black text-[#ea580c]">+{xpEarned}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="material-symbols-outlined text-sm text-yellow-500 fill-current">star</span>
              <span className="text-xs font-bold text-slate-500">Generation Bonus included</span>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a24] p-8 rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Time spent</p>
            <p className="text-4xl font-black text-white">
              {quizStartTime ? Math.floor((Date.now() - quizStartTime) / 60000) : 0}:{quizStartTime ? String(Math.floor(((Date.now() - quizStartTime) % 60000) / 1000)).padStart(2, '0') : '00'}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">Focus Session</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          {savedQuizId ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/shared/quiz/${savedQuizId}`);
                alert('Link copied to clipboard!');
              }}
              className="w-full h-16 bg-[#ea580c]/10 text-[#ea580c] font-black rounded-2xl hover:bg-[#ea580c]/20 transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3 border-2 border-[#ea580c]/30"
            >
              <span className="material-symbols-outlined">link</span>
              COPY SHARE LINK
            </button>
          ) : (
            <button
              onClick={saveQuiz}
              disabled={isSaving}
              className="w-full h-16 bg-[#ea580c] text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">save</span>
              {isSaving ? 'SAVING...' : 'SAVE & SHARE QUIZ'}
            </button>
          )}

          <button
            onClick={() => { setGeneratedData(null); setIsQuizActive(false); setUserAnswers([]); setSavedQuizId(null); }}
            className="w-full h-16 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            DONE & RETURN TO LIBRARY
          </button>
          <div className="flex gap-4">
            <button
              onClick={startQuiz}
              className="flex-1 h-14 bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-all"
            >
              RETAKE QUIZ
            </button>
            <button
              onClick={downloadPDF}
              className="flex-1 h-14 bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-all"
            >
              DOWNLOAD PDF
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {isQuizActive ? (
          renderQuiz()
        ) : userAnswers.length > 0 && userAnswers.length === generatedData?.length && !isQuizActive ? (
          renderResults()
        ) : (
          <main className="flex-1 overflow-y-auto w-full max-w-[1440px] mx-auto">
            <div className="px-6 pt-10 pb-6 md:px-8">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                AI Question Generator
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                Upload your study material and let AI create the perfect quiz for you.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 flex flex-col xl:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1 max-w-3xl space-y-6">
                {/* Upload Card */}
                <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                  <div className="border border-dashed border-slate-300 dark:border-[#3b3b54] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="bg-[#ea580c]/20 p-4 rounded-full mb-4">
                      <span className="material-symbols-outlined text-3xl text-[#5b5bfa]">cloud_upload</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Study Material</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Drag and drop PDF, images, or paste text here</p>
                    <div className="flex flex-col items-center gap-4 w-full max-w-md">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="application/pdf,image/*,.doc,.docx,.pptx,.txt"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-70 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all w-48"
                      >
                        {isUploading ? 'Uploading...' : 'Browse Files'}
                      </button>
                      <select
                        value={selectedResource}
                        onChange={(e) => {
                          setSelectedResource(e.target.value);
                          if (e.target.value) setPastedText('');
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-[#2d2d3f] bg-[#f5f5f8] dark:bg-[#13131a] p-2.5 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none text-slate-900 dark:text-white mt-4"
                      >
                        <option value="">-- Or select an existing library resource --</option>
                        {resources.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                      <textarea
                        value={pastedText}
                        onChange={(e) => {
                          setPastedText(e.target.value);
                          if (e.target.value) setSelectedResource('');
                        }}
                        className="w-full h-20 rounded-lg border border-slate-200 dark:border-[#2d2d3f] bg-[#f5f5f8] dark:bg-[#13131a] p-3 text-sm focus:ring-2 focus:ring-[#ea580c] focus:outline-none text-slate-900 dark:text-white"
                        placeholder="Or paste an excerpt here directly..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Configuration Card */}
                <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">
                    Configuration
                  </h2>

                  {error && (
                    <div className="mb-6 p-3 rounded bg-red-900/10 border border-red-900/30 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-8">
                    {/* QUESTION TYPE */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                        Question Type
                      </label>
                      <div className="flex flex-wrap md:flex-nowrap gap-3">
                        <button
                          onClick={() => setType('mcq')}
                          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'mcq' ? 'bg-[#ea580c] text-white' : 'bg-slate-100 dark:bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
                        >
                          {type === 'mcq' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                          Multiple Choice
                        </button>
                        <button
                          onClick={() => setType('fill_in_gap')}
                          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'fill_in_gap' ? 'bg-[#ea580c] text-white' : 'bg-slate-100 dark:bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
                        >
                          {type === 'fill_in_gap' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                          {!type.includes('fill') && <span className="material-symbols-outlined text-[18px] mr-1">edit</span>}
                          Fill-in-the-gap
                        </button>
                        <button
                          onClick={() => setType('theory')}
                          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'theory' ? 'bg-[#ea580c] text-white' : 'bg-slate-100 dark:bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
                        >
                          {type === 'theory' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                          {type !== 'theory' && <span className="material-symbols-outlined text-[18px] mr-1">menu_book</span>}
                          Theory
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                      {/* DIFFICULTY */}
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                          Difficulty
                        </label>
                        <div className="flex bg-slate-100 dark:bg-[#252535] rounded-xl p-1 gap-1">
                          <button
                            onClick={() => setDifficulty('easy')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'easy' ? 'bg-[#ea580c] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                          >
                            Easy
                          </button>
                          <button
                            onClick={() => setDifficulty('medium')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'medium' ? 'bg-[#ea580c] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                          >
                            Medium
                          </button>
                          <button
                            onClick={() => setDifficulty('hard')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'hard' ? 'bg-[#ea580c] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                          >
                            Hard
                          </button>
                        </div>
                      </div>

                      {/* COUNT */}
                      <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                          Count
                        </label>
                        <div className="flex items-center gap-4 py-2 h-full">
                          <input type="range" min="1" max="50" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="flex-1 accent-[#ea580c]" />
                          <span className="bg-slate-100 dark:bg-[#252535] px-3 py-1 rounded-lg text-sm font-bold text-slate-900 dark:text-white w-12 text-center shadow-sm">
                            {count}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button disabled={isGenerating} onClick={handleGenerate} className="w-full mt-2 bg-[#5b5bfa] hover:bg-[#5b5bfa]/90 border-[1.5px] border-[#7b7bff] disabled:opacity-70 text-slate-900 dark:text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(91,91,250,0.3)] transition-all flex items-center justify-center gap-2">
                      {isGenerating ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined">auto_awesome</span>}
                      {isGenerating ? 'Generating...' : 'Generate Questions'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full xl:w-[480px] flex flex-col gap-6 shrink-0">
                {generatedData && (
                  <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-[#ea580c]"></div>
                    <div className="p-6 pt-7">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedResource ? resources.find(r => r.id === selectedResource)?.title || 'Generated Quiz' : 'Generated Quiz'}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generated just now • {generatedData.length} Questions</p>
                        </div>
                        <span className="bg-[#1a3826] border border-green-500/20 text-[#4ade80] text-xs font-bold px-3 py-1 rounded">Ready</span>
                      </div>

                      <div className="mt-6 space-y-4">
                        {generatedData.slice(0, 2).map((q: any, i: number) => (
                          <div key={i} className="flex gap-4 p-4 rounded-xl bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f]">
                            <div className="text-xs font-black text-[#5b5bfa] bg-[#5b5bfa]/10 h-min px-2 py-1 rounded">Q{i + 1}</div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                              {q.question || q.sentence}
                            </p>
                          </div>
                        ))}
                        {generatedData.length > 2 && (
                          <div className="text-center text-xs font-bold text-slate-500 pt-2">+ {generatedData.length - 2} more questions</div>
                        )}
                      </div>

                      <button
                        onClick={startQuiz}
                        className="w-full mt-6 bg-[#5b5bfa] hover:bg-[#5b5bfa]/90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Take Quiz <span className="material-symbols-outlined text-[18px]">sports_esports</span>
                      </button>
                      <button
                        onClick={downloadPDF}
                        className="w-full mt-3 bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Download PDF <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Generations List */}
                <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm flex-1">
                  <div className="p-6 border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Recent Generations</h3>
                    <Link href="/history" className="text-xs font-bold text-[#5b5bfa] hover:underline">View All</Link>
                  </div>
                  <div className="space-y-4">
                    {/* Empty state for demo */}
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                      No recent generations found. Start by uploading a document!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
