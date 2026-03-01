'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import GalaxyMap from '@/components/gamifier/GalaxyMap';
import SpaceReader from '@/components/gamifier/SpaceReader';
import BossBattle from '@/components/gamifier/BossBattle';
import MissionComplete from '@/components/gamifier/MissionComplete';

function GamifierOrchestrator() {
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get('id');
  const { profile, mutate: mutateProfile } = useProfile();
  const supabase = createClient();

  // App State: 'galaxy' | 'warp' | 'reader' | 'boss' | 'complete'
  const [viewState, setViewState] = useState<'galaxy' | 'warp' | 'reader' | 'boss' | 'complete'>('galaxy');

  // Data State
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [missionStats, setMissionStats] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;

      // Fetch user resources
      const { data: res } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (res) setResources(res);

      // If arrived via URL param, launch straight to reader
      if (initialResourceId && res) {
        const target = res.find(r => r.id === initialResourceId);
        if (target) {
          setSelectedResource(target);
          // Skip warp on direct link
          setViewState('reader');
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, [profile?.id, initialResourceId]);

  // Handlers
  const handleLaunchMission = (resource: any) => {
    setSelectedResource(resource);
    setViewState('warp');
    // Warp CSS animation lasts 1.5s
    setTimeout(() => {
      setViewState('reader');
    }, 1500);
  };

  const handleAbortMission = () => {
    setSelectedResource(null);
    setViewState('galaxy');
    setCurrentMilestone(null);
    mutateProfile(); // Refresh xp/level stats
  };

  const handleBossEncounter = (milestone: string) => {
    // Prepare boss battle
    setCurrentMilestone(milestone);
    setViewState('boss');
  };

  const handleBossWin = async (xp: number) => {
    // Update DB
    if (profile?.id) {
      await supabase.rpc('increment_xp', { user_id: profile.id, xp_amount: xp });
      await supabase.from('profiles').update({
        boss_wins: (profile.boss_wins || 0) + 1
      }).eq('id', profile.id);
    }

    // Return to reader
    setViewState('reader');
    setCurrentMilestone(null);
    mutateProfile();
  };

  const handleBossLose = (retry: boolean) => {
    if (retry) {
      // Keep in boss view, it will reset internally or we could force a re-mount
      // For now, let's just let the user retry
    } else {
      // Abort
      handleAbortMission();
    }
  };

  const handleMissionComplete = (stats: any) => {
    setMissionStats(stats);
    setViewState('complete');
  };

  const handleReturnToGalaxy = () => {
    setSelectedResource(null);
    setViewState('galaxy');
    setMissionStats(null);
    mutateProfile();

    // Refresh resources
    if (profile?.id) {
      supabase.from('resources').select('*').eq('user_id', profile.id).then(({ data }) => {
        if (data) setResources(data);
      });
    }
  };

  // Rendering views
  if (isLoading || !profile) {
    return (
      <div className="w-full h-screen bg-[#050510] flex flex-col items-center justify-center font-display text-[#ea580c]">
        <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-spin border-t-transparent mx-auto mb-4" />
        <div className="text-xs uppercase tracking-widest font-bold">Initializing Galaxy Map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#050510] overflow-hidden text-white font-display">

      {/* 1. Galaxy Map */}
      {viewState === 'galaxy' && (
        <GalaxyMap
          profile={profile}
          resources={resources}
          onSelectPlanet={(res) => handleLaunchMission(res)}
        />
      )}

      {/* 2. Warp Speed Transition */}
      {viewState === 'warp' && (
        <div className="absolute inset-0 z-50 bg-[#050510] flex items-center justify-center overflow-hidden">
          <div className="text-[#38bdf8] font-black text-4xl mb-20 animate-pulse tracking-[0.5em] uppercase">Calculating Trajectory...</div>
          <div className="absolute inset-0 warp-container pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="warp-line" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${0.2 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 0.5}s`
              }} />
            ))}
          </div>
        </div>
      )}

      {/* 3. Space Reader */}
      {viewState === 'reader' && selectedResource && (
        <SpaceReader
          resource={selectedResource}
          profile={profile}
          onAbort={handleAbortMission}
          onComplete={handleMissionComplete}
          onBossEncounter={handleBossEncounter}
        />
      )}

      {/* 4. Boss Battle */}
      {viewState === 'boss' && selectedResource && (
        <BossBattle
          content={selectedResource.content || ''}
          milestone={currentMilestone || ''}
          onWin={handleBossWin}
          onLose={handleBossLose}
        />
      )}

      {/* 5. Mission Complete */}
      {viewState === 'complete' && selectedResource && (
        <MissionComplete
          resource={selectedResource}
          stats={missionStats}
          onReturn={handleReturnToGalaxy}
        />
      )}

      <style jsx global>{`
                .warp-container {
                    perspective: 600px;
                }
                .warp-line {
                    position: absolute;
                    width: 2px;
                    height: 100px;
                    background: linear-gradient(to bottom, rgba(56, 189, 248, 0), #38bdf8, white);
                    opacity: 0;
                    transform-origin: center;
                    animation: warpSpeed linear forwards;
                }
                @keyframes warpSpeed {
                    0% { transform: translateZ(-1000px) scale(0.1); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateZ(600px) scale(2); opacity: 0; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
    </div>
  );
}

export default function GamifierPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-[#ea580c] font-display">
        <div className="size-16 rounded-full border border-dashed border-[#ea580c] animate-[spin_3s_linear_infinite] border-t-transparent mb-4" />
        <div className="text-xs uppercase tracking-widest font-bold">Scanning Sector...</div>
      </div>
    }>
      <GamifierOrchestrator />
    </Suspense>
  );
}
