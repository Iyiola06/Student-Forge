'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the Service Role key to bypass RLS
// This allows the server to securely update XP and Level without trusting the client.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/**
 * Securely awards XP to a user and recalculates their level.
 * This should ONLY be called from secure server context or validated client requests.
 */
export async function awardXp(userId: string, xpToAdd: number, source: string) {
    if (!userId || xpToAdd <= 0) {
        return { success: false, error: 'Invalid parameters' };
    }

    try {
        // Fetch current profile
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('xp, level, full_name')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('awardXp fetchError:', fetchError);
            return { success: false, error: 'Profile not found' };
        }

        const newXp = (profile.xp || 0) + xpToAdd;
        // The standard level formula used across the app
        const calculatedLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        const newLevel = calculatedLevel > (profile.level || 0) ? calculatedLevel : profile.level;

        // Perform the secure update using the service_role key
        // This will bypass the RLS trigger because current_setting('role') won't be 'authenticated'
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ xp: newXp, level: newLevel })
            .eq('id', userId);

        if (updateError) {
            console.error('awardXp updateError:', updateError);
            return { success: false, error: 'Failed to update profile' };
        }

        // Optionally, log the XP event in study_history
        await supabaseAdmin.from('study_history').insert({
            user_id: userId,
            action_type: 'xp_awarded',
            details: { xp_earned: xpToAdd, source }
        });

        return { success: true, newXp, newLevel };
    } catch (err: any) {
        console.error('awardXp exception:', err);
        return { success: false, error: err.message || 'An unexpected error occurred' };
    }
}
