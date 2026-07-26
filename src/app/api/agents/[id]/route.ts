import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { TOOL_NAMES, type ToolName, normalizePermission } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';
import {
  recoverProdAgent,
  resumeProdAgent,
  startProdAgent,
} from '@/lib/runtime/prod-runner';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const agent = store.getAgent(id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({
        agent,
        logs: store.listLogs(id),
        escalations: store.listEscalations(user.id).filter((e) => e.agent_id === id),
        artifacts: store.listArtifacts(user.id).filter((a) => a.agent_id === id),
      });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agent = await data.getAgentForUser(user.id, id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [logs, escalations, artifacts] = await Promise.all([
    data.listLogs(id),
    data.listEscalationsForUser(user.id),
    data.listArtifactsForUser(user.id),
  ]);
  return NextResponse.json({
    agent,
    logs,
    escalations: escalations.filter((e) => e.agent_id === id),
    artifacts: artifacts.filter((a) => a.agent_id === id),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const agent = store.getAgent(id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (body.action === 'start') {
        await store.startRuntime(id);
        return NextResponse.json(store.getAgent(id));
      }
      if (body.action === 'stop') {
        store.stopRuntime(id);
        return NextResponse.json(store.getAgent(id));
      }
      if (body.action === 'recover' || body.action === 'retry') {
        await store.recoverAgent(id, { allowWebSearch: Boolean(body.allow_web_search) });
        return NextResponse.json(store.getAgent(id));
      }
      if (body.permissions) {
        const permissions: Record<string, string> = { ...agent.permissions };
        for (const tool of TOOL_NAMES) {
          if (body.permissions[tool] !== undefined) {
            permissions[tool] = normalizePermission(body.permissions[tool]);
          }
        }
        for (const [k, v] of Object.entries(body.permissions as Record<string, unknown>)) {
          if (!TOOL_NAMES.includes(k as ToolName)) {
            permissions[k] = normalizePermission(v);
          }
        }
        return NextResponse.json(store.updateAgent(id, { permissions }));
      }
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agent = await data.getAgentForUser(user.id, id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'start') {
    await startProdAgent(id);
    return NextResponse.json(await data.getAgentForUser(user.id, id));
  }
  if (body.action === 'stop') {
    return NextResponse.json(
      await data.updateAgent(id, { status: 'idle', current_task: 'Stopped by commander' })
    );
  }
  if (body.action === 'recover' || body.action === 'retry') {
    if (body.allow_web_search) {
      await data.updateAgent(id, {
        permissions: { ...agent.permissions, web_search: 'allow' },
      });
      await data.insertLog(id, 'action', 'Commander loosened web_search → Allow for retry');
    }
    await recoverProdAgent(id);
    return NextResponse.json(await data.getAgentForUser(user.id, id));
  }
  if (body.permissions) {
    const permissions = data.normalizePermissionsPatch(agent.permissions, body.permissions);
    return NextResponse.json(await data.updateAgent(id, { permissions }));
  }
  if (body.action === 'resume' && body.human_response) {
    await resumeProdAgent(id, String(body.human_response));
    return NextResponse.json(await data.getAgentForUser(user.id, id));
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const agent = store.getAgent(id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      store.deleteAgent(id);
      return NextResponse.json({ ok: true });
    });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agent = await data.getAgentForUser(user.id, id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await data.deleteAgent(user.id, id);
  return NextResponse.json({ ok: true });
}
