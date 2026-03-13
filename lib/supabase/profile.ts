import { createClient } from './server';
import { Profile } from '@/hooks/useProfile';

export async function getServerProfile(): Promise<{ user: any; profile: Profile | null }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile: profile as Profile };
}
