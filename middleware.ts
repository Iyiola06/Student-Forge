import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Basic in-memory rate limiter for Edge (Note: isolated per Edge instance)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
        return false;
    }

    if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
        return false;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }

    record.count++;
    return false;
}

export async function middleware(request: NextRequest) {
    // 1. Rate Limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/ai') || request.nextUrl.pathname.startsWith('/api/auth')) {
        const ip = request.headers.get('x-forwarded-for') ?? 'unknown-ip';
        if (isRateLimited(ip)) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // 2. Supabase Session Management - Skip on API routes to reduce TTFB
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico and common static asset extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
