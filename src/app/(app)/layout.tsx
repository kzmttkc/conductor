import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { isDemoMode } from '@/lib/config';
import { getStoreFromCookies } from '@/lib/demo/persist';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  let pendingCount = 0;
  if (isDemoMode()) {
    const store = await getStoreFromCookies();
    pendingCount = store.listEscalations(user.id, 'pending').length;
  }

  return (
    <AppShell
      userName={user.name || user.email}
      userId={user.id}
      pendingCount={pendingCount}
    >
      {children}
    </AppShell>
  );
}
