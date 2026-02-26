import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { provider } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (data?.url) {
            return NextResponse.json({ url: data.url });
        }

        return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
