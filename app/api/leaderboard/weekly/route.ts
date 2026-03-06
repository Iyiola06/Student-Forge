import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Fetch study history for last 7 days
        // We only care about entries that awarded XP
        const { data: history, error: historyError } = await supabase
            .from('study_history')
            .select('user_id, details, created_at')
            .gte('created_at', sevenDaysAgo.toISOString());

        if (historyError) {
            console.error('History fetch error:', historyError);
            return NextResponse.json({ error: historyError.message }, { status: 500 });
        }

        // 2. Aggregate XP per user
        const userXpMap: Record<string, number> = {};
        history.forEach(item => {
            const xp = (item.details as any)?.xp_earned || 0;
            if (xp > 0) {
                userXpMap[item.user_id] = (userXpMap[item.user_id] || 0) + xp;
            }
        });

        const userIds = Object.keys(userXpMap);

        if (userIds.length === 0) {
            return NextResponse.json([]);
        }

        // 3. Fetch profile details for active users
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, level')
            .in('id', userIds);

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // Pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // 4. Combine and Sort
        const leaderboard = userIds.map(id => {
            const p = profiles.find(profile => profile.id === id);
            return {
                id,
                full_name: p?.full_name || 'Anonymous Student',
                avatar_url: p?.avatar_url,
                level: p?.level || 1,
                xp: userXpMap[id]
            };
        })
            .sort((a, b) => b.xp - a.xp);

        const paginatedLeaderboard = leaderboard.slice(startIndex, endIndex);

        return NextResponse.json({
            data: paginatedLeaderboard,
            hasMore: endIndex < leaderboard.length,
            total: leaderboard.length
        });

    } catch (error: any) {
        console.error('Weekly leaderboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
