import { requireSessionUser } from '@/lib/auth/session-user';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { userDisplay } from '@/lib/auth/user-display';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();

  return (
    <div className="min-h-screen">
      <Sidebar user={userDisplay(user)} />
      <div className="lg:pl-[240px]">
        <Header user={user} />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
