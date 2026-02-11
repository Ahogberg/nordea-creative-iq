'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.isLoggedIn) {
          router.push('/dashboard');
          return;
        }
      } catch {
        // Invalid JSON, redirect to login
      }
    }
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="w-8 h-8 border-3 border-[#0000A0]/20 border-t-[#0000A0] rounded-full animate-spin" />
    </div>
  );
}
