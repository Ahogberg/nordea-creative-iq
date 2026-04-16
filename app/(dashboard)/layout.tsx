import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo-session')?.value === 'true';

  let user = null;

  if (!isDemo) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user && !isDemo) {
    redirect('/login');
  }

  const displayUser = user ?? {
    id: 'demo',
    email: 'demo@nordea.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[240px]">
        <Header user={displayUser as any} />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
