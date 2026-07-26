import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AgentsListView } from '@/components/agents/AgentsListView';

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <AgentsListView userId={user.id} />;
}
