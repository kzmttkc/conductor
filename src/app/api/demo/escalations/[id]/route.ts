import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';
import { inngest } from '@/lib/inngest/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
    const escalation = store.getEscalation(id);
    if (!escalation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const agent = store.getAgent(escalation.agent_id);
    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
      escalation,
      agent,
      logs: store.listLogs(agent.id),
    });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
    const escalation = store.getEscalation(id);
    if (!escalation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const agent = store.getAgent(escalation.agent_id);
    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action as 'approve' | 'revise' | 'cancel';
    const humanResponse = String(body.human_response || '').trim();

    if (!['approve', 'revise', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (!humanResponse) {
      return NextResponse.json({ error: 'Response required' }, { status: 400 });
    }

    const updated = store.resolveEscalation(id, action, humanResponse);
    if (updated && action !== 'cancel') {
      await store.resumeAgent(updated.agent_id, humanResponse);
      try {
        await inngest.send({
          name: 'conductor/escalation.resolved',
          data: {
            agentId: updated.agent_id,
            escalationId: updated.id,
            humanResponse,
            action,
          },
        });
      } catch {
        // optional
      }
    }

    const remaining = store.listEscalations(user.id, 'pending').map((e) => e.id);
    return NextResponse.json({ ...updated, next_pending_ids: remaining });
  });
}
