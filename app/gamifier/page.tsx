'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import confetti from 'canvas-confetti';
import Image from 'next/image';
// PDF.js worker will be loaded dynamically

function getAvatar(url?: string | null) {
  return url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
}

function getName(id?: string | null, fullName?: string | null) {
  return fullName || 'Student';
}

// Badges logic based on prompt
const BADGES = [
  { id: 'first_page', name: 'First Page', desc: 'Read the first page of any document', icon: 'book' },
  { id: 'on_a_roll', name: 'On a Roll', desc: 'Read 5 pages in a single session', icon: 'local_fire_department' },
  { id: 'chapter_champion', name: 'Chapter Champion', desc: 'Complete 25% of any document', icon: 'military_tech' },
  { id: 'speed_reader', name: 'Speed Reader', desc: 'Complete a document in under 10 minutes', icon: 'timer' },
  { id: 'halfway_hero', name: 'Halfway Hero', desc: 'Complete 50% of any document', icon: 'moving' },
  { id: 'document_master', name: 'Document Master', desc: 'Complete 100% of any document', icon: 'workspace_premium' },
  { id: 'consistent_learner', name: 'Consistent Learner', desc: 'Maintain a 3-day reading streak', icon: 'calendar_month' },
  { id: 'study_warrior', name: 'Study Warrior', desc: 'Maintain a 7-day reading streak', icon: 'bolt' },
  { id: 'night_owl', name: 'Night Owl', desc: 'Complete a document between 10PM and 2AM', icon: 'bedtime' },
  { id: 'early_bird', name: 'Early Bird', desc: 'Complete a document between 5AM and 8AM', icon: 'wb_twilight' },
  { id: 'xp_collector', name: 'XP Collector', desc: 'Earn 1000 total XP', icon: 'diamond' },
  { id: 'level_up', name: 'Level Up', desc: 'Reach Level 5', icon: 'trending_up' }
];

function GamifierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resourceId = searchParams.get('id');
  const { profile, mutate: mutateProfile } = useProfile();

  const [resource, setResource] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRendering, setIsRendering] = useState(false);

  const [xpEarned, setXpEarned] = useState(0);
  const [pagesReadThisSession, setPagesReadThisSession] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const [badgesUnlockedSession, setBadgesUnlockedSession] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  const [showSummary, setShowSummary] = useState(false);
  const [showPopupCard, setShowPopupCard] = useState<any>(null);

  const [topUsers, setTopUsers] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Fetch Leaderboard
      const { data: top } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, xp')
        .order('xp', { ascending: false })
        .limit(3);
      if (top) setTopUsers(top);

      if (!resourceId) return;

      // Fetch Resource
      const { data: res } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (res) {
        setResource(res);
        loadPdf(res.file_url);

        // Fetch Reading Progress
        if (profile?.id) {
          const { data: prog } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('resource_id', resourceId)
            .eq('user_id', profile.id)
            .maybeSingle();

          if (prog && prog.last_page > 1) {
            const resume = window.confirm(`Resume reading from page ${prog.last_page}?`);
            if (resume) setCurrentPage(prog.last_page);
          }
        }
      }
    }
    if (profile) init();
  }, [resourceId, profile?.id]);

  // Session Timer
  useEffect(() => {
    if (showSummary) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showSummary]);

  // Idle Timer (3 minutes)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowPopupCard({
        title: "Still with us?",
        message: "Try summarizing what you just read in one sentence before moving on!",
        icon: "psychology"
      });
      // Auto dismiss
      setTimeout(() => setShowPopupCard(null), 6000);
    }, 3 * 60 * 1000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentPage, resetIdleTimer]);

  const loadPdf = async (url: string) => {
    try {
      // Dynamically import pdf.js to prevent InvalidPDFException on Vercel client build
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;

      // Store pdfDoc, but because we removed the global pdfjsLib state, we also
      // attach it to window so renderPage can grab it, or pass it in state. 
      // State is safer.
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || isRendering) return;
    setIsRendering(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // HiDPI support
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = pixelRatio > 1 ? 2.0 : 1.5;

      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / scale}px`;
      canvas.style.height = `${viewport.height / scale}px`;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Render error:', error);
    } finally {
      setIsRendering(false);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  // Logic for awarding XP and saving
  const checkBadges = async (currentXpEarned: number, pagesRead: number, isComplete: boolean) => {
    if (!profile) return;
    const existingBadges: string[] = profile.badges || [];
    let newBadges: any[] = [];

    const awardBadge = (badgeId: string) => {
      if (!existingBadges.includes(badgeId)) {
        const badgeDef = BADGES.find(b => b.id === badgeId);
        newBadges.push(badgeId);
        setBadgesUnlockedSession(prev => [...prev, badgeDef]);
        setActiveToast({ type: 'badge', data: badgeDef });
        setTimeout(() => setActiveToast(null), 4000);
      }
    };

    // Check conditions
    if (currentPage >= 1) awardBadge('first_page');
    if (pagesRead >= 5) awardBadge('on_a_roll');

    const pct = currentPage / numPages;
    if (pct >= 0.25) awardBadge('chapter_champion');
    if (pct >= 0.50) awardBadge('halfway_hero');
    if (pct >= 1.0 || isComplete) awardBadge('document_master');

    if (isComplete && sessionSeconds < 600) awardBadge('speed_reader'); // 10 mins

    const hour = new Date().getHours();
    if (isComplete && (hour >= 22 || hour <= 2)) awardBadge('night_owl');
    if (isComplete && (hour >= 5 && hour <= 8)) awardBadge('early_bird');

    const totalUserXp = (profile.xp || 0) + currentXpEarned;
    if (totalUserXp >= 1000) awardBadge('xp_collector');
    if (Math.floor(totalUserXp / 500) + 1 >= 5) awardBadge('level_up');

    if (newBadges.length > 0) {
      await supabase.from('profiles').update({
        badges: [...existingBadges, ...newBadges]
      }).eq('id', profile.id);
      mutateProfile();
    }
  };

  const handlePageTurn = async (dir: 1 | -1) => {
    if (isRendering) return;
    const newPage = currentPage + dir;
    if (newPage < 1 || newPage > numPages) return;

    setCurrentPage(newPage);
    resetIdleTimer();

    // Gamification Logic (Only award XP for advancing forward to a new page, keeping it simple)
    if (dir === 1) {
      const newPagesRead = pagesReadThisSession + 1;
      setPagesReadThisSession(newPagesRead);

      let xpGained = 10;
      const pct = newPage / numPages;
      const prevPct = currentPage / numPages;

      let milestoneTrigger = false;
      let milestoneTitle = '';

      if (pct >= 0.25 && prevPct < 0.25) { xpGained += 50; milestoneTrigger = true; milestoneTitle = "25% Complete!"; }
      if (pct >= 0.50 && prevPct < 0.50) { xpGained += 75; milestoneTrigger = true; milestoneTitle = "Halfway There!"; }
      if (pct >= 0.75 && prevPct < 0.75) { xpGained += 100; milestoneTrigger = true; milestoneTitle = "75% Complete!"; }
      if (pct >= 1.0 && prevPct < 1.0) { xpGained += 200; milestoneTrigger = true; milestoneTitle = "Document Complete!"; }

      const newTotalXpSession = xpEarned + xpGained;
      setXpEarned(newTotalXpSession);

      // Toast Notification for XP
      setActiveToast({ type: 'xp', amount: xpGained });
      setTimeout(() => setActiveToast(null), 2500);

      // Save to Supabase
      if (profile) {
        const newTotalUserXp = (profile.xp || 0) + xpGained;
        const oldLvl = Math.floor((profile.xp || 0) / 500) + 1;
        const newLvl = Math.floor(newTotalUserXp / 500) + 1;

        await supabase.from('profiles').update({
          xp: newTotalUserXp,
          level: newLvl
        }).eq('id', profile.id);

        // Save progress using UPSERT via reading_progress policy
        await supabase.from('reading_progress').upsert({
          user_id: profile.id,
          resource_id: resourceId,
          last_page: newPage,
          completion_percentage: Math.round(pct * 100)
        }, { onConflict: 'user_id, resource_id' });

        if (newLvl > oldLvl) {
          setNewLevel(newLvl);
          setShowLevelUp(true);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        mutateProfile();
      }

      // Check badges
      checkBadges(newTotalXpSession, newPagesRead, pct >= 1.0);

      // Milestone Popups
      if (milestoneTrigger) {
        setShowPopupCard({
          title: milestoneTitle,
          message: `You've earned a bonus +${xpGained - 10} XP!`,
          icon: "celebration"
        });
        setTimeout(() => setShowPopupCard(null), 5000);
      } else if (newPagesRead % 5 === 0) {
        setShowPopupCard({
          title: "Keep Going!",
          message: `You're on fire! You've earned ${newTotalXpSession} XP this session.`,
          icon: "local_fire_department"
        });
        setTimeout(() => setShowPopupCard(null), 4000);
      }

      if (pct >= 1.0) {
        endSession();
      }
    }
  };

  const endSession = async () => {
    setShowSummary(true);
    if (!profile || !resourceId) return;

    // Log to study history
    await supabase.from('study_history').insert({
      user_id: profile.id,
      action_type: 'document_read',
      entity_id: resourceId,
      entity_type: 'resource',
      details: {
        time_spent_seconds: sessionSeconds,
        pages_read: pagesReadThisSession,
        xp_earned: xpEarned,
        completion_percentage: Math.round((currentPage / numPages) * 100)
      }
    });

    // Final leaderboard update implicit through profiles trigger
  };

  if (!resourceId) {
    return (
      <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Turn Your Notes Into a Game</h1>
        <p className="text-slate-600 dark:text-slate-500 dark:text-slate-400 mb-8 max-w-md">Upload a new PDF or choose from your library to start earning XP, badges, and climbing the leaderboard just by reading.</p>
        <Link href="/resources" className="px-8 py-3 bg-[#ea580c] hover:bg-[#d04e0a] text-slate-900 dark:text-white font-bold rounded-xl transition-transform hover:scale-105 shadow-lg shadow-[#ea580c]/30">
          Go to Library
        </Link>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const renderSummary = () => (
    <div className="absolute inset-0 z-50 bg-[#f5f5f8] dark:bg-[#101022]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1b1b27] border border-slate-300 dark:border-[#3b3b54] rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
        {/* Confetti effect background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"></div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">You crushed it today.</p>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-100 dark:bg-[#252535] p-6 rounded-xl border border-slate-300 dark:border-[#3b3b54]">
            <span className="material-symbols-outlined text-[#ea580c] text-3xl mb-2">diamond</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">+{xpEarned}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">XP Earned</p>
          </div>
          <div className="bg-slate-100 dark:bg-[#252535] p-6 rounded-xl border border-slate-300 dark:border-[#3b3b54]">
            <span className="material-symbols-outlined text-blue-400 text-3xl mb-2">auto_stories</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{pagesReadThisSession}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Pages Read</p>
          </div>
          <div className="bg-slate-100 dark:bg-[#252535] p-6 rounded-xl border border-slate-300 dark:border-[#3b3b54]">
            <span className="material-symbols-outlined text-purple-400 text-3xl mb-2">timer</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{formatTime(sessionSeconds)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Time Spent</p>
          </div>
        </div>

        {badgesUnlockedSession.length > 0 && (
          <div className="mb-10 text-left">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Badges Unlocked</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {badgesUnlockedSession.map(b => (
                <div key={b.id} className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-amber-400">{b.icon}</span>
                  <span className="text-sm font-bold text-amber-100">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          {currentPage < numPages && (
            <button onClick={() => setShowSummary(false)} className="px-6 py-3 bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-900 dark:text-white font-bold rounded-xl transition-colors">
              Continue Reading
            </button>
          )}
          <Link href={`generator?id=${resourceId}`} className="px-6 py-3 bg-[#ea580c] hover:bg-[#d04e0a] text-slate-900 dark:text-white font-bold rounded-xl shadow-lg shadow-[#ea580c]20 transition-transform hover:scale-105">
            Generate Study Aids
          </Link>
          <Link href="/resources" className="px-6 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white font-medium transition-colors">
            Back to Library
          </Link>
        </div>
      </div>
    </div>
  );

  const currentLevel = profile?.level || 1;
  const userXp = profile?.xp || 0;
  const targetXp = currentLevel * 500;
  const progressPercent = Math.min(100, Math.round((userXp / targetXp) * 100));

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased">
      {showSummary && renderSummary()}

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1b1b27] border border-[#ea580c]/50 p-12 rounded-3xl text-center transform scale-110 shadow-2xl shadow-[#ea580c]/20 animate-in zoom-in duration-300">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 mb-2">LEVEL UP!</h2>
            <p className="text-xl text-slate-900 dark:text-white mb-8">You've reached Level {newLevel}</p>
            <button onClick={() => setShowLevelUp(false)} className="px-8 py-3 bg-[#ea580c] text-slate-900 dark:text-white font-bold rounded-xl hover:bg-[#d04e0a]">
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d3f] px-6 py-3 bg-[#f5f5f8] dark:bg-[#101022] z-40">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <button onClick={() => endSession()} className="size-10 flex items-center justify-center hover:bg-slate-100 dark:bg-[#252535] rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div>
            <h2 className="text-base font-bold truncate max-w-[300px]">{resource?.title || 'Loading...'}</h2>
            <p className="text-xs text-slate-500">Gamified Reading Session</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-[#1b1b27] px-4 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2d3f]">
          <span className="material-symbols-outlined text-[#ea580c] text-lg">timer</span>
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{formatTime(sessionSeconds)}</span>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left: PDF Reader */}
        <main className="flex-1 flex flex-col bg-slate-200/50 dark:bg-[#0c0c16] relative">

          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            {!pdfDoc && (
              <div className="flex flex-col items-center text-slate-500">
                <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading document...</p>
              </div>
            )}

            <div className="relative shadow-2xl">
              <canvas ref={canvasRef} className="bg-white max-w-full h-auto object-contain rounded-sm" />

              {/* Pagination Overlay Controls */}
              {pdfDoc && (
                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity">
                  <button onClick={() => handlePageTurn(-1)} disabled={currentPage <= 1} className="m-4 size-14 rounded-full bg-black/50 text-slate-900 dark:text-white backdrop-blur-md flex items-center justify-center hover:bg-[#ea580c] disabled:opacity-30 transition-colors">
                    <span className="material-symbols-outlined text-3xl">chevron_left</span>
                  </button>
                </div>
              )}
              {pdfDoc && (
                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity group">
                  <div className="relative flex items-center m-4">
                    {/* Floating XP Toast attached to Next button */}
                    {activeToast?.type === 'xp' && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 font-black px-3 py-1 rounded-full text-sm shadow-lg shadow-amber-400/20 animate-in slide-in-from-bottom-5 fade-in duration-300">
                        +{activeToast.amount} XP
                      </div>
                    )}
                    <button onClick={() => handlePageTurn(1)} disabled={currentPage >= numPages} className="size-14 rounded-full bg-black/50 text-slate-900 dark:text-white backdrop-blur-md flex items-center justify-center hover:bg-[#ea580c] disabled:opacity-30 transition-colors shadow-2xl">
                      <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Reader Toolbar */}
          <div className="h-16 bg-[#f5f5f8] dark:bg-[#101022] border-t border-slate-200 dark:border-[#1b1b27] flex items-center justify-center px-6 text-slate-900 dark:text-white absolute bottom-0 w-full">
            <div className="flex items-center gap-4 bg-white dark:bg-[#1b1b27] px-6 py-2 rounded-full border border-slate-200 dark:border-[#2d2d3f] shadow-lg">
              <button onClick={() => handlePageTurn(-1)} disabled={currentPage <= 1} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="text-sm font-bold min-w-[100px] text-center">
                Page {currentPage} of {numPages || '-'}
              </div>
              <button onClick={() => handlePageTurn(1)} disabled={currentPage >= numPages} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Popup Card Overlay */}
          {showPopupCard && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1b1b27] border border-[#ea580c]/30 p-6 rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-10 fade-in w-[400px]">
              <div className="bg-[#ea580c]/20 p-3 rounded-full text-[#ea580c]">
                <span className="material-symbols-outlined text-3xl">{showPopupCard.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{showPopupCard.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">{showPopupCard.message}</p>
              </div>
              <button onClick={() => setShowPopupCard(null)} className="text-slate-500 hover:text-slate-900 dark:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* Badge Unlock Global Toast */}
          {activeToast?.type === 'badge' && (
            <div className="absolute bottom-8 right-8 bg-gradient-to-r from-[#1b1b27] to-[#252535] border border-amber-500/30 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 fade-in w-[300px] z-50">
              <div className="bg-amber-500/20 p-2 rounded-full text-amber-400">
                <span className="material-symbols-outlined text-2xl">{activeToast.data.icon}</span>
              </div>
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">Badge Unlocked!</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{activeToast.data.name}</p>
              </div>
            </div>
          )}

        </main>

        {/* Right: Game Dashboard */}
        <aside className="w-80 bg-white dark:bg-[#141423] border-l border-slate-200 dark:border-[#2d2d3f] flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">

          {/* User Status */}
          <div className="p-6 border-b border-slate-200 dark:border-[#2d2d3f] bg-gradient-to-b from-[#1b1b27] to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div
                  className="size-12 rounded-full bg-cover bg-center border-2 border-[#ea580c]"
                  style={{ backgroundImage: `url("${getAvatar(profile?.avatar_url)}")` }}
                ></div>
                <div className="absolute -bottom-2 -right-2 bg-[#ea580c] text-slate-900 dark:text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white dark:border-[#141423]">
                  LVL {currentLevel}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{getName(profile?.id, profile?.full_name)}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.streak_days || 0} Day Streak 🔥</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>XP Progress</span>
                <span className="text-slate-900 dark:text-white">{userXp} / {targetXp}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#252535] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">

            {/* Session Stats */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Session Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl p-3 text-center">
                  <p className="text-[#ea580c] font-black text-2xl">+{xpEarned}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">XP Earned</p>
                </div>
                <div className="bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl p-3 text-center">
                  <p className="text-slate-900 dark:text-white font-black text-2xl">{pagesReadThisSession}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Pages Read</p>
                </div>
              </div>
            </div>

            {/* Current Progress Mini-Map */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Document Progress</h4>
              <div className="bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] rounded-xl p-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    {numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                </div>
                {/* Visual marker bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-[#252535] rounded-full flex gap-0.5 overflow-hidden">
                  {numPages > 0 && Array.from({ length: Math.min(50, numPages) }).map((_, i) => {
                    const isRead = (i / Math.min(50, numPages)) < (currentPage / numPages);
                    return <div key={i} className={`flex-1 ${isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                  })}
                </div>
              </div>
            </div>

            {/* Global Leaderboard Snapshot */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Top 3</h4>
                <Link href="/leaderboard" className="text-[10px] text-[#ea580c] hover:underline">View All</Link>
              </div>
              <div className="space-y-2">
                {topUsers.map((user, idx) => (
                  <div key={user.id} className="bg-white dark:bg-[#1b1b27] rounded-lg p-2.5 flex items-center gap-3 border border-slate-200 dark:border-[#2d2d3f]/50">
                    <span className={`font-black text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : 'text-orange-300'}`}>
                      {idx + 1}
                    </span>
                    <div
                      className="size-7 rounded-full bg-cover bg-center border border-slate-300 dark:border-[#3b3b54]"
                      style={{ backgroundImage: `url("${getAvatar(user.avatar_url)}")` }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{getName(user.id, user.full_name)}</p>
                      <p className="text-[10px] text-[#ea580c]">{user.xp?.toLocaleString()} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="p-4 bg-white dark:bg-[#1b1b27] border-t border-slate-200 dark:border-[#2d2d3f] mt-auto">
            <button onClick={endSession} className="w-full py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm rounded-lg transition-colors">
              End Session Early
            </button>
          </div>

        </aside>

      </div>
    </div>
  );
}

export default function GamifierPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f8] dark:bg-[#101022] flex flex-col items-center justify-center">
        <div className="size-16 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#ea580c] font-bold tracking-widest uppercase">Initializing Gamifier...</p>
      </div>
    }>
      <GamifierContent />
    </Suspense>
  );
}
