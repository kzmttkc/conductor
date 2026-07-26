import { getCurrentUser } from '@/lib/auth';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config';
import { getStoreFromCookies } from '@/lib/demo/persist';
import { listAgentsForUser } from '@/lib/supabase/data';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (isDemoMode()) {
    const store = await getStoreFromCookies();
    if (!store.isOnboarded(user.id) && store.listAgents(user.id).length === 0) {
      redirect('/onboarding');
    }
  } else {
    try {
      const agents = await listAgentsForUser(user.id);
      if (agents.length === 0) redirect('/onboarding');
    } catch {
      // schema not applied yet — still show dashboard
    }
  }

  return <DashboardView userId={user.id} />;
}
