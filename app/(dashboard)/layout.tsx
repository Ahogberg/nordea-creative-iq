'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.isLoggedIn) {
          setIsAuthenticated(true);
          return;
        }
      } catch {
        // Invalid JSON
      }
    }
    router.push('/login');
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-3 border-[#0000A0]/20 border-t-[#0000A0] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
