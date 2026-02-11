'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isSupabase = url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder-key';

      if (isSupabase) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        router.push(user ? '/dashboard' : '/login');
      } else {
        const user = localStorage.getItem('nordea-user');
        if (user) {
          try {
            const parsed = JSON.parse(user);
            if (parsed.isLoggedIn) {
              router.push('/dashboard');
              return;
            }
          } catch {
            // Invalid JSON
          }
        }
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="w-8 h-8 border-3 border-[#0000A0]/20 border-t-[#0000A0] rounded-full animate-spin" />
    </div>
  );
}
