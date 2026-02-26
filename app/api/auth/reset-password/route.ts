import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
