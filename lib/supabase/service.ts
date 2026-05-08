import { createClient } from '@supabase/supabase-js';

// Stateless Supabase client for background tasks that run AFTER an API
// response has been sent — at that point the cookies/context Supabase SSR
// expects is gone, so we can't use createServerClient.
//
// Falls back to the anon key if SUPABASE_SERVICE_ROLE_KEY is unset; this
// works because Sprint 3 tables (templates, production_jobs) have no RLS.
// Sprint 11 (Enterprise Prep) will enable RLS, at which point a real
// service-role key is required for the worker.
export function createServiceClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
