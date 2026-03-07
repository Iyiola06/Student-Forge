'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUpload } from '@/components/providers/UploadProgressProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Resource {
  id: string;
  title: string;
  content: string;
  processing_status: string;
}

export default function SimplifierPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [pastedText, setPastedText] = useState('');

  const [level, setLevel] = useState('beginner'); // child, beginner, general, expert
  const [format, setFormat] = useState('paragraphs'); // paragraphs, bullets, analogy
  const [focus, setFocus] = useState('');

  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedOutput, setSimplifiedOutput] = useState<string | null>(null);
  const [youtubeTopics, setYoutubeTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile, uploadState } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchResources() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('resources')
        .select('id, title, content, processing_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setResources(data);
    }
    fetchResources();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setIsUploading(true);
    setPastedText('');
    setSelectedResource('');

    const supabase = createClient();
    const ch = supabase
      .channel('simplifier-upload-' + Date.now())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resources' }, async (payload) => {
        if (payload.new.processing_status === 'ready') {
          setSelectedResource(payload.new.id);
          setIsUploading(false);
          supabase.removeChannel(ch);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('resources')
              .select('id, title, content, processing_status')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (data) setResources(data);
          }
        } else if (payload.new.processing_status === 'error') {
          setIsUploading(false);
          supabase.removeChannel(ch);
        }
      })
      .subscribe();

    await uploadFile(file);
  };

  const handleSimplify = async () => {
    let contentToUse = pastedText;

    if (selectedResource) {
      const resource = resources.find(r => r.id === selectedResource);
      if (resource) {
        if (resource.processing_status !== 'ready') {
          setError('Document is still processing. Please wait.');
          return;
        }
        if (resource.content) {
          contentToUse = resource.content;
        }
      }
    }

    if (!contentToUse.trim()) {
      setError('Please select a resource or paste some text to simplify.');
      return;
    }

    setIsSimplifying(true);
    setError(null);
    setSimplifiedOutput(null);
    setYoutubeTopics([]);

    try {
      const res = await fetch('/api/ai/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToUse,
          level,
          format,
          focus
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to simplify document');
      }

      setSimplifiedOutput(data.result);
      if (Array.isArray(data.youtube_topics)) {
        setYoutubeTopics(data.youtube_topics);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimplifying(false);
    }
  };

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#0b0b10] flex flex-col md:flex-row antialiased min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
        <TopNavigation />

        {simplifiedOutput ? (
          <div className="p-6 md:p-8 max-w-4xl mx-auto w-full flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => setSimplifiedOutput(null)}
              className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-[#1a5c2a] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Simplifier
            </button>
            <div className="bg-white dark:bg-[#161621] rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 dark:border-[#2d2d3f]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#1a5c2a]/10 text-[#1a5c2a] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl font-black">auto_stories</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Simplified Document</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Level: {level} • Format: {format}</p>
                </div>
              </div>
              <div className="prose dark:prose-invert prose-emerald max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{simplifiedOutput}</ReactMarkdown>
              </div>

              {/* YouTube Recommendations Overlay */}
              {youtubeTopics.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-[#2d2d3f]">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">smart_display</span>
                    Watch Concept on YouTube
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {youtubeTopics.map((topic, i) => (
                      <a
                        key={i}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <svg className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                        {topic}
                        <span className="material-symbols-outlined text-[16px] opacity-50 ml-1">open_in_new</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <main className="flex-1 md:overflow-y-auto px-6 pt-10 pb-6 md:px-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              Document Simplifier
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 max-w-3xl">
              Turn complex study materials into easy-to-understand summaries. Choose exactly how you want it explained.
            </p>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* Left Column: Input Source */}
              <div className="flex-1 max-w-2xl space-y-6">
                {/* Upload Area */}
                <div className="bg-white dark:bg-[#161621] rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                  <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors ${isUploading ? 'border-[#1a5c2a] bg-[#1a5c2a]/5' : 'border-slate-300 dark:border-[#3b3b54] hover:border-[#1a5c2a]/50'
                    }`}>
                    {isUploading ? (
                      <div className="size-12 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin mb-4" />
                    ) : (
                      <div className="w-16 h-16 bg-[#1a5c2a]/10 text-[#1a5c2a] rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl font-black">upload_file</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {isUploading ? 'Processing Document...' : 'Upload Study Material'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">PDF, Word, PPT, or Image inputs</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.txt" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-8 py-3 bg-[#1a5c2a] text-white font-bold rounded-xl hover:bg-[#144823] transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-[#1a5c2a]/20">
                      BROWSE FILES
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 dark:bg-[#2d2d3f] flex-1"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="h-px bg-slate-200 dark:bg-[#2d2d3f] flex-1"></div>
                </div>

                <div className="bg-white dark:bg-[#161621] rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                  <div className="mb-4">
                    <label className="text-sm font-bold text-slate-900 dark:text-white mb-1 block">Paste Text</label>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Directly paste an article, chapter, or notes.</p>
                  </div>
                  <textarea
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      setSelectedResource('');
                    }}
                    placeholder="Paste your content here..."
                    className="w-full h-40 p-4 rounded-xl bg-[#f5f5f8] dark:bg-[#0b0b10] border-2 border-slate-200 dark:border-[#2d2d3f] text-slate-900 dark:text-white outline-none focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/10 resize-none font-medium text-sm transition-all"
                  />
                </div>

                {resources.length > 0 && (
                  <div className="bg-white dark:bg-[#161621] rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Or select a recent resource</h3>
                    <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {resources.map(res => (
                        <button
                          key={res.id}
                          onClick={() => {
                            setSelectedResource(res.id);
                            setPastedText('');
                          }}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group ${selectedResource === res.id
                            ? 'border-[#1a5c2a] bg-[#1a5c2a]/5 ring-2 ring-[#1a5c2a]/20'
                            : 'border-slate-100 dark:border-[#2d2d3f] hover:border-[#1a5c2a]/30'
                            }`}
                        >
                          <span className={`material-symbols-outlined ${selectedResource === res.id ? 'text-[#1a5c2a]' : 'text-slate-400 group-hover:text-[#1a5c2a]'}`}>
                            {res.processing_status === 'ready' ? 'check_circle' : 'hourglass_bottom'}
                          </span>
                          <span className={`font-bold truncate text-sm flex-1 ${selectedResource === res.id ? 'text-[#1a5c2a]' : 'text-slate-700 dark:text-slate-300'}`}>
                            {res.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: AI Config */}
              <div className="xl:w-96 flex-shrink-0">
                <div className="bg-white dark:bg-[#161621] rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm sticky top-6">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a5c2a]">tune</span>
                    Simplifier Settings
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Target Audience Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { val: 'child', label: 'Child (5 yo)', icon: 'child_care' },
                          { val: 'beginner', label: 'Beginner', icon: 'school' },
                          { val: 'general', label: 'General', icon: 'public' },
                          { val: 'expert', label: 'Expert', icon: 'psychology' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setLevel(opt.val)}
                            className={`flex items-center gap-2 p-3 border-2 rounded-xl text-sm font-bold transition-all ${level === opt.val ? 'border-[#1a5c2a] bg-[#1a5c2a] text-white' : 'border-slate-200 dark:border-[#2d2d3f] text-slate-600 dark:text-slate-400 hover:border-[#1a5c2a]/50'}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Output Format</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { val: 'paragraphs', label: 'Structured Paragraphs' },
                          { val: 'bullets', label: 'Bullet Points Only' },
                          { val: 'analogy', label: 'Real-world Analogies' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setFormat(opt.val)}
                            className={`flex items-center justify-between p-3 border-2 rounded-xl text-sm font-bold transition-all ${format === opt.val ? 'border-[#1a5c2a] bg-[#1a5c2a]/5 text-[#1a5c2a]' : 'border-slate-200 dark:border-[#2d2d3f] text-slate-600 dark:text-slate-400 hover:border-[#1a5c2a]/50'}`}
                          >
                            <span>{opt.label}</span>
                            {format === opt.val && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Specific Focus <span className="text-slate-400 font-medium normal-case">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Just the mathematical formulas"
                        value={focus}
                        onChange={(e) => setFocus(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#f5f5f8] dark:bg-[#0b0b10] border-2 border-slate-200 dark:border-[#2d2d3f] text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#1a5c2a] transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#2d2d3f]">
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleSimplify}
                      disabled={isSimplifying || isUploading || (!selectedResource && !pastedText.trim())}
                      className="w-full h-14 bg-[#1a5c2a] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black rounded-xl hover:bg-[#144823] transition-all shadow-xl shadow-[#1a5c2a]/20 flex items-center justify-center gap-2"
                    >
                      {isSimplifying ? (
                        <>
                          <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>SIMPLIFYING...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">auto_awesome</span>
                          <span>SIMPLIFY NOW</span>
                        </>
                      )}
                    </button>
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
