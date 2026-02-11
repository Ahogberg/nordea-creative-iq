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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="lg:pl-56">
        <Header />
        <main className="px-6 py-6 lg:px-8 lg:py-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
