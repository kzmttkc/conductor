import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { isDemoMode } from '@/lib/config';
import { getStoreFromCookies } from '@/lib/demo/persist';
import { listPendingEscalations } from '@/lib/supabase/data';

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
  } else {
    try {
      pendingCount = (await listPendingEscalations(user.id)).length;
    } catch {
      pendingCount = 0;
    }
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
