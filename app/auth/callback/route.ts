import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | null;
    const next = searchParams.get('next') ?? '/dashboard';

    const supabase = await createClient();

    // Handle email confirmation (token_hash flow — no PKCE needed)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    // Handle OAuth code exchange (PKCE flow)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    // Something went wrong — redirect to error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Invalid%20request`);
}
