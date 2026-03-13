import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import { User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
    level: number;
    xp: number;
    streak_days: number;
    cards_mastered: number;
    exam_readiness_score: number;
    resources_uploaded?: number;
    quizzes_taken?: number;
    badges?: string[];
    exam_date?: string | null;
    last_active_date?: string;
    boss_wins?: number;
    missions?: any;
    unlocked_titles?: string[];
    active_title?: string;
    unlocked_themes?: string[];
    active_theme?: string;
}

const fetcher = async () => {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code === 'PGRST116') {
        const { data: upsertedProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: user.user_metadata.full_name || user.user_metadata.name || 'Student',
                avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null
            }, { onConflict: 'id' })
            .select()
            .single();

        if (upsertError) throw upsertError;
        profileData = upsertedProfile;
    } else if (profileError) {
        throw profileError;
    }

    let currentProfile = profileData as Profile;
    const todayDate = new Date();
    const todayStr = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    if (currentProfile.last_active_date !== todayStr) {
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        let newStreak = currentProfile.streak_days || 0;
        if (currentProfile.last_active_date === yesterdayStr) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }

        currentProfile = {
            ...currentProfile,
            streak_days: newStreak,
            last_active_date: todayStr
        };

        await supabase.from('profiles').update({
            streak_days: newStreak,
            last_active_date: todayStr
        }).eq('id', user.id);
    }

    return { user, profile: currentProfile };
};

export function useProfile(initialData?: { user: User | null; profile: Profile | null }) {
    // Convert initialData to match SWR's expected type (fetcher returns null when no user)
    const fallback = initialData?.user && initialData?.profile
        ? { user: initialData.user, profile: initialData.profile }
        : undefined;

    const { data, error, isLoading, mutate } = useSWR('user-profile', fetcher, {
        fallbackData: fallback,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        user: data?.user || null,
        profile: data?.profile || null,
        isLoading,
        error: error?.message || null,
        mutate
    };
}
