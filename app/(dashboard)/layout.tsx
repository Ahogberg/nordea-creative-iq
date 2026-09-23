import { requireSessionUser } from '@/lib/auth/session-user';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[240px]">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Header user={user as any} />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
