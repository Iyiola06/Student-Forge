import { createClient as createSupabaseJsClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createCookieServerClient } from '@/lib/supabase/server';

type RouteAuthResult = {
  supabase: SupabaseClient;
  user: any | null;
  authType: 'bearer' | 'cookie';
  accessToken: string | null;
};

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1].trim() || null;
}

/**
 * Creates a Supabase client for Next.js route handlers that supports:
 * - Mobile/native clients: `Authorization: Bearer <access_token>`
 * - Web app: Supabase SSR cookie session (existing behavior)
 */
export async function createAuthedRouteClient(request: Request): Promise<RouteAuthResult> {
  const token = getBearerToken(request);

  if (token) {
    const supabase = createSupabaseJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    return { supabase, user: data.user ?? null, authType: 'bearer', accessToken: token };
  }

  const supabase = await createCookieServerClient();
  const { data } = await supabase.auth.getUser();
  const sessionRes = await supabase.auth.getSession();
  return {
    supabase: supabase as unknown as SupabaseClient,
    user: data.user ?? null,
    authType: 'cookie',
    accessToken: sessionRes.data.session?.access_token ?? null,
  };
}
