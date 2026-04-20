import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password, fullName, firstName, lastName, studyLevel, avatarUrl } = await request.json();
        const supabase = await createClient();
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://student.sulvatech.com';
        const resolvedFullName = fullName?.trim() || `${firstName || ''} ${lastName || ''}`.trim();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    ...(resolvedFullName ? { full_name: resolvedFullName } : {}),
                    ...(studyLevel ? { study_level: studyLevel } : {}),
                    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
                },
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, user: data.user, session: data.session });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
