import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';

export async function POST(request: Request) {
    try {
        const { supabase, user } = await createAuthedRouteClient(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription data required' }, { status: 400 });
        }

        const { error: dbError } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                subscription: subscription,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, subscription' });

        if (dbError) {
            console.error('Subscription save error:', dbError);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Push subscribe API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { supabase, user } = await createAuthedRouteClient(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscription = await request.json();

        const { error: dbError } = await supabase
            .from('push_subscriptions')
            .delete()
            .match({
                user_id: user.id,
                subscription: subscription
            });

        if (dbError) {
            return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
