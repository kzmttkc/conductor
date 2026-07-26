import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';
import { normalizePermission, TOOL_NAMES, type ToolName } from '@/lib/supabase/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
    const agent = store.getAgent(id);
    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    if (body.action === 'start') {
      await store.startRuntime(id);
      return NextResponse.json(store.getAgent(id));
    }
    if (body.action === 'stop') {
      store.stopRuntime(id);
      return NextResponse.json(store.getAgent(id));
    }
    if (body.action === 'recover' || body.action === 'retry') {
      await store.recoverAgent(id);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
    const agent = store.getAgent(id);
    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    store.deleteAgent(id);
    return NextResponse.json({ ok: true });
  });
}
