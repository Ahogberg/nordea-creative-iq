import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Inloggad användare för skyddade layouter (dashboard och studio).
 * Demoläge (NEXT_PUBLIC_ENABLE_DEMO + demo-session-cookie) ger en låtsasanvändare.
 * Omdirigerar till /login om ingen är inloggad.
 */
export async function requireSessionUser(): Promise<User> {
  const cookieStore = await cookies();
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';
  const isDemo = demoEnabled && cookieStore.get('demo-session')?.value === 'true';

  if (isDemo) {
    return {
      id: 'demo',
      email: 'demo@nordea.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '',
    } as User;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return data.user;
}
