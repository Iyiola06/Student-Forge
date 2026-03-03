import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(
        'mailto:support@student-forge.vercel.app',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's subscriptions
        const { data: subscriptions, error: dbError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id);

        if (dbError || !subscriptions) {
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        const notificationPayload = {
            title: 'Test Notification',
            body: 'Your push notification system is now active! 🚀',
            url: '/dashboard'
        };

        const pushPromises = subscriptions.map(sub =>
            webPush.sendNotification(
                sub.subscription,
                JSON.stringify(notificationPayload)
            ).catch(err => {
                console.error('Push send error:', err);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    return supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', sub.id);
                }
            })
        );

        await Promise.all(pushPromises);

        return NextResponse.json({ success: true, count: subscriptions.length });

    } catch (error: any) {
        console.error('Push test error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
