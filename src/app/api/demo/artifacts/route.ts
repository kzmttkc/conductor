import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';

export async function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  const store = getDemoStore();

  if (agentId) {
    const agent = store.getAgent(agentId);
    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      store.listArtifacts(user.id).filter((a) => a.agent_id === agentId)
    );
  }

  return NextResponse.json(store.listArtifacts(user.id));
}
