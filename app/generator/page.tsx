'use client';

import Link from 'next/link';
import TopNavigation from '@/components/layout/TopNavigation';
import { useState, useEffect } from 'react';
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

      // Award XP logic here via another API route or Supabase RPC
      awardGenerationXP();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const awardGenerationXP = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', user.id)
      .single();

    if (profile) {
      const newXp = profile.xp + 20;
      // Simple level calculation: Level = floor(sqrt(newXp / 100)) + 1
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

      await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel > profile.level ? newLevel : profile.level })
        .eq('id', user.id);

      if (newLevel > profile.level) {
        // Basic alert for now, could integrate canvas-confetti here later
        alert(`Level Up! You are now level ${newLevel}!`);
      }
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
  return (
    <div className="bg-[#13131a] font-display min-h-screen flex flex-col antialiased selection:bg-[#3b3bfa]/30 selection:text-[#3b3bfa]">
      <TopNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
        <div className="px-6 pt-10 pb-6 md:px-8">
          <h1 className="text-3xl font-black text-white">
            AI Question Generator
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Upload your study material and let AI create the perfect quiz for you.
          </p>
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 flex flex-col xl:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 max-w-3xl space-y-6">
            {/* Upload Card */}
            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] p-6 shadow-sm">
              <div className="border border-dashed border-[#3b3b54] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="bg-[#3b3bfa]/20 p-4 rounded-full mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#5b5bfa]">cloud_upload</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload Study Material</h3>
                <p className="text-sm text-slate-400 mb-6">Drag and drop PDF, images, or paste text here</p>
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <button className="bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all w-40">
                    Browse Files
                  </button>
                  <select
                    value={selectedResource}
                    onChange={(e) => {
                      setSelectedResource(e.target.value);
                      if (e.target.value) setPastedText('');
                    }}
                    className="w-full rounded-lg border border-[#2d2d3f] bg-[#13131a] p-2.5 text-sm focus:ring-2 focus:ring-[#3b3bfa] focus:outline-none text-white mt-4"
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
                    className="w-full h-20 rounded-lg border border-[#2d2d3f] bg-[#13131a] p-3 text-sm focus:ring-2 focus:ring-[#3b3bfa] focus:outline-none text-white"
                    placeholder="Or paste an excerpt here directly..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Configuration Card */}
            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] p-8 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-8">
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
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-3">
                    Question Type
                  </label>
                  <div className="flex flex-wrap md:flex-nowrap gap-3">
                    <button
                      onClick={() => setType('mcq')}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'mcq' ? 'bg-[#3b3bfa] text-white' : 'bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
                    >
                      {type === 'mcq' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      Multiple Choice
                    </button>
                    <button
                      onClick={() => setType('fill_in_gap')}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'fill_in_gap' ? 'bg-[#3b3bfa] text-white' : 'bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
                    >
                      {type === 'fill_in_gap' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      {!type.includes('fill') && <span className="material-symbols-outlined text-[18px] mr-1">edit</span>}
                      Fill-in-the-gap
                    </button>
                    <button
                      onClick={() => setType('theory')}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${type === 'theory' ? 'bg-[#3b3bfa] text-white' : 'bg-[#252535] text-[#9c9cba] hover:bg-[#2d2d3f]'}`}
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
                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Difficulty
                    </label>
                    <div className="flex bg-[#252535] rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setDifficulty('easy')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'easy' ? 'bg-[#3b3bfa] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                      >
                        Easy
                      </button>
                      <button
                        onClick={() => setDifficulty('medium')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'medium' ? 'bg-[#3b3bfa] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => setDifficulty('hard')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${difficulty === 'hard' ? 'bg-[#3b3bfa] text-white' : 'text-[#9c9cba] hover:text-white'}`}
                      >
                        Hard
                      </button>
                    </div>
                  </div>

                  {/* COUNT */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Count
                    </label>
                    <div className="flex items-center gap-4 py-2 h-full">
                      <input type="range" min="1" max="50" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="flex-1 accent-[#3b3bfa]" />
                      <span className="bg-[#252535] px-3 py-1 rounded-lg text-sm font-bold text-white w-12 text-center shadow-sm">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>

                <button disabled={isGenerating} onClick={handleGenerate} className="w-full mt-2 bg-[#5b5bfa] hover:bg-[#5b5bfa]/90 border-[1.5px] border-[#7b7bff] disabled:opacity-70 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(91,91,250,0.3)] transition-all flex items-center justify-center gap-2">
                  {isGenerating ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined">auto_awesome</span>}
                  {isGenerating ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full xl:w-[480px] flex flex-col gap-6 shrink-0">
            {generatedData && (
              <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm overflow-hidden relative">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-[#3b3bfa]"></div>
                <div className="p-6 pt-7">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Biology: Cell Structure</h3>
                      <p className="text-xs text-slate-400 mt-1">Generated just now • {generatedData.length} Questions</p>
                    </div>
                    <span className="bg-[#1a3826] border border-green-500/20 text-[#4ade80] text-xs font-bold px-3 py-1 rounded">Ready</span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {generatedData.slice(0, 2).map((q: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl bg-[#13131a] border border-[#2d2d3f]">
                        <div className="text-xs font-black text-[#5b5bfa] bg-[#5b5bfa]/10 h-min px-2 py-1 rounded">Q{i + 1}</div>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed">
                          {q.question || q.sentence}
                        </p>
                      </div>
                    ))}
                    {generatedData.length > 2 && (
                      <div className="text-center text-xs font-bold text-slate-500 pt-2">+ {generatedData.length - 2} more questions</div>
                    )}
                  </div>

                  <button
                    onClick={downloadPDF}
                    className="w-full mt-6 bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Take Quiz <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recent Generations List */}
            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex-1">
              <div className="p-6 border-b border-[#2d2d3f] flex items-center justify-between">
                <h3 className="font-bold text-white text-[15px]">Recent Generations</h3>
                <Link href="/history" className="text-xs font-bold text-[#5b5bfa] hover:underline">View All</Link>
              </div>
              <div className="p-2 py-3 space-y-1">
                {[
                  { title: 'European History 1900s', type: 'MCQ', info: '20 Qs • Hard', time: '2h ago', icon: 'history_edu', color: 'text-[#3b3bfa] bg-[#3b3bfa]/20' },
                  { title: 'Calculus: Derivatives', type: 'THEORY', info: '5 Qs • Medium', time: 'Yesterday', icon: 'functions', color: 'text-purple-400 bg-purple-500/20' },
                  { title: 'Spanish Vocabulary', type: 'GAP FILL', info: '50 Qs • Easy', time: '2 days ago', icon: 'translate', color: 'text-orange-400 bg-orange-500/20' },
                  { title: 'Psychology 101', type: 'MCQ', info: '10 Qs • Medium', time: '5 days ago', icon: 'psychology', color: 'text-blue-400 bg-blue-500/20' },
                ].map((gen, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-[#252535] rounded-xl cursor-pointer transition-colors group">
                    <div className={`p-2.5 rounded-xl ${gen.color} shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">{gen.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-[#5b5bfa] transition-colors">{gen.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#a0a0c0] bg-[#2d2d3f] px-1.5 py-0.5 rounded">{gen.type}</span>
                        <span className="text-xs text-slate-400">{gen.info}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#6a6a8c] font-medium whitespace-nowrap">{gen.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
