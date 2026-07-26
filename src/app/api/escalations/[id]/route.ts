import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { inngest } from '@/lib/inngest/client';
import * as data from '@/lib/supabase/data';
import { resumeProdAgent } from '@/lib/runtime/prod-runner';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const escalation = store.getEscalation(id);
      if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: escalation } = await supabase
    .from('escalations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const agent = await data.getAgentForUser(user.id, escalation.agent_id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    escalation,
    agent,
    logs: await data.listLogs(agent.id),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const action = body.action as 'approve' | 'revise' | 'cancel';
  const humanResponse = String(body.human_response || '').trim();

  if (!['approve', 'revise', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  if (!humanResponse) {
    return NextResponse.json({ error: 'Response required' }, { status: 400 });
  }

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const escalation = store.getEscalation(id);
      if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const agent = store.getAgent(escalation.agent_id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: existing } = await supabase
    .from('escalations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const agent = await data.getAgentForUser(user.id, existing.agent_id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await data.resolveEscalationRow(id, action, humanResponse);
  if (action === 'cancel') {
    await data.updateAgent(agent.id, {
      status: 'idle',
      current_task: 'Stopped by commander',
    });
    await data.insertLog(agent.id, 'action', `Cancelled by human: ${humanResponse}`);
  } else {
    await data.insertLog(
      agent.id,
      'action',
      `Human ${action === 'approve' ? 'approved' : 'revised'}: ${humanResponse}`
    );
    await resumeProdAgent(agent.id, humanResponse);
  }

  const remaining = (await data.listPendingEscalations(user.id)).map((e) => e.id);
  return NextResponse.json({ ...updated, next_pending_ids: remaining });
}
