'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Awards XP through a database RPC so we do not depend on the service-role key
 * being present in the app runtime.
 */
export async function awardXp(userId: string, xpToAdd: number, source: string) {
    if (!userId || xpToAdd <= 0) {
        return { success: false, error: 'Invalid parameters' };
    }

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        if (user.id !== userId) {
            return { success: false, error: 'User mismatch' };
        }

        const { data, error } = await supabase.rpc('award_xp', {
            p_user_id: userId,
            p_xp_to_add: xpToAdd,
            p_source: source,
        });

        if (error) {
            console.error('awardXp rpcError:', error);
            return { success: false, error: error.message || 'Failed to award XP' };
        }

        const result = Array.isArray(data) ? data[0] : data;
        if (!result?.success) {
            return { success: false, error: result?.error || 'Failed to award XP' };
        }

        return {
            success: true,
            newXp: result.new_xp,
            newLevel: result.new_level,
            xpAdded: result.xp_added,
        };
    } catch (err: any) {
        console.error('awardXp exception:', err);
        return { success: false, error: err.message || 'An unexpected error occurred' };
    }
}
