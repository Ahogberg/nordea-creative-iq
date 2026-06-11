import { createClient } from '@supabase/supabase-js';

// Stateless Supabase client for background tasks that run AFTER an API
// response has been sent — at that point the cookies/context Supabase SSR
// expects is gone, so we can't use createServerClient.
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set; falls back to the anon key
// only in development so CI stays green without secrets configured.
// In production the missing key throws at call-time, not silently at query-time.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required in production — background jobs will bypass RLS without it"
      );
    }
    // Dev/test: fall back to anon key so the app boots without secrets.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    console.warn("[service-client] SUPABASE_SERVICE_ROLE_KEY not set — using anon key (dev only)");
    return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
