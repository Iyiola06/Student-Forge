import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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
    last_active_date?: string;
}

export function useProfile() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const supabase = createClient();

            // Get the current user session
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (user) {
                setUser(user);

                // Fetch the profile data
                let { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // If no profile found (PGRST116), it means the trigger likely failed or hasn't run yet
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

                // --- STREAK CALCULATION LOGIC ---
                const todayDate = new Date();
                // Get local date string YYYY-MM-DD
                const todayStr = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                if (currentProfile.last_active_date !== todayStr) {
                    const yesterdayDate = new Date(todayDate);
                    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                    const yesterdayStr = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                    let newStreak = currentProfile.streak_days || 0;

                    if (currentProfile.last_active_date === yesterdayStr) {
                        // Logged in yesterday! Increment streak.
                        newStreak += 1;
                    } else {
                        // Missed a day or first time. Reset streak to 1.
                        newStreak = 1;
                    }

                    // Update local profile state
                    currentProfile = {
                        ...currentProfile,
                        streak_days: newStreak,
                        last_active_date: todayStr
                    };

                    // Persist the updated streak silently in the background
                    supabase.from('profiles').update({
                        streak_days: newStreak,
                        last_active_date: todayStr
                    }).eq('id', user.id).then(({ error }) => {
                        if (error) console.error("Failed to update streak:", error);
                    });
                }
                // --- END STREAK CALCULATION LOGIC ---

                setProfile(currentProfile);
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { user, profile, isLoading, error, mutate: fetchProfile };
}
