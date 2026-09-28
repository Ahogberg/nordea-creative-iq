import { requireSessionUser } from '@/lib/auth/session-user';

/**
 * Helskärmslayout för Motion Studio: ingen sidomeny, inget sidhuvud och inga
 * marginaler — editorn fyller hela fönstret och har en egen toppbar.
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSessionUser();
  return <div className="h-screen w-screen overflow-hidden bg-nordea-bg">{children}</div>;
}
