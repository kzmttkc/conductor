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
import { RuntimeError } from '@/lib/runtime/errors';
import { getServerLocale } from '@/i18n/locale-server';

function recentErrors<T extends { type: string }>(logs: T[]) {
  return logs.filter((l) => l.type === 'error').slice(-10).reverse();
}

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
      const logs = store.listLogs(id);
      return NextResponse.json({
        agent,
        logs,
        recent_errors: recentErrors(logs),
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
    recent_errors: recentErrors(logs),
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
      try {
        const locale = await getServerLocale();
        if (body.action === 'start') {
          await store.startRuntime(id, null, locale);
          return NextResponse.json(store.getAgent(id));
        }
        if (body.action === 'stop') {
          store.stopRuntime(id);
          return NextResponse.json(store.getAgent(id));
        }
        if (body.action === 'recover' || body.action === 'retry') {
          await store.recoverAgent(id, {
            allowWebSearch: Boolean(body.allow_web_search),
            locale,
          });
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
        if (body.config && typeof body.config === 'object') {
          const patch = body.config as Record<string, unknown>;
          const nextConfig = { ...agent.config };
          if ('display_name_ja' in patch) {
            const v = patch.display_name_ja;
            if (v === null || v === '') {
              delete nextConfig.display_name_ja;
            } else if (typeof v === 'string') {
              nextConfig.display_name_ja = v.trim().slice(0, 80);
            }
          }
          return NextResponse.json(store.updateAgent(id, { config: nextConfig }));
        }
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      } catch (e) {
        if (e instanceof RuntimeError && e.code === 'conflict') {
          return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
        }
        if ((e as { code?: string }).code === 'USAGE_LIMIT') {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Usage limit', code: 'USAGE_LIMIT' },
            { status: 403 }
          );
        }
        throw e;
      }
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agent = await data.getAgentForUser(user.id, id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const locale = await getServerLocale();
    if (body.action === 'start') {
      await startProdAgent(id, null, locale);
      return NextResponse.json(await data.getAgentForUser(user.id, id));
    }
    if (body.action === 'stop') {
      return NextResponse.json(
        await data.updateAgent(id, { status: 'idle', current_task: 'Stopped by user' })
      );
    }
    if (body.action === 'recover' || body.action === 'retry') {
      if (body.allow_web_search) {
        await data.updateAgent(id, {
          permissions: { ...agent.permissions, web_search: 'allow' },
        });
        await data.insertLog(id, 'action', 'web_search loosened → Allow for retry', {
          i18nKey: 'log.searchAllowedRetry',
        });
      }
      await recoverProdAgent(id, locale);
      return NextResponse.json(await data.getAgentForUser(user.id, id));
    }
    if (body.permissions) {
      const permissions = data.normalizePermissionsPatch(agent.permissions, body.permissions);
      return NextResponse.json(await data.updateAgent(id, { permissions }));
    }
    if (body.config && typeof body.config === 'object') {
      const patch = body.config as Record<string, unknown>;
      const nextConfig = { ...agent.config };
      if ('display_name_ja' in patch) {
        const v = patch.display_name_ja;
        if (v === null || v === '') {
          delete nextConfig.display_name_ja;
        } else if (typeof v === 'string') {
          nextConfig.display_name_ja = v.trim().slice(0, 80);
        }
      }
      return NextResponse.json(await data.updateAgent(id, { config: nextConfig }));
    }
    if (body.action === 'resume' && body.human_response) {
      await resumeProdAgent(id, String(body.human_response), locale);
      return NextResponse.json(await data.getAgentForUser(user.id, id));
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e instanceof RuntimeError && e.code === 'conflict') {
      return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
    }
    const err = e as Error & { code?: string; upgrade_to?: string };
    if (err.code === 'USAGE_LIMIT') {
      return NextResponse.json(
        { error: err.message, code: 'USAGE_LIMIT', upgrade_to: err.upgrade_to },
        { status: 403 }
      );
    }
    throw e;
  }
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
