import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';

export async function GET(request: Request) {
  return withDemoApi(request, async ({ store, user }) => {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
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
