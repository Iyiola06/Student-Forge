'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'react-toastify';

interface PastQuestion {
  id: string;
  user_id: string;
  school_name: string;
  institution_type: string;
  subject: string;
  course_code: string | null;
  year: number;
  semester: string | null;
  description: string | null;
  file_url: string;
  file_size: string;
  file_type: string;
  upvotes: number;
  downloads: number;
  is_approved: boolean;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

const INSTITUTION_TYPES = ['Secondary School', 'University', 'Polytechnic', 'College of Education'];

function PastQuestionsContent() {
  const { profile, mutate: mutateProfile } = useProfile();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Initialize supabase only on client
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    return createClient();
  }, []);

  useEffect(() => { setIsClient(true); }, []);

  const [activeTab, setActiveTab] = useState<'all' | 'my_submissions'>('all');
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ total: 0, schools: 0, subjects: 0 });

  // Filters
  const [filterInstitution, setFilterInstitution] = useState('All');
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [sortBy, setSortBy] = useState('Most Recent');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Form State
  const [formInstitutionType, setFormInstitutionType] = useState('University');
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCourseCode, setFormCourseCode] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formSemester, setFormSemester] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);

  // Dropdown options
  const schoolsList = useMemo(() => Array.from(new Set(questions.map(q => q.school_name))).sort(), [questions]);
  const subjectsList = useMemo(() => Array.from(new Set(questions.map(q => q.subject))).sort(), [questions]);
  const yearsList = useMemo(() => Array.from(new Set(questions.map(q => q.year))).sort((a, b) => b - a), [questions]);

  const fetchQuestions = async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data: qData } = await supabase
      .from('past_questions')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (qData) {
      setQuestions(qData as PastQuestion[]);
      setStats({
        total: qData.length,
        schools: new Set(qData.map((q: PastQuestion) => q.school_name)).size,
        subjects: new Set(qData.map((q: PastQuestion) => q.subject)).size
      });
    }

    if (profile?.id) {
      const { data: upvoteData } = await supabase
        .from('past_question_upvotes')
        .select('past_question_id')
        .eq('user_id', profile.id);

      if (upvoteData) {
        setUserUpvotes(new Set(upvoteData.map((u: { past_question_id: string }) => u.past_question_id)));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [profile?.id]);

  useEffect(() => {
    if (searchParams.get('tab') === 'my_submissions') {
      setActiveTab('my_submissions');
    }
  }, [searchParams]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds 20MB limit.");
        return;
      }
      setFormFile(file);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error('Must be logged in to submit');
    if (!formFile || !formSchoolName || !formSubject || !formYear) return toast.error('Please fill required fields.');

    setIsSubmitting(true);
    try {
      const fileExt = formFile.name.split('.').pop() || 'pdf';
      const fileId = crypto.randomUUID();
      const filePath = `${profile.id}/${fileId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('past-questions')
        .upload(filePath, formFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('past-questions')
        .getPublicUrl(filePath);

      const fileSizeMb = (formFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      const fileType = formFile.type.includes('pdf') ? 'PDF' : 'Image';

      const { error: insertError } = await supabase.from('past_questions').insert({
        user_id: profile.id,
        school_name: formSchoolName,
        institution_type: formInstitutionType,
        subject: formSubject,
        course_code: formCourseCode || null,
        year: formYear,
        semester: formSemester || null,
        description: formDescription,
        file_url: publicUrl,
        file_size: fileSizeMb,
        file_type: fileType,
        is_anonymous: formIsAnonymous
      });

      if (insertError) throw insertError;

      // Gamification Hook
      const newXp = (profile.xp || 0) + 25;
      await supabase.from('profiles').update({ xp: newXp }).eq('id', profile.id);
      await supabase.from('study_history').insert({
        user_id: profile.id,
        action_type: 'past_question_upload',
        entity_type: 'past_question',
        details: { xp_earned: 25 }
      });
      mutateProfile();

      toast.success("Past question submitted! You earned 25 XP! 💎");

      setIsModalOpen(false);
      setFormFile(null);
      setFormSchoolName('');
      setFormSubject('');
      setFormCourseCode('');
      setFormDescription('');
      setFormIsAnonymous(false);
      fetchQuestions();

    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!profile) return;
    const isUpvoted = userUpvotes.has(questionId);

    if (isUpvoted) {
      await supabase.from('past_question_upvotes').delete().eq('past_question_id', questionId).eq('user_id', profile.id);
      setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, upvotes: Math.max(0, q.upvotes - 1) } : q));
      setUserUpvotes(prev => { const n = new Set(prev); n.delete(questionId); return n; });
    } else {
      await supabase.from('past_question_upvotes').insert({ past_question_id: questionId, user_id: profile.id });
      setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q));
      setUserUpvotes(prev => { const n = new Set(prev); n.add(questionId); return n; });
    }
  };

  const handleDownload = async (questionId: string, url: string) => {
    try {
      await supabase.rpc('increment_downloads', { pq_id: questionId });
    } catch { }
    setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, downloads: q.downloads + 1 } : q));
    window.open(url, '_blank');
  };

  const handleDelete = async (questionId: string) => {
    if (typeof window === 'undefined') return;
    if (!confirm('Are you sure you want to delete this submission?')) return;
    await supabase.from('past_questions').delete().eq('id', questionId);
    setQuestions(qs => qs.filter(q => q.id !== questionId));
    toast.success("Submission deleted.");
  };

  // Filter & Group logic
  let filtered = questions.filter(q => {
    if (activeTab === 'my_submissions' && q.user_id !== profile?.id) return false;
    if (filterInstitution !== 'All' && q.institution_type !== filterInstitution) return false;
    if (filterSchool !== 'All' && q.school_name !== filterSchool) return false;
    if (filterSubject !== 'All' && q.subject !== filterSubject) return false;
    if (filterYear !== 'All' && q.year.toString() !== filterYear) return false;
    return true;
  });

  if (sortBy === 'Most Recent') filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'Most Downloaded') filtered.sort((a, b) => b.downloads - a.downloads);
  if (sortBy === 'Most Upvoted') filtered.sort((a, b) => b.upvotes - a.upvotes);

  const isFiltering = filterInstitution !== 'All' || filterSchool !== 'All' || filterSubject !== 'All' || filterYear !== 'All' || sortBy !== 'Most Recent';

  let grouped: Record<string, Record<string, PastQuestion[]>> = {};
  if (!isFiltering && activeTab === 'all') {
    filtered.forEach(q => {
      if (!grouped[q.school_name]) grouped[q.school_name] = {};
      if (!grouped[q.school_name][q.subject]) grouped[q.school_name][q.subject] = [];
      grouped[q.school_name][q.subject].push(q);
    });
  }

  const renderCard = (q: PastQuestion) => (
    <div key={q.id} className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] p-5 hover:shadow-lg transition-all group flex flex-col relative h-full">
      {q.user_id === profile?.id && (
        <button onClick={() => handleDelete(q.id)} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors z-10 p-1">
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      )}

      <div className="flex items-center gap-3 mb-4 pr-6">
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
          {q.is_anonymous ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous&backgroundColor=cbd5e1" alt="Anonymous" className="w-full h-full object-cover opacity-80" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            q.profiles?.avatar_url && <img src={q.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {q.is_anonymous ? 'Anonymous Student' : (q.profiles?.full_name || 'Student')}
            </p>
            {q.user_id === profile?.id && q.is_anonymous && (
              <span className="material-symbols-outlined text-[10px] text-[#ea580c] shrink-0" title="This is your anonymous post">visibility_off</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 truncate">{new Date(q.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="inline-block px-2 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-1">
          {q.institution_type}
        </span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
          {q.school_name}
        </h3>
      </div>

      <div className="bg-slate-50 dark:bg-[#13131a] p-3 rounded-lg mb-4 flex-1 border border-slate-100 dark:border-[#252535]">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h4 className="font-bold text-[#ea580c] dark:text-[#ea580c] text-sm line-clamp-1 flex-1">{q.subject} {q.course_code && <span className="opacity-70 font-normal">({q.course_code})</span>}</h4>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-[#252535] px-1.5 py-0.5 rounded shrink-0">{q.year}</span>
        </div>
        {q.semester && <p className="text-xs text-slate-500 mb-2">{q.semester}</p>}
        {q.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">"{q.description}"</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => handleUpvote(q.id)} className={`flex items-center gap-1 text-xs font-bold transition-colors ${userUpvotes.has(q.id) ? 'text-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <span className={`material-symbols-outlined text-[16px] ${userUpvotes.has(q.id) && 'fill-current'}`}>thumb_up</span>
            {q.upvotes}
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium font-mono">
            <span className="material-symbols-outlined text-[16px]">download</span>
            {q.downloads}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{q.file_type} • {q.file_size}</span>
          <button onClick={() => handleDownload(q.id, q.file_url)} className="bg-[#ea580c] text-white hover:bg-[#d04e0a] p-1.5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">file_download</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full max-w-[100vw]">

        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Header Area */}
          <div className="bg-white dark:bg-[#1a1a24] border-b border-slate-200 dark:border-[#2d2d3f] px-6 py-10 shrink-0">
            <div className="max-w-[1440px] mx-auto w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    Community Past Questions Bank
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Study smarter with past questions shared by students like you.
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-slate-900 dark:text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Submit Past Question
                </button>
              </div>

              {/* Stats Pills */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4 min-w-[160px]">
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Submissions</p>
                  </div>
                </div>
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4 min-w-[160px]">
                  <div className="bg-orange-500/10 text-orange-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.schools}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Schools</p>
                  </div>
                </div>
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4 min-w-[160px]">
                  <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.subjects}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Subjects</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-[#2d2d3f]">
                <button onClick={() => setActiveTab('all')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'all' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-300'}`}>
                  All Questions
                </button>
                <button onClick={() => setActiveTab('my_submissions')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'my_submissions' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-300'}`}>
                  My Submissions
                  {profile && <span className="bg-[#2d2d3f] border border-slate-600 text-white text-[10px] px-2 py-0.5 rounded-full">{questions.filter(q => q.user_id === profile.id).length}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 max-w-[1440px] mx-auto w-full flex-1 flex flex-col">

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 bg-white dark:bg-[#1a1a24] p-2 rounded-xl border border-slate-200 dark:border-[#2d2d3f] sticky top-0 z-10 shadow-sm">
              <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)} className="h-9 px-3 rounded-lg bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none min-w-[140px]">
                <option value="All">All Institutions</option>
                {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="h-9 px-3 rounded-lg bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none min-w-[160px] max-w-[250px] truncate">
                <option value="All">All Schools</option>
                {schoolsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="h-9 px-3 rounded-lg bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none min-w-[140px] max-w-[200px] truncate">
                <option value="All">All Subjects</option>
                {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="h-9 px-3 rounded-lg bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none min-w-[100px]">
                <option value="All">All Years</option>
                {yearsList.map(y => <option key={y} value={y.toString()}>{y}</option>)}
              </select>
              <div className="w-[1px] bg-[#2d2d3f] mx-1"></div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-9 px-3 rounded-lg bg-transparent border-none text-sm font-bold text-[#ea580c] outline-none ml-auto cursor-pointer">
                <option value="Most Recent">Most Recent</option>
                <option value="Most Downloaded">Most Downloaded</option>
                <option value="Most Upvoted">Most Upvoted</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-white dark:bg-[#1a1a24] rounded-xl border border-slate-200 dark:border-[#2d2d3f]"></div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <span className="material-symbols-outlined text-5xl text-slate-600">travel_explore</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No past questions found</h2>
                <p className="text-slate-500 mb-6 max-w-sm">
                  {activeTab === 'my_submissions'
                    ? "You haven't uploaded any past questions yet. Start contributing to help the community!"
                    : "We couldn't find any submissions matching your filters. Be the first to contribute!"}
                </p>
                <button onClick={() => setIsModalOpen(true)} className="bg-transparent border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 font-bold px-6 py-2.5 rounded-xl transition-colors">
                  Submit One Now
                </button>
              </div>
            ) : (!isFiltering && activeTab === 'all') ? (
              <div className="space-y-12 pb-20">
                {Object.keys(grouped).sort().map(school => (
                  <div key={school} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#2d2d3f] pb-2">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">{school}</h2>
                      <span className="bg-white dark:bg-[#1a1a24] text-slate-500 dark:text-slate-400 text-xs font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-[#2d2d3f]">
                        {Object.values(grouped[school]).flat().length} submissions
                      </span>
                    </div>
                    <div className="space-y-8 pl-4 border-l-2 border-[#1a1a24]">
                      {Object.keys(grouped[school]).sort().map(subj => (
                        <div key={subj}>
                          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 before:w-4 before:h-[1px] before:bg-slate-700">
                            {subj}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pl-6">
                            {grouped[school][subj].map(renderCard)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filtered.map(renderCard)}
              </div>
            )}
          </div>
        </main>

        {/* Submission Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-[#101022]/90 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-[#2d2d3f] flex justify-between items-center bg-white dark:bg-[#1a1a24]">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit a Past Question</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-[#ea580c] transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={submitQuestion} className="overflow-y-auto p-6 space-y-5">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Institution Type *</label>
                    <select required value={formInstitutionType} onChange={(e) => setFormInstitutionType(e.target.value)} className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none">
                      {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Year *</label>
                    <input required type="number" min="1990" max="2030" value={formYear} onChange={(e) => setFormYear(parseInt(e.target.value))} className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">School Name *</label>
                  <input required list="school-list" value={formSchoolName} onChange={(e) => setFormSchoolName(e.target.value)} placeholder="e.g. University of Lagos" className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none" />
                  <datalist id="school-list">
                    {schoolsList.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Subject *</label>
                    <input required value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="e.g. Mathematics" className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none" />
                  </div>
                  {(formInstitutionType === 'University' || formInstitutionType === 'Polytechnic') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Course Code</label>
                      <input value={formCourseCode} onChange={(e) => setFormCourseCode(e.target.value)} placeholder="e.g. MTH 101" className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Semester</label>
                  <select value={formSemester} onChange={(e) => setFormSemester(e.target.value)} className="w-full h-10 px-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none">
                    <option value="">None / Not Applicable</option>
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Annual / Full Year">Annual / Full Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description / Context</label>
                  <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Any context about this paper? e.g. which department, lecturer, or exam type" className="w-full h-20 p-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-lg text-sm text-slate-900 dark:text-white focus:border-[#ea580c] outline-none resize-none" />
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-[#2d2d3f] hover:border-[#ea580c] transition-colors rounded-xl p-6 relative flex flex-col items-center justify-center text-center bg-[#f5f5f8] dark:bg-[#13131a]/50">
                  <input required onChange={handleFileUpload} accept=".pdf,image/png,image/jpeg,image/webp" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                  {formFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className={`material-symbols-outlined text-4xl ${formFile.type.includes('pdf') ? 'text-red-400' : 'text-blue-400'}`}>
                        {formFile.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{formFile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{(formFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">cloud_upload</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Drag and drop or click to upload</p>
                      <p className="text-xs text-slate-500">Supports PDF or Images (Max 20MB)</p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] p-4 rounded-xl cursor-pointer" onClick={() => setFormIsAnonymous(!formIsAnonymous)}>
                  <input type="checkbox" id="anonUpload" checked={formIsAnonymous} readOnly className="w-5 h-5 rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer" />
                  <label htmlFor="anonUpload" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Post Anonymously
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">Your name and profile image will be hidden from everyone else. You still earn XP!</span>
                  </label>
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold h-12 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Uploading...</>
                  ) : 'Submit to Community'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PastQuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#101022] flex items-center justify-center"><div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div></div>}>
      <PastQuestionsContent />
    </Suspense>
  );
}
