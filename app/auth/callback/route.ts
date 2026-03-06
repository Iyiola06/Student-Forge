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

        // FIX for: 494 REQUEST_HEADER_TOO_LARGE
        // Clear all code-verifier cookies which can accumulate and bloat headers
        try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            cookieStore.getAll().forEach((cookie) => {
                if (cookie.name.includes('-code-verifier')) {
                    cookieStore.delete(cookie.name);
                }
            });
        } catch (e) {
            console.error('Failed to cleanup code verifier cookies', e);
        }

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    // Something went wrong — redirect to error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Invalid%20request`);
}
