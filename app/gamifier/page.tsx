'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import GameLobby from '@/components/gamifier/GameLobby';
import SessionPlay from '@/components/gamifier/SessionPlay';
import SessionResults from '@/components/gamifier/SessionResults';
import { GameMode, GameSessionRecord } from '@/lib/gamifier/masteryArena';

function GamifierShell() {
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get('id');
  const { profile, mutate } = useProfile();
  const supabase = createClient();

  const [resources, setResources] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<GameSessionRecord | null>(null);
  const [resumableSession, setResumableSession] = useState<GameSessionRecord | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  const loadResources = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('resources')
      .select('id, title, subject, content, processing_status')
      .eq('user_id', profile.id)
      .order('last_accessed_at', { ascending: false });
    setResources(data || []);
  };

  const loadActiveSession = async () => {
    const res = await fetch('/api/gamifier/session', { cache: 'no-store' });
    const json = await res.json();
    setActiveSession(json.session || null);
    setResumableSession(json.session || null);
  };

  useEffect(() => {
    async function bootstrap() {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        await Promise.all([loadResources(), loadActiveSession()]);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [profile?.id]);

  useEffect(() => {
    if (!initialResourceId || !resources.length || activeSession) return;
    const resourceExists = resources.some((resource) => resource.id === initialResourceId);
    if (resourceExists) {
      void startSession('quick_recall', initialResourceId);
    }
  }, [initialResourceId, resources, activeSession]);

  const startSession = async (mode: GameMode, resourceId?: string) => {
    setIsLaunching(true);
    setCompletedSummary(null);
    try {
      const res = await fetch('/api/gamifier/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          resourceId,
          forceNew: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start session');
      setActiveSession(json.session);
      setResumableSession(json.session);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLaunching(false);
    }
  };

  const persistSession = async (
    sessionId: string,
    currentRound: number,
    currentState: any,
    score: number,
    bestStreak: number,
    roundResult?: any
  ) => {
    const res = await fetch(`/api/gamifier/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentRound, currentState, score, bestStreak, roundResult }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save session state');
    setActiveSession((prev) => prev ? {
      ...prev,
      current_round: currentRound,
      current_state: currentState,
      score,
      best_streak: bestStreak,
    } : prev);
  };

  const completeSession = async (sessionId: string) => {
    const res = await fetch('/api/gamifier/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to complete session');
    setCompletedSummary(json.summary);
    setActiveSession(null);
    setResumableSession(null);
    await mutate();
  };

  const abandonSession = async () => {
    setResumableSession(activeSession);
    setActiveSession(null);
  };

  const resumeSession = async () => {
    if (resumableSession) {
      setActiveSession(resumableSession);
      return;
    }
    await loadActiveSession();
  };

  const view = useMemo(() => {
    if (completedSummary) return 'results';
    if (activeSession) return 'play';
    return 'lobby';
  }, [activeSession, completedSummary]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0c12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 rounded-full border border-dashed border-[#f97316] animate-spin border-t-transparent mx-auto mb-4" />
          <div className="text-xs uppercase tracking-widest font-bold text-[#f97316]">Loading Mastery Arena...</div>
        </div>
      </div>
    );
  }

  if (view === 'results' && completedSummary) {
    return (
      <SessionResults
        summary={completedSummary}
        onReturn={() => setCompletedSummary(null)}
        onReplay={(mode) => void startSession(mode)}
      />
    );
  }

  if (view === 'play' && activeSession) {
    return (
      <SessionPlay
        session={activeSession}
        onPersist={persistSession}
        onComplete={completeSession}
        onAbort={abandonSession}
      />
    );
  }

  return (
    <GameLobby
      profile={profile}
      resources={resources}
      activeSession={resumableSession}
      onStartSession={startSession}
      onResumeSession={resumeSession}
      isLaunching={isLaunching}
    />
  );
}

export default function GamifierPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#0a0c12] flex items-center justify-center text-white">
        <div className="size-16 rounded-full border border-dashed border-[#f97316] animate-spin border-t-transparent" />
      </div>
    }>
      <GamifierShell />
    </Suspense>
  );
}
