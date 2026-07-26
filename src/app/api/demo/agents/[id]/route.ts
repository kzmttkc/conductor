import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import { normalizePermission, TOOL_NAMES, type ToolName } from '@/lib/supabase/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const store = getDemoStore();
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
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const store = getDemoStore();
  const agent = store.getAgent(id);
  if (!agent || agent.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  if (body.action === 'start') {
    void store.startRuntime(id);
    return NextResponse.json(store.getAgent(id));
  }
  if (body.action === 'stop') {
    store.stopRuntime(id);
    return NextResponse.json(store.getAgent(id));
  }
  if (body.action === 'recover' || body.action === 'retry') {
    store.recoverAgent(id);
    return NextResponse.json(store.getAgent(id));
  }
  if (body.permissions) {
    const permissions: Record<string, string> = { ...agent.permissions };
    for (const tool of TOOL_NAMES) {
      if (body.permissions[tool] !== undefined) {
        permissions[tool] = normalizePermission(body.permissions[tool]);
      }
    }
    // allow partial updates for unknown keys too
    for (const [k, v] of Object.entries(body.permissions as Record<string, unknown>)) {
      if (!TOOL_NAMES.includes(k as ToolName)) {
        permissions[k] = normalizePermission(v);
      }
    }
    const updated = store.updateAgent(id, { permissions });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const store = getDemoStore();
  const agent = store.getAgent(id);
  if (!agent || agent.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  store.deleteAgent(id);
  return NextResponse.json({ ok: true });
}
