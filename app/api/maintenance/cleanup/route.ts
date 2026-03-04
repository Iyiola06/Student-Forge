import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Maintenance route to cleanup stale 'processing' resources.
 * resources that stay 'processing' for > 1 hour are likely orphans (worker timeout).
 * 
 * Recommended: Trigger this hourly via Vercel Cron or similar service.
 */
export async function GET(request: Request) {
    try {
        // Simple secret check to prevent abuse if needed, or rely on internal triggering
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // Calculate timestamp for 1 hour ago
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // Find and delete stale processing resources
        const { data, error, count } = await supabase
            .from('resources')
            .delete({ count: 'exact' })
            .eq('processing_status', 'processing')
            .lt('created_at', oneHourAgo);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            deletedCount: count || 0,
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        console.error('[maintenance-cleanup] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
