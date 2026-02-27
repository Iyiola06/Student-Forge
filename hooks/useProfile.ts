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
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;

                setProfile(profileData as Profile);
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
