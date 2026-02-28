import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password, firstName, lastName, studyLevel, avatarUrl } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: `${firstName} ${lastName}`.trim(),
                    study_level: studyLevel,
                    avatar_url: avatarUrl,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, user: data.user });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
