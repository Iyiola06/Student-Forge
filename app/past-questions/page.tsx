'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import AppStatCard from '@/components/app/AppStatCard';
import AppEmptyState from '@/components/app/AppEmptyState';
import { AppTabs } from '@/components/app/AppTabs';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { awardXp } from '@/app/actions/gamifier';
import { toast } from 'react-toastify';
import { compressImage } from '@/lib/image-utils';

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

const INSTITUTION_TONES: Record<string, string> = {
  'Secondary School': 'pastel-mint',
  University: 'pastel-sky',
  Polytechnic: 'pastel-peach',
  'College of Education': 'pastel-lavender',
};

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];

      if (file.type.startsWith('image/')) {
        const loadingToast = toast.info("Optimizing image...", { autoClose: false });
        try {
          file = await compressImage(file);
          toast.dismiss(loadingToast);
        } catch (err) {
          toast.dismiss(loadingToast);
          console.error('Compression failed:', err);
        }
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 20MB limit.`);
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
      await awardXp(profile.id, 25, 'past_question_upload');
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

  const mySubmissionCount = profile ? questions.filter(q => q.user_id === profile.id).length : undefined;

  const renderCard = (q: PastQuestion) => {
    const upvoted = userUpvotes.has(q.id);
    const isMine = q.user_id === profile?.id;
    return (
      <article key={q.id} className="lift relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className={cn(INSTITUTION_TONES[q.institution_type] ?? 'pastel-sky', 'px-4 pt-4 pb-3')}>
          <div className="flex min-w-0 items-start gap-3">
            <span className="icon-tile size-11 bg-[var(--card)]">
              <Icon3D name={q.file_type === 'Image' ? 'camera' : 'scroll'} size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="pill-tag !px-2.5 !py-0.5 !text-[11px]">{q.institution_type}</span>
                <span className="pill-tag !px-2.5 !py-0.5 !text-[11px]">{q.year}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-5 text-[var(--text-body)]">{q.school_name}</p>
            </div>
            {isMine && (
              <button
                onClick={() => handleDelete(q.id)}
                aria-label="Delete submission"
                className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4">
          <h3 className="font-display line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em] break-words text-[var(--text-strong)]">
            {q.subject}
            {q.course_code && <span className="ml-1.5 font-normal text-[var(--text-soft)]">{q.course_code}</span>}
          </h3>
          {q.semester && <p className="mt-0.5 text-[12.5px] text-[var(--text-soft)]">{q.semester}</p>}
          {q.description && (
            <div className="mt-2 rounded-2xl bg-[var(--card-2)] px-3 py-2">
              <p className="line-clamp-2 text-[12.5px] leading-5 break-words text-[var(--text-body)]">&ldquo;{q.description}&rdquo;</p>
            </div>
          )}

          <div className="mt-4 flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--accent-soft)]">
              {q.is_anonymous ? (
                <Icon3D name="man-tipping" size={22} />
              ) : q.profiles?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={q.profiles.avatar_url} alt="Avatar" className="size-full object-cover" />
              ) : (
                <Icon3D name="student-1" size={22} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1">
                <p className="truncate text-[13px] font-medium text-[var(--text-strong)]">
                  {q.is_anonymous ? 'Anonymous Student' : (q.profiles?.full_name || 'Student')}
                </p>
                {isMine && q.is_anonymous && (
                  <span className="material-symbols-outlined shrink-0 text-[14px] text-[var(--accent)]" title="This is your anonymous post">visibility_off</span>
                )}
              </div>
              <p className="truncate text-[11.5px] text-[var(--text-soft)]">
                {new Date(q.created_at).toLocaleDateString()} · {q.file_type} · {q.file_size}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleUpvote(q.id)}
                aria-pressed={upvoted}
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[12.5px] font-medium transition',
                  upvoted
                    ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'border-[var(--line)] text-[var(--text-body)] hover:bg-[var(--accent-softer)]'
                )}
              >
                <span className="material-symbols-outlined text-[16px]" style={upvoted ? { fontVariationSettings: "'FILL' 1" } : undefined}>thumb_up</span>
                {q.upvotes}
              </button>
              <span className="inline-flex h-8 items-center gap-1 px-1.5 text-[12.5px] text-[var(--text-soft)]">
                <span className="material-symbols-outlined text-[16px]">download</span>
                {q.downloads}
              </span>
            </div>
            <button onClick={() => handleDownload(q.id, q.file_url)} className="primary-button !h-9 !px-4 !text-[13px]">
              <span className="material-symbols-outlined text-[17px]">file_download</span>
              Download
            </button>
          </div>
          </div>
        </div>
      </article>
    );
  };

  const SubmitButton = (
    <button onClick={() => setIsModalOpen(true)} className="primary-button">
      <span className="material-symbols-outlined text-[20px]">add</span>
      Submit past question
    </button>
  );

  const fieldClass =
    'h-11 w-full min-w-0 rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 text-sm text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--ring-brand)]';
  const filterClass =
    'h-10 w-full min-w-0 truncate rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-4 text-[13px] text-[var(--text-strong)] outline-none transition focus:border-[var(--accent)]';

  return (
    <AppShell
      eyebrow="Community"
      title="Community Past Questions Bank"
      description="Study smarter with past questions shared by students like you."
      actions={SubmitButton}
    >
      <div className="workspace-stack">
        {/* Stats */}
        <section className="stat-trio">
          <AppStatCard label="Submissions" value={stats.total} detail="Total documents shared" icon="scroll" />
          <AppStatCard label="Schools" value={stats.schools} detail="Institutions covered" icon="grad-cap" />
          <AppStatCard label="Subjects" value={stats.subjects} detail="Unique courses available" icon="books" />
        </section>

        {/* Tabs + filters */}
        <section className="glass-panel app-panel-tight space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AppTabs
              items={[
                { id: 'all', label: 'All questions' },
                { id: 'my_submissions', label: 'My submissions', count: mySubmissionCount },
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as 'all' | 'my_submissions')}
            />
            <label className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--text-soft)]">
              <span className="shrink-0">Sort by</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={cn(filterClass, '!w-auto cursor-pointer font-medium')}>
                <option value="Most Recent">Most Recent</option>
                <option value="Most Downloaded">Most Downloaded</option>
                <option value="Most Upvoted">Most Upvoted</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <select aria-label="Institution type" value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)} className={filterClass}>
              <option value="All">All Institutions</option>
              {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select aria-label="School" value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className={filterClass}>
              <option value="All">All Schools</option>
              {schoolsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="Subject" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={filterClass}>
              <option value="All">All Subjects</option>
              {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)} className={filterClass}>
              <option value="All">All Years</option>
              {yearsList.map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
          </div>
        </section>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-[24px] border border-[var(--line)] bg-[var(--card)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            icon={activeTab === 'my_submissions' ? 'inbox' : 'magnifier'}
            title="No past questions found"
            description={activeTab === 'my_submissions'
              ? "You haven't uploaded any past questions yet. Start contributing to help the community!"
              : "We couldn't find any submissions matching your filters. Be the first to contribute!"}
            action={
              <button onClick={() => setIsModalOpen(true)} className="primary-button">
                Submit one now
              </button>
            }
            className="py-12"
          />
        ) : (!isFiltering && activeTab === 'all') ? (
          <div className="space-y-6">
            {Object.keys(grouped).sort().map(school => (
              <section key={school} className="glass-panel app-panel">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="icon-tile size-12">
                    <Icon3D name="grad-cap" size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="panel-title break-words">{school}</h2>
                    <p className="text-[13px] text-[var(--text-soft)]">
                      {Object.values(grouped[school]).flat().length} submissions · {Object.keys(grouped[school]).length} subjects
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-6">
                  {Object.keys(grouped[school]).sort().map(subj => (
                    <div key={subj} className="min-w-0">
                      <div className="mb-3 flex min-w-0 items-center gap-2">
                        <span className="eyebrow-pill min-w-0 !shadow-none !bg-[var(--accent-softer)]">
                          <span className="truncate">{subj}</span>
                          <span className="shrink-0 text-[var(--text-soft)]">{grouped[school][subj].length}</span>
                        </span>
                        <span className="h-px flex-1 bg-[var(--line)]" />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {grouped[school][subj].map(renderCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map(renderCard)}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-panel flex max-h-[92vh] w-full max-w-xl min-w-0 flex-col overflow-hidden !shadow-[var(--shadow-lg)] animate-rise">
            <div className="pastel-sky flex items-start gap-4 px-5 pt-5 pb-4 md:px-7 md:pt-6">
              <Icon3D name="scroll" size={52} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="eyebrow">Earn 25 XP for sharing</p>
                <h2 className="font-display mt-0.5 text-[21px] leading-tight font-semibold tracking-[-0.02em] text-[var(--text-strong)]">Submit a past question</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition hover:text-[var(--text-strong)]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={submitQuestion} className="space-y-4 overflow-y-auto px-5 pt-2 pb-5 md:px-7 md:pb-7">

              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="min-w-0">
                  <label className="auth-label">Institution type *</label>
                  <select required value={formInstitutionType} onChange={(e) => setFormInstitutionType(e.target.value)} className={fieldClass}>
                    {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="auth-label">Year *</label>
                  <input required type="number" min="1990" max="2030" value={formYear} onChange={(e) => setFormYear(parseInt(e.target.value))} className={fieldClass} />
                </div>
              </div>

              <div>
                <label className="auth-label">School name *</label>
                <input required list="school-list" value={formSchoolName} onChange={(e) => setFormSchoolName(e.target.value)} placeholder="e.g. University of Lagos" className={fieldClass} />
                <datalist id="school-list">
                  {schoolsList.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="auth-label">Subject *</label>
                  <input required value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="e.g. Mathematics" className={fieldClass} />
                </div>
                {(formInstitutionType === 'University' || formInstitutionType === 'Polytechnic') && (
                  <div className="min-w-0">
                    <label className="auth-label">Course code</label>
                    <input value={formCourseCode} onChange={(e) => setFormCourseCode(e.target.value)} placeholder="e.g. MTH 101" className={fieldClass} />
                  </div>
                )}
              </div>

              <div>
                <label className="auth-label">Semester</label>
                <select value={formSemester} onChange={(e) => setFormSemester(e.target.value)} className={fieldClass}>
                  <option value="">None / Not Applicable</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                  <option value="Annual / Full Year">Annual / Full Year</option>
                </select>
              </div>

              <div>
                <label className="auth-label">Description / context</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Any context about this paper? e.g. which department, lecturer, or exam type" className={cn(fieldClass, 'h-20 resize-none py-3')} />
              </div>

              <div className="resource-dropzone relative flex flex-col items-center !rounded-[24px] !p-5 text-center" data-dragging={formFile ? 'true' : undefined}>
                <input required onChange={handleFileUpload} accept=".pdf,image/png,image/jpeg,image/webp" type="file" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                {formFile ? (
                  <>
                    <Icon3D name={formFile.type.includes('pdf') ? 'scroll' : 'camera'} size={48} />
                    <p className="mt-2 max-w-full truncate text-sm font-medium text-[var(--text-strong)]">{formFile.name}</p>
                    <p className="text-[12px] text-[var(--text-soft)]">{(formFile.size / (1024 * 1024)).toFixed(2)} MB · tap to replace</p>
                  </>
                ) : (
                  <>
                    <Icon3D name="file-folder" size={52} />
                    <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">Drag and drop or click to upload</p>
                    <p className="text-[12px] text-[var(--text-soft)]">Supports PDF or Images (Max 20MB)</p>
                  </>
                )}
              </div>

              <div
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-[20px] border p-4 transition',
                  formIsAnonymous ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--card-2)]'
                )}
                onClick={() => setFormIsAnonymous(!formIsAnonymous)}
              >
                <input type="checkbox" id="anonUpload" checked={formIsAnonymous} readOnly className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--action)]" />
                <label htmlFor="anonUpload" className="min-w-0 cursor-pointer text-sm font-medium text-[var(--text-strong)] select-none">
                  Post anonymously
                  <span className="mt-0.5 block text-[12.5px] font-normal text-[var(--text-soft)]">Your name and profile image will be hidden from everyone else. You still earn XP!</span>
                </label>
              </div>

              <button disabled={isSubmitting} type="submit" className="primary-button !h-12 w-full">
                {isSubmitting ? (
                  <><span className="size-4 animate-spin rounded-full border-2 border-[var(--action-ink)] border-t-transparent" /> Uploading...</>
                ) : 'Submit to community'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PastQuestionsPage() {
  return (
    <Suspense fallback={<div className="main-bg flex min-h-screen items-center justify-center"><div className="size-10 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"></div></div>}>
      <PastQuestionsContent />
    </Suspense>
  );
}
