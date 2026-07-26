import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import * as data from '@/lib/supabase/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
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
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const arts = await data.listArtifactsForUser(user.id);
  if (agentId) return NextResponse.json(arts.filter((a) => a.agent_id === agentId));
  return NextResponse.json(arts);
}
