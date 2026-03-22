'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import MissionHub from '@/components/gamifier/MissionHub';
import AdventureRun from '@/components/gamifier/AdventureRun';
import MissionResults from '@/components/gamifier/MissionResults';
import { AdventureRunRecord } from '@/lib/gamifier/adventure';

function GamifierShell() {
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get('id');
  const { profile, mutate } = useProfile();
  const supabase = createClient();

  const [resources, setResources] = useState<any[]>([]);
  const [activeRun, setActiveRun] = useState<AdventureRunRecord | null>(null);
  const [resumableRun, setResumableRun] = useState<AdventureRunRecord | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  const loadResources = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('resources')
      .select('id, title, subject, content, processing_status')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setResources(data || []);
  };

  const loadActiveRun = async () => {
    const res = await fetch('/api/gamifier/mission', { cache: 'no-store' });
    const json = await res.json();
    setActiveRun(json.run || null);
    setResumableRun(json.run || null);
  };

  useEffect(() => {
    async function bootstrap() {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        await Promise.all([loadResources(), loadActiveRun()]);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [profile?.id]);

  useEffect(() => {
    if (!initialResourceId || !resources.length || activeRun) return;
    const resourceExists = resources.some((resource) => resource.id === initialResourceId);
    if (resourceExists) {
      void startMission(initialResourceId);
    }
  }, [initialResourceId, resources, activeRun]);

  const startMission = async (resourceId?: string) => {
    setIsLaunching(true);
    setCompletedSummary(null);
    try {
      const res = await fetch('/api/gamifier/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          forceNew: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start mission');
      setActiveRun(json.run);
      setResumableRun(json.run);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLaunching(false);
    }
  };

  const persistRun = async (runId: string, currentNodeId: string, currentState: any, completedNodeId?: string) => {
    const res = await fetch(`/api/gamifier/run/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentNodeId, currentState, completedNodeId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save mission state');
    setActiveRun((prev) => prev ? { ...prev, current_node_id: currentNodeId, current_state: currentState } : prev);
  };

  const completeRun = async (runId: string) => {
    const res = await fetch('/api/gamifier/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to complete mission');
    setCompletedSummary({
      missionTitle: activeRun?.mission_title || 'Story Mission',
      summary: json.summary,
    });
    setActiveRun(null);
    setResumableRun(null);
    await mutate();
  };

  const abandonRun = async () => {
    setResumableRun(activeRun);
    setActiveRun(null);
  };

  const resumeMission = async () => {
    if (resumableRun) {
      setActiveRun(resumableRun);
      return;
    }
    await loadActiveRun();
  };

  const view = useMemo(() => {
    if (completedSummary) return 'results';
    if (activeRun) return 'run';
    return 'hub';
  }, [activeRun, completedSummary]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-[100dvh] bg-[#050510] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-spin border-t-transparent mx-auto mb-4" />
          <div className="text-xs uppercase tracking-widest font-bold text-[#ea580c]">Initializing Story Adventure...</div>
        </div>
      </div>
    );
  }

  if (view === 'results' && completedSummary) {
    return (
      <MissionResults
        missionTitle={completedSummary.missionTitle}
        summary={completedSummary.summary}
        onReturn={() => setCompletedSummary(null)}
      />
    );
  }

  if (view === 'run' && activeRun) {
    return (
      <AdventureRun
        run={activeRun}
        onPersist={persistRun}
        onComplete={completeRun}
        onAbort={abandonRun}
      />
    );
  }

  return (
    <MissionHub
      profile={profile}
      resources={resources}
      activeRun={resumableRun}
      onStartMission={startMission}
      onResumeMission={resumeMission}
      isLaunching={isLaunching}
    />
  );
}

export default function GamifierPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#050510] flex items-center justify-center text-white">
        <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-spin border-t-transparent" />
      </div>
    }>
      <GamifierShell />
    </Suspense>
  );
}
