import { getCurrentUser } from '@/lib/auth';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config';
import { getDemoStore } from '@/lib/demo/store';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (isDemoMode()) {
    const store = getDemoStore();
    if (!store.isOnboarded(user.id) && store.listAgents(user.id).length === 0) {
      redirect('/onboarding');
    }
  }

  return <DashboardView userId={user.id} />;
}
